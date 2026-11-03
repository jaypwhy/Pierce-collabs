/**
 * The `acorn-tap` adapter — micro-savings, where points become deposits.
 *
 * Planned. Nothing here moves money: a deposit answers `not_connected` until
 * there is a ledger to settle it into.
 */
import { notConnected, type ServiceAdapter } from "./envelope";

export const acornTapAdapter: ServiceAdapter = {
  name: "acorn-tap",
  status: "planned",
  actions: ["deposit", "savings"],
  blurb: "Acorn Tap — micro-savings, where a few points at a time become a deposit.",
  call: (action) => notConnected("acorn-tap", action),
};
