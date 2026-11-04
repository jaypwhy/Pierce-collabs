import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { PiScaleBadge } from "~/components/pi-scale-badge";
import { piValue } from "~/lib/pi-scale";
/* ============================================================================
 * TEND — PREVENTATIVE HEALTH — playable closed-loop demo
 *
 * Every number here is the design's constants block (preventative-health/design.md
 * — copied, not re-derived):
 *   PLANT  : +1 plant an action (P1 THE WATERING CAN: up to 2, the player picks
 *            k), free, unlimited, ungated; never past the bed's size, and a
 *            refusal creates NOTHING (refused plants are not plants)
 *   CUT    : enabled iff pl >= bunch (2, P2 THE SHARP SHEARS: 1)
 *            credits += pl  <-- read BEFORE the bunch leaves
 *            pl      -= bunch
 *            -> a cut pays at most the bed's size: 4 / 6 / 8 CR, every tool on
 *   BED    : 4 THE WINDOW BOX (seed) / 6 THE HERB BED (16 CR) / 8 THE GREENHOUSE (52 CR)
 *   POWERS : P1 12 CR · P2 22 CR · P3 6 CR (zero units, prints published numbers)
 *            · P4 5 CR per use (buys an INPUT with credits, adds zero units)
 *   SINKS  : the cut itself · A BUNDLE FOR THE STALL 4 plants (unbounded) ·
 *            THE MARKET STALL 3 CR (unbounded) · P4 5 CR a use · the price list
 *            (5/6/12/16/22/52 = 113 CR finite)
 *   RHYTHM : THE BED WAITS — no setInterval, no setTimeout that changes state,
 *            no Date.now anywhere in this file; closing the tab freezes the
 *            save and a half-planted bed is still there, unchanged.
 * No purchases, no ads, no accounts, no network: meta persists in localStorage
 * only (tend.save.v1). This is a FICTIONAL bed of invented plants: a cycle of 4
 * credits is four numbers in a save file, the counters measure the save and
 * nothing else, and no claim about real plants, real herbs, health, nutrition,
 * medicine or any other real outcome is made anywhere (design Part E2).
 * ==========================================================================*/
type Phase = "start" | "bed" | "book" | "loop";
interface Stats {
  cuts: number;
  planted: number;
  cycles: number;
  crFromCuts: number;
  stallListings: number;
  bundlesSent: number;
}
interface Meta {
  saveVersion: 1;
  pl: number; // plants standing in the bed (PL)
  cr: number; // credits (CR)
  crEarned: number;
  room: 1 | 2 | 3;
  can: boolean; // P1 THE WATERING CAN
  shears: boolean; // P2 THE SHARP SHEARS
  label: boolean; // P3 THE PLANT LABEL
  stall: number; // THE MARKET STALL listings
  bundles: number; // A BUNDLE FOR THE STALL sent
  badges: string[];
  stats: Stats;
}
/** The cycle in progress — a display record, not saved: the design's schema has
 *  `stats.cycles` and nothing else about the open cycle. */
interface Cycle {
  open: boolean;
  target: number; // the bed level this cycle returns to
  actions: number;
  cr: number;
}
/* ------------------------- constants (verbatim) --------------------------- */
const SAVE_KEY = "tend.save.v1";
export const EXPORT_FILENAME = "tend-save.json";
const ROOM = {
  1: { name: "THE WINDOW BOX", bed: 4, cost: 0 },
  2: { name: "THE HERB BED", bed: 6, cost: 16 },
  3: { name: "THE GREENHOUSE", bed: 8, cost: 52 },
} as const;
const BUNCH = 2; // plants a cut takes (P2: 1)
const PLANT_GAIN = [1, 2]; // plants one PLANT action may put in, by P1
const P1_COST = 12; // THE WATERING CAN
const P2_COST = 22; // THE SHARP SHEARS
const P3_COST = 6; // THE PLANT LABEL
const P4_COST = 5; // CR per use, repeatable
const STALL_COST = 3; // unbounded CR sink
const BUNDLE_PL = 4; // unbounded plant sink
const BADGE_EVERY = 10;
const PLANT_COST = 0; // PLANT costs no credits — asserted below (L1, C4)
const LEDGER_KEEP = 30;
const HERBS = ["PENNYLEAF", "SUNTHREAD", "GLASSMINT"]; // invented for this game
const FINITE_TABLE = P4_COST + P3_COST + P1_COST + ROOM[2].cost + P2_COST + ROOM[3].cost; // 113
/* --------------------- derived rules (verbatim from the design) ----------- */
const bedOf = (room: number) => ROOM[room as 1 | 2 | 3].bed;
const bunchOf = (shears: boolean) => (shears ? 1 : BUNCH);
const gainOf = (can: boolean) => PLANT_GAIN[can ? 1 : 0];
/** CUT PAY — one credit for every plant STANDING at the instant of the cut. */
const cutPays = (standing: number) => standing;
/* ------------------------------ seed -------------------------------------- */
const SEED_META: Meta = {
  saveVersion: 1,
  pl: 0,
  cr: 0,
  crEarned: 0,
  room: 1,
  can: false,
  shears: false,
  label: false,
  stall: 0,
  bundles: 0,
  badges: [],
  stats: { cuts: 0, planted: 0, cycles: 0, crFromCuts: 0, stallListings: 0, bundlesSent: 0 },
};
const SEED_CYCLE: Cycle = { open: false, target: 0, actions: 0, cr: 0 };
/* ======================= the published balance lines ======================
 * The same arithmetic checks.py runs, recomputed in the browser from the
 * constants above — the LOOP panel prints the result live (see bandReport).
 * ========================================================================*/
/** TAUGHT line: cut only from a full bed, then plant it back. */
function taughtLine(bed: number, gain: number, bunch: number) {
  const actions = 1 + Math.ceil(bunch / gain);
  return { actions, credits: bed };
}
/** THIN line: cut the moment a bunch can be taken — the price of impatience. */
function thinLine(gain: number, bunch: number) {
  const actions = 1 + Math.ceil(bunch / gain);
  return { actions, credits: bunch };
}
/** EMPTY line: cut the bed down, then replant it from nothing. */
function emptyLine(bed: number, gain: number, bunch: number) {
  const cuts = Math.floor(bed / bunch);
  let credits = 0;
  let standing = bed;
  for (let i = 0; i < cuts; i += 1) {
    credits += standing;
    standing -= bunch;
  }
  const refill = bed - standing;
  return { actions: cuts + Math.ceil(refill / gain), credits };
}
/** n bunches before the bed is replanted (§5.5) — null when the bed cannot refill. */
function rhythmCycle(bed: number, gain: number, bunch: number, n: number) {
  if (n * bunch > bed) return null;
  let credits = 0;
  let standing = bed;
  for (let i = 0; i < n; i += 1) {
    credits += standing;
    standing -= bunch;
  }
  return { actions: n + Math.ceil((n * bunch) / gain), credits };
}
/** Is there a closed cycle of play with actions/credits below `lam`? (Bellman-Ford) */
function hasNegCycle(bed: number, gain: number, bunch: number, lam: number): boolean {
  const edges: Array<[number, number, number]> = [];
  for (let p = 0; p <= bed; p += 1) {
    for (let k = 1; k <= gain; k += 1) if (p + k <= bed) edges.push([p, p + k, 1]);
    if (p >= bunch) edges.push([p, p - bunch, 1 - lam * cutPays(p)]);
  }
  const dist = new Array<number>(bed + 1).fill(0);
  for (let it = 0; it <= bed; it += 1) {
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
/** The best possible closed cycle of play — every simple cycle, by ratio search. */
function bestCycle(bed: number, gain: number, bunch: number): number {
  let lo = 0.05;
  let hi = 3;
  for (let i = 0; i < 60; i += 1) {
    const mid = (lo + hi) / 2;
    if (hasNegCycle(bed, gain, bunch, mid)) hi = mid;
    else lo = mid;
  }
  return lo;
}
const POWER_STATES: Array<{ name: string; gain: number; bunch: number }> = [
  { name: "NO POWERS", gain: 1, bunch: 2 },
  { name: "P1 THE WATERING CAN", gain: 2, bunch: 2 },
  { name: "P2 THE SHARP SHEARS", gain: 1, bunch: 1 },
  { name: "P1 + P2", gain: 2, bunch: 1 },
];
/** The 39 published lines: 15 cut levels + 3 empty beds + 9 taught-with-tools +
 *  12 exhaustive best-cycle searches. Band 0.20 .. 1.50. */
function bandReport() {
  const lines: Array<{ name: string; rate: number }> = [];
  for (const room of [1, 2, 3] as const) {
    const bed = ROOM[room].bed;
    for (let level = 2; level <= bed; level += 1) {
      lines.push({ name: `CUT AT ${level} · BED ${bed}`, rate: (1 + BUNCH) / level });
    }
  }
  for (const room of [1, 2, 3] as const) {
    const e = emptyLine(ROOM[room].bed, 1, BUNCH);
    lines.push({ name: `EMPTY BED ${ROOM[room].bed}`, rate: e.actions / e.credits });
  }
  for (const room of [1, 2, 3] as const) {
    for (const st of POWER_STATES.slice(1)) {
      const t = taughtLine(ROOM[room].bed, st.gain, st.bunch);
      lines.push({ name: `TAUGHT ${ROOM[room].bed} · ${st.name}`, rate: t.actions / t.credits });
    }
  }
  for (const room of [1, 2, 3] as const) {
    for (const st of POWER_STATES) {
      lines.push({ name: `BEST CYCLE ${ROOM[room].bed} · ${st.name}`, rate: bestCycle(ROOM[room].bed, st.gain, st.bunch) });
    }
  }
  const rates = lines.map((l) => l.rate);
  return { lines, lo: Math.min(...rates), hi: Math.max(...rates) };
}
/* ----------------------- dev checks (L1 + the ceilings) ------------------- */
function devChecks(): void {
  /* eslint-disable no-console */
  /* A1 — the ceiling is the bed's size, in every power state. */
  for (const room of [1, 2, 3] as const) {
    const bed = ROOM[room].bed;
    POWER_STATES.forEach((st) => {
      const t = taughtLine(bed, st.gain, st.bunch);
      console.assert(t.credits === bed, `A1: a taught cycle pays the bed's size (${bed}/${st.name})`);
      console.assert(cutPays(bed) === bed && cutPays(bed + 1) === bed + 1, "A1: a cut pays the plants standing");
    });
    /* A5 — the taught line is 3 actions without tools, 2 with either tool. */
    console.assert(taughtLine(bed, 1, 2).actions === 3, "A5: no powers = 3 actions a cycle");
    console.assert(taughtLine(bed, 2, 2).actions === 2 && taughtLine(bed, 1, 1).actions === 2, "A5: a tool = 2 actions");
    /* the three published lines (§5.1) */
    console.assert(Math.abs(taughtLine(bed, 1, 2).actions / bed - [0.75, 0.5, 0.375][room - 1]) < 1e-9, "A5: taught act/CR");
    const e = emptyLine(bed, 1, 2);
    console.assert(`${e.actions}/${e.credits}` === ["6/6", "9/12", "12/20"][room - 1], "A5: empty line");
  }
  const thin = thinLine(1, 2);
  console.assert(thin.actions === 3 && thin.credits === 2 && thin.actions / thin.credits === 1.5, "A6: thin line 3a/2c = 1.50");
  /* A6 — the band, recomputed over 39 lines */
  const rep = bandReport();
  console.assert(Math.abs(rep.lo - 0.2) < 1e-6, "A6: the band's floor is 0.20 (both tools, two bunches)");
  console.assert(Math.abs(rep.hi - 1.5) < 1e-9, "A6: the band's ceiling is 1.50 (the thin line)");
  console.assert(rep.lines.length === 39, "A6: 39 published lines");
  /* §5.5 — the best rhythm on the greenhouse, every simple cycle enumerated */
  const rhythmPublished: Record<string, number[]> = {
    "NO POWERS": [0.375, 3 / 7, 0.5],
    "P1 THE WATERING CAN": [0.25, 2 / 7, 1 / 3],
    "P2 THE SHARP SHEARS": [0.25, 4 / 15, 2 / 7],
    "P1 + P2": [0.25, 0.2, 5 / 21],
  };
  POWER_STATES.forEach((st) => {
    const pub = rhythmPublished[st.name];
    [1, 2, 3].forEach((n, i) => {
      const c = rhythmCycle(8, st.gain, st.bunch, n);
      console.assert(c !== null && Math.abs(c.actions / c.credits - pub[i]) < 1e-9, `A5: rhythm n=${n} (${st.name})`);
    });
    const best = bestCycle(8, st.gain, st.bunch);
    console.assert(Math.abs(best - Math.min(...pub)) < 1e-6, `A5: the best cycle is the best rhythm (${st.name})`);
  });
  /* A10 — the finite price list */
  console.assert(FINITE_TABLE === 113, "A10: the finite price list must total 113 CR");
  /* L1 + C4 — planting is free, unlimited and ungated: 3 actions from nothing pay the first 2 credits */
  console.assert(PLANT_COST === 0, "L1: PLANT must cost zero credits");
  let pl = 0;
  let cr = 0;
  let actions = 0;
  for (let i = 0; i < 2; i += 1) {
    pl = Math.min(pl + gainOf(false), 4);
    actions += 1;
  }
  pl -= BUNCH;
  cr += cutPays(2); // read BEFORE the bunch leaves
  actions += 1;
  console.assert(actions === 3 && cr === 2 && pl === 0, "A7: no lockout — 2 plants + 1 cut = 3 actions, 2 credits");
  /* A4 — plants conserved to the unit over a closed cycle */
  let start = 4;
  let planted = 0;
  let cut = 0;
  let level = start;
  level -= BUNCH;
  cut += BUNCH;
  while (level < start) {
    level += 1;
    planted += 1;
  }
  console.assert(planted === cut + (level - start), "A4: planted = cut + (end bed − start bed)");
  /* A9 — P4 buys an input with credits and can never pay: a plant is worth one credit to a cut */
  console.assert(P4_COST > 1, "A9: P4 must cost more than a plant can add to a cut");
  /* A13 — the π scale is display only: it appears nowhere in this arithmetic */
  console.assert(piValue(1) === 31 && piValue(4) === 125 && piValue(10) === 314, "A13: the π display scale");
  /* eslint-enable no-console */
}
/* ------------------------- persistence + export --------------------------- */
function cloneMeta(m: Meta): Meta {
  return { ...m, badges: [...m.badges], stats: { ...m.stats } };
}
function loadMeta(): Meta {
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return cloneMeta(SEED_META);
    const parsed = JSON.parse(raw) as Partial<Meta>;
    const s: Meta = { ...cloneMeta(SEED_META), ...parsed } as Meta;
    s.saveVersion = 1;
    s.room = (parsed.room === 2 || parsed.room === 3 ? parsed.room : 1) as 1 | 2 | 3;
    s.can = !!parsed.can;
    s.shears = !!parsed.shears;
    s.label = !!parsed.label;
    s.badges = Array.isArray(parsed.badges) ? [...(parsed.badges as string[])] : [];
    s.stats = { ...SEED_META.stats, ...(parsed.stats ?? {}) };
    // sanitize the bed so a stale save can never strand the player above capacity
    const bed = bedOf(s.room);
    s.pl = Math.max(0, Math.min(bed, Math.floor(s.pl || 0)));
    s.cr = Math.max(0, Math.floor(s.cr || 0));
    s.crEarned = Math.max(s.cr, Math.floor(s.crEarned || 0));
    s.stall = Math.max(0, Math.floor(s.stall || 0));
    s.bundles = Math.max(0, Math.floor(s.bundles || 0));
    return s;
  } catch {
    return cloneMeta(SEED_META);
  }
}
function exportSave(meta: Meta) {
  // Documented schema (design B2) — the bed's plants are in the file on purpose:
  // a stranger can export, close the tab mid-refill, reopen and compare.
  const payload = {
    saveVersion: meta.saveVersion,
    pl: meta.pl,
    cr: meta.cr,
    crEarned: meta.crEarned,
    room: meta.room,
    can: meta.can,
    shears: meta.shears,
    label: meta.label,
    stall: meta.stall,
    bundles: meta.bundles,
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
  // Defer the revoke: revoking synchronously after click() can race the
  // browser's download start and abort the file (blob: URLs). This timer
  // changes no game state — the design's ban is on state-changing timers.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
/* ------------------------------ route ------------------------------------- */
export const Route = createFileRoute("/preventative-health")({
  component: Tend,
});
function Tend() {
  const [meta, setMeta] = useState<Meta>(SEED_META);
  const [hydrated, setHydrated] = useState(false);
  const [phase, setPhase] = useState<Phase>("start");
  const [plantSize, setPlantSize] = useState(1);
  const [cycle, setCycle] = useState<Cycle>(SEED_CYCLE);
  const [ledger, setLedger] = useState<string[]>([
    "THE BED IS EMPTY AND THE SEED TRAY IS BOTTOMLESS — PLANT FIRST, AND PLANTING IS FREE",
  ]);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const metaRef = useRef<Meta>(meta);
  const phaseRef = useRef<Phase>(phase);
  const plantSizeRef = useRef(plantSize);
  const cycleRef = useRef<Cycle>(cycle);
  const log = (line: string) => setLedger((l) => [...l.slice(-(LEDGER_KEEP - 1)), line]);
  /** run one action on the current meta; returns the next meta and the ledger line */
  const apply = (fn: (m: Meta, c: Cycle) => { m: Meta; c?: Cycle; line: string; notice?: string }) => {
    const { m, c, line, notice: nt } = fn(metaRef.current, cycleRef.current);
    metaRef.current = m; // keep the ref current so rapid presses never act on a stale bed
    setMeta(m);
    if (c) {
      cycleRef.current = c;
      setCycle(c);
    }
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
      `SAVE LOADED — ${ROOM[m.room].name} · BED ${m.pl}/${bedOf(m.room)} · CREDITS ${m.cr} · BUNCH ${bunchOf(m.shears)}`,
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
  /* ------------------------------- PLANT ----------------------------------- */
  const plant = (want: number) =>
    apply((m, c) => {
      const bed = bedOf(m.room);
      const gain = gainOf(m.can);
      const k = Math.max(1, Math.min(want, gain));
      if (m.pl >= bed) {
        return { m, line: `PLANT — BED FULL — ${bed}/${bed}`, notice: `BED FULL — ${bed}/${bed}` };
      }
      const n = cloneMeta(m);
      const before = n.pl;
      n.pl = Math.min(n.pl + k, bed); // refused plants are NEVER created
      const delta = n.pl - before;
      const refused = k - delta;
      n.stats.planted += delta;
      let next: Cycle = c;
      let line = `PLANT +${delta} → BED ${n.pl}/${bed}${refused > 0 ? ` · ${refused} REFUSED — BED FULL` : ""}`;
      if (c.open) {
        next = { ...c, actions: c.actions + 1 };
        if (n.pl >= c.target) {
          const rate = next.actions / Math.max(1, next.cr);
          line += ` · CYCLE CLOSED · ${next.actions} ACTIONS · ${next.cr} CREDITS · ${rate.toFixed(2)} ACTIONS PER CREDIT`;
          n.stats.cycles += 1;
          next = SEED_CYCLE;
        }
      }
      return { m: n, c: next, line, notice: refused > 0 ? `BED FULL — ${bed}/${bed}` : undefined };
    });
  /* -------------------------------- CUT ------------------------------------ */
  const cut = () =>
    apply((m, c) => {
      const bunch = bunchOf(m.shears);
      if (m.pl < bunch) {
        return { m, line: `CUT — NEEDS ${bunch} PLANTS`, notice: `NEEDS ${bunch} PLANTS — HAVE ${m.pl}` };
      }
      const n = cloneMeta(m);
      const standing = n.pl; // <-- read BEFORE the bunch leaves
      const paid = cutPays(standing);
      n.cr += paid;
      n.crEarned += paid;
      n.pl -= bunch;
      n.stats.cuts += 1;
      n.stats.crFromCuts += paid;
      const next: Cycle = c.open
        ? { ...c, actions: c.actions + 1, cr: c.cr + paid }
        : { open: true, target: standing, actions: 1, cr: paid };
      return {
        m: n,
        c: next,
        line: `CUT · ${standing} STANDING · BUNCH ${bunch} → +${paid} CR · BED ${n.pl}`,
      };
    });
  /* ------------------------------- P4 -------------------------------------- */
  const onCompost = () =>
    apply((m, c) => {
      const bed = bedOf(m.room);
      if (m.pl >= bed) {
        // nothing can be created, so nothing is charged (the PLANT refusal rule, applied to a paid input)
        return { m, line: `P4 THE COMPOST BIN — BED FULL — ${bed}/${bed}`, notice: `BED FULL — NOTHING TO BUY` };
      }
      if (m.cr < P4_COST) {
        return { m, line: `P4 THE COMPOST BIN — NEEDS ${P4_COST} CR`, notice: `NEEDS ${P4_COST} CR — HAVE ${m.cr}` };
      }
      const n = cloneMeta(m);
      n.cr -= P4_COST;
      n.pl = Math.min(bed, n.pl + 1);
      return { m: n, c, line: `P4 THE COMPOST BIN — ${P4_COST} CR → +1 PLANT · BED ${n.pl}/${bed} · ZERO UNITS PAID` };
    });
  /* ------------------------------- sinks ----------------------------------- */
  const doBadge = (badges: string[], key: string, count: number): string[] => {
    if (count > 0 && count % BADGE_EVERY === 0) {
      const badge = `${key} ${count}`;
      return badges.includes(badge) ? badges : [...badges, badge];
    }
    return badges;
  };
  const onBundle = () =>
    apply((m, c) => {
      if (m.pl < BUNDLE_PL) {
        return { m, line: `A BUNDLE — NEEDS ${BUNDLE_PL} PLANTS`, notice: `NEEDS ${BUNDLE_PL} PLANTS — HAVE ${m.pl}` };
      }
      const n = cloneMeta(m);
      n.pl -= BUNDLE_PL;
      n.bundles += 1;
      n.stats.bundlesSent += 1;
      n.badges = doBadge(n.badges, "BUNDLE", n.bundles);
      return { m: n, c, line: `A BUNDLE FOR THE STALL — ${BUNDLE_PL} PLANTS → BUNDLE #${n.bundles} · BED ${n.pl}` };
    });
  const onStall = () =>
    apply((m, c) => {
      if (m.cr < STALL_COST) {
        return { m, line: `THE MARKET STALL — NEEDS ${STALL_COST} CR`, notice: `NEEDS ${STALL_COST} CR — HAVE ${m.cr}` };
      }
      const n = cloneMeta(m);
      n.cr -= STALL_COST;
      n.stall += 1;
      n.stats.stallListings += 1;
      n.badges = doBadge(n.badges, "LISTING", n.stall);
      return { m: n, c, line: `THE MARKET STALL — ${STALL_COST} CR → LISTING #${n.stall} ON THE BOARD` };
    });
  /* ------------------------------- unlocks -------------------------------- */
  const buy = (label: string, cost: number, mutate: (n: Meta) => void) =>
    apply((m, c) => {
      if (m.cr < cost) {
        return { m, line: `${label} — NEEDS ${cost} CR`, notice: `NEEDS ${cost} CR — HAVE ${m.cr}` };
      }
      const n = cloneMeta(m);
      n.cr -= cost;
      mutate(n);
      return { m: n, c, line: `${label} — ${cost} CR PAID FROM THE TAKINGS · NO TOOL RAISES THE CEILING` };
    });
  const onP3 = () => buy("P3 THE PLANT LABEL", P3_COST, (n) => (n.label = true));
  const onP1 = () => buy("P1 THE WATERING CAN", P1_COST, (n) => (n.can = true));
  const onRoom2 = () =>
    buy(`BED 2 — ${ROOM[2].name}`, ROOM[2].cost, (n) => {
      n.room = 2;
      n.pl = Math.min(n.pl, bedOf(2));
    });
  const onP2 = () => buy("P2 THE SHARP SHEARS", P2_COST, (n) => (n.shears = true));
  const onRoom3 = () =>
    buy(`BED 3 — ${ROOM[3].name}`, ROOM[3].cost, (n) => {
      n.room = 3;
      n.pl = Math.min(n.pl, bedOf(3));
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
    setPlantSize(1);
    setCycle(SEED_CYCLE);
    cycleRef.current = SEED_CYCLE;
    setLedger(["THE BED IS EMPTY AND THE SEED TRAY IS BOTTOMLESS — PLANT FIRST, AND PLANTING IS FREE"]);
    setNotice(null);
    setConfirmReset(false);
  };
  /* input: keyboard — the same keys as the button faces */
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const ph = phaseRef.current;
      if (ph === "start" && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        setPhase("bed");
        return;
      }
      if ((ph === "book" || ph === "loop") && e.key === "Escape") {
        setPhase("bed");
        return;
      }
      if (ph !== "bed") return;
      const k = e.key.toLowerCase();
      if (k === "p") plant(plantSizeRef.current);
      else if (k === "c") cut();
      else if (k === "z") onCompost();
      else if (k === "b") onBundle();
      else if (k === "t") onStall();
      else if (k === "1") setPlantSize(1);
      else if (k === "2") setPlantSize(2);
      else if (k === "k") setPhase("book");
      else if (k === "l") setPhase("loop");
      else if (k === "x") exportSave(metaRef.current);
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    plantSizeRef.current = Math.min(plantSize, gainOf(metaRef.current.can));
  }, [plantSize, meta]);
  /* ------------------------- the bed canvas ------------------------------- */
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;
    const m = metaRef.current;
    const bed = bedOf(m.room);
    const bunch = bunchOf(m.shears);
    const full = m.pl === bed;
    const F5 = "5px 'Press Start 2P', monospace";
    const F4 = "4px 'Press Start 2P', monospace";
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = PAL.wall;
    ctx.fillRect(0, 0, 320, 240);
    /* HUD — two 8-px lines */
    ctx.font = F5;
    ctx.fillStyle = PAL.cream;
    ctx.fillText(`${ROOM[m.room].name} · BED ${m.pl}/${bed}`, 4, 10);
    ctx.fillStyle = PAL.brass;
    ctx.fillText(`A CUT PAYS ${m.pl >= bunch ? m.pl : 0} · CEILING ${bed}`, 4, 20);
    /* the bed — 12×16 px slots in rows of four, on soil dark */
    ctx.fillStyle = PAL.timber;
    ctx.fillRect(6, 26, 146, 122);
    ctx.fillStyle = PAL.soil;
    ctx.fillRect(9, 29, 140, 116);
    if (full) {
      ctx.fillStyle = PAL.leaf;
      ctx.fillRect(9, 29, 140, 11);
      ctx.fillStyle = PAL.ink;
      ctx.font = F4;
      ctx.fillText(`FULL — ${bed}/${bed} — CUT NOW`, 12, 37);
    }
    for (let i = 0; i < bed; i += 1) {
      const col = i % 4;
      const row = Math.floor(i / 4);
      const x = 16 + col * 34;
      const y = 50 + row * 24;
      if (i < m.pl) {
        ctx.fillStyle = PAL.leaf;
        ctx.fillRect(x, y, 12, 16);
        ctx.fillStyle = PAL.timber;
        ctx.fillRect(x + 4, y + 16, 4, 4);
      } else {
        ctx.fillStyle = PAL.wall;
        ctx.fillRect(x, y, 12, 16);
        ctx.strokeStyle = PAL.soil;
        ctx.strokeRect(x + 0.5, y + 0.5, 11, 15);
      }
    }
    /* the seed tray + [P] PLANT */
    ctx.fillStyle = PAL.tin;
    ctx.fillRect(12, 106, 40, 26);
    ctx.fillStyle = PAL.ink;
    ctx.font = F4;
    ctx.fillText("SEED", 16, 118);
    ctx.fillText("TRAY", 16, 126);
    ctx.fillStyle = PAL.cream;
    ctx.font = F5;
    ctx.fillText(`[P] PLANT +${gainOf(m.can)}`, 58, 112);
    ctx.fillStyle = PAL.tin;
    ctx.font = F4;
    ctx.fillText("FREE · UNLIMITED", 58, 122);
    ctx.fillStyle = PAL.brass;
    ctx.fillText(`BED ${m.pl}/${bed} · BUNCH ${bunch}`, 58, 132);
    ctx.fillStyle = PAL.leaf;
    ctx.fillText(`${HERBS[m.stats.cycles % HERBS.length]} IN THE BED`, 12, 144);
    /* the stall — the takings and the live payout */
    ctx.fillStyle = PAL.timber;
    ctx.fillRect(160, 26, 152, 82);
    ctx.strokeStyle = PAL.brass;
    ctx.strokeRect(160.5, 26.5, 151, 81);
    ctx.fillStyle = PAL.cream;
    ctx.font = F5;
    ctx.fillText("THE STALL", 166, 38);
    ctx.fillStyle = PAL.brass;
    ctx.fillText(`TAKINGS ${m.cr} CR · π ${piValue(m.cr)}`, 166, 50);
    ctx.fillStyle = m.pl >= bunch ? PAL.leaf : PAL.tin;
    ctx.fillText(`[C] CUT · PAYS ${m.pl >= bunch ? m.pl : 0}`, 166, 62);
    ctx.fillStyle = PAL.tin;
    ctx.font = F4;
    ctx.fillText(m.pl === bed ? "A FULL BED PAYS THE MOST" : `A FULL BED PAYS ${bed}`, 166, 72);
    ctx.fillStyle = PAL.cream;
    ctx.fillText(`[B] BUNDLE ${BUNDLE_PL} · [T] STALL ${STALL_COST}`, 166, 84);
    ctx.fillStyle = PAL.brass;
    ctx.fillText(`STALL ${m.stall} · BUNDLES ${m.bundles} · BADGES ${m.badges.length}`, 166, 96);
    /* the tools */
    ctx.fillStyle = PAL.wall;
    ctx.fillRect(160, 114, 152, 62);
    ctx.strokeStyle = PAL.timber;
    ctx.strokeRect(160.5, 114.5, 151, 61);
    const tool = (y: number, name: string, owned: boolean, price: number) => {
      ctx.fillStyle = owned ? PAL.leaf : PAL.cream;
      ctx.font = F4;
      ctx.fillText(`${name}`, 166, y);
      ctx.fillStyle = owned ? PAL.leaf : PAL.brass;
      ctx.fillText(owned ? "OWNED" : `${price} CR`, 274, y);
    };
    ctx.fillStyle = PAL.brass;
    ctx.font = F4;
    ctx.fillText("THE TOOLS — NEVER PAYOUTS", 166, 124);
    tool(136, "P1 WATERING CAN +2", m.can, P1_COST);
    tool(146, "P2 SHARP SHEARS -1", m.shears, P2_COST);
    tool(156, "P3 PLANT LABEL", m.label, P3_COST);
    ctx.fillStyle = PAL.tin;
    ctx.fillText(`P4 COMPOST BIN ${P4_COST} CR A USE`, 166, 168);
    /* the action bar + the honest lines */
    ctx.fillStyle = PAL.brass;
    ctx.font = F4;
    ctx.fillText("[P] PLANT  [C] CUT  [B] BUNDLE  [T] STALL  [Z] COMPOST", 4, 186);
    ctx.fillStyle = PAL.cream;
    ctx.fillText("[K] BOOK  [L] LOOP  [X] EXPORT THE SAVE", 4, 195);
    ctx.fillText("A CYCLE IS FOUR NUMBERS IN A SAVE FILE.", 4, 212);
    ctx.fillText("NOTHING HERE IS A REAL PLANT, A REAL HERB", 4, 221);
    ctx.fillText("OR HEALTH ADVICE.", 4, 230);
    ctx.fillStyle = PAL.brass;
    ctx.fillText("THE BED WAITS — NO NUMBER MOVES WHILE AWAY", 4, 236);
  }, [meta, phase, cycle]);
  /* ------------------------------ render ---------------------------------- */
  const m = meta;
  const gain = gainOf(m.can);
  const size = Math.min(plantSize, gain);
  return (
    <div className="min-h-dvh bg-[#140f0a] text-amber-100">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b-4 border-amber-500/40 px-4 py-3">
        <div>
          <h1 className="font-pixel text-lg text-amber-300 drop-shadow-[3px_3px_0_rgba(0,0,0,0.9)]">TEND</h1>
          <p className="text-[10px] uppercase tracking-[0.25em] text-amber-500/70">
            herb bed sim · plant → cut → credits → a bigger bed · Gaming Layer demo
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a href="/repair-cafe" className="pixel-btn bg-neutral-900 px-3 py-2 text-[9px] text-amber-200">
            ◀ LEND &amp; MEND
          </a>
          <a href="/preventative-health-design" data-testid="link-to-design" className="pixel-btn bg-neutral-900 px-3 py-2 text-[9px] text-cyan-300">
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
            onStart={() => setPhase("bed")}
            onExport={() => exportSave(metaRef.current)}
            onReset={resetSave}
            confirmReset={confirmReset}
          />
        )}
        {phase === "bed" && (
          <BedScreen
            meta={m}
            cycle={cycle}
            notice={notice}
            ledger={ledger}
            plantSize={size}
            gain={gain}
            onPlantSize={(n) => setPlantSize(Math.max(1, Math.min(gain, n)))}
            onPlant={() => plant(size)}
            onCut={cut}
            onCompost={onCompost}
            onBundle={onBundle}
            onStall={onStall}
            onBook={() => setPhase("book")}
            onLoop={() => setPhase("loop")}
            onExport={() => exportSave(metaRef.current)}
            canvasRef={canvasRef}
          />
        )}
        {phase === "book" && (
          <BookScreen
            meta={m}
            onBack={() => setPhase("bed")}
            onP1={onP1}
            onP2={onP2}
            onP3={onP3}
            onP4={onCompost}
            onRoom2={onRoom2}
            onRoom3={onRoom3}
            onBundle={onBundle}
            onStall={onStall}
            onExport={() => exportSave(metaRef.current)}
          />
        )}
        {phase === "loop" && (
          <div className="flex flex-col gap-4">
            <LoopPanel meta={m} />
            <div className="flex items-center justify-between">
              <button data-testid="go-bed" onClick={() => setPhase("bed")} className="pixel-btn bg-amber-300 px-5 py-3 text-xs text-neutral-950">
                ↩ BACK TO THE BED
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
  timber: "#6b4a2a",
  soil: "#3a2a1c",
  leaf: "#4f8f3a",
  tin: "#9aa4ae",
  brass: "#c8a040",
  cream: "#efe6d2",
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
  const bed = bedOf(meta.room);
  return (
    <div className="relative z-20 mt-3 flex flex-col items-center gap-3 py-2 text-center">
      <p className="font-pixel text-sm text-amber-300">THE LOOP IN FIVE LINES</p>
      <ul className="space-y-1 text-[11px] leading-relaxed text-amber-100/80">
        <li>PLANTING IS FREE AND UNLIMITED</li>
        <li>A BUNCH PAYS ONE CREDIT FOR EVERY PLANT STANDING</li>
        <li>CUT FROM A FULL BED</li>
        <li>THE BED WAITS FOR EVER — NOT ONE NUMBER MOVES WHILE YOU ARE AWAY</li>
        <li>16 CREDITS OPENS THE HERB BED</li>
      </ul>
      <p className="max-w-xl border-2 border-amber-500/30 bg-amber-950/20 px-4 py-2 text-[10px] leading-relaxed text-amber-100/70">
        A CYCLE IS FOUR NUMBERS IN A SAVE FILE. NOTHING HERE IS A REAL PLANT, A REAL HERB OR HEALTH ADVICE. The plants
        and the credits are two integers, the bed is a capacity you bought with credits, and the bed advances only while
        you press a key. This is a fictional bed of invented plants (pennyleaf, sunthread, glassmint), and the counters
        measure the save file and nothing else.
      </p>
      <p className="text-[10px] text-amber-100/50">
        SEED: THE WINDOW BOX · BED {bed} · 0 PLANTS · 0 CREDITS · NO TOOLS · A BUNCH TAKES {BUNCH} PLANTS · A CUT PAYS
        AT MOST {bed}
      </p>
      <p className="max-w-xl text-center text-[10px] leading-relaxed text-amber-100/50">
        CUTS {meta.stats.cuts} · CYCLES {meta.stats.cycles} · PLANTS PLANTED {meta.stats.planted} · CREDITS FROM CUTS{" "}
        {meta.stats.crFromCuts} · PLANTS {meta.pl} · CREDITS {meta.cr} (EARNED {meta.crEarned}) · LISTINGS {meta.stall} ·
        BUNDLES {meta.bundles}
      </p>
      <button data-testid="to-bed" onClick={onStart} className="pixel-btn bg-amber-300 px-6 py-4 text-sm text-neutral-950">
        ▶ TO THE BED — {ROOM[meta.room].name} · BED {bed}
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
        Keys on the bed: P PLANT · C CUT · Z COMPOST BIN ({P4_COST} CR) · B BUNDLE · T STALL · 1/2 PLANT COUNT · K BOOK ·
        L LOOP · X EXPORT. No clock, no timer, no cooldown: the bed waits for ever at exactly the numbers you left in it.
      </p>
    </div>
  );
}
/* ------------------------------- bed screen ------------------------------- */
function BedScreen({
  meta,
  cycle,
  notice,
  ledger,
  plantSize,
  gain,
  onPlantSize,
  onPlant,
  onCut,
  onCompost,
  onBundle,
  onStall,
  onBook,
  onLoop,
  onExport,
  canvasRef,
}: {
  meta: Meta;
  cycle: Cycle;
  notice: string | null;
  ledger: string[];
  plantSize: number;
  gain: number;
  onPlantSize: (n: number) => void;
  onPlant: () => void;
  onCut: () => void;
  onCompost: () => void;
  onBundle: () => void;
  onStall: () => void;
  onBook: () => void;
  onLoop: () => void;
  onExport: () => void;
  canvasRef: RefObject<HTMLCanvasElement | null>;
}) {
  const m = meta;
  const bed = bedOf(m.room);
  const bunch = bunchOf(m.shears);
  const full = m.pl === bed;
  const canCut = m.pl >= bunch;
  const pays = canCut ? m.pl : 0;
  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="relative w-full max-w-3xl border-4 border-amber-500/50 bg-[#1a130d] p-4 shadow-[8px_8px_0_rgba(0,0,0,0.6)]">
        <div className="scanlines pointer-events-none absolute inset-0 z-10" />
        {/* HUD strip */}
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 font-pixel text-[8px] text-amber-100/80">
          <span data-testid="hud-room">
            BED {m.room} — {ROOM[m.room].name} · SIZE {bed}
          </span>
          <span data-testid="bed-value" className="text-amber-200">
            PLANTS {m.pl}/{bed}
          </span>
          <span data-testid="bed-full" className={full ? "text-lime-300" : "text-cyan-300"}>
            {full ? `BED FULL — ${m.pl}/${bed}` : `BED NOT FULL — ${m.pl}/${bed}`}
          </span>
          <span data-testid="credits-value" className="text-pink-300">
            CREDITS {m.cr}
          </span>
          <span data-testid="pi-value" className="text-lime-300">
            π {piValue(m.cr)}
          </span>
          <span data-testid="cut-pays" className={full ? "text-lime-300" : "text-amber-300"}>
            {full ? `CUT · PAYS ${pays}` : `CUT · PAYS ${pays} · A FULL BED PAYS ${bed}`}
          </span>
          <span>CEILING {bed} CREDITS A CUT · NO TOOL RAISES IT</span>
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
        {/* P3 THE PLANT LABEL — every value it prints is already published */}
        {m.label && (
          <p data-testid="label-line" className="mt-1 text-center font-pixel text-[8px] text-amber-300">
            BED {m.pl}/{bed} · BUNCH {bunch} · THIS CUT PAYS {pays} · A FULL BED WOULD PAY {bed}
          </p>
        )}
        {/* the bed, DOM-readable */}
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          <div data-testid="bed-state" className="border-2 border-amber-500/40 bg-amber-950/20 px-3 py-2 text-[9px] text-amber-100">
            PLANTS {m.pl}/{bed} · BUNCH {bunch} · A CUT PAYS {pays} ({bed} FROM A FULL BED)
          </div>
          <div data-testid="cycle-state" className="border-2 border-amber-500/20 bg-black/20 px-3 py-2 text-[9px] text-amber-100/70">
            {cycle.open
              ? `CYCLE OPEN · TARGET BED ${cycle.target} · ${cycle.actions} ACTIONS · ${cycle.cr} CREDITS`
              : `NO CYCLE OPEN · CUT A BUNCH TO START ONE · ${m.stats.cycles} CLOSED`}
          </div>
          <div data-testid="tools-state" className="border-2 border-amber-500/20 bg-black/20 px-3 py-2 text-[9px] text-amber-100/70">
            {m.can ? "CAN +2" : "CAN —"} · {m.shears ? "SHEARS BUNCH 1" : `SHEARS — BUNCH ${BUNCH}`} ·{" "}
            {m.label ? "LABEL ON" : "LABEL —"}
          </div>
        </div>
      </div>
      {/* action bar */}
      <div className="grid w-full max-w-3xl grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="flex flex-col gap-1">
          <div className="flex gap-1">
            {Array.from({ length: gain }, (_, i) => i + 1).map((k) => (
              <button
                key={k}
                data-testid={`plant-size-${k}`}
                onClick={() => onPlantSize(k)}
                className={`pixel-btn flex-1 px-1 py-1 text-[8px] ${plantSize === k ? "bg-amber-600 text-amber-50" : "bg-neutral-900 text-neutral-400"}`}
              >
                {k}
              </button>
            ))}
          </div>
          <button
            data-testid="plant-btn"
            onClick={onPlant}
            className="pixel-btn bg-[#3a2510] px-3 py-3 text-[9px] text-amber-200"
          >
            [P] PLANT +{plantSize}
            {gain > 1 ? ` (UP TO +${gain})` : ""} — FREE · UNLIMITED
          </button>
        </div>
        <button
          data-testid="cut-btn"
          onClick={onCut}
          className={`pixel-btn px-3 py-3 text-[9px] ${canCut ? (full ? "bg-lime-700 text-lime-50" : "bg-amber-700 text-amber-50") : "bg-neutral-900 text-neutral-500"}`}
        >
          [C] CUT · PAYS {pays} · TAKES {bunch}
        </button>
        <button
          data-testid="use-p4"
          onClick={onCompost}
          className={`pixel-btn px-3 py-3 text-[9px] ${m.cr >= P4_COST && m.pl < bed ? "bg-pink-900 text-pink-100" : "bg-neutral-950 text-neutral-500"}`}
        >
          [Z] COMPOST BIN {P4_COST} CR → +1 PLANT
        </button>
        <button
          data-testid="bundle-btn"
          onClick={onBundle}
          className={`pixel-btn px-3 py-3 text-[9px] ${m.pl >= BUNDLE_PL ? "bg-neutral-800 text-lime-300" : "bg-neutral-950 text-neutral-500"}`}
        >
          [B] BUNDLE {BUNDLE_PL} PLANTS
        </button>
      </div>
      {/* the unbounded sinks + nav */}
      <div className="grid w-full max-w-3xl grid-cols-2 gap-2 sm:grid-cols-5">
        <button data-testid="stall-btn" onClick={onStall} className="pixel-btn bg-neutral-800 px-2 py-3 text-[8px] text-amber-200">
          {m.cr >= STALL_COST ? `▶ STALL ${STALL_COST} CR · LISTING #${m.stall + 1}` : `STALL: ${STALL_COST} CR — SHORT ${STALL_COST - m.cr}`}
        </button>
        <button data-testid="go-book" onClick={onBook} className="pixel-btn bg-neutral-900 px-2 py-3 text-[8px] text-amber-100">
          [K] BOOK — THE PRICE LIST
        </button>
        <button data-testid="go-loop" onClick={onLoop} className="pixel-btn bg-neutral-900 px-2 py-3 text-[8px] text-amber-100">
          [L] LOOP — THE PUBLISHED MATH
        </button>
        <button data-testid="export-save-bed" onClick={onExport} className="pixel-btn bg-cyan-950 px-2 py-3 text-[8px] text-cyan-200">
          ⤓ EXPORT SAVE
        </button>
        <span className="flex items-center justify-center px-2 py-3 text-center text-[8px] text-amber-100/40">
          BADGES {m.badges.length} · EVERY {BADGE_EVERY} OF A SINK
        </span>
      </div>
      <div className="w-full max-w-3xl border-2 border-amber-500/20 bg-black/40">
        <div className="flex items-center justify-between border-b border-amber-500/20 px-3 py-2">
          <span className="font-pixel text-[8px] text-amber-300">THE BED LEDGER — EVERY ACTION, PRINTED</span>
          <span className="font-pixel text-[8px] text-amber-100/40">
            CUTS {m.stats.cuts} · CYCLES {m.stats.cycles} · PLANTED {m.stats.planted}
          </span>
        </div>
        <div data-testid="bed-ledger" className="max-h-40 overflow-y-auto px-3 py-2 font-pixel text-[8px] leading-relaxed text-amber-100/80">
          {ledger.map((l, i) => (
            <div key={`${i}-${l}`} className={i === ledger.length - 1 ? "text-amber-200" : "text-amber-100/40"}>
              {l}
            </div>
          ))}
        </div>
      </div>
      <div className="min-h-5 text-center text-[10px] text-yellow-200/90">{notice ?? ""}</div>
      <p className="max-w-3xl text-center text-[9px] leading-relaxed text-amber-100/40">
        THE BED WAITS — NOT ONE NUMBER MOVES WHILE THIS TAB IS CLOSED. NOTHING WILTS, NOTHING DRIES OUT, NOTHING IS OWED:
        NO COOLDOWN, NO DAILY, NO STREAK, NO ABSENCE MAIL. PLANTS REFUSED BY A FULL BED WERE NEVER CREATED, SO NOTHING
        YOU MADE WAS THROWN AWAY.
      </p>
    </div>
  );
}
/* ------------------------------- book screen ------------------------------ */
function BookScreen({
  meta,
  onBack,
  onP1,
  onP2,
  onP3,
  onP4,
  onRoom2,
  onRoom3,
  onBundle,
  onStall,
  onExport,
}: {
  meta: Meta;
  onBack: () => void;
  onP1: () => void;
  onP2: () => void;
  onP3: () => void;
  onP4: () => void;
  onRoom2: () => void;
  onRoom3: () => void;
  onBundle: () => void;
  onStall: () => void;
  onExport: () => void;
}) {
  const m = meta;
  const cr = m.cr;
  return (
    <div className="flex w-full flex-col items-center gap-4" data-testid="book-panel">
      <div className="flex w-full max-w-3xl flex-wrap items-center justify-between gap-2">
        <h2 className="font-pixel text-sm text-amber-300">THE PRICE LIST — CREDITS ONLY</h2>
        <div className="flex items-center gap-2">
          <span className="font-pixel text-[10px] text-pink-300">CREDITS {m.cr}</span>
          <span className="text-[9px] text-amber-100/50">
            LISTINGS {m.stall} · BUNDLES {m.bundles} · FINITE TABLE {FINITE_TABLE} CR
          </span>
        </div>
      </div>
      <div className="w-full max-w-3xl border-2 border-amber-500/30 bg-black/30 p-3">
        <h3 className="font-pixel text-[9px] text-amber-300">
          THE PRICE LIST — EVERY ROW IS CREDITS, NEVER MONEY · FINITE TOTAL {FINITE_TABLE} CR
        </h3>
        <div className="mt-2 flex flex-col gap-2">
          <UnlockRow
            label="P4 THE COMPOST BIN"
            cost={P4_COST}
            have={cr}
            owned={false}
            ownedLabel="REPEATABLE — USE IT"
            buyLabel={`▶ USE ${P4_COST} CR → +1 PLANT`}
            effect="one plant immediately, for no action, capped by the bed's size like any other plant"
            ceiling="zero credits: it buys an INPUT with credits, at 5 CR a plant, so it makes the rate worse on purpose"
            onBuy={onP4}
            testid="buy-p4"
          />
          <UnlockRow
            label="P3 THE PLANT LABEL"
            cost={P3_COST}
            have={cr}
            owned={m.label}
            effect="prints BED 3/4 · BUNCH 2 · THIS CUT PAYS 3 · A FULL BED WOULD PAY 4 before you commit"
            ceiling="zero units: every value it prints is already published — it changes what you see, never what a cut pays"
            onBuy={onP3}
            testid="buy-p3"
          />
          <UnlockRow
            label="P1 THE WATERING CAN"
            cost={P1_COST}
            have={cr}
            owned={m.can}
            effect="one PLANT action puts up to 2 plants in (you still choose the count): a taught cycle goes from 3 actions to 2"
            ceiling="1 rank, ever · a cut still pays exactly the plants standing — 4 / 6 / 8, unchanged"
            onBuy={onP1}
            testid="buy-p1"
          />
          <UnlockRow
            label={`BED 2 — ${ROOM[2].name}`}
            cost={ROOM[2].cost}
            have={cr}
            owned={m.room >= 2}
            effect="bed 4 → 6: a full bed is worth 6 credits and a taught cycle pays 6"
            ceiling="6 credits a cut — the ceiling moves because the bed did, and no tool can raise it further"
            onBuy={onRoom2}
            testid="buy-room-2"
          />
          <UnlockRow
            label="P2 THE SHARP SHEARS"
            cost={P2_COST}
            have={cr}
            owned={m.shears}
            effect="a bunch takes 1 plant instead of 2, so the bed empties half as fast: a taught cycle goes from 3 actions to 2"
            ceiling="1 rank, ever · the cut still pays the plants standing — same credits, fewer actions"
            onBuy={onP2}
            testid="buy-p2"
          />
          <UnlockRow
            label={`BED 3 — ${ROOM[3].name}`}
            cost={ROOM[3].cost}
            have={cr}
            owned={m.room >= 3}
            effect="bed 6 → 8: a full bed is worth 8 credits and a taught cycle pays 8"
            ceiling="8 credits a cut — the top of the published band, every tool on or off"
            onBuy={onRoom3}
            testid="buy-room-3"
          />
        </div>
        <p className="mt-2 text-[9px] text-amber-300">NO ROW IS A TRAP — EVERY BED PAYS cap/3 CREDITS AN ACTION</p>
        <p className="mt-1 text-[9px] text-amber-100/50">
          All timing figures are designed, not measured — no player has reached the last row yet.
        </p>
      </div>
      <div className="w-full max-w-3xl border-2 border-amber-500/30 bg-black/30 p-3">
        <h3 className="font-pixel text-[9px] text-amber-300">THE UNBOUNDED SINKS — REAL SPENDS, BADGE EVERY {BADGE_EVERY}</h3>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <button data-testid="book-stall" onClick={onStall} className="pixel-btn bg-neutral-800 px-2 py-3 text-[8px] text-amber-200">
            {m.cr >= STALL_COST ? `▶ THE MARKET STALL — ${STALL_COST} CR · #${m.stall + 1}` : `MARKET STALL: ${STALL_COST} CR — SHORT ${STALL_COST - m.cr}`}
          </button>
          <button data-testid="book-bundle" onClick={onBundle} className="pixel-btn bg-neutral-800 px-2 py-3 text-[8px] text-lime-300">
            {m.pl >= BUNDLE_PL ? `▶ A BUNDLE FOR THE STALL — ${BUNDLE_PL} PLANTS · #${m.bundles + 1}` : `A BUNDLE: ${BUNDLE_PL} PLANTS — SHORT ${BUNDLE_PL - m.pl}`}
          </button>
        </div>
        <p className="mt-2 text-[9px] text-amber-100/50">
          BADGES: {m.badges.length ? m.badges.join(" · ") : "— none yet —"} · earn one every {BADGE_EVERY} of any sink ·
          the bed holds {m.pl}/{bedOf(m.room)} plants
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button data-testid="go-bed-from-book" onClick={onBack} className="pixel-btn bg-amber-300 px-5 py-3 text-xs text-neutral-950">
          ↩ BACK TO THE BED (ESC)
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
  buyLabel,
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
  buyLabel?: string;
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
        {owned ? ownedLabel ?? "OWNED" : short === 0 ? buyLabel ?? `▶ BUY ${cost} CR` : `NEED ${short} MORE`}
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
  const bandOk = Math.abs(band.lo - 0.2) < 1e-6 && Math.abs(band.hi - 1.5) < 1e-9 && band.lines.length === 39;
  /* the published §4 table: 3a/4c, 3a/6c, 3a/8c with no powers; 2a with a tool */
  const taughtPublished: Record<number, number[]> = { 4: [3, 2, 2, 2], 6: [3, 2, 2, 2], 8: [3, 2, 2, 2] };
  const taughtOk = ([1, 2, 3] as const).every((room) =>
    POWER_STATES.every((st, i) => taughtLine(ROOM[room].bed, st.gain, st.bunch).actions === taughtPublished[ROOM[room].bed][i]),
  );
  const ceilingOk = ([1, 2, 3] as const).every((room) => cutPays(ROOM[room].bed) === ROOM[room].bed);
  const rhythm: Array<{ name: string; rates: number[]; best: number }> = POWER_STATES.map((st) => {
    const rates = [1, 2, 3].map((n) => {
      const c = rhythmCycle(8, st.gain, st.bunch, n);
      return c ? c.actions / c.credits : Number.POSITIVE_INFINITY;
    });
    const best = rates.indexOf(Math.min(...rates)) + 1;
    return { name: st.name, rates, best };
  });
  return (
    <section className="border-2 border-amber-500/30 bg-black/30 p-4" data-testid="loop-panel">
      <h2 className="font-pixel text-[10px] text-amber-300">
        THE LOOP — PLANT → THE BED → CUT → CREDITS → THE PRICE LIST → A BIGGER BED
      </h2>
      <div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr]">
        <StageCard
          title="INPUTS"
          accent="text-cyan-300"
          lines={[
            "Player actions only — no clock, no timer",
            "Plants, put there by PLANT (+1 an action, free, unlimited)",
            "The decision at each action: plant, or cut now",
            "Seed: THE WINDOW BOX (bed 4) · 0 plants · 0 credits · no tools",
          ]}
        />
        <Arrow />
        <StageCard
          title="TRANSFORMATION"
          accent="text-amber-300"
          lines={[
            "PLANT: pl = min(pl + k, bed), k ≤ gain (1 / 2) — refused plants are not created",
            "CUT: credits += pl, read BEFORE the bunch leaves; then pl −= 2 (P2: − 1)",
            "A cut pays at most the bed's size: 4 / 6 / 8",
            "Zero random variables: an integer map end to end",
          ]}
        />
        <Arrow />
        <StageCard
          title="OUTPUTS"
          accent="text-amber-200"
          lines={[
            "CREDITS into the stall's takings",
            "A bed two plants lighter — the next plant's job",
            "A cut pays one credit per plant standing",
            "Ceiling = the bed's size, with every tool on",
          ]}
        />
        <Arrow />
        <StageCard
          title="REINVESTMENT"
          accent="text-pink-300"
          lines={[
            "Credits buy the bed's kit: a bigger bed, a bigger can, sharper shears, a label, a compost bin",
            "New beds add size, not rates: cap/3 credits an action on all three",
            "Two unbounded sinks: THE MARKET STALL 3 CR · A BUNDLE 4 plants",
          ]}
        />
      </div>
      <div className="mt-3 grid gap-2 md:grid-cols-2">
        <div className="border-2 border-amber-500/20 bg-black/20 p-3">
          <p className="font-pixel text-[9px] text-amber-300">THE BEDS — WHAT A CUT IS</p>
          <table className="mt-2 w-full text-left text-[9px] text-amber-100/70">
            <thead className="text-amber-100/40">
              <tr>
                <th className="py-1">BED</th>
                <th>BUNCH</th>
                <th>CREDITS A CUT</th>
                <th>CEILING</th>
              </tr>
            </thead>
            <tbody>
              {([1, 2, 3] as const).map((r) => (
                <tr key={r}>
                  <td className="py-1">{ROOM[r].bed}</td>
                  <td>{BUNCH}</td>
                  <td>{ROOM[r].bed} (a full bed)</td>
                  <td>{ROOM[r].bed} CR · cost {ROOM[r].cost === 0 ? "seed" : `${ROOM[r].cost} CR`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-2 border-amber-500/20 bg-black/20 p-3">
          <p className="font-pixel text-[9px] text-amber-300">THE THREE PUBLISHED LINES — PER CYCLE</p>
          <table className="mt-2 w-full text-left text-[9px] text-amber-100/70">
            <thead className="text-amber-100/40">
              <tr>
                <th className="py-1">BED</th>
                <th>TAUGHT (CUT FROM FULL)</th>
                <th>THIN (CUT AT 2)</th>
                <th>EMPTY (CUT IT DOWN)</th>
              </tr>
            </thead>
            <tbody>
              {([1, 2, 3] as const).map((r) => {
                const bed = ROOM[r].bed;
                const t = taughtLine(bed, 1, BUNCH);
                const th = thinLine(1, BUNCH);
                const e = emptyLine(bed, 1, BUNCH);
                return (
                  <tr key={r}>
                    <td className="py-1">{bed}</td>
                    <td>
                      {t.actions}a · {t.credits}c · {(t.actions / t.credits).toFixed(2)}
                    </td>
                    <td>
                      {th.actions}a · {th.credits}c · {(th.actions / th.credits).toFixed(2)}
                    </td>
                    <td>
                      {e.actions}a · {e.credits}c · {(e.actions / e.credits).toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="mt-2 text-[9px] text-amber-100/50">
            Band: 0.20 to 1.50 player actions per credit over 39 machine-checked lines. The thin line costs the same 3
            actions on every bed and pays 2 credits — the whole price of impatience, in one row.
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
              <td className="py-1">P1 THE WATERING CAN</td>
              <td>{P1_COST} CR</td>
              <td>PLANT up to 2 an action</td>
              <td>a cycle 3 actions → 2, paying 4 / 6 / 8, unchanged</td>
            </tr>
            <tr>
              <td className="py-1">P2 THE SHARP SHEARS</td>
              <td>{P2_COST} CR</td>
              <td>a bunch takes 1 plant</td>
              <td>a cycle 3 actions → 2, same credits</td>
            </tr>
            <tr>
              <td className="py-1">P3 THE PLANT LABEL</td>
              <td>{P3_COST} CR</td>
              <td>prints bed, bunch and the live payout</td>
              <td>zero units — all published numbers</td>
            </tr>
            <tr>
              <td className="py-1">P4 THE COMPOST BIN</td>
              <td>{P4_COST} CR a use</td>
              <td>one plant, no action</td>
              <td>zero credits — 5 CR for a plant that adds one credit to a cut</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="mt-3 grid gap-2 md:grid-cols-2">
        <div className="border-2 border-amber-500/20 bg-black/20 p-3">
          <p className="font-pixel text-[9px] text-amber-300">THE PRICE LIST — {FINITE_TABLE} CREDITS, FINITE</p>
          <ul className="mt-2 space-y-1 text-[9px] text-amber-100/70">
            <li>P4 THE COMPOST BIN — {P4_COST} CR a use</li>
            <li>P3 THE PLANT LABEL — {P3_COST} CR</li>
            <li>P1 THE WATERING CAN — {P1_COST} CR</li>
            <li>BED 2 — {ROOM[2].cost} CR</li>
            <li>P2 THE SHARP SHEARS — {P2_COST} CR</li>
            <li>BED 3 — {ROOM[3].cost} CR</li>
            <li>THE MARKET STALL {STALL_COST} CR · A BUNDLE {BUNDLE_PL} plants — all unbounded</li>
          </ul>
          <p className="mt-2 text-[9px] text-amber-100/50">
            Taught line: 28.2 cycles / 85 actions to own everything. Thin line: 56.5 cycles / 170 actions — nothing is
            lost by playing it except actions.
          </p>
        </div>
        <div className="border-2 border-amber-500/20 bg-black/20 p-3">
          <p className="font-pixel text-[9px] text-amber-300">CONSERVATION — PLANTED = CUT</p>
          <p className="mt-2 text-[9px] leading-relaxed text-amber-100/70">
            Plants are created only by PLANT and destroyed only by a cut or a bundle, so every closed cycle obeys
            planted = cut + (end bed − start bed), exactly — to the unit, on every bed and every power state. Credits
            are capped at the bed's size a cut and every credit has a sink: the price list, the market stall, the
            compost bin.
          </p>
          <p className="mt-2 text-[9px] leading-relaxed text-amber-300">
            THE BED WAITS — NO NUMBER HERE CHANGES WHILE THIS TAB IS CLOSED.
          </p>
          <p className="mt-1 text-[9px] leading-relaxed text-amber-300">
            NOTHING HERE CONVERTS TO MONEY; NO PURCHASES EXIST IN THIS GAME.
          </p>
        </div>
      </div>
      <div className="mt-3 border-2 border-amber-500/20 bg-black/20 p-3">
        <p className="font-pixel text-[9px] text-amber-300">HOW MANY BUNCHES A REFILL? — EVERY SIMPLE CYCLE, GREENHOUSE (8)</p>
        <table className="mt-2 w-full text-left text-[9px] text-amber-100/70">
          <thead className="text-amber-100/40">
            <tr>
              <th className="py-1">STATE</th>
              <th>n=1</th>
              <th>n=2</th>
              <th>n=3</th>
              <th>BEST</th>
            </tr>
          </thead>
          <tbody>
            {rhythm.map((row) => (
              <tr key={row.name}>
                <td className="py-1">{row.name}</td>
                {row.rates.map((r, i) => (
                  <td key={i} className={i + 1 === row.best ? "text-lime-300" : undefined}>
                    {r.toFixed(2)}
                  </td>
                ))}
                <td className="text-lime-300">n={row.best}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-[9px] text-amber-100/50">
          With no tools, or with either tool alone, one bunch a refill is exactly optimal. With both tools the best
          rhythm is two bunches a refill (0.20 against 0.25) — published here rather than hidden, and the ceiling does
          not move: a cut still pays the plants standing, capped by the bed's size.
        </p>
      </div>
      {/* the balance band, recomputed live in this browser */}
      <div data-testid="balance-check" className="mt-3 border-2 border-lime-600/40 bg-lime-950/20 p-3">
        <p className="font-pixel text-[9px] text-lime-300">
          BALANCE BAND RE-CHECKED IN THIS BROWSER — {bandOk && taughtOk && ceilingOk ? "ALL GREEN" : "MISMATCH"}
        </p>
        <p className="mt-2 font-pixel text-[9px] text-lime-200">
          BAND {band.lo.toFixed(2)} .. {band.hi.toFixed(2)} ACTIONS PER CREDIT · {band.lines.length} LINES · PUBLISHED
          0.20 .. 1.50 · 39 LINES
        </p>
        <p className="mt-1 text-[9px] leading-relaxed text-lime-100/70">
          Recomputed from the constants on this page: the 12 taught lines (3 beds × 4 power states) {taughtOk ? "match" : "DO NOT match"}{" "}
          the published table (3 actions without tools, 2 with either), a cut pays exactly the plants standing so the
          ceiling is the bed's size {ceilingOk ? "(4 / 6 / 8 credits a cut with every tool on)" : "(FAILS)"}, the thin
          line is 1.50, the empty lines are 1.00 / 0.75 / 0.60, and the exhaustive cycle search finds 0.20 on the
          greenhouse with both tools. Same numbers as checks.py: 13 asserts green.
        </p>
        <p className="mt-1 text-[9px] text-lime-100/50">
          IN THIS SAVE: {ROOM[meta.room].name} · BED {meta.pl}/{bedOf(meta.room)} · CREDITS {meta.cr} · π{" "}
          {piValue(meta.cr)} · BUNCH {bunchOf(meta.shears)} · {meta.can ? "CAN" : "NO CAN"} ·{" "}
          {meta.shears ? "SHEARS" : "NO SHEARS"} · {meta.label ? "LABEL" : "NO LABEL"}
        </p>
      </div>
    </section>
  );
}
