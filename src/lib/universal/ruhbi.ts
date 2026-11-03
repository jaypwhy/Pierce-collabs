/**
 * The `ruhbi` adapter — Regenerative Universal Housing and (base) Income.
 *
 * Live: the ledger underneath the bridge. Every sip, drip, art save and convert
 * writes one append-only line, and these three actions read that record back.
 * Payroll and residents are the next layers and are not here yet.
 */
import { ensureOpening, ledgerView, summaryView, verifyView } from "../ruhbi-ledger";
import { readSnapshot } from "../upayu-core";
import {
  badRequest,
  fail,
  ok,
  type CallInput,
  type Reply,
  type ServiceAdapter,
} from "./envelope";

const MAX_LIMIT = 1000;

/** `?limit=` — a whole number of entries, or nothing. */
function limitOf(input: CallInput): number | undefined | "bad" {
  const raw = input.query.limit;
  if (raw === undefined || raw === "") return undefined;
  const n = Number(raw);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 1) return "bad";
  return Math.min(MAX_LIMIT, n);
}

/**
 * All three actions read the same record, and a record with no movements yet
 * opens with the balance the account holds now — so reading it never invents a
 * history and never shows an empty ledger over a full account.
 */
async function openLedger(): Promise<number> {
  const snapshot = await readSnapshot();
  await ensureOpening(snapshot.account.id, snapshot.account.points);
  return snapshot.account.points;
}

async function call(action: string, input: CallInput): Promise<Reply> {
  switch (action) {
    case "ledger": {
      const limit = limitOf(input);
      if (limit === "bad") {
        return badRequest("ruhbi", action, "limit must be a whole number of entries, 1 or more.");
      }
      await openLedger();
      const view = await ledgerView({
        limit,
        kind: input.query.kind?.trim() || undefined,
        account: input.query.account?.trim() || undefined,
      });
      return ok("ruhbi", action, view);
    }
    case "summary": {
      await openLedger();
      return ok("ruhbi", action, await summaryView());
    }
    case "verify": {
      const balance = await openLedger();
      return ok("ruhbi", action, await verifyView(balance));
    }
    default:
      return fail("ruhbi", action, "not_found", `ruhbi has no action "${action}".`, 404);
  }
}

export const ruhbiAdapter: ServiceAdapter = {
  name: "ruhbi",
  status: "live",
  actions: ["ledger", "summary", "verify"],
  blurb: "RUHBI — the append-only ledger every point movement settles into.",
  call,
};
