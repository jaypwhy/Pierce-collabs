/**
 * The universal envelope — one shape for every service, success or failure.
 *
 *   { ok: true,  service: "upayu", action: "sip", data: { ... } }
 *   { ok: false, service: "ruhbi", action: "ledger", error: { code, message } }
 *
 * Every /api/v1 response is one of these two, so a client (the `pc` CLI, an app,
 * another agent) can read any service without knowing its shape first.
 */

export type ServiceStatus = "live" | "planned";

export type ErrorCode =
  | "not_connected"
  | "bad_request"
  | "not_found"
  | "cooldown"
  | "failed";

export type Envelope<T = unknown> =
  | { ok: true; service: string; action: string; data: T }
  | { ok: false; service: string; action: string; error: { code: ErrorCode; message: string } };

/** An envelope plus the HTTP status the route should answer with. */
export type Reply<T = unknown> = { status: number; envelope: Envelope<T> };

export type CallInput = { body: Record<string, unknown> };

/**
 * One adapter per service. `call` is the only place that knows the service's
 * own shape; the route and the CLI only ever see envelopes.
 */
export type ServiceAdapter = {
  name: string;
  status: ServiceStatus;
  actions: string[];
  /** One line on what this service is, for the registry. */
  blurb: string;
  call: (action: string, input: CallInput) => Promise<Reply> | Reply;
};

export function ok<T>(service: string, action: string, data: T, status = 200): Reply<T> {
  return { status, envelope: { ok: true, service, action, data } };
}

export function fail(
  service: string,
  action: string,
  code: ErrorCode,
  message: string,
  status = 400,
): Reply {
  return { status, envelope: { ok: false, service, action, error: { code, message } } };
}

/** A service that does not exist yet. Never a 500, never a pretend success. */
export function notConnected(service: string, action: string): Reply {
  return fail(
    service,
    action,
    "not_connected",
    `${service} is not connected yet — this action answers once it lands.`,
    503,
  );
}

export function badRequest(service: string, action: string, message: string): Reply {
  return fail(service, action, "bad_request", message, 400);
}

/** A number out of a request body, or undefined when it is not one. */
export function bodyNumber(body: Record<string, unknown>, key: string): number | undefined {
  const value = body[key];
  if (value === undefined || value === null || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export function bodyString(body: Record<string, unknown>, key: string): string | undefined {
  const value = body[key];
  return typeof value === "string" ? value : undefined;
}
