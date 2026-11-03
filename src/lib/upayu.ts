/**
 * UPayU Bridge — the client-safe face of the account.
 *
 * Types and the ladder can be imported anywhere; every call goes through a
 * server function, and the file-backed core is only pulled in on the server.
 * The same core also answers the plain HTTP endpoints under /api/*.
 */
import { createServerFn } from "@tanstack/react-start";

export type { Account, ArtPiece, LedgerEntry, LadderRung, Snapshot, SnapshotWith } from "./upayu-core";

const MIN_CONVERT_POINTS = 1;
const DRIP_POINTS = 25;

/**
 * The Pi Algo, client-side mirror of the core: dollars = floor(π × 100 × points²).
 * 1 point = $314, 10 points = $31,415, 100 points = $3,141,592.
 */
export const PI_ALGO_FORMULA = "floor(π × 100 × points²)";

export function piAlgoDollars(points: number): number {
  const n = Number.isFinite(points) ? Math.max(0, points) : 0;
  return Math.floor(Math.PI * 100 * n * n);
}

/** The pi ladder — the Pi Algo at four rungs: 1 → $314, 10 → $31,415, 100 → $3,141,592, 1,000 → $314,159,265. */
export const PI_LADDER = [1, 10, 100, 1000].map((points) => ({
  points,
  dollars: piAlgoDollars(points),
}));

export const BRIDGE_RATES = {
  formula: PI_ALGO_FORMULA,
  minimumPoints: MIN_CONVERT_POINTS,
  dripPoints: DRIP_POINTS,
};

export const getBalance = createServerFn({ method: "GET" }).handler(async () => {
  const core = await import("./upayu-core");
  return core.readSnapshot();
});

type SipInput = { points?: number; note?: string };

export const sip = createServerFn({ method: "POST" })
  .validator((input: unknown) => input as SipInput)
  .handler(async ({ data }) => {
    const core = await import("./upayu-core");
    return core.sipPoints({ points: data?.points, note: data?.note });
  });

export const drip = createServerFn({ method: "POST" }).handler(async () => {
  const core = await import("./upayu-core");
  return core.dripPoints();
});

type ConvertInput = { points?: number };

export const convert = createServerFn({ method: "POST" })
  .validator((input: unknown) => input as ConvertInput)
  .handler(async ({ data }) => {
    const core = await import("./upayu-core");
    return core.convertPoints({ points: data?.points });
  });

type ArtInput = { name?: string; media?: string; points?: number; thumb?: string };

export const saveArt = createServerFn({ method: "POST" })
  .validator((input: unknown) => input as ArtInput)
  .handler(async ({ data }) => {
    const core = await import("./upayu-core");
    return core.saveArtWork({
      name: data?.name,
      media: data?.media,
      points: data?.points,
      thumb: data?.thumb,
    });
  });
