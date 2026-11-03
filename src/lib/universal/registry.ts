/**
 * The universal registry — every Pierce Collabs service in one list.
 *
 * Each service is one adapter in this directory. The registry is what
 * `GET /api/v1/services` answers with, and it is how a route or the `pc` CLI
 * finds the adapter for a name. Adding Morbraii later means adding one file
 * here and nothing else.
 */
import { acornTapAdapter } from "./acorn-tap";
import { artAdapter } from "./art";
import { fail, type Reply, type ServiceAdapter, type ServiceStatus } from "./envelope";
import { missionAdapter } from "./mission";
import { morbraiiAdapter } from "./morbraii";
import { ruhbiAdapter } from "./ruhbi";
import { sipDripAdapter } from "./sip-drip";
import { upayuAdapter } from "./upayu";

export const API_VERSION = "v1";

export const ADAPTERS: ServiceAdapter[] = [
  upayuAdapter,
  artAdapter,
  sipDripAdapter,
  ruhbiAdapter,
  morbraiiAdapter,
  missionAdapter,
  acornTapAdapter,
];

export type ServiceDescription = {
  name: string;
  status: ServiceStatus;
  actions: string[];
  blurb: string;
  base: string;
};

function describe(adapter: ServiceAdapter): ServiceDescription {
  return {
    name: adapter.name,
    status: adapter.status,
    actions: adapter.actions,
    blurb: adapter.blurb,
    base: `/api/v1/${adapter.name}`,
  };
}

export function getAdapter(name: string): ServiceAdapter | undefined {
  return ADAPTERS.find((adapter) => adapter.name === name);
}

/** The registry envelope: every service, its status and its actions. */
export function registryReply(): Reply {
  const services = ADAPTERS.map(describe);
  return {
    status: 200,
    envelope: {
      ok: true,
      service: "registry",
      action: "services",
      data: {
        version: API_VERSION,
        count: services.length,
        live: services.filter((s) => s.status === "live").length,
        planned: services.filter((s) => s.status === "planned").length,
        services,
      },
    },
  };
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  try {
    const parsed: unknown = await request.json();
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return {};
  } catch {
    // A GET, an empty body or a body that is not JSON — the adapter decides
    // whether that is a problem, so hand it an empty object.
    return {};
  }
}

/** The query string as plain strings, so a read action can filter. */
function readQuery(request: Request): Record<string, string> {
  const query: Record<string, string> = {};
  for (const [key, value] of new URL(request.url).searchParams) query[key] = value;
  return query;
}

/**
 * The one handler behind every /api/v1 route: resolve the adapter, hand it the
 * body, answer with its envelope and status. No route ever throws a 500 of its
 * own — a planned service answers `not_connected` instead.
 */
export async function respond(serviceName: string, action: string, request: Request): Promise<Response> {
  const adapter = getAdapter(serviceName);
  let reply: Reply;

  if (!adapter) {
    reply = fail(serviceName, action, "not_found", `No service named "${serviceName}".`, 404);
  } else if (!adapter.actions.includes(action)) {
    reply = fail(serviceName, action, "not_found", `${serviceName} has no action "${action}".`, 404);
  } else {
    try {
      reply = await adapter.call(action, { body: await readBody(request), query: readQuery(request) });
    } catch (error) {
      reply = fail(
        serviceName,
        action,
        "failed",
        error instanceof Error ? error.message : "The service failed.",
        500,
      );
    }
  }

  return Response.json(reply.envelope, {
    status: reply.status,
    headers: { "cache-control": "no-store" },
  });
}

/** `GET /api/v1/services` — the registry itself. */
export function servicesResponse(): Response {
  const reply = registryReply();
  return Response.json(reply.envelope, {
    status: reply.status,
    headers: { "cache-control": "no-store" },
  });
}
