/**
 * The `ruhbi` adapter — Regenerative Universal Housing and (base) Income.
 *
 * Planned. The ledger, the payroll run and the residents do not exist yet, so
 * every action answers `not_connected` rather than pretending. When the ledger
 * lands underneath, this file is the only one that changes.
 */
import { notConnected, type ServiceAdapter } from "./envelope";

export const ruhbiAdapter: ServiceAdapter = {
  name: "ruhbi",
  status: "planned",
  actions: ["ledger", "payroll", "residents"],
  blurb: "RUHBI — the ledger, payroll run and resident record everything settles into.",
  call: (action) => notConnected("ruhbi", action),
};
