import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
/* ============================================================================
 * ADV. HOT HEAP — secret deluxe variant of SOIL STACK (The Gaming Layer)
 *
 * Every number here is the design's constants block (compost-to-soil-design.md,
 * /home/team/shared/compost-to-soil-design.md — copied, not re-derived):
 *   Faucets  : GLEAN +4 SC free & unlimited (anti-lockout, no gate, no cap)
 *              · EMPTY pays 1 SO per load + floor(loads/2) BR + floor(loads/3)
 *              MK (doubled when HEATED) — a lookup, never a tuning knob
 *   Loads    : GREEN 2 SC · BROWN 1 SC + 2 BR (1 BR with F2 THE RIDDLE)
 *   Heat     : HEATED iff browns × 3 >= loads; a hot pile gains +2 a turn,
 *              a cold one +1 — a cold pile takes EXACTLY twice the turns
 *   Ripe     : RIPE = max(1, 2 × loads − 4 × forkRank) (F1 THE FORK 6/18 MK)
 *   Beds     : FEED 6 SO (empty→standing) · standing→ready ONLY on an EMPTY
 *              · HARVEST +7 SC +1 BR (ready→empty). ROUND ORDER: HARVEST →
 *              FEED → BATCH — the published order that keeps SO in = SO out.
 *   Powers   : powers move COST, never PAYOUT. F1 THE FORK (6/18 MK, 2 ranks)
 *              · F2 THE RIDDLE (12 MK) · F3 THE BAT HANDLE (2 MK per use,
 *              repeatable, charged only when pressed) · F4 THE GAUGE (8 MK,
 *              zero units: prints turns-to-ripe). Ceilings never move:
 *              6/12/18 SO · 3/6/9 BR · 4/8/12 MK per batch, on every tier.
 *   Sinks    : bed feeds · bin/bed unlocks (12/16/18/22/30 MK, 124 MK total,
 *              Mark-only) · SACKS 8 SO · BORDER 6 BR · TRENCH 8 SC ·
 *              SHED TALLY 3 MK (all four unbounded, badge every 10)
 *   Rhythm   : THE BIN IS SEALED — no setInterval, no state-changing timeout,
 *              no Date.now anywhere in this file; closing the tab freezes the
 *              save and nothing changes while away. A ready batch waits
 *              indefinitely at its full published price.
 * No purchases, no ads, no accounts, no network: meta persists in
 * localStorage only (hotheap.save.v1). This is a FICTIONAL food-waste sim:
 * a batch is six numbers in a save file — nothing here is real waste, and no
 * real-world environmental claim is made (design Part E guardrail).
 * ==========================================================================*/
type Phase = "start" | "yard" | "shed" | "loop";
type BedState = "empty" | "standing" | "ready";
interface Bed {
  id: number;
  state: BedState;
  fedRound: number; // the batch number at which this bed was last fed
}
interface Stats {
  batches: number;
  hotBatches: number;
  coldBatches: number;
  soEver: number;
  marksEver: number;
  bedHarvests: number;
  gleans: number;
  batUses: number;
}
interface Meta {
  saveVersion: 1;
  sc: number;
  br: number;
  so: number;
  mk: number;
  mkEarned: number;
  binTier: 1 | 2 | 3;
  beds: Bed[];
  loads: number; // how many loads are in the bin right now
  browns: number; // how many of them are brown loads
  ripeness: number; // the batch's progress up its own ladder (capped at RIPE)
  forkRank: 0 | 1 | 2;
  riddle: boolean;
  gauge: boolean;
  tallies: number;
  borders: number;
  trenches: number;
  sacks: number;
  badges: string[];
  stats: Stats;
}
/* ------------------------- constants (verbatim) --------------------------- */
const SAVE_KEY = "hotheap.save.v1";
export const EXPORT_FILENAME = "hotheap-save.json";
const BIN = {
  1: { name: "THE PALLET BIN", cap: 6, cost: 0 },
  2: { name: "THE LONG BAY", cap: 12, cost: 12 },
  3: { name: "THE THREE-BAY YARD", cap: 18, cost: 30 },
} as const;
const BED = {
  1: { name: "THE HERB BED", cost: 0 },
  2: { name: "THE ROOT BED", cost: 16 },
  3: { name: "THE POTTING BED", cost: 22 },
} as const;
const BED_FEED_SO = 6; // FEED spends this; a STANDING bed becomes READY when a batch is EMPTIED
const BED_SC = 7; // HARVEST pays this...
const BED_BR = 1; // ...and this
const GREEN_SC = 2; // a GREEN load: 2 SC, 0 brown
const BROWN_SC = 1; // a BROWN load: 1 SC + BROWN_BR browns
const BROWN_BR = 2; // F2 THE RIDDLE changes this to 1 (never below 1)
const BROWN_BR_RIDDLE = 1;
const GLEAN_SC = 4; // free, unlimited, one action — the anti-lockout faucet
const TURN_COST = 0; // NEVER CHANGE THIS. The L1 guarantee lives on this line.
const RIPE_PER_LOAD = 2;
const RIPE_PER_FORK = 4; // RIPE = max(1, RIPE_PER_LOAD*loads - RIPE_PER_FORK*forkRank)
const GAIN_COLD = 1; // ripeness per TURN
const GAIN_HEATED = 2;
const HEAT_RATIO = 3; // HEATED iff loads > 0 && browns * HEAT_RATIO >= loads
const FORK_COST = [0, 6, 18]; // F1, by rank (0 = not owned); 2 ranks MAX
const RIDDLE_COST = 12; // F2, 1 rank MAX
const GAUGE_COST = 8; // F4, 1 rank MAX
const BAT_COST = 2; // F3, MK per use, repeatable
const TALLY_COST = 3; // unbounded MK sink
const SACKS_SO = 8;
const BORDER_BR = 6;
const TRENCH_SC = 8; // unbounded material sinks
const BADGE_EVERY = 10;
const LEDGER_KEEP = 30;
/* --------------------- derived rules (verbatim from the design) ----------- */
const heated = (loads: number, browns: number) => loads > 0 && browns * HEAT_RATIO >= loads;
const ripeAt = (loads: number, forkRank: number) =>
  Math.max(1, RIPE_PER_LOAD * loads - RIPE_PER_FORK * forkRank);
const gainFor = (loads: number, browns: number) => (heated(loads, browns) ? GAIN_HEATED : GAIN_COLD);
const turnsNeeded = (loads: number, browns: number, forkRank: number) =>
  Math.ceil(ripeAt(loads, forkRank) / gainFor(loads, browns));
const emptyPay = (loads: number, browns: number) => ({
  so: loads,
  br: Math.floor(loads / 2),
  mk: Math.floor(loads / 3) * (heated(loads, browns) ? 2 : 1),
});
const brPerBrown = (m: { riddle: boolean }) => (m.riddle ? BROWN_BR_RIDDLE : BROWN_BR);
const capOf = (binTier: number) => BIN[binTier as 1 | 2 | 3].cap;
/* ------------------------------ seed -------------------------------------- */
const SEED_META: Meta = {
  saveVersion: 1,
  sc: 12,
  br: 0,
  so: 0,
  mk: 0,
  mkEarned: 0,
  binTier: 1,
  beds: [{ id: 1, state: "empty", fedRound: 0 }],
  loads: 0,
  browns: 0,
  ripeness: 0,
  forkRank: 0,
  riddle: false,
  gauge: false,
  tallies: 0,
  borders: 0,
  trenches: 0,
  sacks: 0,
  badges: [],
  stats: {
    batches: 0,
    hotBatches: 0,
    coldBatches: 0,
    soEver: 0,
    marksEver: 0,
    bedHarvests: 0,
    gleans: 0,
    batUses: 0,
  },
};
/* ----------------------- dev lockout check (L1) --------------------------- */
function devLockoutCheck(): void {
  // eslint-disable-next-line no-console
  console.assert(TURN_COST === 0, "L1: a TURN must cost zero units");
  // eslint-disable-next-line no-console
  console.assert(GLEAN_SC > 0, "L1: GLEAN must pay at least 1");
  // worst case from an empty save: 2 gleans + 3 green loads + 6 cold turns + 1 empty
  const worstSo = 3;
  const worstBr = 1;
  const worstMk = 1;
  // eslint-disable-next-line no-console
  console.assert(worstSo >= 1 && worstBr >= 0 && worstMk >= 1, "L1: worst-case payout >= 1");
  // eslint-disable-next-line no-console
  console.assert(
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].every(
      (lds) =>
        lds === 0 ||
        turnsNeeded(lds, 0, 0) === 2 * turnsNeeded(lds, Math.ceil(lds / 3), 0) ||
        ripeAt(lds, 0) === 1,
    ),
    "A4: a cold pile takes exactly twice the turns of a hot one",
  );
  // eslint-disable-next-line no-console
  console.assert(
    [6, 12, 18].every((cap) => {
      const hot = emptyPay(cap, Math.ceil(cap / 3));
      const allOn = emptyPay(cap, Math.ceil(cap / 3)); // powers never appear in the lookup
      return hot.so === allOn.so && hot.br === allOn.br && hot.mk === allOn.mk;
    }),
    "A2: powers never change a payout",
  );
}
/* ------------------------- persistence + export --------------------------- */
function cloneMeta(m: Meta): Meta {
  return {
    ...m,
    beds: m.beds.map((b) => ({ ...b })),
    badges: [...m.badges],
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
    s.beds = (parsed.beds ?? SEED_META.beds).map((b) => ({
      id: b.id,
      state: (["empty", "standing", "ready"].includes(b.state) ? b.state : "empty") as BedState,
      fedRound: typeof b.fedRound === "number" ? b.fedRound : 0,
    }));
    s.badges = Array.isArray(parsed.badges) ? [...(parsed.badges as string[])] : [];
    s.stats = { ...SEED_META.stats, ...(parsed.stats ?? {}) };
    const n = { ...s, stats: { ...s.stats } };
    // sanitize the batch's own numbers so a stale save can never strand a pile
    const cap = capOf(n.binTier);
    if (!Number.isFinite(n.loads) || n.loads < 0 || n.loads > cap) n.loads = Math.max(0, Math.min(cap, Math.floor(n.loads || 0)));
    n.browns = Math.max(0, Math.min(n.loads, Math.floor(n.browns || 0)));
    n.ripeness = Math.max(0, Math.min(ripeAt(n.loads, n.forkRank), Math.floor(n.ripeness || 0)));
    n.forkRank = (n.forkRank === 1 || n.forkRank === 2 ? n.forkRank : 0) as 0 | 1 | 2;
    n.binTier = (n.binTier === 2 || n.binTier === 3 ? n.binTier : 1) as 1 | 2 | 3;
    n.riddle = !!n.riddle;
    n.gauge = !!n.gauge;
    return n;
  } catch {
    return cloneMeta(SEED_META);
  }
}
function exportSave(meta: Meta) {
  // Documented schema (design B2) — loads, browns and ripeness are in the file
  // on purpose: a stranger can export before and after closing the tab.
  const payload = {
    saveVersion: meta.saveVersion,
    sc: meta.sc,
    br: meta.br,
    so: meta.so,
    mk: meta.mk,
    mkEarned: meta.mkEarned,
    binTier: meta.binTier,
    beds: meta.beds.map((b) => ({ state: b.state, fedRound: b.fedRound })),
    loads: meta.loads,
    browns: meta.browns,
    ripeness: meta.ripeness,
    forkRank: meta.forkRank,
    riddle: meta.riddle,
    gauge: meta.gauge,
    tallies: meta.tallies,
    borders: meta.borders,
    trenches: meta.trenches,
    sacks: meta.sacks,
    badges: [...meta.badges],
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
  // Defer the revoke: revoking synchronously right after click() can race the
  // browser's download start and abort the file (blob: URLs).
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
/* ------------------------------ route ------------------------------------- */
/* ADV. HOT HEAP — the deluxe comical variant of SOIL STACK. Mounted by
   /soil-stack only after the player enters the cartridge code there. */
export function HotHeapAdv() {
  return <CompostToSoil />;
}
function CompostToSoil() {
  const [meta, setMeta] = useState<Meta>(SEED_META);
  const [hydrated, setHydrated] = useState(false);
  const [phase, setPhase] = useState<Phase>("start");
  const [ledger, setLedger] = useState<string[]>(["THE YARD IS READY — GLEAN AT THE GATE IS FREE AND UNLIMITED"]);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const metaRef = useRef<Meta>(meta);
  const noticeTimer = useRef<number | null>(null);
  const confirmTimer = useRef<number | null>(null);
  const flash = (msg: string) => {
    setNotice(msg);
    if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(null), 2200);
  };
  const log = (line: string) => setLedger((l) => [...l.slice(-(LEDGER_KEEP - 1)), line]);
  /** run one action on the current meta; returns the next meta and the ledger line */
  const apply = (fn: (m: Meta) => { m: Meta; line: string; notice?: string }) => {
    const { m, line, notice: nt } = fn(metaRef.current);
    setMeta(m);
    log(line);
    if (nt) flash(nt);
  };
  /* persistence */
  useEffect(() => {
    const m = loadMeta();
    setMeta(m);
    devLockoutCheck();
    setHydrated(true);
    setLedger((l) => [`SAVE LOADED — BIN ${m.binTier} · SC ${m.sc} · BR ${m.br} · SO ${m.so} · MK ${m.mk}`, ...l]);
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
  /* --------------------------- yard actions ------------------------------- */
  const onGlean = () =>
    apply((m) => {
      const n = cloneMeta(m);
      n.sc += GLEAN_SC;
      n.stats.gleans += 1;
      return { m: n, line: `GLEAN +4 SC — FREE · NO GATE · NO CAP` };
    });
  const loadGreen = () =>
    apply((m) => {
      const cap = capOf(m.binTier);
      if (m.loads >= cap) return { m, line: `GLEAN +4 SC — FREE · NO GATE · NO CAP`, notice: `BIN FULL — ${m.loads}/${cap} LOADS` };
      if (m.sc < GREEN_SC) return { m, line: `GLEAN +4 SC — FREE · NO GATE · NO CAP`, notice: `NEEDS ${GREEN_SC} SC — HAVE ${m.sc}` };
      const n = cloneMeta(m);
      n.sc -= GREEN_SC;
      n.loads += 1;
      const hot = heated(n.loads, n.browns);
      return {
        m: n,
        line: `LOAD ${n.loads} — GREEN · SC −${GREEN_SC} · BROWNS ${n.browns}/${n.loads} → ${hot ? "HEATED" : "COLD"}`,
      };
    });
  const loadBrown = () =>
    apply((m) => {
      const cap = capOf(m.binTier);
      if (m.loads >= cap) return { m, line: `GLEAN +4 SC — FREE · NO GATE · NO CAP`, notice: `BIN FULL — ${m.loads}/${cap} LOADS` };
      if (m.sc < BROWN_SC) return { m, line: `GLEAN +4 SC — FREE · NO GATE · NO CAP`, notice: `NEEDS ${BROWN_SC} SC — HAVE ${m.sc}` };
      const brNeed = brPerBrown(m);
      if (m.br < brNeed) return { m, line: `GLEAN +4 SC — FREE · NO GATE · NO CAP`, notice: `NEEDS ${brNeed} BR — HAVE ${m.br}` };
      const n = cloneMeta(m);
      n.sc -= BROWN_SC;
      n.br -= brNeed;
      n.loads += 1;
      n.browns += 1;
      const hot = heated(n.loads, n.browns);
      return {
        m: n,
        line: `LOAD ${n.loads} — BROWN · SC −1 · BR −${brNeed} · BROWNS ${n.browns}/${n.loads} → ${hot ? "HEATED" : "COLD"}`,
      };
    });
  const onTurn = () =>
    apply((m) => {
      if (m.loads === 0) return { m, line: `GLEAN +4 SC — FREE · NO GATE · NO CAP`, notice: "THE BIN IS EMPTY — LOAD FIRST" };
      const n = cloneMeta(m);
      const gain = gainFor(n.loads, n.browns);
      const target = ripeAt(n.loads, n.forkRank);
      n.ripeness = Math.min(n.ripeness + gain, target); // the CAP is required
      return {
        m: n,
        line: `TURN — ${heated(n.loads, n.browns) ? "HEATED" : "COLD"} +${gain} → RIPENESS ${n.ripeness}/${target}`,
      };
    });
  const onBatHandle = () =>
    apply((m) => {
      if (m.mk < BAT_COST) return { m, line: `GLEAN +4 SC — FREE · NO GATE · NO CAP`, notice: `NEEDS ${BAT_COST} MK — HAVE ${m.mk}` };
      if (m.loads === 0) return { m, line: `GLEAN +4 SC — FREE · NO GATE · NO CAP`, notice: "THE BIN IS EMPTY — LOAD FIRST" };
      const n = cloneMeta(m);
      n.mk -= BAT_COST;
      const gain = gainFor(n.loads, n.browns) * 2; // that turn's gain is DOUBLED
      const target = ripeAt(n.loads, n.forkRank);
      n.ripeness = Math.min(n.ripeness + gain, target); // capped at RIPE
      n.stats.batUses += 1;
      return {
        m: n,
        line: `BAT HANDLE — ${BAT_COST} MK · THAT TURN +${gain} (DOUBLED) → RIPENESS ${n.ripeness}/${target}`,
      };
    });
  const onEmpty = () =>
    apply((m) => {
      const target = ripeAt(m.loads, m.forkRank);
      const pay = emptyPay(m.loads, m.browns);
      const greens = m.loads - m.browns;
      const turns = turnsNeeded(m.loads, m.browns, m.forkRank);
      const n = cloneMeta(m);
      n.so += pay.so;
      n.br += pay.br;
      n.mk += pay.mk;
      n.mkEarned += pay.mk;
      n.stats.batches += 1;
      if (heated(m.loads, m.browns)) n.stats.hotBatches += 1;
      else n.stats.coldBatches += 1;
      n.stats.soEver += pay.so;
      n.stats.marksEver += pay.mk;
      const batchNo = n.stats.batches;
      const beds = n.beds.map((b) => (b.state === "standing" ? { ...b, state: "ready" as BedState } : { ...b }));
      n.beds = beds;
      n.loads = 0;
      n.browns = 0;
      n.ripeness = 0;
      const hot = heated(m.loads, m.browns) ? "HEATED" : "COLD";
      return {
        m: n,
        line: `BATCH ${batchNo}: ${m.loads} LOADS · ${greens} GREEN ${m.browns} BROWN · ${hot} ×${turns} TURNS · RIPE ${target} = 2×${m.loads} − 4×FORK ${m.forkRank} · EMPTY: SO +${pay.so} · BR +${pay.br} · MK +${pay.mk}`,
      };
    });
  const feedBed = (id: number) =>
    apply((m) => {
      const bed = m.beds.find((b) => b.id === id);
      if (!bed) return { m, line: `GLEAN +4 SC — FREE · NO GATE · NO CAP`, notice: "THIS BED IS NOT OWNED YET — SEE THE SHED" };
      if (bed.state !== "empty") return { m, line: `GLEAN +4 SC — FREE · NO GATE · NO CAP`, notice: "THIS BED IS STANDING ALREADY" };
      if (m.so < BED_FEED_SO) return { m, line: `GLEAN +4 SC — FREE · NO GATE · NO CAP`, notice: `NEEDS ${BED_FEED_SO} SO — HAVE ${m.so}` };
      const n = cloneMeta(m);
      n.so -= BED_FEED_SO;
      n.beds = n.beds.map((b) => (b.id === id ? { ...b, state: "standing" as BedState, fedRound: n.stats.batches } : { ...b }));
      return { m: n, line: `FEED BED ${id} — ${BED_FEED_SO} SO → STANDING (READY WHEN THE NEXT BATCH EMPTIES)` };
    });
  const harvestBed = (id: number) =>
    apply((m) => {
      const bed = m.beds.find((b) => b.id === id);
      if (!bed) return { m, line: `GLEAN +4 SC — FREE · NO GATE · NO CAP`, notice: "THIS BED IS NOT OWNED YET — SEE THE SHED" };
      if (bed.state !== "ready") return { m, line: `GLEAN +4 SC — FREE · NO GATE · NO CAP`, notice: "THIS BED IS NOT READY — EMPTY A BATCH" };
      const n = cloneMeta(m);
      n.sc += BED_SC;
      n.br += BED_BR;
      n.stats.bedHarvests += 1;
      n.beds = n.beds.map((b) => (b.id === id ? { ...b, state: "empty" as BedState } : { ...b }));
      return { m: n, line: `HARVEST BED ${id} — SC +${BED_SC} · BR +${BED_BR} → EMPTY` };
    });
  /* ------------------------------- sinks ----------------------------------- */
  const doBadge = (badges: string[], key: string, count: number): string[] => {
    if (count > 0 && count % BADGE_EVERY === 0) {
      const badge = `${key} ${count}`;
      return badges.includes(badge) ? badges : [...badges, badge];
    }
    return badges;
  };
  const onSacks = () =>
    apply((m) => {
      if (m.so < SACKS_SO) return { m, line: `GLEAN +4 SC — FREE · NO GATE · NO CAP`, notice: `NEEDS ${SACKS_SO} SO — HAVE ${m.so}` };
      const n = cloneMeta(m);
      n.so -= SACKS_SO;
      n.sacks += 1;
      n.badges = doBadge(n.badges, "SACKS", n.sacks);
      return { m: n, line: `SACKS TO THE LANE — ${SACKS_SO} SO → SACK #${n.sacks}` };
    });
  const onBorder = () =>
    apply((m) => {
      if (m.br < BORDER_BR) return { m, line: `GLEAN +4 SC — FREE · NO GATE · NO CAP`, notice: `NEEDS ${BORDER_BR} BR — HAVE ${m.br}` };
      const n = cloneMeta(m);
      n.br -= BORDER_BR;
      n.borders += 1;
      n.badges = doBadge(n.badges, "BORDER", n.borders);
      return { m: n, line: `THE BORDER — ${BORDER_BR} BR → MULCH RUN #${n.borders}` };
    });
  const onTrench = () =>
    apply((m) => {
      if (m.sc < TRENCH_SC) return { m, line: `GLEAN +4 SC — FREE · NO GATE · NO CAP`, notice: `NEEDS ${TRENCH_SC} SC — HAVE ${m.sc}` };
      const n = cloneMeta(m);
      n.sc -= TRENCH_SC;
      n.trenches += 1;
      n.badges = doBadge(n.badges, "TRENCH", n.trenches);
      return { m: n, line: `THE TRENCH — ${TRENCH_SC} SC → TRENCH #${n.trenches}` };
    });
  const onTally = () =>
    apply((m) => {
      if (m.mk < TALLY_COST) return { m, line: `GLEAN +4 SC — FREE · NO GATE · NO CAP`, notice: `NEEDS ${TALLY_COST} MK — HAVE ${m.mk}` };
      const n = cloneMeta(m);
      n.mk -= TALLY_COST;
      n.tallies += 1;
      n.badges = doBadge(n.badges, "TALLY", n.tallies);
      return { m: n, line: `SHED TALLY — ${TALLY_COST} MK → TALLY #${n.tallies} ON THE SHED DOOR` };
    });
  /* ------------------------------- unlocks -------------------------------- */
  const buy = (label: string, cost: number, mutate: (n: Meta) => void) =>
    apply((m) => {
      if (m.mk < cost) return { m, line: `GLEAN +4 SC — FREE · NO GATE · NO CAP`, notice: `NEEDS ${cost} MK — HAVE ${m.mk}` };
      const n = cloneMeta(m);
      n.mk -= cost;
      mutate(n);
      return { m: n, line: `${label} — ${cost} MK PAID FROM THE SHED DOOR` };
    });
  const onFork1 = () => buy("F1 THE FORK — RANK 1", FORK_COST[1], (n) => (n.forkRank = 1));
  const onFork2 = () => buy("F1 THE FORK — RANK 2 (MAX)", FORK_COST[2], (n) => (n.forkRank = 2));
  const onRiddle = () => buy("F2 THE RIDDLE", RIDDLE_COST, (n) => (n.riddle = true));
  const onGauge = () => buy("F4 THE GAUGE", GAUGE_COST, (n) => (n.gauge = true));
  const onBin2 = () => buy(`BIN 2 — ${BIN[2].name}`, BIN[2].cost, (n) => (n.binTier = 2));
  const onBin3 = () => buy(`BIN 3 — ${BIN[3].name}`, BIN[3].cost, (n) => (n.binTier = 3));
  const onBed2 = () =>
    buy(`BED 2 — ${BED[2].name}`, BED[2].cost, (n) => {
      if (!n.beds.some((b) => b.id === 2)) n.beds = [...n.beds, { id: 2, state: "empty", fedRound: 0 }];
    });
  const onBed3 = () =>
    buy(`BED 3 — ${BED[3].name}`, BED[3].cost, (n) => {
      if (!n.beds.some((b) => b.id === 3)) n.beds = [...n.beds, { id: 3, state: "empty", fedRound: 0 }];
    });
  /* ------------------------------ misc ------------------------------------- */
  const resetSave = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      if (confirmTimer.current) window.clearTimeout(confirmTimer.current);
      confirmTimer.current = window.setTimeout(() => setConfirmReset(false), 4000);
      return;
    }
    try {
      window.localStorage.removeItem(SAVE_KEY);
    } catch {
      /* ignore */
    }
    setMeta(cloneMeta(SEED_META));
    setPhase("start");
    setLedger(["THE YARD IS READY — GLEAN AT THE GATE IS FREE AND UNLIMITED"]);
    setNotice(null);
    setConfirmReset(false);
  };
  /* input: keyboard — yard-only actions, the same keys as the button faces */
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const ph = phaseRef.current;
      if (ph === "start" && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        setPhase("yard");
        return;
      }
      if (ph === "shed" && e.key === "Escape") setPhase("yard");
      if (ph === "loop" && e.key === "Escape") setPhase("yard");
      if (ph !== "yard") return;
      const k = e.key.toLowerCase();
      if (k === "1") loadGreen();
      else if (k === "2") loadBrown();
      else if (k === "t") onTurn();
      else if (k === "e") onEmpty();
      else if (k === "g") onGlean();
      else if (k === "b") onBatHandle();
      else if (k === "s") setPhase("shed");
      else if (k === "l") setPhase("loop");
      else if (k === "f") {
        const bed = metaRef.current.beds.find((b) => b.state === "empty");
        if (bed) feedBed(bed.id);
        else flash("NO EMPTY BED TO FEED");
      } else if (k === "h") {
        const bed = metaRef.current.beds.find((b) => b.state === "ready");
        if (bed) harvestBed(bed.id);
        else flash("NO READY BED TO HARVEST");
      }
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const phaseRef = useRef<Phase>(phase);
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);
  /* ------------------------- the yard canvas ------------------------------ */
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;
    const m = metaRef.current;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = PAL.earth;
    ctx.fillRect(0, 0, 320, 240);
    ctx.font = "6px 'Press Start 2P', monospace";
    const cap = capOf(m.binTier);
    const ripe = ripeAt(m.loads, m.forkRank);
    const hot = heated(m.loads, m.browns);
    // HUD — two 8-px lines
    ctx.fillStyle = PAL.cream;
    ctx.fillText(`BIN ${m.binTier} ${BIN[m.binTier].name}`, 6, 8);
    ctx.fillText(`LOADS ${m.loads}/${cap} · BROWNS ${m.browns}/${m.loads} · ${hot ? "HEATED" : "COLD"} · RIPE ${m.ripeness}/${ripe}`, 6, 18);
    ctx.fillStyle = PAL.amber;
    ctx.fillText(`SO ${m.so} · BR ${m.br} · SC ${m.sc} · MK ${m.mk} · TALLIES ${m.tallies}`, 6, 28);
    // the bin panel: a 6×3 grid of 12×12 load slots, 4-px gutters
    const slot = (c: number, r: number) => {
      const idx = r * 6 + c;
      const x = 14 + c * 16;
      const y = 36 + r * 16;
      if (idx < m.loads) {
        ctx.fillStyle = idx < m.loads - m.browns ? PAL.leaf : PAL.brown;
        ctx.fillRect(x, y, 12, 12);
      } else {
        ctx.fillStyle = idx < cap ? PAL.cream : "#6b5a3e";
        ctx.strokeStyle = idx < cap ? PAL.cream : "#6b5a3e";
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, 11, 11);
      }
    };
    for (let r = 0; r < 3; r += 1) for (let c = 0; c < 6; c += 1) slot(c, r);
    // ripeness bar + gauge readout
    const bx = 14;
    const by = 90;
    const bw = 128;
    const frac = ripe === 0 ? 0 : Math.min(1, m.ripeness / ripe);
    ctx.fillStyle = "#3a2a18";
    ctx.fillRect(bx, by, bw, 8);
    ctx.fillStyle = m.ripeness >= ripe && m.loads > 0 ? PAL.amber : PAL.brown;
    ctx.fillRect(bx, by, Math.max(0, Math.round(bw * frac)), 8);
    ctx.fillStyle = PAL.cream;
    ctx.fillText(`RIPENESS ${m.ripeness}/${ripe}`, 150, by + 7);
    if (m.gauge && m.loads > 0) {
      const left = Math.max(0, Math.ceil((ripe - m.ripeness) / gainFor(m.loads, m.browns)));
      ctx.fillStyle = PAL.amber;
      ctx.fillText(`${left} TURN${left === 1 ? "" : "S"} TO RIPE`, 150, by + 15);
    }
    // the heap: a mound whose peak height grows with the loads
    const baseY = 142;
    const peak = 20 + m.loads * 3;
    const ratioRipe = ripe === 0 ? 0 : Math.max(0, Math.min(1, m.ripeness / ripe));
    ctx.fillStyle = mix(PAL.brown, PAL.amber, ratioRipe);
    ctx.beginPath();
    ctx.moveTo(20, baseY);
    ctx.lineTo(26, baseY - Math.round(peak * 0.35));
    ctx.lineTo(60, baseY - peak);
    ctx.lineTo(100, baseY - peak);
    ctx.lineTo(134, baseY - Math.round(peak * 0.35));
    ctx.lineTo(140, baseY);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = mix(PAL.earth, PAL.brown, 0.5);
    ctx.fillRect(20, baseY, 120, 3);
    // three 2×2 steam puffs — only when HEATED
    if (hot) {
      ctx.fillStyle = PAL.cream;
      ctx.fillRect(56, baseY - peak - 10, 2, 2);
      ctx.fillRect(62, baseY - peak - 14, 2, 2);
      ctx.fillRect(68, baseY - peak - 10, 2, 2);
    }
    ctx.fillStyle = PAL.cream;
    ctx.fillText(`SO ${m.so} · BR ${m.br}`, 20, 152);
    // the gate: the pail and the leaf heap
    ctx.fillStyle = PAL.cream;
    ctx.fillRect(10, 178, 22, 2);
    ctx.fillRect(12, 168, 2, 12);
    ctx.fillRect(26, 168, 2, 10);
    ctx.fillRect(10, 170, 20, 2);
    ctx.fillStyle = PAL.amber;
    ctx.fillText("GLEAN +4 SC", 38, 176);
    ctx.fillText("FREE · NO GATE", 38, 184);
    ctx.fillStyle = PAL.leaf;
    ctx.beginPath();
    ctx.moveTo(120, 180);
    ctx.lineTo(136, 168);
    ctx.lineTo(152, 180);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PAL.cream;
    ctx.fillText("BR " + m.br, 160, 178);
    ctx.fillText("· SC " + m.sc, 160, 186);
    // the beds — three panels 48×40 at y 38 / 96 / 154 on the right
    for (const bedId of [1, 2, 3]) {
      drawBed(ctx, m, bedId);
    }
    ctx.fillStyle = PAL.amber;
    ctx.fillText("ROUND ORDER: HARVEST → FEED → BATCH", 6, 216);
    ctx.fillStyle = PAL.cream;
    ctx.fillText("THE PILE ADVANCES ONLY ON YOUR TURN", 14, 224);
  }, [meta, phase]);
  /* ------------------------------ render ---------------------------------- */
  const m = meta;
  const ripeNow = ripeAt(m.loads, m.forkRank);
  const hotNow = heated(m.loads, m.browns);
  const emptyOpen = m.loads >= 1 && m.ripeness >= ripeNow;
  const turnsLeft = m.loads === 0 ? 0 : Math.max(0, Math.ceil((ripeNow - m.ripeness) / gainFor(m.loads, m.browns)));
  return (
    <div className="min-h-dvh bg-[#0a0d12] text-amber-100">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b-4 border-amber-500/40 px-4 py-3">
        <div>
          <h1 className="font-pixel text-lg text-amber-300 drop-shadow-[3px_3px_0_rgba(0,0,0,0.9)]">ADV. HOT HEAP</h1>
          <p className="text-[10px] uppercase tracking-[0.25em] text-amber-500/70">
            adv. hot heap · compost to soil · glean → load → turn → empty · Gaming Layer demo
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a href="/bin-runner" data-testid="link-to-binrunner" className="pixel-btn bg-neutral-900 px-3 py-2 text-[9px] text-cyan-300">
            ♻ BIN RUNNER ▶
          </a>
          <a href="/brick-break" data-testid="link-to-brickbreak" className="pixel-btn bg-neutral-900 px-3 py-2 text-[9px] text-lime-300">
            🧱 BRICK BREAK ▶
          </a>
          <a href="/paper-airplane" data-testid="link-to-paperairplane" className="pixel-btn bg-neutral-900 px-3 py-2 text-[9px] text-yellow-200">
            ✈ PAPER AIRPLANE ▶
          </a>
          <a href="/" className="pixel-btn bg-neutral-900 px-3 py-2 text-[9px] text-amber-300">
            ◀ BACK
          </a>
        </div>
      </header>
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6">
        {phase === "start" && (
          <StartScreen meta={m} onStart={() => setPhase("yard")} onExport={() => exportSave(metaRef.current)} onReset={resetSave} confirmReset={confirmReset} />
        )}
        {phase === "yard" && (
          <YardScreen
            meta={m}
            notice={notice}
            ledger={ledger}
            emptyOpen={emptyOpen}
            turnsLeft={turnsLeft}
            hotNow={hotNow}
            ripeNow={ripeNow}
            onGlean={onGlean}
            onLoadGreen={loadGreen}
            onLoadBrown={loadBrown}
            onTurn={onTurn}
            onEmpty={onEmpty}
            onBatHandle={onBatHandle}
            onFeed={feedBed}
            onHarvest={harvestBed}
            onSacks={onSacks}
            onBorder={onBorder}
            onTrench={onTrench}
            onTally={onTally}
            onShed={() => setPhase("shed")}
            onLoop={() => setPhase("loop")}
            onExport={() => exportSave(metaRef.current)}
            canvasRef={canvasRef}
          />
        )}
        {phase === "shed" && (
          <ShedScreen
            meta={m}
            onBack={() => setPhase("yard")}
            onFork1={onFork1}
            onFork2={onFork2}
            onRiddle={onRiddle}
            onGauge={onGauge}
            onBin2={onBin2}
            onBin3={onBin3}
            onBed2={onBed2}
            onBed3={onBed3}
            onTally={onTally}
            onSacks={onSacks}
            onBorder={onBorder}
            onTrench={onTrench}
            onExport={() => exportSave(metaRef.current)}
          />
        )}
        {phase === "loop" && (
          <div className="flex flex-col gap-4">
            <LoopPanel />
            <div className="flex items-center justify-between">
              <button data-testid="go-yard" onClick={() => setPhase("yard")} className="pixel-btn bg-amber-300 px-5 py-3 text-xs text-neutral-950">
                ↩ BACK TO THE YARD
              </button>
              <span className="text-[9px] text-amber-100/40">ESC ALSO RETURNS</span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
/* ------------------------------- palette + art ---------------------------- */
const PAL = {
  earth: "#2b1d12",
  leaf: "#6a8f4a",
  brown: "#8a5a2b",
  cream: "#e8e0c8",
  amber: "#e0a020",
};
function mix(a: string, b: string, t: number): string {
  const pa = [parseInt(a.slice(1, 3), 16), parseInt(a.slice(3, 5), 16), parseInt(a.slice(5, 7), 16)];
  const pb = [parseInt(b.slice(1, 3), 16), parseInt(b.slice(3, 5), 16), parseInt(b.slice(5, 7), 16)];
  const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
  return `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}
function drawBed(ctx: CanvasRenderingContext2D, m: Meta, bedId: number) {
  const xs = [160, 212, 264];
  const ys = [44, 102, 160];
  const x = xs[bedId - 1];
  const y = ys[bedId - 1];
  const owned = m.beds.find((b) => b.id === bedId);
  ctx.fillStyle = "#241a10";
  ctx.fillRect(x, y, 48, 40);
  ctx.strokeStyle = PAL.brown;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, 47, 39);
  ctx.font = "5px 'Press Start 2P', monospace";
  const bed = BED[bedId as 1 | 2 | 3];
  if (!owned) {
    ctx.fillStyle = "#6b5a3e";
    ctx.fillText(`BED ${bedId}`, x + 12, y + 12);
    ctx.fillText(`— ${bed.cost} MK`, x + 10, y + 22);
    ctx.fillText("(SHED)", x + 15, y + 32);
    return;
  }
  ctx.fillStyle = PAL.cream;
  ctx.fillText(`BED${bedId} ${bed.name.slice(0, 4)}.`, x + 3, y + 8);
  if (owned.state === "empty") {
    ctx.fillStyle = "#5a4a30";
    for (let r = 0; r < 3; r += 1) {
      ctx.fillRect(x + 6, y + 15 + r * 6, 36, 1);
      ctx.fillRect(x + 6, y + 18 + r * 6, 36, 1);
    }
    ctx.fillStyle = PAL.amber;
    ctx.fillText("FEED 6 SO", x + 11, y + 36);
  } else if (owned.state === "standing") {
    ctx.fillStyle = PAL.leaf;
    ctx.fillRect(x + 10, y + 24, 2, 6);
    ctx.fillRect(x + 16, y + 20, 2, 10);
    ctx.fillRect(x + 22, y + 22, 2, 8);
    ctx.fillRect(x + 28, y + 26, 2, 4);
    ctx.fillStyle = PAL.cream;
    ctx.fillText("STANDING", x + 9, y + 36);
  } else {
    ctx.fillStyle = PAL.leaf;
    ctx.fillRect(x + 10, y + 24, 2, 6);
    ctx.fillRect(x + 16, y + 20, 2, 10);
    ctx.fillRect(x + 22, y + 22, 2, 8);
    ctx.fillRect(x + 28, y + 26, 2, 4);
    ctx.fillStyle = PAL.amber;
    ctx.fillRect(x + 30, y + 12, 5, 5);
    ctx.fillRect(x + 34, y + 14, 5, 5);
    ctx.fillStyle = PAL.amber;
    ctx.fillText("HARVEST +7 SC", x + 6, y + 36);
  }
}
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
  return (
    <div className="relative z-20 mt-3 flex flex-col items-center gap-3 py-2 text-center">
      <p className="font-pixel text-sm text-amber-300">THE LOOP IN FIVE LINES</p>
      <ul className="space-y-1 text-[11px] leading-relaxed text-amber-100/80">
        <li>GLEAN IS FREE AND UNLIMITED — NO PLAYER CAN BE LOCKED OUT OF THE LOOP</li>
        <li>2 SC A GREEN LOAD, 1 SC + 2 BR A BROWN LOAD</li>
        <li>A HOT PILE (1 BROWN PER 3 LOADS) TAKES HALF THE TURNS</li>
        <li>THE BIN IS SEALED WHEN YOU LEAVE — NOT ONE NUMBER MOVES WHILE YOU ARE AWAY</li>
        <li>12 MARKS OPENS BIN 2 — THE LONG BAY</li>
      </ul>
      <p className="max-w-xl border-2 border-amber-500/30 bg-amber-950/20 px-4 py-2 text-[10px] leading-relaxed text-amber-100/70">
        A BATCH IS SIX NUMBERS IN A SAVE FILE. NOTHING HERE IS REAL WASTE — the green and the brown are
        two integers, soil is an integer, and the pile advances only while you press a key.
      </p>
      <p className="text-[10px] text-amber-100/50">
        SEED: BIN 1 (6 LOADS) + BED 1 + 12 SC · 0 BR · 0 SO · 0 MK · NO POWERS · ROUND ORDER HARVEST → FEED → BATCH
      </p>
      <p className="max-w-xl text-center text-[10px] leading-relaxed text-amber-100/50">
        BATCHES {meta.stats.batches} · HOT {meta.stats.hotBatches} · COLD {meta.stats.coldBatches} · SO EVER {meta.stats.soEver} ·
        MK EVER {meta.stats.marksEver} · HARVESTS {meta.stats.bedHarvests} · SC {meta.sc} · BR {meta.br} · SO {meta.so} · MK {meta.mk}
      </p>
      <button
        data-testid="to-yard"
        onClick={onStart}
        className="pixel-btn blink bg-amber-300 px-6 py-4 text-sm text-neutral-950"
      >
        ▶ TO THE YARD — {BIN[meta.binTier as 1 | 2 | 3].name} {BIN[meta.binTier as 1 | 2 | 3].cap} LOADS
      </button>
      <div className="flex gap-2">
        <button
          data-testid="export-save-start"
          onClick={onExport}
          className="pixel-btn bg-cyan-950 px-3 py-2 text-[8px] text-cyan-200"
        >
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
        Keys in the yard: 1 LOAD GREEN · 2 LOAD BROWN · T TURN · E EMPTY · G GLEAN · F FEED · H HARVEST · B BAT HANDLE · S SHED · L LOOP.
        No clock, no timer, no decay, no cooldown: the bin is sealed when this tab closes.
      </p>
    </div>
  );
}
/* ------------------------------- yard screen ------------------------------ */
function YardScreen({
  meta,
  notice,
  ledger,
  emptyOpen,
  turnsLeft,
  hotNow,
  ripeNow,
  onGlean,
  onLoadGreen,
  onLoadBrown,
  onTurn,
  onEmpty,
  onBatHandle,
  onFeed,
  onHarvest,
  onSacks,
  onBorder,
  onTrench,
  onTally,
  onShed,
  onLoop,
  onExport,
  canvasRef,
}: {
  meta: Meta;
  notice: string | null;
  ledger: string[];
  emptyOpen: boolean;
  turnsLeft: number;
  hotNow: boolean;
  ripeNow: number;
  onGlean: () => void;
  onLoadGreen: () => void;
  onLoadBrown: () => void;
  onTurn: () => void;
  onEmpty: () => void;
  onBatHandle: () => void;
  onFeed: (id: number) => void;
  onHarvest: (id: number) => void;
  onSacks: () => void;
  onBorder: () => void;
  onTrench: () => void;
  onTally: () => void;
  onShed: () => void;
  onLoop: () => void;
  onExport: () => void;
  canvasRef: RefObject<HTMLCanvasElement | null>;
}) {
  const cap = capOf(meta.binTier);
  const m = meta;
  const bedStates = new Map(m.beds.map((b) => [b.id, b.state]));
  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="relative w-full max-w-3xl border-4 border-amber-500/50 bg-[#0d1117] p-4 shadow-[8px_8px_0_rgba(0,0,0,0.6)]">
        <div className="scanlines pointer-events-none absolute inset-0 z-10" />
        {/* HUD strip */}
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 font-pixel text-[8px] text-amber-100/80">
          <span data-testid="hud-bin">
            BIN {m.binTier} {BIN[m.binTier as 1 | 2 | 3].name} · CAP {cap} LOADS
          </span>
          <span>
            <span data-testid="loads-value">LOADS {m.loads}/{cap}</span>
            {" · "}
            <span data-testid="browns-value">BROWNS {m.browns}/{m.loads || 1}</span>
            {" · "}
            <span data-testid="heat-state" className={hotNow ? "text-amber-300" : "text-cyan-300"}>
              {hotNow ? "HEATED" : "COLD"}
            </span>
          </span>
          <span data-testid="ripeness-value">RIPENESS {m.ripeness}/{ripeNow}</span>
          <span data-testid="meta-sc" className="text-cyan-300">
            SC {m.sc}
          </span>
          <span data-testid="meta-br" className="text-emerald-300">
            BR {m.br}
          </span>
          <span data-testid="meta-so" className="text-amber-200">
            SO {m.so}
          </span>
          <span data-testid="meta-mk" className="text-pink-300">
            MK {m.mk}
          </span>
          <span>TALLIES {m.tallies}</span>
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
        {/* gauge line (F4), DOM-readable */}
        {m.gauge && m.loads > 0 && (
          <p data-testid="gauge-line" className="mt-1 text-center font-pixel text-[8px] text-amber-300">
            RIPENESS {m.ripeness}/{ripeNow} · {hotNow ? "HEATED" : "COLD"} · {turnsLeft} TURN{turnsLeft === 1 ? "" : "S"} TO RIPE
          </p>
        )}
        {/* ripeness progress bar (DOM, for the stranger's check) */}
        <div className="mt-2 h-3 w-full bg-neutral-900">
          <div
            data-testid="ripeness-bar"
            className={`h-3 ${emptyOpen ? "bg-amber-300" : "bg-amber-600"}`}
            style={{ width: `${ripeNow === 0 ? 0 : Math.min(100, (m.ripeness / ripeNow) * 100)}%` }}
          />
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-center text-[9px] text-amber-100/40">
          <span>THE PILE ADVANCES ONLY ON YOUR TURN — NO CLOCK IN THE YARD</span>
          <span className="text-amber-300">ROUND ORDER: HARVEST → FEED → BATCH</span>
        </div>
      </div>
      {/* action bar */}
      <div className="grid w-full max-w-3xl grid-cols-2 gap-2 sm:grid-cols-3">
        <button
          data-testid="load-green"
          onClick={onLoadGreen}
          className="pixel-btn bg-[#16260f] px-3 py-3 text-[9px] text-lime-300"
        >
          [1] LOAD GREEN · {GREEN_SC} SC
        </button>
        <button
          data-testid="load-brown"
          onClick={onLoadBrown}
          className="pixel-btn bg-[#3a2510] px-3 py-3 text-[9px] text-amber-200"
        >
          [2] LOAD BROWN · {BROWN_SC} SC · {m.riddle ? BROWN_BR_RIDDLE : BROWN_BR} BR
          {m.riddle ? " (RIDDLE)" : ""}
        </button>
        <button
          data-testid="turn-btn"
          onClick={onTurn}
          disabled={m.loads === 0}
          className={`pixel-btn px-3 py-3 text-[9px] ${m.loads === 0 ? "bg-neutral-950 text-neutral-600" : "bg-amber-800 text-amber-100"}`}
        >
          [T] TURN · {hotNow ? `+${GAIN_HEATED}` : `+${GAIN_COLD} COLD`} — 0 UNITS
          {m.loads === 0 ? " · BIN EMPTY" : ""}
        </button>
        <button
          data-testid="empty-btn"
          onClick={onEmpty}
          disabled={!emptyOpen}
          className={`pixel-btn px-3 py-3 text-[9px] ${emptyOpen ? "bg-amber-300 text-neutral-950 blink" : "bg-neutral-950 text-neutral-500"}`}
        >
          [E] EMPTY {emptyOpen ? "→ SO +" + m.loads + " · BR +" + Math.floor(m.loads / 2) + " · MK +" + Math.floor(m.loads / 3) * (hotNow ? 2 : 1) : `· RIPENESS ${m.ripeness}/${ripeNow}`}
        </button>
        <button data-testid="glean-btn" onClick={onGlean} className="pixel-btn bg-cyan-950 px-3 py-3 text-[9px] text-cyan-200">
          [G] GLEAN +{GLEAN_SC} SC — FREE · UNLIMITED
        </button>
        <button
          data-testid="use-bat-handle"
          onClick={onBatHandle}
          className={`pixel-btn px-3 py-3 text-[9px] ${m.mk >= BAT_COST && m.loads > 0 ? "bg-pink-900 text-pink-100" : "bg-neutral-950 text-neutral-500"}`}
        >
          [B] BAT HANDLE {BAT_COST} MK → THAT TURN +{hotNow ? GAIN_HEATED * 2 : GAIN_COLD * 2}
        </button>
      </div>
      {/* the beds — per-bed buttons, real feeds and harvests */}
      <div className="grid w-full max-w-3xl grid-cols-3 gap-2">
        {[1, 2, 3].map((id) => {
          const owned = m.beds.some((b) => b.id === id);
          const state = bedStates.get(id);
          if (!owned) {
            return (
              <div key={id} className="pixel-btn flex flex-col items-center bg-neutral-950 px-2 py-3 text-[8px] text-neutral-500">
                <span>BED {id} — {BED[id as 1 | 2 | 3].cost} MK</span>
                <span>BUY AT THE SHED</span>
              </div>
            );
          }
          if (state === "empty") {
            return (
              <button key={id} data-testid={`feed-bed-${id}`} onClick={() => onFeed(id)} className="pixel-btn bg-amber-950 px-2 py-3 text-[8px] text-amber-200">
                [F{id}] FEED BED {id} · {BED_FEED_SO} SO → STANDING
              </button>
            );
          }
          if (state === "standing") {
            return (
              <div key={id} className="pixel-btn bg-neutral-900 px-2 py-3 text-[8px] text-lime-300">
                BED {id} STANDING — READY WHEN THE NEXT BATCH EMPTIES
              </div>
            );
          }
          return (
            <button key={id} data-testid={`harvest-bed-${id}`} onClick={() => onHarvest(id)} className="pixel-btn blink bg-lime-800 px-2 py-3 text-[8px] text-lime-100">
              [H{id}] HARVEST BED {id} · {BED_SC} SC +{BED_BR} BR
            </button>
          );
        })}
      </div>
      {/* bottom row: the four unbounded sinks + nav */}
      <div className="grid w-full max-w-3xl grid-cols-2 gap-2 sm:grid-cols-6">
        <button data-testid="sack-so" onClick={onSacks} className="pixel-btn bg-neutral-800 px-2 py-3 text-[8px] text-amber-200">
          SACKS {SACKS_SO} SO · #{m.sacks + 1}
        </button>
        <button data-testid="border-br" onClick={onBorder} className="pixel-btn bg-neutral-800 px-2 py-3 text-[8px] text-lime-300">
          BORDER {BORDER_BR} BR · #{m.borders + 1}
        </button>
        <button data-testid="trench-sc" onClick={onTrench} className="pixel-btn bg-neutral-800 px-2 py-3 text-[8px] text-cyan-300">
          TRENCH {TRENCH_SC} SC · #{m.trenches + 1}
        </button>
        <button data-testid="shed-tally" onClick={onTally} className="pixel-btn bg-neutral-800 px-2 py-3 text-[8px] text-pink-300">
          SHED TALLY {TALLY_COST} MK · #{m.tallies + 1}
        </button>
        <button data-testid="go-shed" onClick={onShed} className="pixel-btn bg-neutral-900 px-2 py-3 text-[8px] text-amber-100">
          [S] SHED — BINS · BEDS · POWERS
        </button>
        <button data-testid="go-loop" onClick={onLoop} className="pixel-btn bg-neutral-900 px-2 py-3 text-[8px] text-amber-100">
          [L] LOOP — THE PUBLISHED MATH
        </button>
      </div>
      <div className="w-full max-w-3xl border-2 border-amber-500/20 bg-black/40">
        <div className="flex items-center justify-between border-b border-amber-500/20 px-3 py-2">
          <span className="font-pixel text-[8px] text-amber-300">BATCH LEDGER — EVERY ACTION, PRINTED</span>
          <button data-testid="export-save-yard" onClick={onExport} className="pixel-btn bg-cyan-950 px-3 py-1 text-[8px] text-cyan-200">
            ⤓ EXPORT SAVE
          </button>
        </div>
        <div data-testid="batch-ledger" className="max-h-40 overflow-y-auto px-3 py-2 font-pixel text-[8px] leading-relaxed text-amber-100/80">
          {ledger.map((l, i) => (
            <div key={`${i}-${l}`} className={i === ledger.length - 1 ? "text-amber-200" : "text-amber-100/40"}>
              {l}
            </div>
          ))}
        </div>
      </div>
      <div className="min-h-5 text-center text-[10px] text-yellow-200/90">{notice ?? ""}</div>
      <p className="max-w-3xl text-center text-[9px] leading-relaxed text-amber-100/40">
        THE BIN IS SEALED WHEN YOU LEAVE — NOT ONE NUMBER MOVES WHILE THIS TAB IS CLOSED. A RIPE BATCH WAITS
        INDEFINITELY AT ITS FULL PUBLISHED PRICE: NO FRESHNESS PENALTY, NO ROT, NO COOLDOWN ANYWHERE.
      </p>
    </div>
  );
}
/* ------------------------------- shed screen ------------------------------ */
function ShedScreen({
  meta,
  onBack,
  onFork1,
  onFork2,
  onRiddle,
  onGauge,
  onBin2,
  onBin3,
  onBed2,
  onBed3,
  onTally,
  onSacks,
  onBorder,
  onTrench,
  onExport,
}: {
  meta: Meta;
  onBack: () => void;
  onFork1: () => void;
  onFork2: () => void;
  onRiddle: () => void;
  onGauge: () => void;
  onBin2: () => void;
  onBin3: () => void;
  onBed2: () => void;
  onBed3: () => void;
  onTally: () => void;
  onSacks: () => void;
  onBorder: () => void;
  onTrench: () => void;
  onExport: () => void;
}) {
  const m = meta;
  const mk = m.mk;
  return (
    <div className="flex w-full flex-col items-center gap-4" data-testid="shed-panel">
      <div className="flex w-full max-w-3xl flex-wrap items-center justify-between gap-2">
        <h2 className="font-pixel text-sm text-amber-300">THE SHED</h2>
        <div className="flex items-center gap-2">
          <span className="font-pixel text-[10px] text-pink-300">MK {m.mk}</span>
          <span className="text-[9px] text-amber-100/50">
            TALLIES {m.tallies} · BORDERS {m.borders} · TRENCHES {m.trenches} · SACKS {m.sacks}
          </span>
        </div>
      </div>
      {/* the hint that is a MUST-wire rule */}
      {m.binTier < 2 && (
        <div className="w-full max-w-3xl border-2 border-red-500/40 bg-red-950/20 px-4 py-2 text-[10px] text-red-200">
          A SECOND BED NEEDS A SECOND BIN — 12 SO A ROUND. Prices are ordered on purpose: a 6-load bin pays 6
          SO a batch, and a bed's feed is 6 SO — a second bed bought before a second bin would sit idle.
        </div>
      )}
      <div className="w-full max-w-3xl border-2 border-amber-500/30 bg-black/30 p-3">
        <h3 className="font-pixel text-[9px] text-amber-300">THE UNLOCK TABLE — EVERY ROW IS MARKS, NEVER MONEY · FINITE TOTAL 124 MK</h3>
        <div className="mt-2 flex flex-col gap-2">
          <UnlockRow
            label="F1 THE FORK — RANK 1"
            cost={FORK_COST[1]}
            have={mk}
            owned={m.forkRank >= 1}
            effect="the pile needs 4 fewer ripeness points: a 6-load hot batch ripens in 4 turns instead of 6"
            ceiling="2 ranks, ever · at every rank a cold pile still takes exactly twice the turns"
            onBuy={onFork1}
            testid="buy-fork"
          />
          <UnlockRow
            label="F1 THE FORK — RANK 2"
            cost={FORK_COST[2]}
            have={mk}
            owned={m.forkRank >= 2}
            ownedLabel="OWNED — MAX (2 RANKS, EVER)"
            effect="8 fewer ripeness points in total: a 6-load hot batch ripens in 2 turns"
            ceiling="MAX rank · a cold pile takes exactly 4 turns at 6 loads — the fork cannot repeal the ratio rule"
            onBuy={onFork2}
            testid="buy-fork2"
          />
          <UnlockRow
            label="F4 THE GAUGE"
            cost={GAUGE_COST}
            have={mk}
            owned={m.gauge}
            effect="prints the exact turns to ripe before you commit — RIPENESS 4/12 · HEATED · 4 TURNS TO RIPE"
            ceiling="zero units: it changes what a player can see, never what a batch pays"
            onBuy={onGauge}
            testid="buy-gauge"
          />
          <UnlockRow
            label="BIN 2 — THE LONG BAY"
            cost={BIN[2].cost}
            have={mk}
            owned={m.binTier >= 2}
            effect="capacity 6 → 12 loads: a round goes from 16 actions / 4 MK to 31 actions / 8 MK"
            ceiling="the batch still pays 1 SO per load — 12 SO max, no power can pay more"
            onBuy={onBin2}
            testid="buy-bin-2"
          />
          <UnlockRow
            label="F2 THE RIDDLE"
            cost={RIDDLE_COST}
            have={mk}
            owned={m.riddle}
            effect="a brown load costs 1 BR instead of 2; the brown balance goes from exactly 0 to +2 a round"
            ceiling="1 rank, ever · the batch's SO, BR and MK are untouched"
            onBuy={onRiddle}
            testid="buy-riddle"
          />
          <UnlockRow
            label="BED 2 — THE ROOT BED"
            cost={BED[2].cost}
            have={mk}
            owned={m.beds.some((b) => b.id === 2)}
            effect="a second bed: two harvests a round (+14 SC, +2 BR)"
            ceiling="feeds on 6 SO, harvests 7 SC + 1 BR — identical to every other bed"
            onBuy={onBed2}
            testid="buy-bed-2"
          />
          <UnlockRow
            label="BED 3 — THE POTTING BED"
            cost={BED[3].cost}
            have={mk}
            owned={m.beds.some((b) => b.id === 3)}
            effect="a third bed: three harvests a round (+21 SC, +3 BR)"
            ceiling="feeds on 6 SO, harvests 7 SC + 1 BR — identical to every other bed"
            onBuy={onBed3}
            testid="buy-bed-3"
          />
          <UnlockRow
            label="BIN 3 — THE THREE-BAY YARD"
            cost={BIN[3].cost}
            have={mk}
            owned={m.binTier >= 3}
            effect="capacity 18 loads: a round goes to 46 actions / 12 MK and feeds all three beds exactly"
            ceiling="18 SO / 9 BR / 12 MK per batch — the top of the published band, every power on or off"
            onBuy={onBin3}
            testid="buy-bin-3"
          />
        </div>
        <p className="mt-2 text-[9px] text-amber-100/50">
          F3 THE BAT HANDLE — {BAT_COST} MK per use, repeatable: one doubled turn, charged only when the use is
          pressed, saves exactly 1 action, and can never add a unit of SO, BR or MK to a batch. Buy it on the
          yard — [B].
        </p>
        <p className="mt-1 text-[9px] text-amber-100/50">
          All timing figures are designed, not measured — no player has reached the last row yet.
        </p>
      </div>
      <div className="w-full max-w-3xl border-2 border-amber-500/30 bg-black/30 p-3">
        <h3 className="font-pixel text-[9px] text-amber-300">THE UNBOUNDED SINKS — REAL SPENDS, BADGE EVERY {BADGE_EVERY}</h3>
        <div className="mt-2 grid gap-2 sm:grid-cols-4">
          <button data-testid="shed-sack-so" onClick={onSacks} className="pixel-btn bg-neutral-800 px-2 py-3 text-[8px] text-amber-200">
            {m.so >= SACKS_SO ? `▶ SACKS — ${SACKS_SO} SO · #${m.sacks + 1}` : `SACKS: ${SACKS_SO} SO — SHORT ${SACKS_SO - m.so}`}
          </button>
          <button data-testid="shed-border-br" onClick={onBorder} className="pixel-btn bg-neutral-800 px-2 py-3 text-[8px] text-lime-300">
            {m.br >= BORDER_BR ? `▶ BORDER — ${BORDER_BR} BR · #${m.borders + 1}` : `BORDER: ${BORDER_BR} BR — SHORT ${BORDER_BR - m.br}`}
          </button>
          <button data-testid="shed-trench-sc" onClick={onTrench} className="pixel-btn bg-neutral-800 px-2 py-3 text-[8px] text-cyan-300">
            {m.sc >= TRENCH_SC ? `▶ TRENCH — ${TRENCH_SC} SC · #${m.trenches + 1}` : `TRENCH: ${TRENCH_SC} SC — SHORT ${TRENCH_SC - m.sc}`}
          </button>
          <button data-testid="shed-tally-mk" onClick={onTally} className="pixel-btn bg-neutral-800 px-2 py-3 text-[8px] text-pink-300">
            {m.mk >= TALLY_COST ? `▶ SHED TALLY — ${TALLY_COST} MK · #${m.tallies + 1}` : `SHED TALLY: ${TALLY_COST} MK — SHORT ${TALLY_COST - m.mk}`}
          </button>
        </div>
        <p className="mt-2 text-[9px] text-amber-100/50">
          BADGES: {m.badges.length ? m.badges.join(" · ") : "— none yet —"} · earn one every {BADGE_EVERY} of any sink.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button data-testid="go-yard" onClick={onBack} className="pixel-btn bg-amber-300 px-5 py-3 text-xs text-neutral-950">
          ↩ BACK TO THE YARD (ESC)
        </button>
        <button data-testid="export-save-shed" onClick={onExport} className="pixel-btn bg-cyan-950 px-3 py-3 text-[8px] text-cyan-200">
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
  return (
    <div className="border border-amber-500/20 bg-amber-950/10 p-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-pixel text-[8px] text-amber-200">{label}</span>
        <button data-testid={testid} onClick={onBuy} disabled={owned} className={`pixel-btn px-3 py-2 text-[8px] ${owned ? "bg-lime-900/40 text-lime-300" : have >= cost ? "bg-amber-700 text-amber-50" : "bg-neutral-900 text-neutral-500"}`}>
          {owned ? (ownedLabel ?? "OWNED ✓") : have >= cost ? `▶ ${cost} MK` : `${cost} MK — SHORT ${cost - have}`}
        </button>
      </div>
      <p className="mt-1 text-[9px] text-amber-100/70">{effect}</p>
      <p className="text-[9px] text-amber-100/40">ceiling: {ceiling}</p>
    </div>
  );
}
/* ------------------------------- LOOP panel ------------------------------- */
function LoopPanel() {
  const batchRows: Array<[string, string, string, string]> = [
    ["3 LOADS · 2 GREEN 1 BROWN · HOT", "RIPE 6 · 3 TURNS", "7 ACTIONS", "2 MK"],
    ["6 LOADS · 4 GREEN 2 BROWN · HOT", "RIPE 12 · 6 TURNS", "13 ACTIONS", "4 MK"],
    ["6 LOADS · 6 GREEN · COLD", "RIPE 12 · 12 TURNS", "19 ACTIONS", "2 MK"],
    ["12 LOADS · 8 GREEN 4 BROWN · HOT", "RIPE 24 · 12 TURNS", "25 ACTIONS", "8 MK"],
    ["12 LOADS · 12 GREEN · COLD", "RIPE 24 · 24 TURNS", "37 ACTIONS", "4 MK"],
    ["18 LOADS · 12 GREEN 6 BROWN · HOT", "RIPE 36 · 18 TURNS", "37 ACTIONS", "12 MK"],
    ["18 LOADS · 18 GREEN · COLD", "RIPE 36 · 36 TURNS", "55 ACTIONS", "6 MK"],
  ];
  const powRows: Array<[string, string, string, string]> = [
    ["F1 THE FORK", "6 / 18 MK (2 ranks)", "RIPE − 4 per rank: a 6-load hot batch ripens 6 → 4 → 2 turns", "2 ranks, ever · never repeals the cold = 2× hot rule"],
    ["F2 THE RIDDLE", "12 MK (1 rank)", "a BROWN load costs 1 BR instead of 2", "1 rank, ever · batch SO/BR/MK untouched"],
    ["F3 THE BAT HANDLE", "2 MK per use", "that turn's ripeness gain doubled (2→4 hot, 1→2 cold), capped at RIPE", "zero units · saves exactly 1 action"],
    ["F4 THE GAUGE", "8 MK (1 rank)", "prints turns-to-ripe before a turn is committed", "zero units · changes what you see, never a payout"],
  ];
  const withOut: Array<[string, string, string, string]> = [
    ["no power, hot (reference)", "6", "16", "4.00"],
    ["F1 rank 1", "4", "14", "3.50"],
    ["F1 rank 2 (full turning skill)", "2", "12", "3.00"],
    ["F1 rank 2 + F2 (all powers)", "2", "12", "3.00"],
    ["F3 THE BAT HANDLE, 1 use", "5", "15", "3.75"],
    ["F3, 2 uses (2 MK each)", "4", "14", "3.50"],
    ["no power, COLD (the band's other end)", "12", "23", "11.50"],
  ];
  const refs: Array<[string, string]> = [
    ["SEED hot — BIN1+BED1, 6 loads", "4.00 act/MK · +4 MK/round"],
    ["SEED cold — the first-time line", "11.50 act/MK · +2 MK/round"],
    ["BIN2+BED2 hot", "3.88 act/MK · +8 MK/round"],
    ["BIN3+BED3 hot", "3.83 act/MK · +12 MK/round"],
  ];
  return (
    <section className="border-2 border-amber-500/30 bg-black/30 p-4" data-testid="loop-panel">
      <h2 className="font-pixel text-[10px] text-amber-300">
        THE LOOP — GLEAN → LOAD → HEAT → RIPENESS → EMPTY SOIL → BED → CROP → SCRAP
      </h2>
      <div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr]">
        <StageCard
          title="INPUTS"
          accent="text-cyan-300"
          lines={[
            "Time: player actions only — no clock",
            "Skill: browns × 3 ≥ loads (the heat ratio)",
            "Batch depth: fill the bin, load in threes",
            "Seed: BIN 1 · BED 1 · 12 SC · 0 of the rest",
          ]}
        />
        <Arrow />
        <StageCard
          title="TRANSFORMATION"
          accent="text-amber-300"
          lines={[
            "HEATED iff browns × 3 ≥ loads",
            "RIPE = max(1, 2 × loads − 4 × forkRank)",
            "turn: +2 hot / +1 cold, capped at RIPE",
            "EMPTY = lookup on the loads: 1 SO + BR + MK",
          ]}
        />
        <Arrow />
        <StageCard
          title="OUTPUTS"
          accent="text-amber-200"
          lines={[
            "SO = loads (at most the bin's capacity)",
            "BR = floor(loads / 2)",
            "MK = floor(loads / 3), doubled when hot",
            "banked the instant the batch empties",
          ]}
        />
        <Arrow />
        <StageCard
          title="REINVESTMENT"
          accent="text-emerald-300"
          lines={[
            "the coarse fraction = the next pile's heat",
            "BR in = BR out exactly (4 = 3 + 1 at BIN 1)",
            "soil feeds beds, beds crop, crop is the scrap",
            "SO in = SO out exactly, every round",
          ]}
        />
      </div>
      <div className="mt-4 grid gap-2 lg:grid-cols-2">
        <div className="border-2 border-amber-500/20 bg-amber-950/10 p-2 text-[10px] leading-relaxed text-amber-100/80">
          <p className="font-pixel text-[8px] text-amber-200">THE BATCH TABLE — LOADS → HEAT → TURNS → PAYMENT</p>
          <div className="mt-1 grid grid-cols-[1fr_1fr_auto_auto] gap-x-2 text-[9px]">
            <span className="text-amber-100/50">loads / composition</span>
            <span className="text-amber-100/50">ladder</span>
            <span className="text-amber-100/50">actions</span>
            <span className="text-amber-100/50">MK</span>
            {batchRows.map((r) => (
              <span key={r[0]} className="col-span-4 grid grid-cols-subgrid border-t border-amber-500/10 py-0.5">
                <span>{r[0]}</span>
                <span>{r[1]}</span>
                <span>{r[2]}</span>
                <span>{r[3]}</span>
              </span>
            ))}
          </div>
          <p className="mt-1">A bin holding fewer than 3 loads pays no Mark at all — the anti-farm cliff, printed on the LOAD face before you commit.</p>
        </div>
        <div className="border-2 border-amber-500/20 bg-amber-950/10 p-2 text-[10px] leading-relaxed text-amber-100/80">
          <p className="font-pixel text-[8px] text-amber-200">THE CEILINGS — 6 / 12 / 18 SO · 3 / 6 / 9 BR · 4 / 8 / 12 MK</p>
          <p className="mt-1">The batch's output is a lookup on the loads the bin holds: SO = loads, always, 1 per load on every tier. No power, skill or multiplier can add one unit of soil, one brown or one Mark to any batch — with every power on, the gross ceiling stays exactly where it is with none.</p>
          <p className="mt-1">With and without the powers, seed config, per round:</p>
          <div className="mt-1 grid grid-cols-[1fr_auto_auto_auto] gap-x-2 text-[9px]">
            <span className="text-amber-100/50">line</span>
            <span className="text-amber-100/50">turns</span>
            <span className="text-amber-100/50">actions</span>
            <span className="text-amber-100/50">act/MK</span>
            {withOut.map((r) => (
              <span key={r[0]} className="col-span-4 grid grid-cols-subgrid border-t border-amber-500/10 py-0.5">
                <span>{r[0]}</span>
                <span>{r[1]}</span>
                <span>{r[2]}</span>
                <span className="font-pixel text-amber-200">{r[3]}</span>
              </span>
            ))}
          </div>
          <p className="mt-1">In every row the batch still pays 6 SO / 3 BR / 4 MK. Powers move actions, never a payout.</p>
        </div>
      </div>
      <div className="mt-2 grid gap-2 lg:grid-cols-2">
        <div className="border-2 border-amber-500/20 bg-amber-950/10 p-2 text-[10px] leading-relaxed text-amber-100/80">
          <p className="font-pixel text-[8px] text-amber-200">THE POWERS — MARKS ONLY, NEVER MONEY</p>
          <div className="mt-1 flex flex-col gap-1">
            {powRows.map((r) => (
              <p key={r[0]}>
                {r[0]} — <span className="text-amber-200">{r[1]}</span> · {r[2]}
                <span className="text-amber-100/50"> · ceiling: {r[3]}</span>
              </p>
            ))}
          </div>
          <p className="mt-1 text-amber-100/60">Every power has a published cost, a published effect and a published ceiling; none can move the gross faucet by one unit.</p>
        </div>
        <div className="border-2 border-amber-500/20 bg-amber-950/10 p-2 text-[10px] leading-relaxed text-amber-100/80">
          <p className="font-pixel text-[8px] text-amber-200">THE PUBLISHED BAND + THE CLOSED LOOP</p>
          <p>
            Band: <span className="text-amber-200">3.00 to 11.50 player actions per Mark</span>, over 24 machine-checked lines (3 bin tiers × 2 heat states × 4 power states).
          </p>
          <div className="mt-1 flex flex-col gap-1">
            {refs.map((r) => (
              <p key={r[0]}>
                {r[0]} — <span className="text-amber-200">{r[1]}</span>
              </p>
            ))}
          </div>
          <p className="mt-1">Everything on moves the seed line to 3.00 act/MK and not one unit of the batch's payout.</p>
          <p className="mt-1">
            Closed sub-loops, exact: <span className="text-amber-200">BR in = BR out</span> at every tier (BIN 1:
            2 brown loads cost 4 BR; the empty returns 3, the bed returns 1 → 4 = 4 · BIN 2: 8 = 6 + 2 · BIN 3: 12 = 9 + 3) and{" "}
            <span className="text-amber-200">SO in = SO out</span> per round (6 SO feeds a bed, the bed pays 7 SC + 1 BR — the crop closes the loop).
          </p>
          <p className="mt-1">
            Lockout: GLEAN is free and unlimited, a TURN costs zero units — from 0 SC / 0 BR / 0 SO / 0 MK a
            player is 12 actions from their first soil and first Mark, and no sequence of play can strand the pile.
          </p>
        </div>
      </div>
      <div className="mt-2 grid gap-2 lg:grid-cols-2">
        <div className="border-2 border-amber-500/20 bg-amber-950/10 p-2 text-[10px] leading-relaxed text-amber-100/80">
          <p className="font-pixel text-[8px] text-amber-200">THE UNLOCK TABLE — 124 MK FINITE</p>
          <p className="mt-1">
            F1 rank 1 — 6 MK · F4 THE GAUGE — 8 MK · BIN 2 — 12 MK · F2 THE RIDDLE — 12 MK · BED 2 — 16 MK ·
            F1 rank 2 — 18 MK · BED 3 — 22 MK · BIN 3 — 30 MK. Prices are ordered on purpose: BIN 2 (12 MK) is
            deliberately cheaper than BED 2 (16 MK), because a 6-load bin pays 6 SO a batch and a bed's feed is
            6 SO — a second bed bought before a second bin would sit idle. The table's price order is the
            game's only tutorial, and it leads bin → bed → bed → bin.
          </p>
          <p className="mt-1">
            After the table: SHED TALLY (3 MK, no cap) and F3 THE BAT HANDLE (2 MK a use, no cap) take
            everything you care to spend. No unit is created that no sink can consume.
          </p>
        </div>
        <div className="border-2 border-amber-500/20 bg-amber-950/10 p-2 text-[10px] leading-relaxed text-amber-100/80">
          <p className="font-pixel text-[8px] text-amber-200">THE SEALED BIN + THE HONEST LINE</p>
          <p className="mt-1">
            The pile advances only on your turn: this file has no setInterval, no state-changing timer and no
            timestamp comparison, so there is no code path through which time can change a number. A ripe batch
            waits indefinitely at its full published price.
          </p>
          <p className="mt-1">THE BIN IS SEALED — NO NUMBER HERE CHANGES WHILE THIS TAB IS CLOSED.</p>
          <p className="mt-1 text-amber-100/60">
            The save is one JSON file you can export — loads, browns and ripeness included, so a stranger can
            open it before and after closing the tab and watch nothing move. The counters measure the save file
            and nothing else: a batch of 6 loads is six numbers in a JSON object, not real waste.
          </p>
        </div>
      </div>
      <p className="mt-3 text-center font-pixel text-[9px] text-yellow-200/90">
        NOTHING HERE CONVERTS TO MONEY; NO PURCHASES EXIST IN THIS GAME
      </p>
    </section>
  );
}
/* --------------------------- small pieces -------------------------------- */
function StageCard({ title, accent, lines }: { title: string; accent: string; lines: string[] }) {
  return (
    <div className="border-2 border-amber-500/20 bg-amber-950/10 p-2">
      <h3 className={`font-pixel text-[8px] ${accent}`}>{title}</h3>
      <ul className="mt-1 space-y-1 text-[10px] leading-tight text-amber-100/80">
        {lines.map((l) => (
          <li key={l}>· {l}</li>
        ))}
      </ul>
    </div>
  );
}
function Arrow() {
  return <div className="hidden self-center text-2xl text-amber-500 md:block">▶</div>;
}