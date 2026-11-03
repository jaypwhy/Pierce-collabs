/**
 * The `mission` adapter — task-based rewards.
 *
 * Planned. Completing a task should earn points into the same account; until
 * there is a task list to complete, it answers `not_connected`.
 */
import { notConnected, type ServiceAdapter } from "./envelope";

export const missionAdapter: ServiceAdapter = {
  name: "mission",
  status: "planned",
  actions: ["tasks", "complete"],
  blurb: "Mission — task-based rewards, earning points into the same account.",
  call: (action) => notConnected("mission", action),
};
