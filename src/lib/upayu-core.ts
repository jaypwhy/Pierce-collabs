/**
 * UPayU Bridge core — the one account behind every Pierce Collabs app.
 *
 * Server-only. Persists to a single JSON file (no database), the same way the
 * DropKey is stored. Everything mutates through `withAccount`, which serialises
 * writes and swaps the file atomically so a reload, a restart or two clicks at
 * once never leave a half-written balance.
 */
import fs from "node:fs/promises";
import path from "node:path";

import {
  PI_BUTTON_PRESSES,
  PRESS_UPGRADE_COST,
  PRESS_UPGRADE_UNLOCK_POINTS,
  blankPressPay,
  buildPressView,
  normalisePressPay,
  openTierIds,
  pressNet,
  pressesPerClick,
  tierById,
  type PressPayState,
  type PressView,
} from "./press-pay-rules";
import { record } from "./ruhbi-ledger";

/**
 * The Pi Algo — the bridge's one conversion rule:
 *   dollars = floor(π × 100 × points²)
 * 1 point = $314, 10 points = $31,415, 100 points = $3,141,592.
 */
export const PI_ALGO_FORMULA = "floor(π × 100 × points²)";

export function piAlgoDollars(points: number): number {
  const n = Number.isFinite(points) ? Math.max(0, points) : 0;
  return Math.floor(Math.PI * 100 * n * n);
}

export const MIN_CONVERT_POINTS = 1;
export const DRIP_POINTS = 25;
export const DRIP_COOLDOWN_MS = 60_000;

const STORE_FILE =
  process.env.UPUAY_ACCOUNT_FILE?.trim() || "/home/team/shared/upayu-account.json";
const USER_ID = "pierce";
const MAX_LEDGER = 40;
const MAX_PIECES = 12;

export type EntryKind = "sip" | "drip" | "convert" | "art" | "press";

export type LedgerEntry = {
  id: string;
  kind: EntryKind;
  points: number;
  dollars: number;
  note: string;
  at: string;
};

export type ArtPiece = {
  id: string;
  name: string;
  media: string;
  points: number;
  at: string;
  thumb: string;
};

export type Account = {
  id: string;
  points: number;
  dollars: number;
  lifetimePoints: number;
  lastDripAt: string | null;
  pieces: ArtPiece[];
  ledger: LedgerEntry[];
  /** Press Pay Btn's own record: presses counted, the upgrade, the hidden button. */
  pressPay: PressPayState;
  updatedAt: string;
};

export type LadderRung = { points: number; dollars: number };

export type Snapshot = {
  ok: boolean;
  error?: string;
  account: Account;
  /** Points at the Pi Algo: floor(π × 100 × points²). */
  dollarValue: number;
  /** Settled dollars already converted, plus this point balance. */
  totalValue: number;
  conversion: { minimumPoints: number; formula: string };
  drip: { points: number; cooldownMs: number; remainingMs: number; ready: boolean };
  ladder: LadderRung[];
  /** Press Pay Btn — presses, the upgrade and the hidden Pi button. */
  press: PressView;
};

export type SnapshotWith = Snapshot & { message?: string; awarded?: number };

/** The pi ladder — the Pi Algo at four rungs: 1 → $314, 10 → $31,415, 100 → $3,141,592, 1,000 → $314,159,265. */
export const PI_LADDER: LadderRung[] = [1, 10, 100, 1000].map((points) => ({
  points,
  dollars: piAlgoDollars(points),
}));

function nowIso(): string {
  return new Date().toISOString();
}

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function blankAccount(): Account {
  return {
    id: USER_ID,
    points: 0,
    dollars: 0,
    lifetimePoints: 0,
    lastDripAt: null,
    pieces: [],
    ledger: [],
    pressPay: blankPressPay(),
    updatedAt: nowIso(),
  };
}

function number(value: unknown, fallback = 0): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

async function readAccount(): Promise<Account> {
  try {
    const raw = await fs.readFile(STORE_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<Account> & { users?: Record<string, Account> };
    const source = (parsed.users?.[USER_ID] ?? parsed) as Partial<Account>;
    return {
      ...blankAccount(),
      ...source,
      id: USER_ID,
      points: Math.max(0, Math.floor(number(source.points))),
      dollars: Math.max(0, number(source.dollars)),
      lifetimePoints: Math.max(0, Math.floor(number(source.lifetimePoints))),
      lastDripAt: typeof source.lastDripAt === "string" ? source.lastDripAt : null,
      pieces: Array.isArray(source.pieces) ? source.pieces.slice(0, MAX_PIECES) : [],
      ledger: Array.isArray(source.ledger) ? source.ledger.slice(0, MAX_LEDGER) : [],
      pressPay: normalisePressPay(source.pressPay),
    };
  } catch {
    return blankAccount();
  }
}

async function writeAccount(account: Account): Promise<void> {
  const next: Account = { ...account, updatedAt: nowIso() };
  const tmp = `${STORE_FILE}.${process.pid}.tmp`;
  await fs.mkdir(path.dirname(STORE_FILE), { recursive: true });
  await fs.writeFile(tmp, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  await fs.rename(tmp, STORE_FILE);
}

let queue: Promise<unknown> = Promise.resolve();

/**
 * One writer at a time: read, mutate, write, hand back both.
 *
 * `after` runs inside the same turn of the queue, once the account is on disk,
 * so a movement's RUHBI ledger line is written in the order the balances were
 * written and can never disagree with them.
 */
function withAccount<T>(
  fn: (account: Account) => T,
  after?: (account: Account, result: T) => Promise<void> | void,
): Promise<{ account: Account; result: T }> {
  const run = queue.then(async () => {
    const account = await readAccount();
    const result = fn(account);
    await writeAccount(account);
    if (after) await after(account, result);
    return { account, result };
  });
  queue = run.catch(() => undefined);
  return run;
}

function snapshot(account: Account, extra: { message?: string; awarded?: number } = {}): SnapshotWith {
  const since = account.lastDripAt ? Date.parse(account.lastDripAt) : 0;
  const elapsed = Number.isFinite(since) ? Date.now() - since : DRIP_COOLDOWN_MS;
  const remainingMs = Math.max(0, DRIP_COOLDOWN_MS - elapsed);
  return {
    ok: true,
    account,
    dollarValue: piAlgoDollars(account.points),
    totalValue: account.dollars + piAlgoDollars(account.points),
    conversion: { minimumPoints: MIN_CONVERT_POINTS, formula: PI_ALGO_FORMULA },
    drip: {
      points: DRIP_POINTS,
      cooldownMs: DRIP_COOLDOWN_MS,
      remainingMs,
      ready: remainingMs === 0,
    },
    ladder: PI_LADDER,
    press: buildPressView(account.pressPay, account.points),
    ...extra,
  };
}

function fail(account: Account, error: string): Snapshot {
  return { ...snapshot(account), ok: false, error };
}

export async function readSnapshot(): Promise<Snapshot> {
  return snapshot(await readAccount());
}

/** Points in: a sip from an app, a task, a piece of art. */
export async function sipPoints(input: {
  points?: number;
  note?: string;
  kind?: "sip" | "art";
}): Promise<SnapshotWith> {
  const requested = Math.floor(number(input.points, 10));
  const points = Math.min(1000, Math.max(1, requested || 10));
  const kind: EntryKind = input.kind === "art" ? "art" : "sip";
  const note = (input.note ?? "").trim().slice(0, 120) || "Sip";

  const { account, result } = await withAccount(
    (account) => {
      account.points += points;
      account.lifetimePoints += points;
      account.ledger.unshift({
        id: newId(),
        kind,
        points,
        dollars: 0,
        note,
        at: nowIso(),
      });
      account.ledger = account.ledger.slice(0, MAX_LEDGER);
      return points;
    },
    (account) =>
      record({
        account: account.id,
        kind: kind === "art" ? "art" : "sip",
        points,
        dollars: 0,
        balanceBefore: account.points - points,
        balanceAfter: account.points,
        ref: kind === "art" ? "art:save" : "sip-drip:sip",
        memo: note,
      }).then(() => undefined),
  );

  return snapshot(account, { awarded: result, message: `+${result} points` });
}

/** The base-income drip. One claim per cooldown window. */
export async function dripPoints(): Promise<SnapshotWith> {
  const current = snapshot(await readAccount());
  if (!current.drip.ready) {
    const seconds = Math.ceil(current.drip.remainingMs / 1000);
    return {
      ...fail(current.account, `The drip is resting — ${seconds}s until the next one.`),
      drip: current.drip,
    };
  }

  const { account } = await withAccount(
    (account) => {
      account.points += DRIP_POINTS;
      account.lifetimePoints += DRIP_POINTS;
      account.lastDripAt = nowIso();
      account.ledger.unshift({
        id: newId(),
        kind: "drip",
        points: DRIP_POINTS,
        dollars: 0,
        note: "Base income drip",
        at: nowIso(),
      });
      account.ledger = account.ledger.slice(0, MAX_LEDGER);
    },
    (account) =>
      record({
        account: account.id,
        kind: "drip",
        points: DRIP_POINTS,
        dollars: 0,
        balanceBefore: account.points - DRIP_POINTS,
        balanceAfter: account.points,
        ref: "sip-drip:drip",
        memo: "Base income drip",
      }).then(() => undefined),
  );

  return snapshot(account, { awarded: DRIP_POINTS, message: `+${DRIP_POINTS} points, dripped` });
}

/** Points become dollars through the Pi Algo, from 1 point upward. */
export async function convertPoints(input: { points?: number }): Promise<SnapshotWith> {
  const reader = await readAccount();
  const available = reader.points;
  const requested = input.points === undefined ? NaN : Math.floor(number(input.points));

  let points = Number.isFinite(requested) ? requested : available;
  if (points > available) {
    points = available;
  }

  if (points < MIN_CONVERT_POINTS) {
    return fail(
      reader,
      available < MIN_CONVERT_POINTS
        ? `You need at least ${MIN_CONVERT_POINTS} point to convert — you have ${available}.`
        : `Convert at least ${MIN_CONVERT_POINTS} point.`,
    );
  }

  const dollars = piAlgoDollars(points);
  const { account } = await withAccount(
    (account) => {
      account.points -= points;
      account.dollars += dollars;
      account.ledger.unshift({
        id: newId(),
        kind: "convert",
        points: -points,
        dollars,
        note: `${points} ${points === 1 ? "point" : "points"} → ${dollars.toLocaleString("en-US")}`,
        at: nowIso(),
      });
      account.ledger = account.ledger.slice(0, MAX_LEDGER);
    },
    (account) =>
      record({
        account: account.id,
        kind: "convert",
        points: -points,
        dollars,
        balanceBefore: account.points + points,
        balanceAfter: account.points,
        ref: "upayu:convert",
        memo: "Pi Algo conversion",
      }).then(() => undefined),
  );

  return snapshot(account, {
    awarded: points,
    message: `${points} ${points === 1 ? "point" : "points"} converted — $${dollars.toLocaleString("en-US")} settled.`,
  });
}

/** A finished piece of art earns its points through the same bridge. */
export async function saveArtWork(input: {
  name?: string;
  media?: string;
  points?: number;
  thumb?: string;
}): Promise<SnapshotWith> {
  const points = Math.min(5000, Math.max(1, Math.floor(number(input.points, 1))));
  const name = (input.name ?? "").trim().slice(0, 80) || "Untitled piece";
  const media = (input.media ?? "").trim().slice(0, 120) || "Mixed media";
  const thumb = typeof input.thumb === "string" ? input.thumb.slice(0, 400_000) : "";

  const { account, result } = await withAccount(
    (account) => {
      const piece: ArtPiece = { id: newId(), name, media, points, at: nowIso(), thumb };
      account.pieces = [piece, ...account.pieces].slice(0, MAX_PIECES);
      account.points += points;
      account.lifetimePoints += points;
      account.ledger.unshift({
        id: newId(),
        kind: "art",
        points,
        dollars: 0,
        note: name,
        at: nowIso(),
      });
      account.ledger = account.ledger.slice(0, MAX_LEDGER);
      return piece;
    },
    (account, piece) =>
      record({
        account: account.id,
        kind: "art",
        points: piece.points,
        dollars: 0,
        balanceBefore: account.points - piece.points,
        balanceAfter: account.points,
        ref: "art:save",
        memo: piece.name,
      }).then(() => undefined),
  );

  return snapshot(account, {
    awarded: result.points,
    message: `Saved — ${result.points} points into your UPayU balance.`,
  });
}

/**
 * Press Pay Btn — a press spends points and returns ten times as many.
 *
 * The press itself is the movement: the account goes up by the net, one line
 * lands in the RUHBI ledger, and the press counter moves. Points only — no
 * money moves here, whatever the Pi Algo reads the points as.
 */
export async function pressPoints(input: { tier?: string } = {}): Promise<SnapshotWith> {
  const current = await readAccount();
  const tier = tierById(input.tier);
  const view = buildPressView(current.pressPay, current.points);
  const tierView = view.tiers.find((entry) => entry.id === tier.id) ?? view.tiers[0];

  if (!tierView.unlocked) {
    return fail(
      current,
      tier.hiddenUntilPresses !== null
        ? `The Pi button is not here yet — ${view.pressesToPi.toLocaleString("en-US")} more ${view.pressesToPi === 1 ? "press" : "presses"} to go.`
        : `That button opens at ${tier.unlockPoints} points — the account holds ${current.points}.`,
    );
  }

  if (current.points < tier.cost) {
    return fail(
      current,
      `A press costs ${tier.cost} ${tier.cost === 1 ? "point" : "points"} — the account holds ${current.points}.`,
    );
  }

  const counted = pressesPerClick(current.pressPay);
  const net = pressNet(tier);

  const { account } = await withAccount(
    (account) => {
      account.points += net;
      account.lifetimePoints += tier.pays;

      const press = account.pressPay;
      press.presses += counted;
      press.paid += tier.cost;
      press.earned += tier.pays;
      press.unlocked = openTierIds(press, account.points);
      if (press.presses >= PI_BUTTON_PRESSES && !press.piUnlockedAt) {
        press.piUnlockedAt = nowIso();
        press.unlocked = openTierIds(press, account.points);
      }

      account.ledger.unshift({
        id: newId(),
        kind: "press",
        points: net,
        dollars: 0,
        note: `${tier.label} · ${tier.cost} in → ${tier.pays} out`,
        at: nowIso(),
      });
      account.ledger = account.ledger.slice(0, MAX_LEDGER);
    },
    (account) =>
      record({
        account: account.id,
        kind: "press",
        points: net,
        dollars: 0,
        balanceBefore: account.points - net,
        balanceAfter: account.points,
        ref: `press-pay:${tier.id}`,
        memo: `${tier.label} — ${tier.cost} point${tier.cost === 1 ? "" : "s"} in, ${tier.pays} out`,
      }).then(() => undefined),
  );

  return snapshot(account, {
    awarded: net,
    message: `+${net} points — ${tier.cost} in, ${tier.pays} out.`,
  });
}

/**
 * Double Your Clicks — 100 points, once. From then on every press counts twice
 * towards the 1,000 that reveal the Pi button.
 */
export async function pressUpgrade(): Promise<SnapshotWith> {
  const current = await readAccount();

  if (current.pressPay.upgraded) {
    return snapshot(current, { message: "Double Your Clicks is already on." });
  }
  if (current.points < PRESS_UPGRADE_COST) {
    return fail(
      current,
      `Double Your Clicks opens at ${PRESS_UPGRADE_UNLOCK_POINTS} points and costs ${PRESS_UPGRADE_COST} — the account holds ${current.points}.`,
    );
  }

  const { account } = await withAccount(
    (account) => {
      account.points -= PRESS_UPGRADE_COST;
      account.pressPay.upgraded = true;
      account.pressPay.upgradedAt = nowIso();
      account.pressPay.unlocked = openTierIds(account.pressPay, account.points);
      account.ledger.unshift({
        id: newId(),
        kind: "press",
        points: -PRESS_UPGRADE_COST,
        dollars: 0,
        note: "Double Your Clicks — every press counts twice",
        at: nowIso(),
      });
      account.ledger = account.ledger.slice(0, MAX_LEDGER);
    },
    (account) =>
      record({
        account: account.id,
        kind: "press",
        points: -PRESS_UPGRADE_COST,
        dollars: 0,
        balanceBefore: account.points + PRESS_UPGRADE_COST,
        balanceAfter: account.points,
        ref: "press-pay:upgrade",
        memo: "Double Your Clicks — every press counts twice",
      }).then(() => undefined),
  );

  return snapshot(account, {
    message: "Double Your Clicks is on — every press now counts twice.",
  });
}
