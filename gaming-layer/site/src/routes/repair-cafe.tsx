import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { PiScaleBadge } from "~/components/pi-scale-badge";
/* ============================================================================
 * REPAIR CAFE / LIBRARY OF THINGS — LEND & MEND — playable closed-loop demo
 *
 * Every number here is the design's constants block (repair-cafe/design.md —
 * copied, not re-derived):
 *   Faucets  : STOCK +1 part an action (F1 r1 +2, r2 +3 — the player chooses k,
 *              never past the bench's capacity; a refusal creates NOTHING) ·
 *              FIX pays `cost` if the bench was EXACTLY emptied by the spend,
 *              `cost//2` if not — the doubling is a comparison, read BEFORE the
 *              spend
 *   Jobs     : SMALL = cap/4 (2/3/4) · BIG = 3cap/4 (6/9/12); SMALL + BIG = cap
 *   Tray     : EVERY fix hands 1 part back (F2: 2) — created = spent − 2, exactly
 *   Ceiling  : SMALL + BIG = cap credits a card — 8 / 12 / 16, with every power
 *              on. No power, rank or course can add one credit.
 *   Powers   : F1 THE SPARES CART (12 / 34 CR, 2 ranks MAX) · F2 THE RETURN TRAY
 *              (22 CR) · F3 THE CLAMP (2 CR per use, repeatable, charged only
 *              when pressed, saves exactly 1 action) · F4 THE FAULT BOOK (6 CR,
 *              zero units: prints numbers this design already publishes)
 *   Sinks    : the fixes themselves · LEND A KIT 8 parts (unbounded) ·
 *              THE NOTICEBOARD 3 CR (unbounded) · F3 2 CR a use · the price
 *              list (6/12/16/22/34/56 = 146 CR finite)
 *   Rhythm   : THE CARD WAITS — no setInterval, no setTimeout that changes
 *              state, no Date.now anywhere in this file; closing the tab
 *              freezes the save and a half-fixed card is still there.
 * No purchases, no ads, no accounts, no network: meta persists in
 * localStorage only (lendmend.save.v1). This is a FICTIONAL cafe: a card of 8
 * credits is eight numbers in a save file, the counters measure the save and
 * nothing else, and no claim about real repairs, real skills, real savings or
 * real waste is made anywhere (design Part E guardrail).
 * ==========================================================================*/
type Phase = "start" | "cafe" | "book" | "loop";
type Which = "small" | "big";
type Trade = "electrical" | "textile" | "wood";
interface Card {
  small: boolean;
  big: boolean;
}
interface Stats {
  cards: number;
  jobs: number;
  clears: number;
  carries: number;
  carried: number;
  kitsLent: number;
  clampUses: number;
  cardActions: number; // actions in the card in progress — printed when it closes
  cardCr: number; // credits the card in progress has paid — same
}
interface Meta {
  saveVersion: 1;
  pt: number;
  cr: number;
  crEarned: number;
  room: 1 | 2 | 3;
  card: Card;
  cart: 0 | 1 | 2; // F1 THE SPARES CART rank
  tray: boolean; // F2 THE RETURN TRAY
  book: boolean; // F4 THE FAULT BOOK
  clamp: boolean; // F3 THE CLAMP armed: the next FIX this card costs no action
  boards: number;
  kits: number;
  badges: string[];
  trades: { electrical: number; textile: number; wood: number };
  stats: Stats;
}
/* ------------------------- constants (verbatim) --------------------------- */
const SAVE_KEY = "lendmend.save.v1";
export const EXPORT_FILENAME = "lendmend-save.json";
const ROOM = {
  1: { name: "THE FRONT TABLE", bench: 8, cost: 0 },
  2: { name: "THE BACK BENCH", bench: 12, cost: 16 },
  3: { name: "THE WHOLE ROOM", bench: 16, cost: 56 },
} as const;
const TRAY_RETURN = [1, 2]; // parts back per fix, by F2
const CART_GAIN = [1, 2, 3]; // parts one STOCK action may carry, by F1 rank
const F1_COST = [0, 12, 34]; // by rank; 2 ranks MAX
const F2_COST = 22; // F2 THE RETURN TRAY, 1 rank MAX
const F4_COST = 6; // F4 THE FAULT BOOK, 1 rank MAX
const F3_COST = 2; // CR per use, repeatable
const BOARD_COST = 3; // unbounded CR sink
const KIT_PT = 8; // unbounded part sink
const BADGE_EVERY = 10;
const LEDGER_KEEP = 30;
const TRADES: Trade[] = ["electrical", "textile", "wood"];
const FINITE_TABLE = F4_COST + F1_COST[1] + ROOM[2].cost + F2_COST + F1_COST[2] + ROOM[3].cost; // 146
/* --------------------- derived rules (verbatim from the design) ----------- */
const benchOf = (room: number) => ROOM[room as 1 | 2 | 3].bench;
const SMALL_OF = (bench: number) => bench / 4; // 2 / 3 / 4
const BIG_OF = (bench: number) => (3 * bench) / 4; // 6 / 9 / 12
const FIX_CR = (cost: number, clear: boolean) => (clear ? cost : Math.floor(cost / 2));
const gainOf = (rank: number) => CART_GAIN[rank] ?? 1;
const retOf = (tray: boolean) => TRAY_RETURN[tray ? 1 : 0];
const costOf = (bench: number, which: Which) => (which === "small" ? SMALL_OF(bench) : BIG_OF(bench));
const tradeOfCard = (cardsClosed: number) => TRADES[cardsClosed % TRADES.length];
/* ------------------------------ seed -------------------------------------- */
const SEED_META: Meta = {
  saveVersion: 1,
  pt: 0,
  cr: 0,
  crEarned: 0,
  room: 1,
  card: { small: false, big: false },
  cart: 0,
  tray: false,
  book: false,
  clamp: false,
  boards: 0,
  kits: 0,
  badges: [],
  trades: { electrical: 0, textile: 0, wood: 0 },
  stats: { cards: 0, jobs: 0, clears: 0, carries: 0, carried: 0, kitsLent: 0, clampUses: 0, cardActions: 0, cardCr: 0 },
};
/* ======================= the published balance lines ======================
 * The same arithmetic checks.py runs, recomputed in the browser from the
 * constants above — the LOOP panel prints the result live (see bandReport).
 * ========================================================================*/
/** TAUGHT line: carry only what the job needs, in chunks of `gain`, from the steady bench. */
function taughtLine(bench: number, gain: number, ret: number) {
  const costs = [SMALL_OF(bench), BIG_OF(bench)];
  let pt = ret;
  let actions = 0;
  for (const cost of costs) {
    while (pt < cost) {
      pt += Math.min(gain, cost - pt);
      actions += 1;
    }
    pt = pt - cost + ret;
    actions += 1;
  }
  return { actions, credits: SMALL_OF(bench) + BIG_OF(bench) };
}
/** FLAT line: fill the bench before every fix — cap actions, halves rounded down. */
function flatLine(bench: number) {
  return { actions: bench, credits: Math.floor(SMALL_OF(bench) / 2) + Math.floor(BIG_OF(bench) / 2) };
}
/** Is there a cycle of play whose actions/credits ratio is below `lam`? (Bellman-Ford) */
function hasNegCycle(bench: number, gain: number, ret: number, lam: number): boolean {
  const small = SMALL_OF(bench);
  const big = BIG_OF(bench);
  const idx = (p: number, c: number) => p * 3 + c;
  const nodes = (bench + 1) * 3;
  const edges: Array<[number, number, number]> = [];
  for (let p = 0; p <= bench; p += 1) {
    for (let c = 0; c < 3; c += 1) {
      for (let k = 1; k <= gain; k += 1) {
        if (p + k <= bench) edges.push([idx(p, c), idx(p + k, c), 1]);
      }
      ([
        [1, small],
        [2, big],
      ] as const).forEach(([bit, cost]) => {
        if (c & bit) return;
        if (p < cost) return;
        const paid = p === cost ? cost : Math.floor(cost / 2);
        edges.push([idx(p, c), idx(p - cost + ret, (c | bit) % 3), 1 - lam * paid]);
      });
    }
  }
  const dist = new Array<number>(nodes).fill(0);
  for (let it = 0; it < nodes; it += 1) {
    let changed = false;
    for (const [a, b, w] of edges) {
      if (dist[a] + w < dist[b] - 1e-12) {
        dist[b] = dist[a] + w;
        changed = true;
      }
    }
    if (!changed) return false;
  }
  return true;
}
/** The best possible closed cycle of cards, by parametric search on the ratio. */
function bestCycle(bench: number, gain: number, ret: number): number {
  let lo = 0.2;
  let hi = 3;
  for (let i = 0; i < 60; i += 1) {
    const mid = (lo + hi) / 2;
    if (hasNegCycle(bench, gain, ret, mid)) hi = mid;
    else lo = mid;
  }
  return lo;
}
const POWER_STATES: Array<{ name: string; gain: number; ret: number }> = [
  { name: "NO POWERS", gain: 1, ret: 1 },
  { name: "F1 THE SPARES CART r1", gain: 2, ret: 1 },
  { name: "F1 THE SPARES CART r2", gain: 3, ret: 1 },
  { name: "F2 THE RETURN TRAY", gain: 1, ret: 2 },
  { name: "F1 r2 + F2", gain: 3, ret: 2 },
];
/** The 24 published lines: 15 taught + 3 flat + 6 best-cycle. Band 0.43..2.40. */
function bandReport() {
  const lines: Array<{ name: string; rate: number }> = [];
  for (const room of [1, 2, 3] as const) {
    for (const st of POWER_STATES) {
      const t = taughtLine(ROOM[room].bench, st.gain, st.ret);
      lines.push({ name: `TAUGHT ${ROOM[room].bench} · ${st.name}`, rate: t.actions / t.credits });
    }
    const f = flatLine(ROOM[room].bench);
    lines.push({ name: `FLAT ${ROOM[room].bench}`, rate: f.actions / f.credits });
  }
  for (const room of [1, 2, 3] as const) {
    for (const st of [POWER_STATES[0], POWER_STATES[4]]) {
      lines.push({ name: `BEST CYCLE ${ROOM[room].bench} · ${st.name}`, rate: bestCycle(ROOM[room].bench, st.gain, st.ret) });
    }
  }
  const rates = lines.map((l) => l.rate);
  return { lines, lo: Math.min(...rates), hi: Math.max(...rates) };
}
/* ----------------------- dev checks (L1 + the ceilings) ------------------- */
function devChecks(): void {
  /* eslint-disable no-console */
  const taughtPublished: Record<number, number[]> = { 8: [8, 6, 5, 6, 4], 12: [12, 7, 6, 10, 6], 16: [16, 10, 7, 14, 7] };
  for (const bench of [8, 12, 16]) {
    POWER_STATES.forEach((st, i) => {
      const t = taughtLine(bench, st.gain, st.ret);
      console.assert(t.actions === taughtPublished[bench][i], `A5: taught line ${bench}/${st.name}`);
      console.assert(t.credits === bench, "A1: SMALL + BIG must equal the bench's size");
    });
    const f = flatLine(bench);
    console.assert(f.credits === Math.floor(SMALL_OF(bench) / 2) + Math.floor(BIG_OF(bench) / 2), "A5: flat line");
  }
  const rep = bandReport();
  console.assert(Math.abs(rep.lo - 3 / 7) < 1e-6, "A6: the band's floor is 3/7 (0.43)");
  console.assert(Math.abs(rep.hi - 2.4) < 1e-9, "A6: the band's ceiling is 2.40");
  console.assert(rep.lines.length === 24, "A6: 24 published lines");
  console.assert(FINITE_TABLE === 146, "A10: the finite price list must total 146 CR");
  console.assert(SMALL_OF(benchOf(1)) <= 2 * CART_GAIN[0], "L1: the first credits must be 3 actions away");
  console.assert(CART_GAIN[0] === 1 && TRAY_RETURN[0] === 1, "L1: rank 0 carries 1 and returns 1");
  console.assert(F3_COST > 0, "A9: F3 must cost credits — it buys an action, never a payout");
  /* eslint-enable no-console */
}
/* ------------------------- persistence + export --------------------------- */
function cloneMeta(m: Meta): Meta {
  return {
    ...m,
    card: { ...m.card },
    badges: [...m.badges],
    trades: { ...m.trades },
    stats: { ...m.stats },
  };
}
function loadMeta(): Meta {
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return cloneMeta(SEED_META);
    const parsed = JSON.parse(raw) as Partial<Meta>;
    const s: Meta = { ...cloneMeta(SEED_META), ...parsed } as Meta;
    s.saveVersion = 1;
    s.room = (parsed.room === 2 || parsed.room === 3 ? parsed.room : 1) as 1 | 2 | 3;
    s.cart = (parsed.cart === 1 || parsed.cart === 2 ? parsed.cart : 0) as 0 | 1 | 2;
    s.tray = !!parsed.tray;
    s.book = !!parsed.book;
    s.clamp = !!parsed.clamp;
    s.badges = Array.isArray(parsed.badges) ? [...(parsed.badges as string[])] : [];
    s.trades = { ...SEED_META.trades, ...(parsed.trades ?? {}) };
    s.stats = { ...SEED_META.stats, ...(parsed.stats ?? {}) };
    s.card = { small: !!parsed.card?.small, big: !!parsed.card?.big };
    // sanitize the bench so a stale save can never strand a card
    const bench = benchOf(s.room);
    s.pt = Math.max(0, Math.min(bench, Math.floor(s.pt || 0)));
    s.cr = Math.max(0, Math.floor(s.cr || 0));
    s.crEarned = Math.max(s.cr, Math.floor(s.crEarned || 0));
    s.boards = Math.max(0, Math.floor(s.boards || 0));
    s.kits = Math.max(0, Math.floor(s.kits || 0));
    return s;
  } catch {
    return cloneMeta(SEED_META);
  }
}
function exportSave(meta: Meta) {
  // Documented schema (design B2) — the open card is in the file on purpose:
  // a stranger can export, close the tab mid-card, reopen and compare.
  const payload = {
    saveVersion: meta.saveVersion,
    pt: meta.pt,
    cr: meta.cr,
    crEarned: meta.crEarned,
    room: meta.room,
    card: { small: meta.card.small, big: meta.card.big },
    cart: meta.cart,
    tray: meta.tray,
    book: meta.book,
    clamp: meta.clamp,
    boards: meta.boards,
    kits: meta.kits,
    badges: [...meta.badges],
    trades: { ...meta.trades },
    stats: { ...meta.stats },
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = EXPORT_FILENAME;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Defer the revoke: revoking synchronously after click() can race the
  // browser's download start and abort the file (blob: URLs). This timer
  // changes no game state — the design's ban is on state-changing timers.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
/* ------------------------------ route ------------------------------------- */
export const Route = createFileRoute("/repair-cafe")({
  component: RepairCafe,
});
function RepairCafe() {
  const [meta, setMeta] = useState<Meta>(SEED_META);
  const [hydrated, setHydrated] = useState(false);
  const [phase, setPhase] = useState<Phase>("start");
  const [carrySize, setCarrySize] = useState(1);
  const [ledger, setLedger] = useState<string[]>([
    "THE CARD IS PINNED UP — CARRY PARTS, THEN FIX THE SMALL JOB AND THE BIG JOB",
  ]);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const metaRef = useRef<Meta>(meta);
  const phaseRef = useRef<Phase>(phase);
  const carrySizeRef = useRef(carrySize);
  const log = (line: string) => setLedger((l) => [...l.slice(-(LEDGER_KEEP - 1)), line]);
  /** run one action on the current meta; returns the next meta and the ledger line */
  const apply = (fn: (m: Meta) => { m: Meta; line: string; notice?: string }) => {
    const { m, line, notice: nt } = fn(metaRef.current);
    metaRef.current = m; // keep the ref current so rapid presses never act on a stale bench
    setMeta(m);
    log(line);
    setNotice(nt ?? null);
  };
  /* persistence */
  useEffect(() => {
    const m = loadMeta();
    setMeta(m);
    devChecks();
    setHydrated(true);
    setLedger((l) => [
      `SAVE LOADED — ROOM ${m.room} · BENCH ${m.pt}/${benchOf(m.room)} · CREDITS ${m.cr} · CARD ${
        m.card.small && m.card.big ? "CLOSED" : "OPEN"
      }`,
      ...l,
    ]);
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    metaRef.current = meta;
    try {
      window.localStorage.setItem(SAVE_KEY, JSON.stringify(meta));
    } catch {
      /* storage unavailable — the demo still works, it just won't persist */
    }
  }, [meta, hydrated]);
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);
  /* ------------------------------- STOCK ----------------------------------- */
  const stock = (want: number) =>
    apply((m) => {
      const bench = benchOf(m.room);
      const gain = gainOf(m.cart);
      const k = Math.max(1, Math.min(want, gain));
      if (m.pt >= bench) {
        return { m, line: `STOCK — BENCH FULL — ${bench}/${bench}`, notice: `BENCH FULL — ${bench}/${bench}` };
      }
      const n = cloneMeta(m);
      const before = n.pt;
      n.pt = Math.min(n.pt + k, bench); // refused parts are NOT created
      const delta = n.pt - before;
      const refused = k - delta;
      n.stats.carries += 1;
      n.stats.carried += delta;
      n.stats.cardActions += 1;
      return {
        m: n,
        line: `STOCK +${delta} → BENCH ${n.pt}/${bench}${refused > 0 ? ` · ${refused} REFUSED — BENCH FULL` : ""}`,
        notice: refused > 0 ? `BENCH FULL — ${bench}/${bench}` : undefined,
      };
    });
  /* -------------------------------- FIX ------------------------------------ */
  const fix = (which: Which) =>
    apply((m) => {
      const bench = benchOf(m.room);
      const cost = costOf(bench, which);
      const ret = retOf(m.tray);
      const name = which === "small" ? "SMALL" : "BIG";
      if (m.card[which]) {
        return { m, line: `FIX ${name} — ALREADY FIXED THIS CARD`, notice: `${name} IS ALREADY FIXED` };
      }
      if (m.pt < cost) {
        return { m, line: `FIX ${name} — NEEDS ${cost} PARTS`, notice: `NEEDS ${cost} PARTS — HAVE ${m.pt}` };
      }
      const n = cloneMeta(m);
      const clear = n.pt === cost; // read BEFORE the spend
      const paid = FIX_CR(cost, clear);
      const freeAction = n.clamp; // F3 THE CLAMP: this fix costs no action
      n.cr += paid;
      n.crEarned += paid;
      n.pt = n.pt - cost + ret;
      n.card[which] = true;
      n.stats.jobs += 1;
      if (clear) n.stats.clears += 1;
      n.stats.cardCr += paid;
      if (!freeAction) n.stats.cardActions += 1;
      n.clamp = false;
      const trade = tradeOfCard(n.stats.cards);
      n.trades[trade] += 1;
      let line = `FIX ${name} · ${clear ? "CLEAR" : "NOT CLEAR"} → +${paid} CR · BENCH ${n.pt} · TRAY +${ret}${
        freeAction ? " · F3 — NO ACTION SPENT" : ""
      }`;
      if (n.card.small && n.card.big) {
        line += ` — CARD CLOSED · ${n.stats.cardActions} ACTIONS · ${n.stats.cardCr} CREDITS · NEW CARD POSTED`;
        n.card = { small: false, big: false };
        n.stats.cards += 1;
        n.stats.cardActions = 0;
        n.stats.cardCr = 0;
      }
      return { m: n, line };
    });
  /* ------------------------------- F3 -------------------------------------- */
  const onClamp = () =>
    apply((m) => {
      if (m.clamp) {
        return { m, line: `F3 THE CLAMP — ALREADY ARMED`, notice: "THE CLAMP IS ALREADY ARMED" };
      }
      if (m.cr < F3_COST) {
        return { m, line: `F3 THE CLAMP — NEEDS ${F3_COST} CR`, notice: `NEEDS ${F3_COST} CR — HAVE ${m.cr}` };
      }
      const n = cloneMeta(m);
      n.cr -= F3_COST;
      n.clamp = true;
      n.stats.clampUses += 1;
      return { m: n, line: `F3 THE CLAMP — ${F3_COST} CR · THE NEXT FIX THIS CARD COSTS NO ACTION` };
    });
  /* ------------------------------- sinks ----------------------------------- */
  const doBadge = (badges: string[], key: string, count: number): string[] => {
    if (count > 0 && count % BADGE_EVERY === 0) {
      const badge = `${key} ${count}`;
      return badges.includes(badge) ? badges : [...badges, badge];
    }
    return badges;
  };
  const onLend = () =>
    apply((m) => {
      if (m.pt < KIT_PT) {
        return { m, line: `LEND A KIT — NEEDS ${KIT_PT} PARTS`, notice: `NEEDS ${KIT_PT} PARTS — HAVE ${m.pt}` };
      }
      const n = cloneMeta(m);
      n.pt -= KIT_PT;
      n.kits += 1;
      n.stats.kitsLent += 1;
      n.badges = doBadge(n.badges, "KIT", n.kits);
      return { m: n, line: `LEND A KIT — ${KIT_PT} PARTS → KIT #${n.kits} OUT ON LOAN` };
    });
  const onBoard = () =>
    apply((m) => {
      if (m.cr < BOARD_COST) {
        return { m, line: `THE NOTICEBOARD — NEEDS ${BOARD_COST} CR`, notice: `NEEDS ${BOARD_COST} CR — HAVE ${m.cr}` };
      }
      const n = cloneMeta(m);
      n.cr -= BOARD_COST;
      n.boards += 1;
      n.badges = doBadge(n.badges, "CARD", n.boards);
      return { m: n, line: `THE NOTICEBOARD — ${BOARD_COST} CR → CARD #${n.boards} PINNED UP` };
    });
  /* ------------------------------- unlocks -------------------------------- */
  const buy = (label: string, cost: number, mutate: (n: Meta) => void) =>
    apply((m) => {
      if (m.cr < cost) {
        return { m, line: `${label} — NEEDS ${cost} CR`, notice: `NEEDS ${cost} CR — HAVE ${m.cr}` };
      }
      const n = cloneMeta(m);
      n.cr -= cost;
      mutate(n);
      return { m: n, line: `${label} — ${cost} CR PAID FROM THE CAFE'S BOOK` };
    });
  const onF4 = () => buy("F4 THE FAULT BOOK", F4_COST, (n) => (n.book = true));
  const onF1a = () => buy("F1 THE SPARES CART — RANK 1", F1_COST[1], (n) => (n.cart = 1));
  const onRoom2 = () =>
    buy(`BENCH 2 — ${ROOM[2].name}`, ROOM[2].cost, (n) => {
      n.room = 2;
      n.pt = Math.min(n.pt, benchOf(2));
    });
  const onF2 = () => buy("F2 THE RETURN TRAY", F2_COST, (n) => (n.tray = true));
  const onF1b = () => buy("F1 THE SPARES CART — RANK 2 (MAX)", F1_COST[2], (n) => (n.cart = 2));
  const onRoom3 = () =>
    buy(`BENCH 3 — ${ROOM[3].name}`, ROOM[3].cost, (n) => {
      n.room = 3;
      n.pt = Math.min(n.pt, benchOf(3));
    });
  /* ------------------------------ misc ------------------------------------- */
  const resetSave = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    try {
      window.localStorage.removeItem(SAVE_KEY);
    } catch {
      /* ignore */
    }
    setMeta(cloneMeta(SEED_META));
    setPhase("start");
    setCarrySize(1);
    setLedger(["THE CARD IS PINNED UP — CARRY PARTS, THEN FIX THE SMALL JOB AND THE BIG JOB"]);
    setNotice(null);
    setConfirmReset(false);
  };
  /* input: keyboard — the same keys as the button faces */
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const ph = phaseRef.current;
      if (ph === "start" && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        setPhase("cafe");
        return;
      }
      if ((ph === "book" || ph === "loop") && e.key === "Escape") {
        setPhase("cafe");
        return;
      }
      if (ph !== "cafe") return;
      const k = e.key.toLowerCase();
      if (k === "c") stock(carrySizeRef.current);
      else if (k === "1") fix("small");
      else if (k === "2") fix("big");
      else if (k === "f") onClamp();
      else if (k === "q") setCarrySize((s) => Math.max(1, s - 1));
      else if (k === "e") setCarrySize((s) => Math.min(gainOf(metaRef.current.cart), s + 1));
      else if (k === "s") setPhase("book");
      else if (k === "l") setPhase("loop");
      else if (k === "x") exportSave(metaRef.current);
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    carrySizeRef.current = Math.min(carrySize, gainOf(metaRef.current.cart));
  }, [carrySize, meta]);
  /* ------------------------- the cafe canvas ------------------------------ */
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;
    const m = metaRef.current;
    const bench = benchOf(m.room);
    const small = SMALL_OF(bench);
    const big = BIG_OF(bench);
    const ret = retOf(m.tray);
    const clearSmall = !m.card.small && m.pt === small;
    const clearBig = !m.card.big && m.pt === big;
    const F5 = "5px 'Press Start 2P', monospace";
    const F4 = "4px 'Press Start 2P', monospace";
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = PAL.wall;
    ctx.fillRect(0, 0, 320, 240);
    /* HUD — two 8-px lines */
    ctx.font = F5;
    ctx.fillStyle = PAL.cream;
    ctx.fillText(`${ROOM[m.room].name} · BENCH ${m.pt}/${bench}`, 4, 10);
    ctx.fillStyle = PAL.brass;
    ctx.fillText(`CLEAR? ${clearSmall ? "YES — SMALL" : clearBig ? "YES — BIG" : "NO"} · CEILING ${bench}`, 4, 20);
    /* the bench — bench slots of 10×14 in rows of six */
    ctx.fillStyle = PAL.crate;
    ctx.fillRect(6, 24, 146, 126);
    ctx.strokeStyle = PAL.oak;
    ctx.lineWidth = 1;
    ctx.strokeRect(6.5, 24.5, 145, 125);
    if (clearSmall || clearBig) {
      ctx.fillStyle = PAL.brass;
      ctx.fillRect(8, 26, 142, 10);
      ctx.fillStyle = PAL.ink;
      ctx.font = F4;
      ctx.fillText(`CLEAR — FIX THE ${clearSmall ? "SMALL" : "BIG"} JOB NOW`, 10, 34);
    }
    for (let i = 0; i < bench; i += 1) {
      const col = i % 6;
      const row = Math.floor(i / 6);
      const x = 12 + col * 22;
      const y = 42 + row * 18;
      if (i < m.pt) {
        ctx.fillStyle = PAL.oak;
        ctx.fillRect(x, y, 10, 14);
      } else {
        ctx.fillStyle = PAL.wall;
        ctx.fillRect(x, y, 10, 14);
        ctx.strokeStyle = PAL.tin;
        ctx.strokeRect(x + 0.5, y + 0.5, 9, 13);
      }
    }
    /* the crate + the return tray */
    ctx.fillStyle = PAL.crate;
    ctx.fillRect(12, 112, 40, 32);
    ctx.strokeStyle = PAL.tin;
    ctx.strokeRect(12.5, 112.5, 39, 31);
    ctx.fillStyle = PAL.tin;
    ctx.font = F4;
    ctx.fillText("CRATE", 16, 124);
    ctx.fillStyle = PAL.cream;
    ctx.font = F5;
    ctx.fillText(`[C] CARRY +${gainOf(m.cart)}`, 58, 120);
    ctx.fillStyle = PAL.tin;
    ctx.font = F4;
    ctx.fillText("FREE · NEVER GATED", 58, 130);
    ctx.fillText(`BENCH ${m.pt}/${bench}`, 58, 140);
    ctx.fillStyle = PAL.brass;
    ctx.fillText(`TRAY +${ret} A FIX`, 12, 152);
    /* the card — a paper panel with two ruled lines */
    ctx.fillStyle = PAL.cream;
    ctx.fillRect(160, 24, 152, 88);
    ctx.strokeStyle = PAL.oak;
    ctx.strokeRect(160.5, 24.5, 151, 87);
    ctx.fillStyle = PAL.ink;
    ctx.font = F5;
    ctx.fillText("THE CARD", 166, 36);
    ctx.fillStyle = PAL.oak;
    ctx.fillRect(165, 40, 142, 1);
    const ruled = (which: Which, y: number, label: string, cost: number) => {
      const done = m.card[which];
      const willClear = m.pt === cost;
      ctx.fillStyle = done ? PAL.tin : PAL.ink;
      ctx.font = F5;
      ctx.fillText(`${label} · ${cost} PARTS`, 166, y);
      ctx.fillStyle = done ? PAL.tin : willClear ? PAL.oak : PAL.crate;
      ctx.fillText(done ? "FIXED" : willClear ? `CLEAR +${cost}` : `+${FIX_CR(cost, false)}`, 254, y);
      ctx.fillStyle = done ? PAL.tin : PAL.crate;
      ctx.font = F4;
      ctx.fillText(`PAYS ${FIX_CR(cost, false)} (${cost} IF CLEAR)`, 166, y + 9);
      if (done) {
        ctx.strokeStyle = PAL.tin;
        ctx.beginPath();
        ctx.moveTo(164, y - 4);
        ctx.lineTo(310, y - 4);
        ctx.stroke();
      }
    };
    ruled("small", 54, "SMALL", small);
    ruled("big", 84, "BIG", big);
    ctx.fillStyle = PAL.crate;
    ctx.font = F4;
    ctx.fillText(`${tradeOfCard(m.stats.cards).toUpperCase()} — A RECORD, NOT A RULE`, 166, 106);
    /* the cafe — the noticeboard and the kit shelf */
    ctx.fillStyle = PAL.crate;
    ctx.fillRect(160, 116, 152, 60);
    ctx.strokeStyle = PAL.brass;
    ctx.strokeRect(160.5, 116.5, 151, 59);
    for (let b = 0; b < 8; b += 1) {
      const x = 166 + b * 18;
      const pinned = b < m.boards % 9;
      ctx.fillStyle = pinned ? PAL.cream : PAL.wall;
      ctx.fillRect(x, 122, 12, 16);
      ctx.strokeStyle = PAL.brass;
      ctx.strokeRect(x + 0.5, 122.5, 11, 15);
    }
    ctx.fillStyle = PAL.cream;
    ctx.font = F4;
    ctx.fillText(`BOARDS ${m.boards} · KITS ${m.kits} · BADGES ${m.badges.length}`, 166, 152);
    ctx.fillStyle = PAL.brass;
    ctx.fillText("[S] BOOK — THE PRICE LIST · [L] LOOP", 166, 168);
    /* the action bar + the honest line */
    ctx.fillStyle = PAL.brass;
    ctx.font = F4;
    ctx.fillText("[C] CARRY  [1] FIX SMALL  [2] FIX BIG  [F] CLAMP", 4, 188);
    ctx.fillStyle = PAL.cream;
    ctx.fillText("[S] BOOK  [L] LOOP  [X] EXPORT THE SAVE", 4, 197);
    ctx.fillText("A CARD IS EIGHT NUMBERS IN A SAVE FILE.", 4, 214);
    ctx.fillText("NOTHING HERE IS A REAL REPAIR.", 4, 223);
    ctx.fillStyle = PAL.brass;
    ctx.fillText("THE CARD WAITS — NO NUMBER MOVES WHILE YOU ARE AWAY", 4, 233);
  }, [meta, phase]);
  /* ------------------------------ render ---------------------------------- */
  const m = meta;
  const gain = gainOf(m.cart);
  const size = Math.min(carrySize, gain);
  return (
    <div className="min-h-dvh bg-[#140f0a] text-amber-100">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b-4 border-amber-500/40 px-4 py-3">
        <div>
          <h1 className="font-pixel text-lg text-amber-300 drop-shadow-[3px_3px_0_rgba(0,0,0,0.9)]">LEND &amp; MEND</h1>
          <p className="text-[10px] uppercase tracking-[0.25em] text-amber-500/70">
            repair cafe · library of things · carry → fix → cut credits · Gaming Layer demo
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a href="/local-energy" className="pixel-btn bg-neutral-900 px-3 py-2 text-[9px] text-amber-200">
            ⚡ KETTLE LANE ▶
          </a>
          <a href="/repair-cafe-design" data-testid="link-to-design" className="pixel-btn bg-neutral-900 px-3 py-2 text-[9px] text-cyan-300">
            ▤ THE DESIGN
          </a>
          <a href="/" className="pixel-btn bg-neutral-900 px-3 py-2 text-[9px] text-amber-300">
            ◀ BACK
          </a>
        </div>
      </header>

      {/* the shared π display scale — the loop's own unit is untouched */}
      <PiScaleBadge units={m.cr} unit="CR" tone="amber" />

      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6">
        {phase === "start" && (
          <StartScreen
            meta={m}
            onStart={() => setPhase("cafe")}
            onExport={() => exportSave(metaRef.current)}
            onReset={resetSave}
            confirmReset={confirmReset}
          />
        )}
        {phase === "cafe" && (
          <CafeScreen
            meta={m}
            notice={notice}
            ledger={ledger}
            carrySize={size}
            gain={gain}
            onCarrySize={(n) => setCarrySize(Math.max(1, Math.min(gain, n)))}
            onStock={() => stock(size)}
            onFix={fix}
            onClamp={onClamp}
            onLend={onLend}
            onBoard={onBoard}
            onBook={() => setPhase("book")}
            onLoop={() => setPhase("loop")}
            onExport={() => exportSave(metaRef.current)}
            canvasRef={canvasRef}
          />
        )}
        {phase === "book" && (
          <BookScreen
            meta={m}
            onBack={() => setPhase("cafe")}
            onF4={onF4}
            onF1a={onF1a}
            onRoom2={onRoom2}
            onF2={onF2}
            onF1b={onF1b}
            onRoom3={onRoom3}
            onLend={onLend}
            onBoard={onBoard}
            onExport={() => exportSave(metaRef.current)}
          />
        )}
        {phase === "loop" && (
          <div className="flex flex-col gap-4">
            <LoopPanel meta={m} />
            <div className="flex items-center justify-between">
              <button data-testid="go-cafe" onClick={() => setPhase("cafe")} className="pixel-btn bg-amber-300 px-5 py-3 text-xs text-neutral-950">
                ↩ BACK TO THE CAFE
              </button>
              <span className="text-[9px] text-amber-100/40">ESC ALSO RETURNS</span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
/* ------------------------------- palette ---------------------------------- */
const PAL = {
  wall: "#241a12",
  oak: "#6b4a2a",
  crate: "#3a4048",
  tin: "#9aa4ae",
  cream: "#efe6d2",
  brass: "#c8a040",
  ink: "#1a1410",
};
/* ------------------------------ start screen ------------------------------ */
function StartScreen({
  meta,
  onStart,
  onExport,
  onReset,
  confirmReset,
}: {
  meta: Meta;
  onStart: () => void;
  onExport: () => void;
  onReset: () => void;
  confirmReset: boolean;
}) {
  const bench = benchOf(meta.room);
  return (
    <div className="relative z-20 mt-3 flex flex-col items-center gap-3 py-2 text-center">
      <p className="font-pixel text-sm text-amber-300">THE LOOP IN FIVE LINES</p>
      <ul className="space-y-1 text-[11px] leading-relaxed text-amber-100/80">
        <li>CARRYING IS FREE AND UNLIMITED</li>
        <li>FIX THE SMALL JOB AND THE BIG JOB</li>
        <li>A FIX THAT LEAVES THE BENCH EMPTY PAYS FULL</li>
        <li>THE CARD WAITS FOR EVER — NOT ONE NUMBER MOVES WHILE YOU ARE AWAY</li>
        <li>16 CREDITS OPENS THE BACK BENCH</li>
      </ul>
      <p className="max-w-xl border-2 border-amber-500/30 bg-amber-950/20 px-4 py-2 text-[10px] leading-relaxed text-amber-100/70">
        A CARD IS EIGHT NUMBERS IN A SAVE FILE. NOTHING HERE IS A REAL REPAIR — the parts and the credits are two
        integers, the bench is a capacity you bought with credits, and the card advances only while you press a key.
        This is a fictional cafe, and the counters measure the save file and nothing else.
      </p>
      <p className="text-[10px] text-amber-100/50">
        SEED: THE FRONT TABLE · BENCH {bench} · 0 PARTS · 0 CREDITS · CART +1 · NO POWERS · SMALL {SMALL_OF(bench)} / BIG{" "}
        {BIG_OF(bench)} PARTS
      </p>
      <p className="max-w-xl text-center text-[10px] leading-relaxed text-amber-100/50">
        CARDS CLOSED {meta.stats.cards} · JOBS {meta.stats.jobs} · CLEARS {meta.stats.clears} · CARRIES{" "}
        {meta.stats.carries} · PARTS CARRIED {meta.stats.carried} · F3 USES {meta.stats.clampUses} · PARTS {meta.pt} ·
        CREDITS {meta.cr} (EARNED {meta.crEarned}) · BOARDS {meta.boards} · KITS {meta.kits}
      </p>
      <button data-testid="to-cafe" onClick={onStart} className="pixel-btn bg-amber-300 px-6 py-4 text-sm text-neutral-950">
        ▶ TO THE BENCH — ROOM {meta.room} · BENCH {bench}
      </button>
      <div className="flex gap-2">
        <button data-testid="export-save-start" onClick={onExport} className="pixel-btn bg-cyan-950 px-3 py-2 text-[8px] text-cyan-200">
          ⤓ EXPORT SAVE → {EXPORT_FILENAME}
        </button>
        <button
          data-testid="reset-save"
          onClick={onReset}
          className={`pixel-btn px-3 py-2 text-[8px] ${confirmReset ? "bg-red-900 text-red-100" : "bg-neutral-900 text-neutral-400"}`}
        >
          {confirmReset ? "SURE? CLICK AGAIN" : "RESET SAVE"}
        </button>
      </div>
      <p className="max-w-xl text-[9px] leading-relaxed text-amber-100/40">
        Keys on the bench: C CARRY · 1 FIX SMALL · 2 FIX BIG · F THE CLAMP ({F3_COST} CR) · Q/E CARRY SIZE · S BOOK · L
        LOOP · X EXPORT. No clock, no timer, no cooldown: the card waits for ever at its full published price.
      </p>
    </div>
  );
}
/* ------------------------------- cafe screen ------------------------------ */
function CafeScreen({
  meta,
  notice,
  ledger,
  carrySize,
  gain,
  onCarrySize,
  onStock,
  onFix,
  onClamp,
  onLend,
  onBoard,
  onBook,
  onLoop,
  onExport,
  canvasRef,
}: {
  meta: Meta;
  notice: string | null;
  ledger: string[];
  carrySize: number;
  gain: number;
  onCarrySize: (n: number) => void;
  onStock: () => void;
  onFix: (which: Which) => void;
  onClamp: () => void;
  onLend: () => void;
  onBoard: () => void;
  onBook: () => void;
  onLoop: () => void;
  onExport: () => void;
  canvasRef: RefObject<HTMLCanvasElement | null>;
}) {
  const m = meta;
  const bench = benchOf(m.room);
  const small = SMALL_OF(bench);
  const big = BIG_OF(bench);
  const ret = retOf(m.tray);
  const clearSmall = !m.card.small && m.pt === small;
  const clearBig = !m.card.big && m.pt === big;
  const clearLabel = clearSmall ? "YES — SMALL CLEARS" : clearBig ? "YES — BIG CLEARS" : "NO";
  const trade = tradeOfCard(m.stats.cards);
  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="relative w-full max-w-3xl border-4 border-amber-500/50 bg-[#1a130d] p-4 shadow-[8px_8px_0_rgba(0,0,0,0.6)]">
        <div className="scanlines pointer-events-none absolute inset-0 z-10" />
        {/* HUD strip */}
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 font-pixel text-[8px] text-amber-100/80">
          <span data-testid="hud-room">
            ROOM {m.room} — {ROOM[m.room].name} · BENCH {bench}
          </span>
          <span data-testid="bench-value" className="text-amber-200">
            BENCH {m.pt}/{bench}
          </span>
          <span data-testid="bench-clear" className={clearSmall || clearBig ? "text-amber-300" : "text-cyan-300"}>
            CLEAR? {clearLabel}
          </span>
          <span data-testid="credits-value" className="text-pink-300">
            CREDITS {m.cr}
          </span>
          <span>CEILING {bench} CREDITS A CARD · NO COURSE RAISES IT</span>
        </div>
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={320}
            height={240}
            style={{ imageRendering: "pixelated", width: "100%", maxWidth: 640, height: "auto", aspectRatio: "320 / 240" }}
            className="mx-auto block"
          />
        </div>
        {/* F4 THE FAULT BOOK — every value it prints is already published */}
        {m.book && (
          <p data-testid="fault-book-line" className="mt-1 text-center font-pixel text-[8px] text-amber-300">
            BENCH {m.pt}/{bench} · SMALL NEEDS {small} · BIG NEEDS {big} · CARRY {Math.max(0, Math.ceil((small - m.pt) / gain))}{" "}
            FOR SMALL / {Math.max(0, Math.ceil((big - m.pt) / gain))} FOR BIG · FIX PAYS {small} IF THE BENCH CLEARS,{" "}
            {FIX_CR(small, false)} IF NOT — {big} / {FIX_CR(big, false)} FOR BIG
          </p>
        )}
        {/* the card, DOM-readable */}
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <div
            data-testid="card-small-state"
            className={`border-2 px-3 py-2 text-[9px] ${m.card.small ? "border-neutral-700 bg-neutral-900 text-neutral-500" : "border-amber-500/40 bg-amber-950/20 text-amber-100"}`}
          >
            SMALL · {small} PARTS · PAYS {FIX_CR(small, false)} ({small} IF CLEAR) ·{" "}
            {m.card.small ? "FIXED" : clearSmall ? "CLEAR NOW" : "OPEN"}
          </div>
          <div
            data-testid="card-big-state"
            className={`border-2 px-3 py-2 text-[9px] ${m.card.big ? "border-neutral-700 bg-neutral-900 text-neutral-500" : "border-amber-500/40 bg-amber-950/20 text-amber-100"}`}
          >
            BIG · {big} PARTS · PAYS {FIX_CR(big, false)} ({big} IF CLEAR) · {m.card.big ? "FIXED" : clearBig ? "CLEAR NOW" : "OPEN"}
          </div>
        </div>
        <p className="mt-1 text-center font-pixel text-[8px] text-amber-100/50">
          {trade.toUpperCase()} CARD — THE TRADE TAG IS A RECORD, NOT A RULE · NO RULE READS IT
        </p>
      </div>
      {/* action bar */}
      <div className="grid w-full max-w-3xl grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="flex flex-col gap-1">
          <div className="flex gap-1">
            {Array.from({ length: gain }, (_, i) => i + 1).map((k) => (
              <button
                key={k}
                data-testid={`carry-size-${k}`}
                onClick={() => onCarrySize(k)}
                className={`pixel-btn flex-1 px-1 py-1 text-[8px] ${carrySize === k ? "bg-amber-600 text-amber-50" : "bg-neutral-900 text-neutral-400"}`}
              >
                {k}
              </button>
            ))}
          </div>
          <button
            data-testid="carry-btn"
            onClick={onStock}
            className="pixel-btn bg-[#3a2510] px-3 py-3 text-[9px] text-amber-200"
          >
            [C] CARRY +{carrySize}
            {gain > 1 ? ` (UP TO +${gain})` : ""} — FREE · UNLIMITED
          </button>
        </div>
        <button
          data-testid="fix-small"
          onClick={() => onFix("small")}
          disabled={m.card.small}
          className={`pixel-btn px-3 py-3 text-[9px] ${m.card.small ? "bg-neutral-950 text-neutral-600" : m.pt >= small ? "bg-amber-700 text-amber-50" : "bg-neutral-900 text-neutral-500"}`}
        >
          [1] FIX SMALL {clearSmall ? `· CLEAR +${small}` : `· +${FIX_CR(small, false)}`} · {small} PARTS
        </button>
        <button
          data-testid="fix-big"
          onClick={() => onFix("big")}
          disabled={m.card.big}
          className={`pixel-btn px-3 py-3 text-[9px] ${m.card.big ? "bg-neutral-950 text-neutral-600" : m.pt >= big ? "bg-amber-300 text-neutral-950" : "bg-neutral-900 text-neutral-500"}`}
        >
          [2] FIX BIG {clearBig ? `· CLEAR +${big}` : `· +${FIX_CR(big, false)}`} · {big} PARTS
        </button>
        <button
          data-testid="use-clamp"
          onClick={onClamp}
          className={`pixel-btn px-3 py-3 text-[9px] ${m.clamp ? "bg-lime-900 text-lime-200" : m.cr >= F3_COST ? "bg-pink-900 text-pink-100" : "bg-neutral-950 text-neutral-500"}`}
        >
          [F] CLAMP {F3_COST} CR → NEXT FIX FREE{`${m.clamp ? " · ARMED" : ""}`}
        </button>
      </div>
      {/* the two unbounded sinks + nav */}
      <div className="grid w-full max-w-3xl grid-cols-2 gap-2 sm:grid-cols-5">
        <button data-testid="lend-kit" onClick={onLend} className="pixel-btn bg-neutral-800 px-2 py-3 text-[8px] text-lime-300">
          {m.pt >= KIT_PT ? `▶ LEND A KIT · ${KIT_PT} PARTS · KIT #${m.kits + 1}` : `LEND A KIT: ${KIT_PT} PARTS — SHORT ${KIT_PT - m.pt}`}
        </button>
        <button data-testid="noticeboard" onClick={onBoard} className="pixel-btn bg-neutral-800 px-2 py-3 text-[8px] text-amber-200">
          {m.cr >= BOARD_COST ? `▶ NOTICEBOARD ${BOARD_COST} CR · #${m.boards + 1}` : `NOTICEBOARD: ${BOARD_COST} CR — SHORT ${BOARD_COST - m.cr}`}
        </button>
        <button data-testid="go-book" onClick={onBook} className="pixel-btn bg-neutral-900 px-2 py-3 text-[8px] text-amber-100">
          [S] BOOK — THE PRICE LIST
        </button>
        <button data-testid="go-loop" onClick={onLoop} className="pixel-btn bg-neutral-900 px-2 py-3 text-[8px] text-amber-100">
          [L] LOOP — THE PUBLISHED MATH
        </button>
        <button data-testid="export-save-cafe" onClick={onExport} className="pixel-btn bg-cyan-950 px-2 py-3 text-[8px] text-cyan-200">
          ⤓ EXPORT SAVE
        </button>
      </div>
      <div className="w-full max-w-3xl border-2 border-amber-500/20 bg-black/40">
        <div className="flex items-center justify-between border-b border-amber-500/20 px-3 py-2">
          <span className="font-pixel text-[8px] text-amber-300">THE CARD LEDGER — EVERY ACTION, PRINTED</span>
          <span className="font-pixel text-[8px] text-amber-100/40">
            CARDS {m.stats.cards} · CLEARS {m.stats.clears} · TRAY +{ret}
          </span>
        </div>
        <div data-testid="card-ledger" className="max-h-40 overflow-y-auto px-3 py-2 font-pixel text-[8px] leading-relaxed text-amber-100/80">
          {ledger.map((l, i) => (
            <div key={`${i}-${l}`} className={i === ledger.length - 1 ? "text-amber-200" : "text-amber-100/40"}>
              {l}
            </div>
          ))}
        </div>
      </div>
      <div className="min-h-5 text-center text-[10px] text-yellow-200/90">{notice ?? ""}</div>
      <p className="max-w-3xl text-center text-[9px] leading-relaxed text-amber-100/40">
        THE CARD WAITS — NOT ONE NUMBER MOVES WHILE THIS TAB IS CLOSED. A JOB WAITS FOR EVER AT ITS FULL PUBLISHED PRICE:
        NO FRESHNESS PENALTY, NO ABSENCE MAIL, NO STREAK, NO DAILY, NO COOLDOWN ANYWHERE.
      </p>
    </div>
  );
}
/* ------------------------------- book screen ------------------------------ */
function BookScreen({
  meta,
  onBack,
  onF4,
  onF1a,
  onRoom2,
  onF2,
  onF1b,
  onRoom3,
  onLend,
  onBoard,
  onExport,
}: {
  meta: Meta;
  onBack: () => void;
  onF4: () => void;
  onF1a: () => void;
  onRoom2: () => void;
  onF2: () => void;
  onF1b: () => void;
  onRoom3: () => void;
  onLend: () => void;
  onBoard: () => void;
  onExport: () => void;
}) {
  const m = meta;
  const cr = m.cr;
  return (
    <div className="flex w-full flex-col items-center gap-4" data-testid="book-panel">
      <div className="flex w-full max-w-3xl flex-wrap items-center justify-between gap-2">
        <h2 className="font-pixel text-sm text-amber-300">THE CAFE'S BOOK — THE PRICE LIST</h2>
        <div className="flex items-center gap-2">
          <span className="font-pixel text-[10px] text-pink-300">CREDITS {m.cr}</span>
          <span className="text-[9px] text-amber-100/50">
            BOARDS {m.boards} · KITS {m.kits} · FINITE TABLE {FINITE_TABLE} CR
          </span>
        </div>
      </div>
      <div className="w-full max-w-3xl border-2 border-amber-500/30 bg-black/30 p-3">
        <h3 className="font-pixel text-[9px] text-amber-300">
          THE UNLOCK TABLE — EVERY ROW IS CREDITS, NEVER MONEY · FINITE TOTAL {FINITE_TABLE} CR
        </h3>
        <div className="mt-2 flex flex-col gap-2">
          <UnlockRow
            label="F4 THE FAULT BOOK"
            cost={F4_COST}
            have={cr}
            owned={m.book}
            effect="prints BENCH 4/8 · SMALL NEEDS 2 · BIG NEEDS 6 · CARRY 2 · FIX PAYS 6 IF THE BENCH CLEARS, 3 IF NOT before you commit"
            ceiling="zero units: every value it prints is already published — it changes what you can see, never what a card pays"
            onBuy={onF4}
            testid="buy-f4"
          />
          <UnlockRow
            label="F1 THE SPARES CART — RANK 1"
            cost={F1_COST[1]}
            have={cr}
            owned={m.cart >= 1}
            effect="one CARRY action moves up to 2 parts instead of 1 (you still choose the count): a front-table card goes from 8 actions to 6"
            ceiling="2 ranks, ever · a card still pays exactly 8 credits — the ceiling is the bench's size"
            onBuy={onF1a}
            testid="buy-f1"
          />
          <UnlockRow
            label={`BENCH 2 — ${ROOM[2].name}`}
            cost={ROOM[2].cost}
            have={cr}
            owned={m.room >= 2}
            effect="bench 8 → 12: jobs 3 and 9 parts, ceiling 12 credits a card"
            ceiling="SMALL + BIG = 12 — the ceiling moves because the bench did, and no power can raise it further"
            onBuy={onRoom2}
            testid="buy-room-2"
          />
          <UnlockRow
            label="F2 THE RETURN TRAY"
            cost={F2_COST}
            have={cr}
            owned={m.tray}
            effect="every fix hands back 2 parts instead of 1, so the bench restocks faster"
            ceiling="1 rank, ever · a bigger return is fewer carries, not more credits — a fix still pays cost//2 or cost"
            onBuy={onF2}
            testid="buy-f2"
          />
          <UnlockRow
            label="F1 THE SPARES CART — RANK 2"
            cost={F1_COST[2]}
            have={cr}
            owned={m.cart >= 2}
            ownedLabel="OWNED — MAX (2 RANKS, EVER)"
            effect="one CARRY action moves up to 3 parts: a front-table card goes from 8 actions to 5"
            ceiling="MAX rank · still exactly 8 credits a card at the front table — 5 actions, same payout"
            onBuy={onF1b}
            testid="buy-f1-2"
          />
          <UnlockRow
            label={`BENCH 3 — ${ROOM[3].name}`}
            cost={ROOM[3].cost}
            have={cr}
            owned={m.room >= 3}
            effect="bench 16: jobs 4 and 12 parts, ceiling 16 credits a card"
            ceiling="SMALL + BIG = 16 — the top of the published band, every power on or off"
            onBuy={onRoom3}
            testid="buy-room-3"
          />
        </div>
        <p className="mt-2 text-[9px] text-amber-100/50">
          F3 THE CLAMP — {F3_COST} CR per use, repeatable: one fix this card costs no action, saves exactly 1 action,
          charged only when the use is pressed, and can never add a credit to any card. Buy it on the bench — [F].
        </p>
        <p className="mt-1 text-[9px] text-amber-300">NO ROW IS A TRAP — EVERY BENCH PAYS 1.00 ACTION PER CREDIT</p>
        <p className="mt-1 text-[9px] text-amber-100/50">
          All timing figures are designed, not measured — no player has reached the last row yet.
        </p>
      </div>
      <div className="w-full max-w-3xl border-2 border-amber-500/30 bg-black/30 p-3">
        <h3 className="font-pixel text-[9px] text-amber-300">THE UNBOUNDED SINKS — REAL SPENDS, BADGE EVERY {BADGE_EVERY}</h3>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <button data-testid="book-noticeboard" onClick={onBoard} className="pixel-btn bg-neutral-800 px-2 py-3 text-[8px] text-amber-200">
            {m.cr >= BOARD_COST ? `▶ THE NOTICEBOARD — ${BOARD_COST} CR · #${m.boards + 1}` : `NOTICEBOARD: ${BOARD_COST} CR — SHORT ${BOARD_COST - m.cr}`}
          </button>
          <button data-testid="book-lend-kit" onClick={onLend} className="pixel-btn bg-neutral-800 px-2 py-3 text-[8px] text-lime-300">
            {m.pt >= KIT_PT ? `▶ LEND A KIT — ${KIT_PT} PARTS · KIT #${m.kits + 1}` : `LEND A KIT: ${KIT_PT} PARTS — SHORT ${KIT_PT - m.pt}`}
          </button>
        </div>
        <p className="mt-2 text-[9px] text-amber-100/50">
          BADGES: {m.badges.length ? m.badges.join(" · ") : "— none yet —"} · earn one every {BADGE_EVERY} of any sink ·
          TRADES (a record, not a rule): ELECTRICAL {m.trades.electrical} · TEXTILE {m.trades.textile} · WOOD{" "}
          {m.trades.wood}
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button data-testid="go-cafe-from-book" onClick={onBack} className="pixel-btn bg-amber-300 px-5 py-3 text-xs text-neutral-950">
          ↩ BACK TO THE BENCH (ESC)
        </button>
        <button data-testid="export-save-book" onClick={onExport} className="pixel-btn bg-cyan-950 px-3 py-3 text-[8px] text-cyan-200">
          ⤓ EXPORT SAVE → {EXPORT_FILENAME}
        </button>
      </div>
    </div>
  );
}
function UnlockRow({
  label,
  cost,
  have,
  owned,
  ownedLabel,
  effect,
  ceiling,
  onBuy,
  testid,
}: {
  label: string;
  cost: number;
  have: number;
  owned: boolean;
  ownedLabel?: string;
  effect: string;
  ceiling: string;
  onBuy: () => void;
  testid: string;
}) {
  const short = Math.max(0, cost - have);
  return (
    <div
      className={`flex flex-col gap-1 border-2 px-3 py-2 sm:flex-row sm:items-center sm:justify-between ${owned ? "border-lime-600/40 bg-lime-950/20" : "border-amber-500/20 bg-black/20"}`}
    >
      <div className="min-w-0">
        <p className="font-pixel text-[9px] text-amber-200">
          {label} <span className="text-pink-300">· {cost} CR</span>
        </p>
        <p className="mt-1 text-[9px] leading-relaxed text-amber-100/60">{effect}</p>
        <p className="mt-0.5 text-[9px] leading-relaxed text-cyan-300/70">CEILING: {ceiling}</p>
      </div>
      <button
        data-testid={testid}
        onClick={onBuy}
        disabled={owned}
        className={`pixel-btn shrink-0 px-3 py-2 text-[8px] ${owned ? "bg-lime-900 text-lime-200" : short === 0 ? "bg-amber-300 text-neutral-950" : "bg-neutral-900 text-neutral-500"}`}
      >
        {owned ? ownedLabel ?? "OWNED" : short === 0 ? `▶ BUY ${cost} CR` : `NEED ${short} MORE`}
      </button>
    </div>
  );
}
/* -------------------------------- loop panel ------------------------------ */
function StageCard({ title, accent, lines }: { title: string; accent: string; lines: string[] }) {
  return (
    <div className="border-2 border-amber-500/20 bg-black/30 p-3">
      <p className={`font-pixel text-[9px] ${accent}`}>{title}</p>
      <ul className="mt-2 space-y-1 text-[9px] leading-relaxed text-amber-100/60">
        {lines.map((l) => (
          <li key={l}>{l}</li>
        ))}
      </ul>
    </div>
  );
}
function Arrow() {
  return <div className="hidden items-center justify-center font-pixel text-[10px] text-amber-500/50 md:flex">▶</div>;
}
function LoopPanel({ meta }: { meta: Meta }) {
  const band = bandReport();
  const bandOk = Math.abs(band.lo - 3 / 7) < 1e-6 && Math.abs(band.hi - 2.4) < 1e-9 && band.lines.length === 24;
  const taughtPublished: Record<number, number[]> = { 8: [8, 6, 5, 6, 4], 12: [12, 7, 6, 10, 6], 16: [16, 10, 7, 14, 7] };
  const taughtOk = ([1, 2, 3] as const).every((room) =>
    POWER_STATES.every((st, i) => taughtLine(ROOM[room].bench, st.gain, st.ret).actions === taughtPublished[ROOM[room].bench][i]),
  );
  const ceilingOk = ([1, 2, 3] as const).every((room) => {
    const b = ROOM[room].bench;
    return FIX_CR(SMALL_OF(b), true) + FIX_CR(BIG_OF(b), true) === b;
  });
  const best16 = bestCycle(16, 3, 2);
  return (
    <section className="border-2 border-amber-500/30 bg-black/30 p-4" data-testid="loop-panel">
      <h2 className="font-pixel text-[10px] text-amber-300">
        THE LOOP — CARRY → BENCH → FIX → CREDITS → THE BOOK → A BIGGER BENCH
      </h2>
      <div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr]">
        <StageCard
          title="INPUTS"
          accent="text-cyan-300"
          lines={[
            "Player actions only — no clock, no timer",
            "Parts, carried by STOCK (+1 an action, free)",
            "The decision at each fix: how many parts to carry",
            "Seed: THE FRONT TABLE (bench 8) · 0 parts · 0 credits · cart +1 · no powers",
          ]}
        />
        <Arrow />
        <StageCard
          title="TRANSFORMATION"
          accent="text-amber-300"
          lines={[
            "STOCK: pt = min(pt + k, bench), k ≤ cart gain — refused parts are not created",
            "FIX: pays cost if pt == cost, else cost//2",
            "pt = pt − cost + 1 (F2: + 2) — the tray hands it back",
            "Zero random variables: an integer map end to end",
          ]}
        />
        <Arrow />
        <StageCard
          title="OUTPUTS"
          accent="text-amber-200"
          lines={[
            "CREDITS cut into the cafe's book",
            "+1 part per fix — the next job's input",
            "SMALL + BIG = bench credits a card (8 / 12 / 16)",
            "Ceiling = the bench's size, with every power on",
          ]}
        />
        <Arrow />
        <StageCard
          title="REINVESTMENT"
          accent="text-pink-300"
          lines={[
            "Credits buy the cafe's kit: bigger bench, bigger cart, faster tray, a fault book",
            "New rooms add decisions, not rates: 1.00 act/CR on all three",
            "Two unbounded sinks: NOTICEBOARD 3 CR · LEND A KIT 8 parts",
          ]}
        />
      </div>
      <div className="mt-3 grid gap-2 md:grid-cols-2">
        <div className="border-2 border-amber-500/20 bg-black/20 p-3">
          <p className="font-pixel text-[9px] text-amber-300">THE BENCHES — WHAT A CARD IS</p>
          <table className="mt-2 w-full text-left text-[9px] text-amber-100/70">
            <thead className="text-amber-100/40">
              <tr>
                <th className="py-1">BENCH</th>
                <th>SMALL / BIG</th>
                <th>COST</th>
                <th>CEILING</th>
              </tr>
            </thead>
            <tbody>
              {([1, 2, 3] as const).map((r) => (
                <tr key={r}>
                  <td className="py-1">{ROOM[r].bench}</td>
                  <td>
                    {SMALL_OF(ROOM[r].bench)} / {BIG_OF(ROOM[r].bench)}
                  </td>
                  <td>{ROOM[r].cost === 0 ? "seed" : `${ROOM[r].cost} CR`}</td>
                  <td>{ROOM[r].bench} CR</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-2 border-amber-500/20 bg-black/20 p-3">
          <p className="font-pixel text-[9px] text-amber-300">THE TWO PUBLISHED LINES — PER CARD</p>
          <table className="mt-2 w-full text-left text-[9px] text-amber-100/70">
            <thead className="text-amber-100/40">
              <tr>
                <th className="py-1">BENCH</th>
                <th>TAUGHT (CARRY ONLY WHAT THE JOB NEEDS)</th>
                <th>FLAT (FILL THE BENCH)</th>
              </tr>
            </thead>
            <tbody>
              {([1, 2, 3] as const).map((r) => {
                const t = taughtLine(ROOM[r].bench, 1, 1);
                const f = flatLine(ROOM[r].bench);
                return (
                  <tr key={r}>
                    <td className="py-1">{ROOM[r].bench}</td>
                    <td>
                      {t.actions} actions · {t.credits} credits · {(t.actions / t.credits).toFixed(2)}
                    </td>
                    <td>
                      {f.actions} actions · {f.credits} credits · {(f.actions / f.credits).toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="mt-2 text-[9px] text-amber-100/50">
            Band: 0.43 to 2.40 player actions per credit over 24 machine-checked lines (the 12 bench is 2.40 because
            half of an odd cost rounds down).
          </p>
        </div>
      </div>
      <div className="mt-3 border-2 border-amber-500/20 bg-black/20 p-3">
        <p className="font-pixel text-[9px] text-amber-300">THE POWERS — THEY MOVE ACTIONS, NEVER PAYOUTS</p>
        <table className="mt-2 w-full text-left text-[9px] text-amber-100/70">
          <thead className="text-amber-100/40">
            <tr>
              <th className="py-1">POWER</th>
              <th>COST</th>
              <th>EFFECT</th>
              <th>CEILING</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-1">F1 THE SPARES CART r1</td>
              <td>{F1_COST[1]} CR</td>
              <td>CARRY up to 2 parts an action</td>
              <td>8 credits a card, unchanged</td>
            </tr>
            <tr>
              <td className="py-1">F1 THE SPARES CART r2</td>
              <td>{F1_COST[2]} CR</td>
              <td>CARRY up to 3 (MAX)</td>
              <td>8 credits a card, unchanged</td>
            </tr>
            <tr>
              <td className="py-1">F2 THE RETURN TRAY</td>
              <td>{F2_COST} CR</td>
              <td>every fix returns 2 parts</td>
              <td>fewer carries, never more credits</td>
            </tr>
            <tr>
              <td className="py-1">F3 THE CLAMP</td>
              <td>{F3_COST} CR a use</td>
              <td>one fix costs no action</td>
              <td>zero units — it makes the rate worse</td>
            </tr>
            <tr>
              <td className="py-1">F4 THE FAULT BOOK</td>
              <td>{F4_COST} CR</td>
              <td>prints bench, needs and both prices</td>
              <td>zero units — all published numbers</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="mt-3 grid gap-2 md:grid-cols-2">
        <div className="border-2 border-amber-500/20 bg-black/20 p-3">
          <p className="font-pixel text-[9px] text-amber-300">THE PRICE LIST — {FINITE_TABLE} CREDITS, FINITE</p>
          <ul className="mt-2 space-y-1 text-[9px] text-amber-100/70">
            <li>F4 THE FAULT BOOK — {F4_COST} CR</li>
            <li>F1 THE SPARES CART r1 — {F1_COST[1]} CR</li>
            <li>BENCH 2 — {ROOM[2].cost} CR</li>
            <li>F2 THE RETURN TRAY — {F2_COST} CR</li>
            <li>F1 THE SPARES CART r2 — {F1_COST[2]} CR</li>
            <li>BENCH 3 — {ROOM[3].cost} CR</li>
            <li>NOTICEBOARD {BOARD_COST} CR · F3 {F3_COST} CR a use · LEND A KIT {KIT_PT} parts — all unbounded</li>
          </ul>
        </div>
        <div className="border-2 border-amber-500/20 bg-black/20 p-3">
          <p className="font-pixel text-[9px] text-amber-300">CONSERVATION — CREATED = SPENT − 2</p>
          <p className="mt-2 text-[9px] leading-relaxed text-amber-100/70">
            Parts are created only by STOCK and destroyed only by a fix. Every fix hands 1 back (F2: 2), so a closed
            card creates exactly its two jobs' worth minus 2 — to the unit, on every bench and every power state.
            Credits are capped at the bench's size and every credit has a sink.
          </p>
          <p className="mt-2 text-[9px] leading-relaxed text-amber-300">
            THE CARD WAITS — NO NUMBER HERE CHANGES WHILE THIS TAB IS CLOSED.
          </p>
          <p className="mt-1 text-[9px] leading-relaxed text-amber-300">
            NOTHING HERE CONVERTS TO MONEY; NO PURCHASES EXIST IN THIS GAME.
          </p>
        </div>
      </div>
      {/* the balance band, recomputed live in this browser */}
      <div data-testid="balance-check" className="mt-3 border-2 border-lime-600/40 bg-lime-950/20 p-3">
        <p className="font-pixel text-[9px] text-lime-300">
          BALANCE BAND RE-CHECKED IN THIS BROWSER — {bandOk && taughtOk && ceilingOk ? "ALL GREEN" : "MISMATCH"}
        </p>
        <p className="mt-2 font-pixel text-[9px] text-lime-200">
          BAND {band.lo.toFixed(2)} .. {band.hi.toFixed(2)} ACTIONS PER CREDIT · {band.lines.length} LINES · PUBLISHED
          0.43 .. 2.40 · 24 LINES
        </p>
        <p className="mt-1 text-[9px] leading-relaxed text-lime-100/70">
          Recomputed from the constants on this page: the 15 taught lines (3 benches × 5 power states) {taughtOk ? "match" : "DO NOT match"}{" "}
          the published table, the 3 flat lines match, the ceiling SMALL + BIG = bench holds on every bench{" "}
          {ceilingOk ? "(8 / 12 / 16 credits a card with every power on)" : "(FAILS)"}, and the best possible closed
          cycle on the 16 bench with both carry powers is {best16.toFixed(4)} = 3/7 — the band's floor. Same numbers as
          checks.py: 12 asserts green.
        </p>
        <p className="mt-1 text-[9px] text-lime-100/50">
          IN THIS SAVE: ROOM {meta.room} · BENCH {meta.pt}/{benchOf(meta.room)} · CREDITS {meta.cr} · CART +
          {gainOf(meta.cart)} · TRAY +{retOf(meta.tray)} · {meta.clamp ? "CLAMP ARMED" : "CLAMP OFF"} ·{" "}
          {meta.book ? "FAULT BOOK OWNED" : "NO FAULT BOOK"}
        </p>
      </div>
    </section>
  );
}
