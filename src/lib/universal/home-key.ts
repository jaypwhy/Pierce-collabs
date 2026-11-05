/**
 * The `home-key` adapter — Project Home Key, the first node.
 *
 * Planned and empty: the repository holds nothing yet, so there is no action to
 * list. It is in the registry so the ecosystem can see the door exists, and any
 * call to it answers `not_connected` rather than pretending it is unknown.
 *
 * Project Home Key is the Soft Landing node the one-pager describes — housing,
 * health, food and hygiene, regenerative income and travel, as one navigable
 * system. None of that is wired to this account yet.
 */
import { notConnected, type ServiceAdapter } from "./envelope";

export const homeKeyAdapter: ServiceAdapter = {
  name: "home-key",
  status: "planned",
  actions: [],
  blurb:
    "home-key — Project Home Key, the first node: housing, health, food and regenerative income in one place.",
  call: (action) =>
    notConnected(
      "home-key",
      action,
      "Project Home Key is the first node and nothing of it is wired to this account yet.",
    ),
};
