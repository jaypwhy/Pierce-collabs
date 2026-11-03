/**
 * RUHBI ledger — the append-only record underneath the bridge.
 *
 * One file, one line per movement, never edited and never deleted. `record` is
 * the only function that appends, and it is called from the same critical
 * section that changes the account, so no line can disagree with the balance it
 * reports. Corrections are new lines that reverse an earlier one.
 *
 * Server-only: a JSON file, same as the account, until there is a reason for more.
 */
import fs from "node:fs/promises";
import path from "node:path";

export const LEDGER_FILE =
  process.env.RUHBI_LEDGER_FILE?.trim() || "/home/team/shared/ruhbi-ledger.json";

export type LedgerKind = "opening" | "sip" | "drip" | "art" | "convert" | "adjust";

export type RuhbiEntry = {
  /** `ldg_0001`, `ldg_0002`, … in the order the lines were written. */
  id: string;
  at: string;
  account: string;
  kind: LedgerKind;
  /** Signed: negative when points leave the account. */
  points: number;
  /** Money as a decimal string, so it is never a float. */
  dollars: string;
  balanceAfter: number;
  /** Where the movement came from, so a line can be traced to the app. */
  ref: string;
  memo: string;
};

function nowIso(): string {
  return new Date().toISOString();
}

function entryId(n: number): string {
  return `ldg_${String(n).padStart(4, "0")}`;
}

/** Dollars are whole in the Pi Algo, but money is still carried as cents. */
function centsFromDollars(dollars: number): number {
  const n = Number.isFinite(dollars) ? dollars : 0;
  return Math.round(n * 100);
}

function decimalFromCents(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

export function decimalDollars(dollars: number): string {
  return decimalFromCents(centsFromDollars(dollars));
}

async function readLines(): Promise<{ entries: RuhbiEntry[]; broken: number }> {
  let raw: string;
  try {
    raw = await fs.readFile(LEDGER_FILE, "utf8");
  } catch {
    return { entries: [], broken: 0 };
  }

  const entries: RuhbiEntry[] = [];
  let broken = 0;
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const parsed = JSON.parse(trimmed) as RuhbiEntry;
      if (parsed && typeof parsed === "object" && typeof parsed.points === "number") {
        entries.push(parsed);
      } else {
        broken++;
      }
    } catch {
      // A line that does not parse is counted, not skipped silently: verify
      // reports it rather than pretending the history is intact.
      broken++;
    }
  }
  return { entries, broken };
}

async function append(lines: RuhbiEntry[]): Promise<void> {
  if (!lines.length) return;
  await fs.mkdir(path.dirname(LEDGER_FILE), { recursive: true });
  await fs.appendFile(LEDGER_FILE, lines.map((line) => `${JSON.stringify(line)}\n`).join(""), "utf8");
}

/** One writer at a time, so two movements never interleave their lines. */
let queue: Promise<unknown> = Promise.resolve();

function serialise<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn);
  queue = run.catch(() => undefined);
  return run;
}

export type Movement = {
  account: string;
  kind: Exclude<LedgerKind, "opening">;
  points: number;
  dollars: number;
  /** The balance before this movement — the opening line when the ledger starts here. */
  balanceBefore: number;
  balanceAfter: number;
  ref: string;
  memo: string;
};

function openingLine(account: string, balance: number, nextId: number): RuhbiEntry {
  return {
    id: entryId(nextId),
    at: nowIso(),
    account,
    kind: "opening",
    points: balance,
    dollars: "0.00",
    balanceAfter: balance,
    ref: "ruhbi:opening",
    memo: `Opening balance — ${balance} points earned before the ledger existed.`,
  };
}

/**
 * The one append. Every action that changes value calls this at the moment it
 * changes the account; the first movement writes the opening line first, so the
 * history starts with the balance it inherited.
 */
export function record(movement: Movement): Promise<RuhbiEntry[]> {
  return serialise(async () => {
    const { entries } = await readLines();
    const written: RuhbiEntry[] = [];

    let nextId = entries.length + 1;
    if (!entries.length) {
      written.push(openingLine(movement.account, movement.balanceBefore, nextId));
      nextId++;
    }

    written.push({
      id: entryId(nextId),
      at: nowIso(),
      account: movement.account,
      kind: movement.kind,
      points: movement.points,
      dollars: decimalDollars(movement.dollars),
      balanceAfter: movement.balanceAfter,
      ref: movement.ref,
      memo: movement.memo,
    });

    await append(written);
    return written;
  });
}

/**
 * A ledger that has never recorded a movement still opens honestly: the balance
 * the account holds today is the first line, and nothing before it is invented.
 */
export function ensureOpening(account: string, balance: number): Promise<void> {
  return serialise(async () => {
    const { entries } = await readLines();
    if (entries.length) return;
    await append([openingLine(account, balance, 1)]);
  });
}

export type LedgerFilter = { limit?: number; kind?: string; account?: string };

export type LedgerView = {
  count: number;
  total: number;
  filter: { limit: number | null; kind: string | null; account: string | null };
  entries: RuhbiEntry[];
};

/** Every entry, newest first. */
export async function ledgerView(filter: LedgerFilter = {}): Promise<LedgerView> {
  const { entries } = await readLines();
  let selected = entries;

  if (filter.kind) selected = selected.filter((entry) => entry.kind === filter.kind);
  if (filter.account) selected = selected.filter((entry) => entry.account === filter.account);

  const total = selected.length;
  if (filter.limit && filter.limit > 0) selected = selected.slice(-filter.limit);

  return {
    count: selected.length,
    total,
    filter: { limit: filter.limit ?? null, kind: filter.kind ?? null, account: filter.account ?? null },
    entries: [...selected].reverse(),
  };
}

export type SummaryView = {
  openingPoints: number;
  pointsIssued: number;
  pointsConverted: number;
  pointsAdjusted: number;
  dollarsSettled: string;
  outstandingBalance: number;
  entryCount: number;
  firstAt: string | null;
  lastAt: string | null;
};

/** What the record adds up to, without replaying it (verify does that). */
export async function summaryView(): Promise<SummaryView> {
  const { entries } = await readLines();
  let openingPoints = 0;
  let pointsIssued = 0;
  let pointsConverted = 0;
  let pointsAdjusted = 0;
  let settledCents = 0;

  for (const entry of entries) {
    settledCents += centsFromDollars(Number(entry.dollars));
    if (entry.kind === "opening") {
      openingPoints += entry.points;
    } else if (entry.kind === "convert") {
      pointsConverted += Math.max(0, -entry.points);
    } else if (entry.kind === "adjust") {
      pointsAdjusted += entry.points;
    } else if (entry.points > 0) {
      pointsIssued += entry.points;
    } else {
      pointsAdjusted += entry.points;
    }
  }

  return {
    openingPoints,
    pointsIssued,
    pointsConverted,
    pointsAdjusted,
    dollarsSettled: decimalFromCents(settledCents),
    outstandingBalance: entries.length ? entries[entries.length - 1].balanceAfter : 0,
    entryCount: entries.length,
    firstAt: entries.length ? entries[0].at : null,
    lastAt: entries.length ? entries[entries.length - 1].at : null,
  };
}

export type VerifyMismatch = { id: string; balanceAfter: number; expected: number };

export type VerifyView = {
  verified: boolean;
  entryCount: number;
  brokenLines: number;
  openingPoints: number;
  replayedBalance: number;
  currentBalance: number;
  dollarsSettled: string;
  mismatches: VerifyMismatch[];
  message: string;
};

/** Replays the lines and confirms they add up to the balance the account holds now. */
export async function verifyView(currentBalance: number): Promise<VerifyView> {
  const { entries, broken } = await readLines();
  const mismatches: VerifyMismatch[] = [];
  let running = 0;
  let settledCents = 0;

  for (const entry of entries) {
    running += entry.points;
    settledCents += centsFromDollars(Number(entry.dollars));
    if (entry.balanceAfter !== running) {
      mismatches.push({ id: entry.id, balanceAfter: entry.balanceAfter, expected: running });
    }
  }

  const openingPoints = entries.length && entries[0].kind === "opening" ? entries[0].points : 0;
  const verified = entries.length > 0 && broken === 0 && !mismatches.length && running === currentBalance;

  return {
    verified,
    entryCount: entries.length,
    brokenLines: broken,
    openingPoints,
    replayedBalance: running,
    currentBalance,
    dollarsSettled: decimalFromCents(settledCents),
    mismatches: mismatches.slice(0, 10),
    message: verified
      ? `${entries.length} ${entries.length === 1 ? "line replays" : "lines replay"} to ${running} points — the balance the account holds.`
      : !entries.length
        ? "The ledger is empty — there is nothing to verify yet."
        : broken
          ? `${broken} ${broken === 1 ? "line does" : "lines do"} not parse — the record is damaged.`
          : mismatches.length
            ? `${mismatches.length} ${mismatches.length === 1 ? "line disagrees" : "lines disagree"} with the running balance.`
            : `The lines replay to ${running} points, but the account holds ${currentBalance}.`,
  };
}
