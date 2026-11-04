/**
 * Press Pay Btn — the rules, in the one place the server and the page both read.
 *
 * Points only. Nothing here moves money: every number is points, and the dollar
 * figures the page shows are the Pi Algo's reading of those points, never a
 * payout. A press spends points and returns ten times as many, so the ladder is
 * the same ×10 shape the Pi Algo has:
 *
 *   1 point in  → 10 out      (reads as $314 in, $3,141 back)
 *   10 in       → 100 out     (reads as $3,141 in, $31,415 back)
 *   100 in      → 1,000 out   (the hidden Pi button)
 *
 * The first two buttons open as the balance reaches them and never close again.
 * The Pi button does not exist until 1,000 presses have been counted, and
 * "Double Your Clicks" (100 points) makes every press count twice towards it.
 *
 * Client-safe: no node imports, so the page can import this directly.
 */

export type PressTierId = "one" | "ten" | "pi";

export type PressTier = {
  id: PressTierId;
  label: string;
  /** Points spent to press it. */
  cost: number;
  /** Points it pays back. */
  pays: number;
  /** The balance that opens the button — 0 when it is not gated by balance. */
  unlockPoints: number;
  /** Presses that must be counted before it appears at all, or null. */
  hiddenUntilPresses: number | null;
  hidden: boolean;
  blurb: string;
};

export const PRESS_TIERS: PressTier[] = [
  {
    id: "one",
    label: "Press Pay Btn",
    cost: 1,
    pays: 10,
    unlockPoints: 1,
    hiddenUntilPresses: null,
    hidden: false,
    blurb: "One point in, ten points back.",
  },
  {
    id: "ten",
    label: "Ten at a Time",
    cost: 10,
    pays: 100,
    unlockPoints: 10,
    hiddenUntilPresses: null,
    hidden: false,
    blurb: "Ten points in, a hundred back.",
  },
  {
    id: "pi",
    label: "The Pi Button",
    cost: 100,
    pays: 1000,
    unlockPoints: 0,
    hiddenUntilPresses: 1000,
    hidden: true,
    blurb: "A hundred points in, a thousand back.",
  },
];

/** What the upgrade costs, and the balance at which it opens. */
export const PRESS_UPGRADE_COST = 100;
export const PRESS_UPGRADE_UNLOCK_POINTS = 100;

/** The presses that reveal the Pi button. */
export const PI_BUTTON_PRESSES = 1000;

/** What a press of a tier pays net of what it costs. */
export function pressNet(tier: PressTier): number {
  return tier.pays - tier.cost;
}

export function tierById(id: string | undefined | null): PressTier {
  const wanted = (id ?? "").trim().toLowerCase();
  return PRESS_TIERS.find((tier) => tier.id === wanted) ?? PRESS_TIERS[0];
}

/** Everything a press has done to this account, kept on the account itself. */
export type PressPayState = {
  /** Presses counted — two per click once the upgrade is on. */
  presses: number;
  /** Points spent pressing. */
  paid: number;
  /** Points the button has returned. */
  earned: number;
  upgraded: boolean;
  upgradedAt: string | null;
  /** Tiers that have opened. Once open, never closed. */
  unlocked: string[];
  piUnlockedAt: string | null;
};

export function blankPressPay(): PressPayState {
  return {
    presses: 0,
    paid: 0,
    earned: 0,
    upgraded: false,
    upgradedAt: null,
    unlocked: ["one"],
    piUnlockedAt: null,
  };
}

function whole(value: unknown, fallback = 0): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : fallback;
}

/** A stored press state, made safe — an old or partial record still reads. */
export function normalisePressPay(raw: unknown): PressPayState {
  const blank = blankPressPay();
  if (!raw || typeof raw !== "object") return blank;
  const source = raw as Partial<PressPayState>;
  const unlocked = Array.isArray(source.unlocked)
    ? source.unlocked.filter((id): id is string => typeof id === "string")
    : [];
  return {
    presses: whole(source.presses),
    paid: whole(source.paid),
    earned: whole(source.earned),
    upgraded: source.upgraded === true,
    upgradedAt: typeof source.upgradedAt === "string" ? source.upgradedAt : null,
    unlocked: Array.from(new Set(["one", ...unlocked])),
    piUnlockedAt: typeof source.piUnlockedAt === "string" ? source.piUnlockedAt : null,
  };
}

/** How many presses one click counts for. The upgrade doubles it. */
export function pressesPerClick(state: PressPayState): number {
  return state.upgraded ? 2 : 1;
}

/** Whether a tier is open, given the balance and what the account has done. */
export function isTierUnlocked(
  tier: PressTier,
  state: PressPayState,
  points: number,
): boolean {
  if (tier.hiddenUntilPresses !== null) {
    return state.presses >= tier.hiddenUntilPresses || state.piUnlockedAt !== null;
  }
  if (tier.unlockPoints > 0 && points >= tier.unlockPoints) return true;
  return state.unlocked.includes(tier.id);
}

/** The tiers this balance opens, as ids — used to persist an unlock. */
export function openTierIds(state: PressPayState, points: number): string[] {
  const ids = new Set(state.unlocked);
  for (const tier of PRESS_TIERS) {
    if (isTierUnlocked(tier, state, points)) ids.add(tier.id);
  }
  return Array.from(ids);
}

export type PressTierView = PressTier & {
  unlocked: boolean;
  /** Whether the balance can pay for one press right now. */
  affordable: boolean;
  net: number;
};

/** The press state as the page and the API read it. */
export type PressView = {
  presses: number;
  paid: number;
  earned: number;
  net: number;
  upgraded: boolean;
  upgradeCost: number;
  upgradeUnlocked: boolean;
  /** Presses per click: 1, or 2 with the upgrade. */
  perClick: number;
  piAt: number;
  piUnlocked: boolean;
  pressesToPi: number;
  tiers: PressTierView[];
};

export function buildPressView(state: PressPayState, points: number): PressView {
  const piUnlocked = state.presses >= PI_BUTTON_PRESSES || state.piUnlockedAt !== null;
  return {
    presses: state.presses,
    paid: state.paid,
    earned: state.earned,
    net: state.earned - state.paid,
    upgraded: state.upgraded,
    upgradeCost: PRESS_UPGRADE_COST,
    upgradeUnlocked: state.upgraded || points >= PRESS_UPGRADE_UNLOCK_POINTS,
    perClick: pressesPerClick(state),
    piAt: PI_BUTTON_PRESSES,
    piUnlocked,
    pressesToPi: Math.max(0, PI_BUTTON_PRESSES - state.presses),
    tiers: PRESS_TIERS.map((tier) => ({
      ...tier,
      unlocked: isTierUnlocked(tier, state, points),
      affordable: points >= tier.cost,
      net: pressNet(tier),
    })),
  };
}
