/**
 * The `worldvolume` adapter — field equations on D-brane worldvolumes.
 *
 * Planned. The Python toolkit is still a skeleton: it solves the Klein-Gordon
 * equation on a rectangular worldvolume and checks the spectrum against the
 * closed form, but there is nothing running for this API to call yet. So it
 * lists its two actions and answers `not_connected` for both.
 *
 * When it lands, `solve` runs one boundary-condition problem and `results`
 * reads back the solves that have been kept. Whether a solve earns points is
 * still the owner's call — see the integration map.
 */
import { notConnected, type ServiceAdapter } from "./envelope";

export const worldvolumeAdapter: ServiceAdapter = {
  name: "worldvolume",
  status: "planned",
  actions: ["solve", "results"],
  blurb:
    "worldvolume — field equations on D-brane worldvolumes, a solve validated against the closed form.",
  call: (action) =>
    notConnected(
      "worldvolume",
      action,
      "the Python toolkit is still a skeleton, so solve and results answer once it runs.",
    ),
};
