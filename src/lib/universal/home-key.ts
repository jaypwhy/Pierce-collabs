/**
 * The `home-key` adapter — reserved, not connected.
 *
 * Planned and empty: the repository holds nothing yet, so there is no action to
 * list. It is in the registry so the ecosystem can see the door exists, and any
 * call to it answers `not_connected` rather than pretending it is unknown.
 */
import { notConnected, type ServiceAdapter } from "./envelope";

export const homeKeyAdapter: ServiceAdapter = {
  name: "home-key",
  status: "planned",
  actions: [],
  blurb: "home-key — reserved for the key to a home; the repository is empty, so it has no actions yet.",
  call: (action) =>
    notConnected("home-key", action, "the repository is empty, so it is reserved rather than connected."),
};
