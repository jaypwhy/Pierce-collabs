/**
 * The `morbraii` adapter — identity and onboarding.
 *
 * Planned. There is no auth anywhere in this pass: identity is Morbraii's job
 * and Morbraii does not exist yet, so it answers `not_connected`.
 */
import { notConnected, type ServiceAdapter } from "./envelope";

export const morbraiiAdapter: ServiceAdapter = {
  name: "morbraii",
  status: "planned",
  actions: ["identity", "onboard"],
  blurb: "Morbraii — identity and onboarding; the answer to who a person is here.",
  call: (action) => notConnected("morbraii", action),
};
