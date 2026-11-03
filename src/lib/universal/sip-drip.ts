/**
 * The `sip-drip` adapter — the 8-bit clicker.
 *
 * It owns no account of its own: every SIP and DRIP it fires is an `upayu` sip
 * or drip, so the registry lists it but the actions live on the bridge.
 */
import { badRequest, type ServiceAdapter } from "./envelope";

export const sipDripAdapter: ServiceAdapter = {
  name: "sip-drip",
  status: "live",
  actions: [],
  blurb: "Sip Drip — an 8-bit clicker whose sips and drips land on the upayu bridge.",
  call: (action) =>
    badRequest(
      "sip-drip",
      action,
      "sip-drip has no actions of its own — use upayu sip and upayu drip.",
    ),
};
