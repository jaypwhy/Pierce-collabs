/**
 * THE π SCALE — one shared convention for every Pierce Collabs / Gaming Layer
 * game, taken from the owner's "Pi Thresholds" working note (Sip Drip build).
 *
 * Owner decision (Reading A): π is a real irrational number used as the
 * DISPLAY scale only. The loop's own unit stays a whole integer, earn rates and
 * payouts do not change, conservation stays exact, and no loop unit ever
 * converts into money.
 *
 *   value = floor(units × 10π)
 *
 *   units    1 →     31
 *   units   10 →    314
 *   units  100 →  3,141
 *   units 1000 → 31,415
 */

/** The display value of a whole number of loop units on the π scale. */
export function piValue(units: number): number {
  if (!Number.isFinite(units)) return 0;
  return Math.floor(units * 10 * Math.PI);
}

export type PiScaleRow = { units: number; value: number };

/** The published table. Same numbers on every game's HUD, always. */
export const PI_SCALE_TABLE: readonly PiScaleRow[] = Object.freeze([
  { units: 1, value: piValue(1) },
  { units: 10, value: piValue(10) },
  { units: 100, value: piValue(100) },
  { units: 1000, value: piValue(1000) },
]);

/** What the scale is, in one sentence, for HUDs and the /pi-scale page. */
export const PI_SCALE_LABEL = "π SCALE — DISPLAY ONLY · NOT A PAYOUT · NOT MONEY";

/** The longer caveat, printed under the table. */
export const PI_SCALE_NOTE =
  "The loop's own unit is a whole integer and every earn rate, price and ceiling is unchanged. " +
  "The π value is the same integer multiplied by 10π and floored — a shared way to show it, " +
  "nothing more. It never converts a loop unit into money.";

/** Thousands-separated, locale-free formatting so every HUD reads the same. */
export function formatPi(value: number): string {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
