import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { PiScaleBadge } from "~/components/pi-scale-badge";

/* ============================================================================
 * PAPER AIRPLANE — WINDWARD — a playable closed-loop demo (The Gaming Layer)
 *
 * Every number here is the design's constants block (paper-airplane-design.md,
 * /home/team/shared/paper-airplane-design.md — copied, not re-derived):
 *   Fold costs : DART 0 SH (free forever — anti-lockout) · GLIDER 4 SH
 *                · KITE 8 SH; sheets leave stock AT THE THROW
 *   Transform  : reach = base + aim(0..10) − max(0, gust − MILL HAND)
 *                base = glide + (rides ? columns × lift : 0), ×1.25 floored
 *                with SQUALL FOLD
 *   Gust       : C1/C2 0·3·6 · C3 0·4·8 · C4 0·5·10, drawn uniformly from the
 *                band on a save-backed counter (gustIndex), announced before
 *                the throw, printed after the landing, kept 20 deep in the
 *                export. SECOND PRESS re-rolls the throw, never the wind.
 *   Payout     : PAY_SH +1/+3/+7/+12/+18 · PAY_MD 0/+1/+2/+4/+6, a lookup on
 *                grade (SHORT..PAD 4), identical on every course, banked the
 *                instant the plane lands. The ladder's top IS the ceiling.
 *   Sinks      : fold costs · baling order 8 SH/bale (unbounded, badge /10)
 *                · bench plates 5 MD (unbounded, badge /10) · course unlocks
 *                10/24/48 MD · re-chart 3 MD · SECOND PRESS 4 MD (only when
 *                actually taken)
 *   Powers     : F1 MILL HAND 6/18 MD (2 ranks, −1 yd headwind each)
 *                F2 SQUALL FOLD 12 MD (base ×1.25, floored)
 *                F3 SECOND PRESS 4 MD (one retry, same wind, better pays)
 *                F4 WIND CHART 10 MD (exact gust before the throw)
 * No purchases, no ads, no accounts, no network, no clock: the landing ends
 * the flight. Meta persists in localStorage only (paperairplane.save.v1).
 * ==========================================================================*/

type Phase = "start" | "bench" | "aim" | "flight" | "landing";
type FoldId = "DART" | "GLIDER" | "KITE";

interface Meta {
  saveVersion: 1;
  sh: number;
  md: number;
  mdBurned: number;
  courses: number[];
  chartIndex: Record<number, number>;
  millHand: 0 | 1 | 2;
  squallFold: boolean;
  windChart: boolean;
  bales: number;
  plates: number;
  badges: string[];
  gustIndex: number;
  gustHistory: number[];
  stats: {
    flights: number;
    bestReach: number;
    bestGrade: number;
    farBalers: number;
    secondPresses: number;
    shortLandings: number;
  };
}

interface Flight {
  course: number;
  fold: FoldId;
  gust: number | null; // drawn once per flight at throw (earlier if WIND CHART)
  retried: boolean;
  landed: boolean;
  aim: number;
  effGust: number;
  base: number;
  reach: number;
  grade: number;
  paySh: number; // this throw's gross ladder payout
  payMd: number;
  addedSh: number; // actually banked at THIS landing (delta on a retry)
  addedMd: number;
  priorPaySh: number; // first landing's payout, for the better-of-two rule
  priorPayMd: number;
}

interface ThrowLedger {
  course: number;
  fold: FoldId;
  base: number;
  aim: number;
  effGust: number;
  reach: number;
  grade: number;
  retried: boolean;
}

/* ----------------------------- constants ---------------------------------- */
/* Copied verbatim from paper-airplane-design.md » BUILD NOTES.               */

const SAVE_KEY = "paperairplane.save.v1";

const FOLD = {
  DART: { glide: 20, rides: false, cost: 0 }, // free forever — the anti-lockout fold
  GLIDER: { glide: 32, rides: true, cost: 4 },
  KITE: { glide: 40, rides: true, cost: 8 },
} as const;

const AIM_MAX = 10; // exact integer, shown on screen before and after the throw
const SQUALL_MULT = 1.25; // F2: floor(base * 1.25)
const HAND_MAX = 2; // F1: 2 ranks, -1 yard of headwind each
const SECOND_PRESS = 4; // F3: MD, charged only when the retry is actually taken
const WIND_CHART = 10; // F4: MD, one rank
const MILL_HAND_COST = [6, 18]; // MD, rank 1 then rank 2

// one row per course chart
const COURSE = {
  1: { name: "MILL YARD", pads: [16, 32, 46, 58], gust: [0, 3, 6], columns: 2, lift: 6, cost: 0 },
  2: { name: "HARBOUR FLAT", pads: [12, 32, 42, 58], gust: [0, 3, 6], columns: 1, lift: 8, cost: 10 },
  3: { name: "RIDGE LINE", pads: [18, 34, 46, 64], gust: [0, 4, 8], columns: 3, lift: 5, cost: 24 },
  4: { name: "NIGHT RUN", pads: [20, 38, 56, 72], gust: [0, 5, 10], columns: 2, lift: 8, cost: 48 },
} as const;

const PAY_SH = [1, 3, 7, 12, 18]; // index 0 = SHORT, 1..4 = PAD 1..4 — IDENTICAL ON EVERY COURSE
const PAY_MD = [0, 1, 2, 4, 6]; // ditto. The lookup on grade IS the ceiling; never compute a
//                                    payout from reach, or the ladder's cap stops being structural.

const BALE_SH = 8; // unbounded sheet sink: 8 SH -> one bale, badge every 10
const PLATE_MD = 5; // unbounded MD sink: 5 MD -> one bench plate, badge every 10
const RECHART_MD = 3; // repeatable
const GUST_KEEP = 20; // gust values kept in the save for audit

const SEED = {
  sh: 0,
  md: 0,
  courses: [1],
  chartIndex: { 1: 0 },
  millHand: 0,
  squallFold: false,
  windChart: false,
  bales: 0,
  plates: 0,
  badges: [] as string[],
  gustIndex: 0,
  gustHistory: [] as number[],
};

/* Geometry, on a 320×240 field (design BUILD NOTES).                        */
const FIELD_W = 320;
const FIELD_H = 240;
const GROUND_Y = 208;
const FLIGHT_MS = 2400; // 2.4 s quadratic arc from the rail to the landing x
const AIM_SWEEP_UPS = 12; // marker speed, units/second (a 0→10→0 sweep in 1.67 s)

const X = (reach: number) => 20 + reach * 3.4; // landing x for a reach in yards
const PAD_X = (c: number, pad: number) => X(courseOf(c).pads[pad - 1]);

// Draft column x positions (design: always before the nearest baler)
const DRAFT_X: Record<number, number[]> = { 1: [36, 58], 2: [44], 3: [30, 46, 62], 4: [34, 56] };

const GRADE_NAME = ["SHORT", "PAD 1", "PAD 2", "PAD 3", "PAD 4"];
const BALE_NAME = ["THE YARD", "COURT", "RUN", "RIDGE", "FAR"]; // 0 unused; PAD n — <name> BALE

// 4-colour palette: cream paper, ink, mill grey, one accent
const PAL = {
  paper: "#f2e3bd",
  paperDim: "#b8a67c",
  ink: "#0e1116",
  inkHi: "#141a22",
  grey: "#9aa0a8",
  greyDim: "#4c545e",
  accent: "#fbbf24",
  accentDim: "#7a5c14",
};

/* ------------------------------ model ------------------------------------- */

function courseOf(c: number): (typeof COURSE)[keyof typeof COURSE] {
  return COURSE[c as keyof typeof COURSE];
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

// base(fold, course) = FOLD[fold].glide + (rides ? columns * lift : 0),
// then × 1.25 floored if squallFold (design BUILD NOTES formula, verbatim).
function baseReach(f: FoldId, c: number, squall: boolean): number {
  const fold = FOLD[f];
  const base = fold.glide + (fold.rides ? courseOf(c).columns * courseOf(c).lift : 0);
  return squall ? Math.floor(base * SQUALL_MULT) : base;
}

function headwind(gust: number, hand: number): number {
  return Math.max(0, gust - hand); // F1: -1 yard per rank, never below 0
}

// reach = base + aim − max(0, gust − millHand)
function reachOf(f: FoldId, c: number, aim: number, gust: number, squall: boolean, hand: number): number {
  return baseReach(f, c, squall) + aim - headwind(gust, hand);
}

// grade = last index i where reach ≥ pads[i], else 0 (SHORT). Returns 0..4.
function gradeOf(c: number, reach: number): number {
  let g = 0;
  for (const p of courseOf(c).pads) if (reach >= p) g += 1;
  return g;
}

// Uniform draw from the course's published three-value band, on a counter
// stored in the save: the same (course, gustIndex) always draws the same
// value, so the whole sequence is auditable from the export (design A3/L8).
function drawGust(c: number, gustIndex: number): number {
  const band = courseOf(c).gust;
  return band[gustIndex % band.length];
}

function devLockoutCheck(): void {
  // MUST item 6: dev-only assert that the loop can never be locked out.
  if (!import.meta.env.DEV) return;
  if (FOLD.DART.cost !== 0) throw new Error("design: DART fold cost must be 0");
  for (const c of [1, 2, 3, 4]) {
    const worst = reachOf("DART", c, 0, Math.max(...courseOf(c).gust), false, 0);
    if (PAY_SH[gradeOf(c, worst)] < 1) {
      throw new Error(`design: DART worst-gust payout on course ${c} must be >= 1 SH`);
    }
    const best = reachOf("DART", c, AIM_MAX, 0, false, 0);
    if (gradeOf(c, best) > 1) throw new Error(`design: free DART must never reach PAD 2 (course ${c})`);
  }
  // eslint-disable-next-line no-console
  console.log("[windward] dev lockout check passed: DART 0 SH, worst payout >= +1 SH on every course");
}

const SEED_META: Meta = {
  saveVersion: 1,
  sh: SEED.sh,
  md: SEED.md,
  mdBurned: 0,
  courses: [...SEED.courses],
  chartIndex: { ...SEED.chartIndex },
  millHand: 0,
  squallFold: false,
  windChart: false,
  bales: 0,
  plates: 0,
  badges: [],
  gustIndex: 0,
  gustHistory: [],
  stats: { flights: 0, bestReach: 0, bestGrade: 0, farBalers: 0, secondPresses: 0, shortLandings: 0 },
};

function loadMeta(): Meta {
  if (typeof window === "undefined") return SEED_META;
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return SEED_META;
    const parsed = JSON.parse(raw) as Partial<Meta>;
    if (typeof parsed.sh !== "number") return SEED_META;
    return {
      ...SEED_META,
      ...parsed,
      courses: Array.isArray(parsed.courses) && parsed.courses.length ? parsed.courses : [1],
      chartIndex: { ...SEED_META.chartIndex, ...(parsed.chartIndex ?? {}) },
      badges: Array.isArray(parsed.badges) ? parsed.badges : [],
      gustHistory: Array.isArray(parsed.gustHistory) ? parsed.gustHistory.slice(-GUST_KEEP) : [],
      stats: { ...SEED_META.stats, ...(parsed.stats ?? {}) },
    };
  } catch {
    return SEED_META;
  }
}

function exportSave(meta: Meta, filename: string) {
  // Documented schema (design B2): a stranger can audit gustHistory.
  const payload = {
    saveVersion: meta.saveVersion,
    sh: meta.sh,
    md: meta.md,
    mdBurned: meta.mdBurned,
    courses: [...meta.courses],
    chartIndex: { ...meta.chartIndex },
    skills: { millHand: meta.millHand, squallFold: meta.squallFold, windChart: meta.windChart },
    bales: meta.bales,
    plates: meta.plates,
    badges: [...meta.badges],
    gustIndex: meta.gustIndex,
    gustHistory: [...meta.gustHistory],
    stats: { ...meta.stats },
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Defer the revoke: revoking synchronously right after click() can race the
  // browser's download start and abort the file (blob: URLs).
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ------------------------------ route ------------------------------------- */

export const Route = createFileRoute("/paper-airplane")({
  component: PaperAirplane,
});

function PaperAirplane() {
  const [meta, setMeta] = useState<Meta>(SEED_META);
  const [hydrated, setHydrated] = useState(false);
  const [phase, setPhase] = useState<Phase>("start");
  const [tick, setTick] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState(1);
  const [fold, setFold] = useState<FoldId>("DART");
  const [confirmReset, setConfirmReset] = useState(false);
  const [ledger, setLedger] = useState<ThrowLedger | null>(null); // permanent flight ledger
  const [payoutLine, setPayoutLine] = useState<string | null>(null);
  const [gustValue, setGustValue] = useState<string | null>(null);
  const [retryEligible, setRetryEligible] = useState(false);
  const [bankedThis, setBankedThis] = useState<{ sh: number; md: number } | null>(null);
  const [aimDisp, setAimDisp] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const noticeTimer = useRef<number | null>(null);
  const metaRef = useRef<Meta>(meta);
  const phaseRef = useRef<Phase>(phase);
  const courseRef = useRef(selectedCourse);
  const foldRef = useRef<FoldId>(fold);
  const flightRef = useRef<Flight | null>(null);
  const aimRef = useRef({ t: 0, value: 0, disp: 0 });
  const dispRef = useRef(0);
  const flightStartRef = useRef(0);
  metaRef.current = meta;
  phaseRef.current = phase;
  courseRef.current = selectedCourse;
  foldRef.current = fold;

  const flash = (msg: string) => {
    setNotice(msg);
    if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(null), 1800);
  };

  /* persistence */
  useEffect(() => {
    const m = loadMeta();
    setMeta(m);
    setSelectedCourse(Math.max(...m.courses));
    devLockoutCheck();
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(SAVE_KEY, JSON.stringify(meta));
    } catch {
      /* storage unavailable — the demo still works, it just won't persist */
    }
  }, [meta, hydrated]);

  /* ------------------------- spend + earn helpers ------------------------ */

  const unlockCourse = (c: number) => {
    const cost = courseOf(c).cost;
    const m = metaRef.current;
    if (m.courses.includes(c)) return;
    if (m.md < cost) {
      flash(`COURSE ${c} ${courseOf(c).name} NEEDS ${cost} MD  (have ${m.md})`);
      return;
    }
    setMeta((mm) =>
      mm.courses.includes(c) || mm.md < cost
        ? mm
        : {
            ...mm,
            md: mm.md - cost,
            mdBurned: mm.mdBurned + cost,
            courses: [...mm.courses, c].sort((a, b) => a - b),
            chartIndex: { ...mm.chartIndex, [c]: 0 },
          },
    );
    setSelectedCourse((prev) => (prev === c ? prev : Math.max(prev, c)));
    flash(`COURSE ${c} — ${courseOf(c).name} UNLOCKED`);
  };

  const buyMillHand = () => {
    const m = metaRef.current;
    if (m.millHand >= HAND_MAX) return;
    const cost = MILL_HAND_COST[m.millHand];
    if (m.md < cost) {
      flash(`MILL HAND R${m.millHand + 1} NEEDS ${cost} MD  (have ${m.md})`);
      return;
    }
    setMeta((mm) => {
      if (mm.millHand >= HAND_MAX || mm.md < MILL_HAND_COST[mm.millHand]) return mm;
      const costNow = MILL_HAND_COST[mm.millHand];
      return { ...mm, md: mm.md - costNow, mdBurned: mm.mdBurned + costNow, millHand: (mm.millHand + 1) as 1 | 2 };
    });
    flash(`MILL HAND RANK ${m.millHand + 1} — HEADWIND −${m.millHand + 1} YD`);
  };

  const buySquallFold = () => {
    const m = metaRef.current;
    if (m.squallFold) return;
    if (m.md < 12) {
      flash(`SQUALL FOLD NEEDS 12 MD  (have ${m.md})`);
      return;
    }
    setMeta((mm) => (mm.squallFold || mm.md < 12 ? mm : { ...mm, md: mm.md - 12, mdBurned: mm.mdBurned + 12, squallFold: true }));
    flash("SQUALL FOLD — BASE REACH ×1.25 (FLOORED)");
  };

  const buyWindChart = () => {
    const m = metaRef.current;
    if (m.windChart) return;
    if (m.md < WIND_CHART) {
      flash(`WIND CHART NEEDS ${WIND_CHART} MD  (have ${m.md})`);
      return;
    }
    setMeta((mm) =>
      mm.windChart || mm.md < WIND_CHART ? mm : { ...mm, md: mm.md - WIND_CHART, mdBurned: mm.mdBurned + WIND_CHART, windChart: true },
    );
    flash("WIND CHART — THE EXACT GUST SHOWS BEFORE EVERY THROW");
  };

  const pressBale = () => {
    const m = metaRef.current;
    if (m.sh < BALE_SH) {
      flash(`BALING ORDER NEEDS ${BALE_SH} SH  (have ${m.sh})`);
      return;
    }
    setMeta((mm) => {
      if (mm.sh < BALE_SH) return mm;
      const next = mm.bales + 1;
      const badges = [...mm.badges];
      if (next % 10 === 0) badges.push(`BALE STENCIL — ${next} BALES`);
      return { ...mm, sh: mm.sh - BALE_SH, bales: next, badges };
    });
    flash(`BALE PRESSED #${m.bales + 1} — 8 SH SPENT`);
  };

  const benchPlate = () => {
    const m = metaRef.current;
    if (m.md < PLATE_MD) {
      flash(`BENCH PLATE NEEDS ${PLATE_MD} MD  (have ${m.md})`);
      return;
    }
    setMeta((mm) => {
      if (mm.md < PLATE_MD) return mm;
      const next = mm.plates + 1;
      const badges = [...mm.badges];
      if (next % 10 === 0) badges.push(`BENCH PLATE — ${next} PLATES`);
      return { ...mm, md: mm.md - PLATE_MD, mdBurned: mm.mdBurned + PLATE_MD, plates: next, badges };
    });
    flash(`BENCH PLATE ENGRAVED #${m.plates + 1} — 5 MD SPENT`);
  };

  const reChart = () => {
    const m = metaRef.current;
    if (m.md < RECHART_MD) {
      flash(`RE-CHART NEEDS ${RECHART_MD} MD  (have ${m.md})`);
      return;
    }
    setMeta((mm) => {
      if (mm.md < RECHART_MD) return mm;
      const index = (mm.chartIndex[selectedCourse] ?? 0) + 1;
      return { ...mm, md: mm.md - RECHART_MD, mdBurned: mm.mdBurned + RECHART_MD, chartIndex: { ...mm.chartIndex, [selectedCourse]: index } };
    });
    const next = (m.chartIndex[selectedCourse] ?? 0) + 1;
    flash(`CHART ${next + 1} FOR COURSE ${selectedCourse} QUEUED — 3 MD SPENT`);
  };

  /* --------------------------- flight lifecycle -------------------------- */

  const toBench = () => {
    setPhase("bench");
    setNotice(null);
  };

  const enterRail = () => {
    flightRef.current = {
      course: selectedCourse,
      fold,
      gust: null,
      retried: false,
      landed: false,
      aim: 0,
      effGust: 0,
      base: 0,
      reach: 0,
      grade: 0,
      paySh: 0,
      payMd: 0,
      addedSh: 0,
      addedMd: 0,
      priorPaySh: 0,
      priorPayMd: 0,
    };
    aimRef.current = { t: 0, value: 0, disp: 0 };
    dispRef.current = 0;
    setAimDisp(0);
    setPayoutLine(null);
    setGustValue(null);
    setRetryEligible(false);
    setBankedThis(null);
    setPhase("aim");
    setTick((t) => t + 1);
  };

  const throwNow = () => {
    if (phaseRef.current !== "aim") return;
    const f = flightRef.current;
    if (!f || f.landed) return;
    const m = metaRef.current;
    const cost = FOLD[f.fold].cost;
    if (m.sh < cost) {
      flash(`${f.fold} NEEDS ${cost} SH  (have ${m.sh})`);
      return;
    }
    // One gust per flight, drawn at the throw on the save-backed counter —
    // unless WIND CHART revealed it earlier (same deterministic value).
    let gust = f.gust;
    if (gust === null) {
      gust = drawGust(f.course, m.gustIndex);
      f.gust = gust;
      setMeta((mm) => ({
        ...mm,
        gustIndex: mm.gustIndex + 1,
        gustHistory: [...mm.gustHistory, gust as number].slice(-GUST_KEEP),
      }));
    }
    const aim = aimRef.current.disp;
    // Reach and grade are decided here — the arithmetic is all published,
    // so the flight animation can fly to the true landing x (design: the
    // landing x comes from reach × 3.4, never from physics).
    f.base = baseReach(f.fold, f.course, m.squallFold);
    f.effGust = headwind(gust, m.millHand);
    f.reach = f.base + aim - f.effGust;
    f.grade = gradeOf(f.course, f.reach);
    f.paySh = PAY_SH[f.grade];
    f.payMd = PAY_MD[f.grade];
    f.aim = aim;
    // Sheets leave the stock at the throw (changing folds before this costs nothing).
    setMeta((mm) => ({ ...mm, sh: mm.sh - cost }));
    flightStartRef.current = performance.now();
    setPhase("flight");
    setTick((t) => t + 1);
  };

  const bankLanding = () => {
    const f = flightRef.current;
    if (!f || f.landed) return;
    f.landed = true;
    // SECOND PRESS: the flight pays the better of the two landings — the
    // amount banked at a retry landing is the delta over the first.
    let addSh: number;
    let addMd: number;
    if (f.retried) {
      addSh = f.paySh > f.priorPaySh ? f.paySh - f.priorPaySh : 0;
      addMd = f.payMd > f.priorPayMd ? f.payMd - f.priorPayMd : 0;
    } else {
      addSh = f.paySh;
      addMd = f.payMd;
      f.priorPaySh = f.paySh;
      f.priorPayMd = f.payMd;
    }
    f.addedSh = addSh;
    f.addedMd = addMd;
    // Banked the instant the plane lands — never batched to a session end (L2).
    setMeta((mm) => ({
      ...mm,
      sh: mm.sh + addSh,
      md: mm.md + addMd,
      stats: {
        flights: mm.stats.flights + 1,
        bestReach: Math.max(mm.stats.bestReach, f.reach),
        bestGrade: Math.max(mm.stats.bestGrade, f.grade),
        farBalers: mm.stats.farBalers + (f.grade === 4 ? 1 : 0),
        secondPresses: mm.stats.secondPresses, // incremented when the press is taken
        shortLandings: mm.stats.shortLandings + (f.grade === 0 ? 1 : 0),
      },
    }));
    setLedger({
      course: f.course,
      fold: f.fold,
      base: f.base,
      aim: f.aim,
      effGust: f.effGust,
      reach: f.reach,
      grade: f.grade,
      retried: f.retried,
    });
    setBankedThis({ sh: addSh, md: addMd });
    setPayoutLine(
      f.grade === 0
        ? `SHORT — THE YARD · SH +${f.paySh} · MD +${f.payMd}`
        : `PAD ${f.grade} — ${BALE_NAME[f.grade]} BALE · SH +${f.paySh} · MD +${f.payMd}`,
    );
    setGustValue(`GUST DRAWN: ${f.gust} (BAND ${courseOf(f.course).gust.join("/")})`);
    // SECOND PRESS appears when the landing is below what this fold + wind
    // could pay with a 10 aim — the best grade this flight can reach.
    const bestGradeAim10 = gradeOf(f.course, f.base + AIM_MAX - f.effGust);
    setRetryEligible(!f.retried && f.grade < bestGradeAim10);
    setPhase("landing");
    setTick((t) => t + 1);
  };

  const takeSecondPress = () => {
    const f = flightRef.current;
    if (!f || f.landed || f.retried) return;
    const m = metaRef.current;
    if (m.md < SECOND_PRESS) {
      flash(`SECOND PRESS NEEDS ${SECOND_PRESS} MD  (have ${m.md})`);
      return;
    }
    setMeta((mm) => {
      if (mm.md < SECOND_PRESS) return mm;
      return {
        ...mm,
        md: mm.md - SECOND_PRESS,
        mdBurned: mm.mdBurned + SECOND_PRESS,
        stats: { ...mm.stats, secondPresses: mm.stats.secondPresses + 1 },
      };
    });
    f.retried = true;
    f.landed = false; // the retry is a new landing of the same flight
    aimRef.current = { t: 0, value: 0, disp: 0 };
    dispRef.current = 0;
    setAimDisp(0);
    setRetryEligible(false);
    setPayoutLine(null);
    setBankedThis(null);
    flash(`SECOND PRESS TAKEN — SAME WIND ${f.gust}, THROW AGAIN`);
    setPhase("aim");
    setTick((t) => t + 1);
  };

  const resetSave = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      window.setTimeout(() => setConfirmReset(false), 4000);
      return;
    }
    try {
      window.localStorage.removeItem(SAVE_KEY);
    } catch {
      /* ignore */
    }
    flightRef.current = null;
    setMeta(SEED_META);
    setSelectedCourse(1);
    setFold("DART");
    setPhase("start");
    setLedger(null);
    setPayoutLine(null);
    setGustValue(null);
    setRetryEligible(false);
    setBankedThis(null);
    setConfirmReset(false);
  };

  /* input: keyboard */
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === " " || e.key === "Enter") && phaseRef.current === "aim") {
        e.preventDefault();
        throwNow();
      }
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ------------------------- game loop + canvas -------------------------- */

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;
    let raf = 0;

    const drawBaler = (x: number, n: number, dim: boolean) => {
      const yTop = GROUND_Y - 16;
      ctx!.fillStyle = dim ? PAL.greyDim : PAL.grey;
      ctx!.fillRect(x - 6, yTop, 12, 2); // top bar
      ctx!.fillRect(x - 5, yTop + 2, 2, 14); // left post
      ctx!.fillRect(x + 3, yTop + 2, 2, 14); // right post
      for (let k = 0; k < 3; k += 1) {
        ctx!.fillRect(x - 5, yTop + 5 + k * 4, 8, 1); // net mesh
      }
      ctx!.fillStyle = dim ? PAL.greyDim : PAL.paper;
      ctx!.fillRect(x + 5, yTop + 12, 2, 4);
      ctx!.font = "6px 'Press Start 2P', monospace";
      ctx!.fillText(`P${n}`, x - 6, yTop - 3);
    };

    const drawPlane = (x: number, y: number, accent: string) => {
      ctx!.fillStyle = accent;
      ctx!.beginPath();
      ctx!.moveTo(x + 6, y);
      ctx!.lineTo(x - 8, y - 2);
      ctx!.lineTo(x - 4, y);
      ctx!.lineTo(x - 8, y + 2);
      ctx!.closePath();
      ctx!.fill();
      ctx!.fillStyle = PAL.ink;
      ctx!.fillRect(x - 8, y - 1, 3, 2);
    };

    const draw = (now: number) => {
      const ph = phaseRef.current;
      const c = courseRef.current;
      const course = courseOf(c);
      const m = metaRef.current;
      const f = flightRef.current;

      // sky + ground
      ctx!.fillStyle = PAL.ink;
      ctx!.fillRect(0, 0, FIELD_W, FIELD_H);
      ctx!.fillStyle = "#131a24";
      ctx!.fillRect(0, 0, FIELD_W, GROUND_Y);
      ctx!.fillStyle = "#1a1f26";
      ctx!.fillRect(0, GROUND_Y, FIELD_W, FIELD_H - GROUND_Y);
      ctx!.fillStyle = PAL.greyDim;
      ctx!.fillRect(0, GROUND_Y, FIELD_W, 2);

      // draft columns (dashed, y 40–208) — a wing rides every column it passes
      ctx!.strokeStyle = "rgba(154,160,168,0.4)";
      ctx!.setLineDash([3, 6]);
      ctx!.lineWidth = 2;
      for (const cx of DRAFT_X[c]) {
        ctx!.beginPath();
        ctx!.moveTo(cx, 40);
        ctx!.lineTo(cx, GROUND_Y);
        ctx!.stroke();
      }
      ctx!.setLineDash([]);
      ctx!.font = "6px 'Press Start 2P', monospace";
      ctx!.fillStyle = "rgba(154,160,168,0.55)";
      ctx!.fillText("DRAFT", 282, 46); // the mill's waste heat rises

      // balers at their pad thresholds
      course.pads.forEach((_, i) => {
        const beReached = f && f.grade >= i + 1;
        drawBaler(PAD_X(c, i + 1), i + 1, !!f && !beReached);
      });
      // the far net: surplus reach above PAD 4 is absorbed — never punitive
      ctx!.fillStyle = PAL.greyDim;
      for (let fx = 246; fx < 318; fx += 8) {
        ctx!.fillRect(fx, GROUND_Y - 26, 2, 26);
      }
      ctx!.fillRect(244, GROUND_Y - 28, 76, 3);
      ctx!.font = "6px 'Press Start 2P', monospace";
      ctx!.fillStyle = PAL.greyDim;
      ctx!.fillText("FAR NET", 258, GROUND_Y - 34);

      // mill wall + launch rail
      ctx!.fillStyle = PAL.grey;
      ctx!.fillRect(8, 132, 12, GROUND_Y - 132);
      ctx!.fillStyle = PAL.greyDim;
      ctx!.fillRect(8, 132, 2, GROUND_Y - 132);
      ctx!.fillRect(18, 148, 2, GROUND_Y - 148);
      ctx!.fillStyle = PAL.grey;
      ctx!.fillRect(2, 196, 30, 2); // the rail
      ctx!.fillRect(2, 196, 2, 8);
      ctx!.fillRect(30, 196, 2, 8);

      // plane
      if (ph === "flight" && f && f.gust !== null) {
        const p = Math.min((now - flightStartRef.current) / FLIGHT_MS, 1);
        const x0 = 12;
        const x1 = X(f.reach);
        const x = x0 + (x1 - x0) * p;
        let y = 198 - 36 * Math.sin(Math.PI * p);
        if (FOLD[f.fold].rides) {
          let stepped = 0;
          for (const cx of DRAFT_X[f.course]) {
            if (cx >= x0 && cx <= x1 && x >= cx) stepped += 1;
          }
          y -= 5 * stepped; // a visible lift step at each draft column crossed
        }
        // headwind streaks scroll backwards while the gust is non-zero
        if (f.gust > 0) {
          ctx!.fillStyle = "rgba(154,160,168,0.5)";
          for (let i = 0; i < 3; i += 1) {
            const sx = 340 - ((now * 0.07 + i * 113) % 340);
            ctx!.fillRect(sx, 70 + i * 42, 12, 1);
          }
        }
        drawPlane(x, Math.max(34, Math.min(y, 200)), PAL.accent);
      } else if (f && f.landed && f.gust !== null) {
        drawPlane(X(f.reach), GROUND_Y - 3, PAL.paper); // resting in the baler
      } else {
        drawPlane(12, 198, PAL.paper); // on the rail, waiting
        if (ph === "aim") {
          ctx!.fillStyle = "rgba(242,227,189,0.35)";
          ctx!.fillRect(12, 202, 2, 2);
        }
      }

      // aim meter (bottom strip y 216–232) during the aim phase
      if (ph === "aim") {
        const base = baseReach(foldRef.current, c, m.squallFold);
        ctx!.fillStyle = "#07090d";
        ctx!.fillRect(28, 213, 264, 21);
        ctx!.fillStyle = PAL.greyDim;
        ctx!.fillRect(28, 214, 264, 1);
        ctx!.fillRect(28, 233, 264, 1);
        // the bar
        ctx!.fillStyle = PAL.greyDim;
        ctx!.fillRect(40, 223, 240, 4);
        ctx!.fillStyle = PAL.grey;
        ctx!.fillRect(40, 223, 240, 1);
        // clean-line ticks: the aim each baler needs at zero gust
        course.pads.forEach((pad, i) => {
          const need = pad - base;
          const pos = 40 + (clamp(need, 0, AIM_MAX) / AIM_MAX) * 240;
          ctx!.fillStyle = need <= AIM_MAX ? PAL.accent : "rgba(251,191,36,0.3)";
          ctx!.fillRect(pos - 1, 217, 2, 13);
          ctx!.font = "6px 'Press Start 2P', monospace";
          ctx!.fillStyle = need <= AIM_MAX ? PAL.paper : PAL.greyDim;
          ctx!.fillText(`P${i + 1}`, clamp(pos - 4, 30, 268), 228);
        });
        // the sweeping marker
        const v = aimRef.current.value;
        const mx = 40 + (v / AIM_MAX) * 240;
        ctx!.fillStyle = PAL.paper;
        ctx!.fillRect(mx - 2, 216, 5, 15);
        ctx!.fillStyle = PAL.accent;
        ctx!.fillRect(mx - 1, 216, 2, 15);
      }

      // read-only snapshot for verification tooling (no gameplay effect)
      if (f && f.gust !== null) {
        (window as unknown as Record<string, unknown>).__windward = {
          phase: ph,
          course: f.course,
          courseName: course.name,
          fold: f.fold,
          aim: f.aim,
          gust: f.gust,
          reach: f.reach,
          grade: f.grade,
          retried: f.retried,
          landed: f.landed,
          sh: m.sh,
          md: m.md,
          gustIndex: m.gustIndex,
          gustHistory: m.gustHistory,
        };
      } else {
        (window as unknown as Record<string, unknown>).__windward = {
          phase: ph,
          course: c,
          courseName: course.name,
          fold: foldRef.current,
          gustIndex: m.gustIndex,
          sh: m.sh,
          md: m.md,
          aimDisp: aimRef.current.disp,
          retried: f ? f.retried : false,
          gust: f ? f.gust : null,
        };
      }
    };

    const loop = (now: number) => {
      const ph = phaseRef.current;
      if (ph === "aim" && flightRef.current && !flightRef.current.landed) {
        // marker sweeps 0→10→0 at 12 units/second — a full sweep in 1.67 s
        const t = now / 1000;
        let u = (t * AIM_SWEEP_UPS) % 20;
        if (u > 10) u = 20 - u;
        aimRef.current.value = u;
        aimRef.current.disp = Math.round(u);
        if (aimRef.current.disp !== dispRef.current) {
          dispRef.current = aimRef.current.disp;
          setAimDisp(aimRef.current.disp); // live DOM readout of the exact integer
        }
        if (aimRef.current.t === 0) aimRef.current.t = now;
      }
      if (ph === "flight" && flightRef.current && !flightRef.current.landed) {
        if (now - flightStartRef.current >= FLIGHT_MS) bankLanding();
      }
      draw(now);
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const m = meta;
  const course = courseOf(selectedCourse);
  const benchBase = baseReach(fold, selectedCourse, m.squallFold);

  /* ------------------------------ render --------------------------------- */

  return (
    <div className="min-h-dvh bg-[#0a0d12] text-amber-100" data-tick={tick}>
      <header className="flex flex-wrap items-center justify-between gap-3 border-b-4 border-amber-500/40 px-4 py-3">
        <div>
          <h1 className="font-pixel text-lg text-amber-300 drop-shadow-[3px_3px_0_rgba(0,0,0,0.9)]">
            WINDWARD
          </h1>
          <p className="text-[10px] uppercase tracking-[0.25em] text-amber-500/70">
            paper airplane · fold → throw → land · Gaming Layer demo
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/bin-runner"
            data-testid="link-to-binrunner"
            className="pixel-btn bg-neutral-900 px-3 py-2 text-[9px] text-cyan-300"
          >
            ♻ BIN RUNNER ▶
          </a>
          <a
            href="/brick-break"
            data-testid="link-to-brickbreak"
            className="pixel-btn bg-neutral-900 px-3 py-2 text-[9px] text-lime-300"
          >
            🧱 BRICK BREAK ▶
          </a>
          <a href="/" className="pixel-btn bg-neutral-900 px-3 py-2 text-[9px] text-amber-300">
            ◀ BACK
          </a>
        </div>
      </header>

      {/* the shared π display scale — the loop's own unit is untouched */}
      <PiScaleBadge units={m.sh} unit="SH" tone="amber" />

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* ------------------------- left: loop + cabinet ---------------- */}
        <div className="min-w-0">
          <LoopPanel meta={m} />
          <div className="relative mt-4 border-4 border-amber-500/50 bg-[#0d1117] p-4 shadow-[8px_8px_0_rgba(0,0,0,0.6)]">
            <div className="scanlines pointer-events-none absolute inset-0 z-10" />

            {/* HUD strip */}
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 font-pixel text-[8px] text-amber-100/80">
              <span data-testid="hud-course">
                COURSE {selectedCourse} {course.name} · CHART v{(m.chartIndex[selectedCourse] ?? 0) + 1}
              </span>
              <span data-testid="gust-band">GUST {course.gust.join("/")}</span>
              <span>
                SH <span className="text-amber-200" data-testid="meta-sh">{m.sh}</span> · MD{" "}
                <span className="text-amber-200" data-testid="meta-md">{m.md}</span> · FOLD {fold}
              </span>
            </div>
            {phase === "aim" && (
              <div className="mb-1 font-pixel text-[8px] text-amber-100/70">
                BASE {benchBase} + AIM <span data-testid="aim-value">{aimDisp}</span> − GUST{" "}
                {m.windChart ? (
                  <span className="text-amber-200" data-testid="gust-value">
                    {flightRef.current?.gust ?? drawGust(selectedCourse, m.gustIndex)}
                  </span>
                ) : (
                  course.gust.join("/")
                )}
                <span className="ml-2 text-amber-100/40">· CLEAN LINE TO EACH BALER IS ON THE METER</span>
              </div>
            )}

            <canvas
              ref={canvasRef}
              data-testid="play-field"
              width={FIELD_W}
              height={FIELD_H}
              className="w-full max-w-[588px] [image-rendering:pixelated] border-2 border-amber-500/30 bg-[#0e1116]"
            />

            {phase === "start" && (
              <StartScreen
                meta={m}
                selectedCourse={selectedCourse}
                onSelectCourse={setSelectedCourse}
                onBench={toBench}
                onExport={() => exportSave(m, "paperairplane-save.json")}
                onReset={resetSave}
                confirmReset={confirmReset}
              />
            )}
            {phase === "bench" && (
              <BenchScreen
                meta={m}
                course={selectedCourse}
                fold={fold}
                notice={notice}
                onFold={setFold}
                onRail={enterRail}
                onBack={() => setPhase("start")}
                onExport={() => exportSave(m, "paperairplane-save.json")}
                onUnlock={unlockCourse}
                onMillHand={buyMillHand}
                onSquall={buySquallFold}
                onWindChart={buyWindChart}
                onBale={pressBale}
                onPlate={benchPlate}
                onReChart={reChart}
              />
            )}
            {phase === "aim" && (
              <div className="pointer-events-none relative z-20 -mt-2 flex items-center justify-between gap-2 px-1 font-pixel text-[8px] text-amber-100/60">
                <span>SPACE / CLICK TO RELEASE — THE VALUE STOPS AT THE THROW</span>
                <button
                  data-testid="throw-btn"
                  onClick={throwNow}
                  className="pixel-btn pointer-events-auto bg-amber-300 px-4 py-2 text-[9px] text-neutral-950"
                >
                  ▶ THROW ({FOLD[fold].cost} SH)
                </button>
                <span>{FOLD[fold].rides ? "WING RIDES THE DRAFT" : "NO LIFT — A DART"}</span>
              </div>
            )}
            {phase === "flight" && (
              <div className="pointer-events-none relative z-20 -mt-4 text-center font-pixel text-[8px] text-amber-100/60">
                {flightRef.current?.gust !== null ? (
                  <span>
                    IN FLIGHT — {fold} · GUST {flightRef.current?.gust} · LANDS WHERE THE PAPER TOUCHES
                  </span>
                ) : (
                  <span>THE WIND IS UP — WATCH THE PLANE</span>
                )}
              </div>
            )}
            {phase === "landing" && (
              <LandingScreen
                ledger={ledger}
                payoutLine={payoutLine}
                gustValue={gustValue}
                banked={bankedThis}
                md={m.md}
                retryEligible={retryEligible}
                notice={notice}
                onRetry={takeSecondPress}
                onBench={toBench}
              />
            )}

            {/* permanent flight ledger — the C1 legibility line */}
            <div
              data-testid="flight-ledger"
              className="mt-2 border-2 border-amber-500/20 bg-black/40 px-2 py-2 font-pixel text-[8px] leading-relaxed text-amber-100/80"
            >
              {ledger ? (
                <>
                  <span className="text-amber-300">
                    REACH {ledger.reach} = {ledger.base} BASE + {ledger.aim} AIM − {ledger.effGust} GUST →{" "}
                    {GRADE_NAME[ledger.grade]} → SH +{PAY_SH[ledger.grade]} · MD +{PAY_MD[ledger.grade]}
                  </span>
                  {ledger.retried && (
                    <span className="ml-2 text-amber-100/50">· SECOND PRESS — BETTER OF 2 LANDINGS PAYS</span>
                  )}
                </>
              ) : (
                <span className="text-amber-100/40">FLIGHT LEDGER — THE LAST LANDING'S LINE PRINTS HERE</span>
              )}
            </div>
          </div>

          {notice && phase !== "bench" && phase !== "landing" && (
            <div className="mt-2 text-center text-[10px] text-yellow-200/90">{notice}</div>
          )}
        </div>

        {/* ------------------------- right: panels ------------------------ */}
        <aside className="flex min-w-0 flex-col gap-4">
          <Panel title="INVENTORY — IN-GAME UNITS ONLY">
            <InvRow label="SH · SHEET" value={m.sh} color="text-amber-200" />
            <InvRow label="MD · MEDALLION" value={m.md} hint={`${m.mdBurned} burned all-time`} color="text-amber-300" />
            <InvRow label="BALES PRESSED" value={m.bales} hint="8 SH each" color="text-neutral-200" />
            <InvRow label="BENCH PLATES" value={m.plates} hint="5 MD each" color="text-neutral-200" />
            <InvRow label="COURSES OPEN" value={m.courses.join(" / ")} color="text-amber-200" />
            <p className="mt-2 text-[9px] leading-relaxed text-amber-100/50">
              Nothing here converts to money. No purchases exist in this game.
              {m.badges.length > 0 ? ` · ${m.badges.join(" · ")}` : ""}
            </p>
          </Panel>

          <Panel title="THE WIND — L8: DISCLOSED, HONEST, HEDGEABLE">
            <ul className="space-y-1 text-[10px] leading-relaxed text-amber-100/80">
              {[1, 2, 3, 4].map((c) => (
                <li key={c}>
                  · COURSE {c} {courseOf(c).name}: band {courseOf(c).gust.join("/")} — announced before, printed
                  after
                </li>
              ))}
              <li>· Drawn uniformly on a counter (gustIndex {m.gustIndex}) stored in the save.</li>
              <li>
                · Last {Math.min(GUST_KEEP, m.gustHistory.length)} drawn:{" "}
                <span className="font-pixel text-[8px] text-amber-200">
                  {m.gustHistory.length ? m.gustHistory.join(" · ") : "— none yet"}
                </span>
              </li>
              <li>· Never sold: no calmer wind, no forecast, no retry, no extra throw is for sale (D2).</li>
              <li>· WIND CHART (earned, 10 MD) reveals the exact value early; SECOND PRESS re-rolls the throw, never the wind.</li>
            </ul>
          </Panel>

          <Panel title="POWERS — ALL EARNED WITH MD, ALL CAPPED">
            <ul className="space-y-1 text-[10px] leading-relaxed text-amber-100/80">
              <li>
                F1 MILL HAND — {m.millHand}/{HAND_MAX} RANKS · −{m.millHand} YD HEADWIND
                {m.millHand === 0 ? " · 6 / 18 MD" : m.millHand === 1 ? " · NEXT 18 MD" : " · MAX"}
              </li>
              <li>
                F2 SQUALL FOLD — {m.squallFold ? "OWNED" : "12 MD"} · BASE ×{SQUALL_MULT} (FLOORED), EVERY FLIGHT
              </li>
              <li>
                F3 SECOND PRESS — {SECOND_PRESS} MD PER FLIGHT, CHARGED ONLY WHEN TAKEN · SAME WIND, BETTER PAYS
              </li>
              <li>F4 WIND CHART — {m.windChart ? "OWNED" : `${WIND_CHART} MD`} · EXACT GUST BEFORE THE THROW</li>
            </ul>
            <p className="mt-2 text-[9px] text-amber-100/50">
              No power raises the ladder's top: +18 SH / +6 MD per flight is the structural ceiling.
            </p>
          </Panel>

          <Panel title="LIFETIME LEDGER">
            <InvRow label="FLIGHTS" value={m.stats.flights} color="text-amber-200" />
            <InvRow label="BEST REACH (YD)" value={m.stats.bestReach} color="text-amber-200" />
            <InvRow label="BEST GRADE" value={GRADE_NAME[m.stats.bestGrade]} color="text-amber-200" />
            <InvRow label="FAR BALERS HIT" value={m.stats.farBalers} color="text-amber-200" />
            <InvRow label="SECOND PRESSES" value={m.stats.secondPresses} color="text-amber-200" />
            <InvRow label="SHORT LANDINGS" value={m.stats.shortLandings} color="text-neutral-300" />
            <button
              data-testid="export-save-start"
              onClick={() => exportSave(m, "paperairplane-save.json")}
              className="pixel-btn mt-3 w-full bg-cyan-950 px-2 py-2 text-[8px] text-cyan-200"
            >
              ⤓ EXPORT SAVE → paperairplane-save.json
            </button>
            <button
              data-testid="reset-save"
              onClick={resetSave}
              className={`pixel-btn mt-2 w-full px-2 py-2 text-[8px] ${
                confirmReset ? "bg-red-900 text-red-100" : "bg-neutral-900 text-neutral-400"
              }`}
            >
              {confirmReset ? "SURE? CLICK AGAIN — EVERYTHING GOES" : "RESET PROGRESS"}
            </button>
          </Panel>
        </aside>
      </main>

      <footer className="border-t-4 border-amber-500/20 px-4 py-4 text-center">
        <p className="mx-auto max-w-3xl text-[10px] leading-relaxed text-amber-100/50">
          This demo is a game economy only. It does not produce income, health, or real-world
          environmental outcomes — a landed flight is a variable in a save file. No purchases · no
          ads · no accounts · free entrance, free exit — nothing decays while you are away, and
          there is no clock anywhere in the game. Loop arithmetic from the Paper Airplane
          incorporation form (design v1, 2026-10-01), machine-checked by paper-airplane-checks.py.
        </p>
      </footer>
    </div>
  );
}

/* ----------------------------- start screen ------------------------------- */

function StartScreen({
  meta,
  selectedCourse,
  onSelectCourse,
  onBench,
  onExport,
  onReset,
  confirmReset,
}: {
  meta: Meta;
  selectedCourse: number;
  onSelectCourse: (c: number) => void;
  onBench: () => void;
  onExport: () => void;
  onReset: () => void;
  confirmReset: boolean;
}) {
  const band = courseOf(selectedCourse).gust.join("/");
  return (
    <div className="relative z-20 mt-3 flex flex-col items-center gap-3 py-2 text-center">
      <p className="font-pixel text-sm text-amber-300">THE LOOP IN FIVE LINES</p>
      <ul className="space-y-1 text-[11px] leading-relaxed text-amber-100/80">
        <li>DART FOLD FREE — NO PLAYER CAN BE LOCKED OUT OF THE LOOP</li>
        <li>LAND A BALER FOR SHEETS + MEDALLIONS</li>
        <li>THE FAR BALER PAYS +18 SH +6 MD — THE LADDER'S TOP IS THE CEILING</li>
        <li>THE GUST BAND {band} IS ANNOUNCED BEFORE EVERY THROW</li>
        <li>10 MD OPENS COURSE 2 — HARBOUR FLAT</li>
      </ul>

      <div className="flex flex-wrap items-center justify-center gap-2">
        {[1, 2, 3, 4].map((c) => {
          const unlocked = meta.courses.includes(c);
          const cost = courseOf(c).cost;
          return unlocked ? (
            <button
              key={c}
              data-testid={`course-select-${c}`}
              onClick={() => onSelectCourse(c)}
              className={`pixel-btn px-3 py-2 text-[9px] ${
                selectedCourse === c ? "bg-amber-300 text-neutral-950" : "bg-neutral-900 text-amber-300"
              }`}
            >
              COURSE {c} {courseOf(c).name}
            </button>
          ) : (
            <span key={c} className="pixel-btn bg-neutral-950 px-3 py-2 text-[9px] text-neutral-600">
              COURSE {c} — {cost} MD
            </span>
          );
        })}
      </div>

      <button
        data-testid="to-bench"
        onClick={onBench}
        className="pixel-btn blink bg-amber-300 px-6 py-4 text-sm text-neutral-950"
      >
        ▶ TO THE BENCH — COURSE {selectedCourse} {courseOf(selectedCourse).name}
      </button>

      <p className="text-[10px] text-amber-100/50">
        FLIGHTS {meta.stats.flights} · BEST REACH {meta.stats.bestReach} YD · FAR BALERS{" "}
        {meta.stats.farBalers} · BALES {meta.bales} · PLATES {meta.plates}
      </p>
      <p className="text-[10px] text-amber-100/50">
        SH {meta.sh} · MD {meta.md} · no clock, no charge, no board — the landing ends the flight.
      </p>
      <div className="flex gap-2">
        <button
          data-testid="export-save-start-screen"
          onClick={onExport}
          className="pixel-btn bg-cyan-950 px-3 py-2 text-[8px] text-cyan-200"
        >
          ⤓ EXPORT SAVE
        </button>
        <button
          data-testid="reset-save-screen"
          onClick={onReset}
          className={`pixel-btn px-3 py-2 text-[8px] ${
            confirmReset ? "bg-red-900 text-red-100" : "bg-neutral-900 text-neutral-400"
          }`}
        >
          {confirmReset ? "SURE? CLICK AGAIN" : "RESET SAVE"}
        </button>
      </div>
    </div>
  );
}

/* ------------------------------ bench screen ------------------------------ */

function BenchScreen({
  meta,
  course,
  fold,
  notice,
  onFold,
  onRail,
  onBack,
  onExport,
  onUnlock,
  onMillHand,
  onSquall,
  onWindChart,
  onBale,
  onPlate,
  onReChart,
}: {
  meta: Meta;
  course: number;
  fold: FoldId;
  notice: string | null;
  onFold: (f: FoldId) => void;
  onRail: () => void;
  onBack: () => void;
  onExport: () => void;
  onUnlock: (c: number) => void;
  onMillHand: () => void;
  onSquall: () => void;
  onWindChart: () => void;
  onBale: () => void;
  onPlate: () => void;
  onReChart: () => void;
}) {
  const c = courseOf(course);
  return (
    <div className="relative z-20 mt-2 flex flex-col gap-3">
      <div className="border-2 border-amber-500/30 bg-black/40 p-3 text-center">
        <h2 className="font-pixel text-sm text-amber-300">THE BENCH — PICK A FOLD</h2>
        <p className="mt-1 text-[10px] text-amber-100/60">
          COURSE {course} {c.name} · CHART v{(meta.chartIndex[course] ?? 0) + 1} · PADS {c.pads.join("/")} ·
          GUST {c.gust.join("/")} · DRAFT {c.columns}×{c.lift} YD
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        {(Object.keys(FOLD) as FoldId[]).map((f) => {
          const def = FOLD[f];
          const afford = meta.sh >= def.cost;
          const r = def.rides ? baseReach(f, course, meta.squallFold) : def.glide;
          return (
            <button
              key={f}
              data-testid={`fold-${f}`}
              onClick={() => onFold(f)}
              disabled={f === "DART" ? false : !afford}
              className={`pixel-btn px-2 py-3 text-[9px] ${
                fold === f
                  ? "bg-amber-300 text-neutral-950"
                  : afford
                    ? "bg-neutral-900 text-amber-300"
                    : "bg-neutral-950 text-neutral-600"
              }`}
            >
              {def.cost === 0
                ? `▶ DART — FREE · BASE ${r}`
                : afford
                  ? `▶ ${f} — ${def.cost} SH · BASE ${r}`
                  : `${f} — ${def.cost} SH · SHORT ${def.cost - meta.sh} SH`}
              <span className="mt-1 block text-[7px] opacity-70">
                {def.rides ? `RIDES THE DRAFT · BASE ${def.glide}+${c.columns * c.lift}` : "NO WING AREA — NO LIFT"}
              </span>
            </button>
          );
        })}
      </div>
      <p className="text-center text-[9px] text-amber-100/50">
        Sheets leave the stock AT THE THROW — changing your mind before the throw costs nothing. The
        DART always returns at least +1 SH.
      </p>

      {/* INTERMISSION ECONOMY — every button shows price and shortfall */}
      <div className="border-2 border-amber-500/40 bg-amber-950/20 p-3">
        <h3 className="font-pixel text-[9px] text-amber-300">
          INTERMISSION ECONOMY — ALL PRICES IN LOOP UNITS, NOTHING FOR SALE
        </h3>

        <p className="mt-2 font-pixel text-[8px] text-amber-200">COURSE CHARTS (L10 — EARNED ONLY)</p>
        <div className="mt-1 grid gap-2 sm:grid-cols-3">
          {[2, 3, 4].map((cc) => {
            const unlocked = meta.courses.includes(cc);
            const cost = courseOf(cc).cost;
            const afford = meta.md >= cost;
            return (
              <button
                key={cc}
                data-testid={`unlock-course-${cc}`}
                onClick={() => onUnlock(cc)}
                disabled={unlocked}
                className={`pixel-btn px-2 py-2 text-[8px] ${
                  unlocked
                    ? "bg-lime-900/30 text-lime-400"
                    : afford
                      ? "bg-amber-700 text-amber-50"
                      : "bg-neutral-900 text-neutral-500"
                }`}
              >
                {unlocked
                  ? `COURSE ${cc} ${courseOf(cc).name} OPEN ✓`
                  : afford
                    ? `▶ COURSE ${cc} ${courseOf(cc).name} — ${cost} MD`
                    : `COURSE ${cc} ${courseOf(cc).name}: ${cost} MD — SHORT ${cost - meta.md} MD`}
              </button>
            );
          })}
        </div>
        <p className="mt-1 text-[9px] text-amber-100/50">
          Payouts are identical on every course: courses are geometry, gust and decisions — never rates.
        </p>

        <p className="mt-3 font-pixel text-[8px] text-amber-200">POWERS — MD ONLY, NEVER PURCHASABLE</p>
        <div className="mt-1 grid gap-2 sm:grid-cols-2">
          <button
            data-testid="buy-millhand"
            onClick={onMillHand}
            disabled={meta.millHand >= HAND_MAX}
            className={`pixel-btn px-2 py-2 text-[8px] ${
              meta.millHand >= HAND_MAX
                ? "bg-lime-900/30 text-lime-400"
                : meta.md >= MILL_HAND_COST[meta.millHand]
                  ? "bg-amber-700 text-amber-50"
                  : "bg-neutral-900 text-neutral-500"
            }`}
          >
            {meta.millHand >= HAND_MAX
              ? "F1 MILL HAND MAX — −2 YD HEADWIND"
              : meta.md >= MILL_HAND_COST[meta.millHand]
                ? `▶ F1 MILL HAND R${meta.millHand + 1} — ${MILL_HAND_COST[meta.millHand]} MD (−1 YD)`
                : `F1 MILL HAND R${meta.millHand + 1}: ${MILL_HAND_COST[meta.millHand]} MD — SHORT ${
                    MILL_HAND_COST[meta.millHand] - meta.md
                  } MD`}
          </button>
          <button
            data-testid="buy-squallfold"
            onClick={onSquall}
            disabled={meta.squallFold}
            className={`pixel-btn px-2 py-2 text-[8px] ${
              meta.squallFold
                ? "bg-lime-900/30 text-lime-400"
                : meta.md >= 12
                  ? "bg-amber-700 text-amber-50"
                  : "bg-neutral-900 text-neutral-500"
            }`}
          >
            {meta.squallFold
              ? "F2 SQUALL FOLD OWNED ✓ (×1.25 FLOORED)"
              : meta.md >= 12
                ? "▶ F2 SQUALL FOLD — 12 MD (BASE ×1.25)"
                : `F2 SQUALL FOLD: 12 MD — SHORT ${12 - meta.md} MD`}
          </button>
          <button
            data-testid="buy-windchart"
            onClick={onWindChart}
            disabled={meta.windChart}
            className={`pixel-btn px-2 py-2 text-[8px] ${
              meta.windChart
                ? "bg-lime-900/30 text-lime-400"
                : meta.md >= WIND_CHART
                  ? "bg-amber-700 text-amber-50"
                  : "bg-neutral-900 text-neutral-500"
            }`}
          >
            {meta.windChart
              ? "F4 WIND CHART OWNED ✓ (EXACT GUST EARLY)"
              : meta.md >= WIND_CHART
                ? `▶ F4 WIND CHART — ${WIND_CHART} MD`
                : `F4 WIND CHART: ${WIND_CHART} MD — SHORT ${WIND_CHART - meta.md} MD`}
          </button>
          <div className="border border-amber-500/20 p-2 text-[9px] text-amber-100/70">
            F3 SECOND PRESS — {SECOND_PRESS} MD per flight, charged only when the retry is taken. Same
            wind, better of two landings pays. It re-rolls the throw, never the wind.
          </div>
        </div>
        <p className="mt-1 text-[9px] text-amber-100/50">
          Every power has a published ceiling; none can move the ladder's top (+18 SH / +6 MD).
        </p>

        <p className="mt-3 font-pixel text-[8px] text-amber-200">SINKS — UNBOUNDED, REAL SPENDS</p>
        <div className="mt-1 grid gap-2 sm:grid-cols-3">
          <button
            data-testid="press-bale"
            onClick={onBale}
            disabled={meta.sh < BALE_SH}
            className={`pixel-btn px-2 py-2 text-[8px] ${
              meta.sh >= BALE_SH
                ? "bg-neutral-700 text-neutral-100"
                : "bg-neutral-950 text-neutral-600"
            }`}
          >
            {meta.sh >= BALE_SH
              ? `▶ BALING ORDER — ${BALE_SH} SH · BALE #${meta.bales + 1}`
              : `BALING ORDER: ${BALE_SH} SH — SHORT ${BALE_SH - meta.sh} SH`}
          </button>
          <button
            data-testid="bench-plate"
            onClick={onPlate}
            disabled={meta.md < PLATE_MD}
            className={`pixel-btn px-2 py-2 text-[8px] ${
              meta.md >= PLATE_MD
                ? "bg-neutral-700 text-neutral-100"
                : "bg-neutral-950 text-neutral-600"
            }`}
          >
            {meta.md >= PLATE_MD
              ? `▶ BENCH PLATE — ${PLATE_MD} MD · #${meta.plates + 1}`
              : `BENCH PLATE: ${PLATE_MD} MD — SHORT ${PLATE_MD - meta.md} MD`}
          </button>
          <button
            data-testid="rechart"
            onClick={onReChart}
            disabled={meta.md < RECHART_MD}
            className={`pixel-btn px-2 py-2 text-[8px] ${
              meta.md >= RECHART_MD
                ? "bg-neutral-700 text-neutral-100"
                : "bg-neutral-950 text-neutral-600"
            }`}
          >
            {meta.md >= RECHART_MD
              ? `▶ RE-CHART COURSE ${course} — ${RECHART_MD} MD`
              : `RE-CHART: ${RECHART_MD} MD — SHORT ${RECHART_MD - meta.md} MD`}
          </button>
        </div>
        <p className="mt-1 text-[9px] text-amber-100/50">
          BALES {meta.bales} · PLATES {meta.plates} · badge every 10. The next chart may be queued:
          the sink is what conservation needs, the art is not.
        </p>
      </div>

      <div className="min-h-5 text-center text-[10px] text-yellow-200/90">{notice ?? ""}</div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          data-testid="export-save-bench"
          onClick={onExport}
          className="pixel-btn bg-cyan-950 px-3 py-3 text-[8px] text-cyan-200"
        >
          ⤓ EXPORT SAVE
        </button>
        <button
          data-testid="to-rail"
          onClick={onRail}
          className="pixel-btn blink bg-amber-300 px-5 py-3 text-xs text-neutral-950"
        >
          ▶ TO THE RAIL — {fold} ({FOLD[fold].cost} SH AT THROW)
        </button>
        <button
          data-testid="back-to-start"
          onClick={onBack}
          className="pixel-btn bg-neutral-900 px-3 py-3 text-[8px] text-neutral-400"
        >
          ◀ START
        </button>
      </div>
    </div>
  );
}

/* ----------------------------- landing screen ----------------------------- */

function LandingScreen({
  ledger,
  payoutLine,
  gustValue,
  banked,
  md,
  retryEligible,
  notice,
  onRetry,
  onBench,
}: {
  ledger: ThrowLedger | null;
  payoutLine: string | null;
  gustValue: string | null;
  banked: { sh: number; md: number } | null;
  md: number;
  retryEligible: boolean;
  notice: string | null;
  onRetry: () => void;
  onBench: () => void;
}) {
  return (
    <div className="relative z-20 mt-2 flex flex-col gap-3">
      <div className="border-2 border-amber-500/40 bg-black/50 p-3 text-center">
        <h2 className="font-pixel text-sm text-amber-300">THE PLANE LANDS</h2>
        {payoutLine && (
          <p data-testid="payout-line" className="mt-2 font-pixel text-[11px] text-amber-100">
            {payoutLine}
          </p>
        )}
        {banked && ledger && (
          <p className="mt-1 text-[10px] text-amber-100/70">
            BANKED NOW: <span className="text-amber-200">SH +{banked.sh} · MD +{banked.md}</span>
            {ledger.retried
              ? " — SECOND PRESS: BETTER OF 2 LANDINGS PAYS, SAME WIND, 4 MD CHARGED"
              : " — THE INSTANT THE PAPER LANDS (CLOSING THE TAB LOSES NOTHING)"}
          </p>
        )}
        {gustValue && (
          <p data-testid="gust-value" className="mt-1 text-[10px] text-amber-100/60">
            {gustValue}
          </p>
        )}

        {retryEligible && (
          <button
            data-testid="use-second-press"
            onClick={onRetry}
            className="pixel-btn mt-3 bg-neutral-900 px-4 py-3 text-[9px] text-amber-300"
          >
            {md >= SECOND_PRESS
              ? `F3 SECOND PRESS — ${SECOND_PRESS} MD · SAME WIND, THROW AGAIN`
              : `F3 SECOND PRESS: ${SECOND_PRESS} MD — SHORT ${SECOND_PRESS - md} MD`}
          </button>
        )}
        {!retryEligible && (
          <p className="mt-2 text-[9px] text-amber-100/40">
            {ledger?.retried ? "ONE PRESS PER FLIGHT — THE FLIGHT IS OVER." : "AIM 10 WOULD NOT PAY MORE — THE FLIGHT IS OVER."}
          </p>
        )}
        <div className="min-h-4 text-[10px] text-yellow-200/90">{notice ?? ""}</div>
        <button
          data-testid="continue-btn"
          onClick={onBench}
          className="pixel-btn blink mt-2 bg-amber-300 px-5 py-3 text-xs text-neutral-950"
        >
          → BENCH — FOLD THE NEXT PLANE
        </button>
      </div>
    </div>
  );
}

/* ------------------------------ LOOP panel -------------------------------- */

function LoopPanel({ meta }: { meta: Meta }) {
  const refs: Array<[string, string]> = [
    ["free DART line (0 sheets held)", "20 + 7 − 3 = 24 · PAD 1 · SH +3 − 0 = +3 · MD +1"],
    ["competent GLIDER line", "44 + 7 − 3 = 48 · PAD 3 · SH +12 − 4 = +8 · MD +4"],
    ["skilled KITE line", "52 + 9 − 0 = 61 · PAD 4 · SH +18 − 8 = +10 · MD +6"],
    ["KITE + SQUALL FOLD + MILL HAND 2 (everything on)", "65 + 10 − 6 = 71 · PAD 4 · SH +18 − 8 = +10 · MD +6"],
  ];
  return (
    <section className="border-2 border-amber-500/30 bg-black/30 p-4" data-testid="loop-panel">
      <h2 className="font-pixel text-[10px] text-amber-300">
        THE LOOP — SHEET → FOLD → FLIGHT → LANDING GRADE → SHEETS + MEDALLIONS
      </h2>
      <div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr]">
        <StageCard
          title="INPUTS"
          accent="text-cyan-300"
          lines={[
            "Time: one flight, no clock",
            "Skill: the fold, and release timing",
            "Aim meter: exact integer 0–10",
            "Seed: course 1 · free DART · 0 SH · 0 MD",
          ]}
        />
        <Arrow />
        <StageCard
          title="TRANSFORMATION"
          accent="text-amber-300"
          lines={[
            "reach = base + aim − gust",
            "base = glide + draft × lift (wing)",
            "×1.25 floored with SQUALL FOLD",
            "one disclosed gust, announced first",
          ]}
        />
        <Arrow />
        <StageCard
          title="OUTPUTS"
          accent="text-amber-200"
          lines={[
            "SH +1/+3/+7/+12/+18 by grade",
            "MD 0/+1/+2/+4/+6 by the same grade",
            "lookup on grade, identical everywhere",
            "banked the instant the plane lands",
          ]}
        />
        <Arrow />
        <StageCard
          title="REINVESTMENT"
          accent="text-emerald-300"
          lines={[
            "the mill's own draft is the lift",
            "the plane's paper returns (+1 SH floor)",
            "sheets pay folds; MD pays skills",
            "sinks: bales · plates · charts · unlocks",
          ]}
        />
      </div>

      <div className="mt-3 grid gap-2 lg:grid-cols-2">
        <div className="border-2 border-amber-500/20 bg-amber-950/10 p-2 text-[10px] leading-relaxed text-amber-100/80">
          <p className="font-pixel text-[8px] text-amber-200">BALANCE ARITHMETIC (PER FLIGHT, COURSE 1)</p>
          <div className="mt-1 overflow-x-auto">
            <table className="w-full text-[8px]">
              <tbody>
                {(Object.keys(FOLD) as FoldId[]).map((f) => (
                  <tr key={f}>
                    <td className="pr-1 text-amber-200">{f}</td>
                    <td className="pr-1 text-amber-100/50">glide {FOLD[f].glide}</td>
                    <td className="pr-1 text-amber-100/50">cost {FOLD[f].cost} SH</td>
                    <td>
                      base C1–C4:{" "}
                      {[1, 2, 3, 4]
                        .map((cc) => `${baseReach(f, cc, false)}${meta.squallFold ? `/${baseReach(f, cc, true)}` : ""}`)
                        .join(" ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-1">
            LADDER + PAYOUT (identical on every course):{" "}
            {[1, 2, 3, 4].map((cc) => `C${cc} ${courseOf(cc).pads.join("/")}`).join(" · ")}
          </p>
          <p>
            SHORT +1/0 · PAD 1 +3/+1 · PAD 2 +7/+2 · PAD 3 +12/+4 · PAD 4 +18/+6 · the ladder's top
            is the hard cap: no power moves it.
          </p>
          <p className="mt-1 font-pixel text-[8px] text-yellow-200">THE FOUR REFERENCE FLIGHTS (C1)</p>
          <ul className="mt-1 space-y-1">
            {refs.map(([name, line]) => (
              <li key={name} className="text-[9px]">
                <span className="text-amber-200">{name}:</span> {line}
              </li>
            ))}
          </ul>
          <p className="mt-1">
            NET BAND PER FLIGHT: <span className="text-amber-200">−1..+10 SH</span> with no skills ·{" "}
            <span className="text-amber-200">−1..+14 SH</span> with every power · gross 1..18 SH · MD
            0..6
          </p>
          <p className="mt-1 text-amber-100/60">
            Absorbed: 10 competent GLIDER flights = 80 SH = 10 bales; the DART-only player still
            presses one bale per 2.67 flights. 128 MD of finite sinks = 32 competent flights; then
            plates (5 MD) and re-charts (3 MD) take the rest with no cap (C2).
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <div className="border-2 border-amber-500/20 bg-amber-950/10 p-2 text-[10px] leading-relaxed text-amber-100/80">
            <p className="font-pixel text-[8px] text-amber-200">POWERS TABLE — COST · EFFECT · CEILING</p>
            <p className="mt-1">
              F1 MILL HAND — <span className="text-amber-200">6 / 18 MD</span> · −1 yd headwind per
              rank, 2 ranks ever (MAX) · ceiling: never past the far baler
            </p>
            <p>
              F2 SQUALL FOLD — <span className="text-amber-200">12 MD</span> · base reach ×1.25
              (floored) every flight · 1 rank ever · surplus above the far baler pays nothing
            </p>
            <p>
              F3 SECOND PRESS — <span className="text-amber-200">4 MD</span> · one retry of the
              throw, same wind, better of two landings pays · charged only when taken
            </p>
            <p>
              F4 WIND CHART — <span className="text-amber-200">10 MD</span> · the exact gust before
              the throw · zero units: knowing earlier never changes what a landing pays
            </p>
            <p className="mt-1 text-amber-100/60">
              With/without SQUALL FOLD on C1: DART +1..+3 → +3..+7 SH (Δ+2/+1 MD) · GLIDER +3..+8 →
              +8..+14 SH (Δ+5/+2 MD) · KITE +4..+10 → +10..+10 SH (Δ+6/+2 MD). The fold that reaches
              further is lifted exactly one baler; the gross ceiling stays +18/+6.
            </p>
          </div>
          <div className="border-2 border-amber-500/20 bg-amber-950/10 p-2 text-[10px] leading-relaxed text-amber-100/80">
            <p className="font-pixel text-[8px] text-amber-200">GUST — ONE DISCLOSED VARIABLE</p>
            <p className="mt-1">
              Bands: C1/C2 0·3·6 · C3 0·4·8 · C4 0·5·10. Drawn uniformly on the save's counter,
              announced before every throw, printed after every landing.
            </p>
            <p>
              History (last {Math.min(GUST_KEEP, meta.gustHistory.length)}):{" "}
              <span className="font-pixel text-[8px] text-amber-200">
                {meta.gustHistory.length ? meta.gustHistory.join(" · ") : "— none yet"}
              </span>
            </p>
            <p className="mt-1 text-amber-100/60">
              Aim 10 outsizes the worst gust on C1–C3 for every riding fold. Nothing is for sale, so
              no purchase can ever be attached to chance — the band is the whole of the randomness.
            </p>
          </div>
        </div>
      </div>
      <p className="mt-3 text-center font-pixel text-[9px] text-yellow-200/90">
        NOTHING HERE CONVERTS TO MONEY; NO PURCHASES EXIST IN THIS GAME
      </p>
    </section>
  );
}

/* --------------------------- small pieces -------------------------------- */

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-2 border-amber-500/30 bg-black/30 p-3">
      <h2 className="font-pixel text-[9px] text-amber-300">{title}</h2>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function InvRow({
  label,
  value,
  hint,
  color,
}: {
  label: string;
  value: string | number;
  hint?: string;
  color: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2 border-b border-amber-500/10 py-1">
      <span className="text-[10px] text-amber-100/70">{label}</span>
      <span className={`font-pixel text-[10px] ${color} text-right`}>
        {value}
        {hint ? <span className="ml-1 text-[8px] text-amber-100/40">{hint}</span> : null}
      </span>
    </div>
  );
}

function StageCard({
  title,
  accent,
  lines,
}: {
  title: string;
  accent: string;
  lines: string[];
}) {
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