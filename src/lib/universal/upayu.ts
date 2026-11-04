/**
 * The `upayu` adapter — the UPayU Bridge behind the universal layer.
 *
 * It does not reimplement anything: every action calls `upayu-core`, which stays
 * the one place that owns the Pi Algo, the drip cooldown and the account file.
 * This file only knows how to turn a core snapshot into an envelope.
 */
import {
  PI_ALGO_FORMULA,
  convertPoints,
  dripPoints,
  pressPoints,
  pressUpgrade,
  readSnapshot,
  sipPoints,
  type Snapshot,
} from "~/lib/upayu-core";

import {
  badRequest,
  bodyNumber,
  bodyString,
  fail,
  ok,
  type CallInput,
  type Reply,
  type ServiceAdapter,
} from "./envelope";

const RECENT_ENTRIES = 5;

export type BalanceData = {
  points: number;
  dollars: number;
  /** Points at the Pi Algo: floor(π × 100 × points²). */
  dollarValue: number;
  totalValue: number;
  lifetimePoints: number;
  pieces: number;
  conversion: { minimumPoints: number; formula: string };
  drip: { points: number; cooldownMs: number; remainingMs: number; ready: boolean };
  /** Press Pay Btn — presses counted, the upgrade, the hidden Pi button. */
  press: Snapshot["press"];
  recent: Snapshot["account"]["ledger"];
};

function balanceData(snapshot: Snapshot): BalanceData {
  return {
    points: snapshot.account.points,
    dollars: snapshot.account.dollars,
    dollarValue: snapshot.dollarValue,
    totalValue: snapshot.totalValue,
    lifetimePoints: snapshot.account.lifetimePoints,
    pieces: snapshot.account.pieces.length,
    conversion: snapshot.conversion,
    drip: snapshot.drip,
    press: snapshot.press,
    recent: snapshot.account.ledger.slice(0, RECENT_ENTRIES),
  };
}

/** A snapshot that carries a change reads as the balance plus what happened. */
function changed(snapshot: Snapshot & { message?: string; awarded?: number }) {
  return { ...balanceData(snapshot), awarded: snapshot.awarded, message: snapshot.message };
}

function call(action: string, input: CallInput): Promise<Reply> | Reply {
  switch (action) {
    case "balance": {
      return readSnapshot().then((snapshot) => ok("upayu", action, balanceData(snapshot)));
    }
    case "sip": {
      return sipPoints({
        points: bodyNumber(input.body, "points"),
        note: bodyString(input.body, "note"),
      }).then((snapshot) => ok("upayu", action, changed(snapshot)));
    }
    case "drip": {
      return dripPoints().then((snapshot) =>
        snapshot.ok
          ? ok("upayu", action, changed(snapshot))
          : fail("upayu", action, "cooldown", snapshot.error ?? "The drip is resting.", 429),
      );
    }
    case "convert": {
      const points = bodyNumber(input.body, "points");
      if (points === undefined) {
        return badRequest("upayu", action, "convert needs { points } — the number to convert.");
      }
      return convertPoints({ points }).then((snapshot) =>
        snapshot.ok
          ? ok("upayu", action, changed(snapshot))
          : fail("upayu", action, "failed", snapshot.error ?? "Nothing to convert.", 400),
      );
    }
    case "press": {
      return pressPoints({ tier: bodyString(input.body, "tier") }).then((snapshot) =>
        snapshot.ok
          ? ok("upayu", action, changed(snapshot))
          : fail(
              "upayu",
              action,
              "failed",
              snapshot.error ?? "That press did not go through.",
              400,
            ),
      );
    }
    case "press-upgrade": {
      return pressUpgrade().then((snapshot) =>
        snapshot.ok
          ? ok("upayu", action, changed(snapshot))
          : fail(
              "upayu",
              action,
              "failed",
              snapshot.error ?? "Double Your Clicks did not go through.",
              400,
            ),
      );
    }
    case "ladder": {
      return readSnapshot().then((snapshot) =>
        ok("upayu", action, {
          formula: PI_ALGO_FORMULA,
          minimumPoints: snapshot.conversion.minimumPoints,
          // The ladder is the system's example of infinite and infinitely: each
          // rung is the same rule ten times out, not a price that terminates.
          rungs: snapshot.ladder,
        }),
      );
    }
    default:
      return fail("upayu", action, "not_found", `upayu has no action "${action}".`, 404);
  }
}

export const upayuAdapter: ServiceAdapter = {
  name: "upayu",
  status: "live",
  actions: ["sip", "drip", "balance", "convert", "ladder", "press", "press-upgrade"],
  blurb: "The UPayU Bridge — one account, one balance, points converted at the Pi Algo.",
  call,
};
