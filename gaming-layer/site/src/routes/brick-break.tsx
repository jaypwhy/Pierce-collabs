import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { PiScaleBadge } from "~/components/pi-scale-badge";

/* ============================================================================
 * BRICK BREAK — a playable closed-loop demo (The Gaming Layer)
 *
 * Every number here is the design's constants block (brick-break-design.md,
 * /home/team/shared/brick-break-design.md — copied, not re-derived):
 *   SW        : 30 per run · −1 per cart return · −5 per lost ram
 *              · +4 per row cleared · remainder forfeited at run end
 *   SE        : +1 per row cleared · +3 per wall sealed (run ends at once)
 *   Bricks    : W +2 RK +1 DZ · C +3 RB +2 DZ · L +1 RK +1 RB +1 DZ
 *              credits bank to the save the instant the brick breaks
 *   Upkeep    : −16 RB −8 DZ at run start (floors at 0)
 *   Patches   : automatic, 5 DZ → +6 px cart width, max 3 per run
 *   Courses   : 25 RK + 10 RB + 8 DZ (unbounded material sink)
 *   Frames    : T2 120/60/40 · T3 300/180/120  (cart 56 → 68 → 80 px)
 *   Bays      : 9 / 24 / 54 SE · Re-lay 3 SE per bay (layout queued)
 *   Powers    : M1 6/16 SE · M2 10 SE · M3 12 SE · M4 4 SE a press
 *               (arcade-powers.md §3 — earned only, SE only; every one of
 *               them leaves the wall at 30 bricks / 35 RK on bay 1)
 *   Geometry  : 336×240 field, brick rows 10 px tall, cart 8 px tall,
 *                ram 3 px radius, constant 110 px/s (no ramp)
 * Meta persists in localStorage only. No purchases, no ads, no accounts,
 * no randomness — fixed published layouts, deterministic transform.
 * ==========================================================================*/

type Phase = "start" | "run" | "intermission";
type BrickChar = "W" | "C" | "L";

/* ARCADE POWERS (arcade-powers.md §3) — earned only, spent in SE only.
 * m1 / m2 / m3 are owned ranks; M4 is charged per press and never stored. */
interface Powers {
  m1: number; // THE SIGHT LINE · rank 0..2 · 6 / 16 SE
  m2: number; // THE STEADY RAM · rank 0..1 · 10 SE
  m3: number; // THE TALLY BOARD · rank 0..1 · 12 SE
}

interface Meta {
  saveVersion: 1;
  rk: number;
  rb: number;
  dz: number;
  se: number;
  seEarned: number;
  cartTier: 1 | 2 | 3;
  bays: number[];
  layoutIndex: Record<number, number>;
  coursesLaid: number;
  bricksLaid: number;
  badges: string[];
  powers: Powers;
  stats: {
    runs: number;
    bricks: number;
    rows: number;
    wallsSealed: number;
    ramsLost: number;
    perfectRuns: number;
    m4Presses: number;
  };
}

interface Brick {
  x: number;
  y: number;
  w: number;
  h: number;
  row: number;
  col: number;
  c: BrickChar;
  dead: boolean;
}

interface RunState {
  bay: number;
  sw: number; // current Swing
  granted: number; // 30 + 4 × rows cleared
  rowsCleared: number;
  patches: number;
  cartW: number; // px, base + 6 × patches
  bricksBroken: number;
  returns: number;
  ramsLost: number;
  runRk: number;
  runRb: number;
  runDz: number;
  wallSealed: boolean;
  forfeited: number;
  speed: number; // ram speed px/s — 110, or 93.5 with M2
  spareArmed: boolean; // M4: the next lost ram costs 0 SW
  m4Uses: number; // SPARE RAM presses this run — never persisted
  // physics
  bx: number;
  by: number;
  bvx: number;
  bvy: number;
  resting: boolean; // ram on the cart, waiting for launch
  cartX: number; // cart left edge
  bricks: Brick[];
}

type GameEvent =
  | { kind: "brick"; row: number; col: number; c: BrickChar }
  | { kind: "return" }
  | { kind: "lost" };

interface RunSummary {
  bay: number;
  reason: "sw" | "seal" | "manual";
  bricks: number;
  rows: number;
  ramsLost: number;
  returns: number;
  runRk: number;
  runRb: number;
  runDz: number;
  sealsRun: number;
  wallSealed: boolean;
  forfeited: number;
}

/* ----------------------------- constants --------------------------------- */
/* Copied verbatim from brick-break-design.md » BUILD NOTES.                 */

const SAVE_KEY = "brickbreak.save.v1";

const SW_START = 30;
const SW_PER_ROW = 4;
const SW_PER_RETURN = 1;
const SW_LOST_RAM = 5;
const ROW_SE = 1;
const SEAL_WALL_BONUS = 3;
const PATCH_DUST = 5;
const PATCH_MAX = 3;
const PATCH_PX = 6;
const UPKEEP_RB = 16;
const UPKEEP_DZ = 8;
const COURSE = { rk: 25, rb: 10, dz: 8 };
const FRAME2 = { rk: 120, rb: 60, dz: 40 };
const FRAME3 = { rk: 300, rb: 180, dz: 120 };
const BAY_COST: Record<number, number> = { 1: 0, 2: 9, 3: 24, 4: 54 };
const RELAY_COST = 3;

/* ---------------------- ARCADE POWERS — constants -------------------------
 * Copied verbatim from arcade-powers.md §7 (BUILD NOTES). Do not re-derive.
 * Every price is in SE, the currency finishing masonry pays. Nothing here
 * writes to a brick's yield, to the Swing grant, or to a bay's wall.        */
const M1_COST = [0, 6, 16]; // SE by rank; rank 0 = not owned
const M2_COST = 10; // SE
const M3_COST = 12; // SE
const M4_COST = 4; // SE per press, unbounded
const M1_BOUNCES = [0, 1, 2]; // sight-line bounces by rank
const M2_SPEED = 0.85; // ram speed multiplier
const M4_SAVE_SW = 5; // one press = one lost ram forgiven

const SEED: {
  rk: number;
  rb: number;
  dz: number;
  se: number;
  cartTier: 1 | 2 | 3;
  bays: number[];
  layoutIndex: Record<number, number>;
} = { rk: 0, rb: 0, dz: 0, se: 0, cartTier: 1, bays: [1], layoutIndex: { 1: 0 } };

const BRICK_YIELD: Record<BrickChar, { rk: number; rb: number; dz: number }> = {
  W: { rk: 2, rb: 0, dz: 1 }, // WHOLE   amber
  C: { rk: 0, rb: 3, dz: 2 }, // CRUMBLE grey
  L: { rk: 1, rb: 1, dz: 1 }, // LIME    pale
};

/* Geometry (design): field 336×240 for every bay (the doc permits widening
 * from 320 so bay 4's 8-wide wall has room; ceilings don't depend on size).
 * Brick height 10, cart height 8, ram radius 3, speed 110 px/s constant.   */
const FIELD_W = 336;
const FIELD_H = 240;
const BRICK_H = 10;
const BRICK_TOP = 24;
const CART_H = 8;
const CART_Y = FIELD_H - CART_H - 8; // 224
const BALL_R = 3;
const BALL_SPEED = 110; // constant — design: no speed ramp
const MAX_ANGLE_DEG = 60;
const MIN_VY = 20; // physics safeguard: no horizontal-lock oscillation
const CART_SPEED = 220; // keyboard cart speed, px/s
const CART_BASE: Record<number, number> = { 1: 56, 2: 68, 3: 80 };

const BAY_NAME: Record<number, string> = {
  1: "YARD WALL",
  2: "LIME KILN",
  3: "DRY STORE",
  4: "BOTTLE OVEN",
};

/* Published layouts — copy from the design's constants block, unchanged.   */
const BAY_ROWS: Record<number, string[]> = {
  1: ["WWCWCL", "WWCWCL", "WWCWCL", "WWCWCL", "WWCWCL"], // 5 × 6
  2: ["WLCCLW", "WLCCLW", "WLCCLW", "CLWLCW", "CLWLCW", "CLWLCW"], // 6 × 6
  3: ["CCWCWCC", "CCWCWCC", "CCWCWCC", "CCWCWCC", "CCWCWCC"], // 5 × 7
  4: ["WCWLWCWC", "WCWLWCWC", "WCWLWCWC", "WCWLWCWC", "WCWLWCWC", "WCWLWCWC"], // 6 × 8
};

/* Full-clear ceilings per bay (design A4 table) — published numbers.       */
const BAY_CEILING: Record<
  number,
  { rk: number; rb: number; dz: number; se: number; sw: number; bricks: number }
> = {
  1: { rk: 35, rb: 35, dz: 40, se: 8, sw: 50, bricks: 30 },
  2: { rk: 36, rb: 48, dz: 48, se: 9, sw: 54, bricks: 36 },
  3: { rk: 20, rb: 75, dz: 60, se: 8, sw: 50, bricks: 35 },
  4: { rk: 54, rb: 60, dz: 66, se: 9, sw: 54, bricks: 48 },
};

function brickCounts(bay: number): { W: number; C: number; L: number } {
  const counts = { W: 0, C: 0, L: 0 };
  for (const row of BAY_ROWS[bay]) {
    for (const ch of row) {
      counts[ch as BrickChar] += 1;
    }
  }
  return counts;
}

const SEED_META: Meta = {
  saveVersion: 1,
  rk: SEED.rk,
  rb: SEED.rb,
  dz: SEED.dz,
  se: SEED.se,
  seEarned: 0,
  cartTier: SEED.cartTier,
  bays: [...SEED.bays],
  layoutIndex: { ...SEED.layoutIndex },
  coursesLaid: 0,
  bricksLaid: 0,
  badges: [],
  powers: { m1: 0, m2: 0, m3: 0 },
  stats: {
    runs: 0,
    bricks: 0,
    rows: 0,
    wallsSealed: 0,
    ramsLost: 0,
    perfectRuns: 0,
    m4Presses: 0,
  },
};

/* ------------------------------ helpers ---------------------------------- */

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function loadMeta(): Meta {
  if (typeof window === "undefined") return SEED_META;
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return SEED_META;
    const parsed = JSON.parse(raw) as Partial<Meta>;
    if (typeof parsed.se !== "number") return SEED_META;
    return {
      ...SEED_META,
      ...parsed,
      bays: Array.isArray(parsed.bays) && parsed.bays.length ? parsed.bays : [1],
      layoutIndex: {
        ...SEED_META.layoutIndex,
        ...(parsed.layoutIndex ?? {}),
      },
      powers: { ...SEED_META.powers, ...(parsed.powers ?? {}) },
      stats: { ...SEED_META.stats, ...(parsed.stats ?? {}) },
    };
  } catch {
    return SEED_META;
  }
}

function buildBricks(bay: number): Brick[] {
  const rows = BAY_ROWS[bay];
  const bw = FIELD_W / rows[0].length;
  const bricks: Brick[] = [];
  rows.forEach((rowStr, row) => {
    for (let col = 0; col < rowStr.length; col += 1) {
      bricks.push({
        x: col * bw,
        y: BRICK_TOP + row * BRICK_H,
        w: bw,
        h: BRICK_H,
        row,
        col,
        c: rowStr[col] as BrickChar,
        dead: false,
      });
    }
  });
  return bricks;
}

/* Deterministic physics step; returns events for the caller to resolve.    */
function stepRun(r: RunState, dt: number): GameEvent[] {
  const evs: GameEvent[] = [];
  r.bx += r.bvx * dt;
  r.by += r.bvy * dt;

  // side + top walls
  if (r.bx <= BALL_R) {
    r.bx = 2 * BALL_R - r.bx;
    r.bvx = -r.bvx;
  } else if (r.bx >= FIELD_W - BALL_R) {
    r.bx = 2 * (FIELD_W - BALL_R) - r.bx;
    r.bvx = -r.bvx;
  }
  if (r.by <= BALL_R) {
    r.by = 2 * BALL_R - r.by;
    r.bvy = -r.bvy;
  }

  // bricks
  for (const b of r.bricks) {
    if (b.dead) continue;
    const bl = r.bx - BALL_R;
    const br = r.bx + BALL_R;
    const bt = r.by - BALL_R;
    const bb = r.by + BALL_R;
    if (bb <= b.y || bt >= b.y + b.h || br <= b.x || bl >= b.x + b.w) continue;
    b.dead = true;
    evs.push({ kind: "brick", row: b.row, col: b.col, c: b.c });
    const overlapL = br - b.x;
    const overlapR = b.x + b.w - bl;
    const overlapT = bb - b.y;
    const overlapB = b.y + b.h - bt;
    if (Math.min(overlapL, overlapR) < Math.min(overlapT, overlapB)) {
      r.bvx = -r.bvx;
      r.bx += overlapL < overlapR ? -(overlapL + 0.05) : overlapR + 0.05;
    } else {
      r.bvy = -r.bvy;
      r.by += overlapT < overlapB ? -(overlapT + 0.05) : overlapB + 0.05;
    }
  }

  // cart
  if (r.bvy > 0) {
    const center = r.cartX + r.cartW / 2;
    if (
      r.by + BALL_R >= CART_Y &&
      r.by - BALL_R <= CART_Y + CART_H &&
      Math.abs(r.bx - center) <= r.cartW / 2 + BALL_R - 0.5
    ) {
      const off = clamp((r.bx - center) / (r.cartW / 2), -1, 1);
      const ang = (off * MAX_ANGLE_DEG * Math.PI) / 180;
      r.bvx = Math.sin(ang) * r.speed;
      r.bvy = -Math.cos(ang) * r.speed;
      r.by = CART_Y - BALL_R;
      evs.push({ kind: "return" });
    }
  }

  // lost ram
  if (r.by > FIELD_H + BALL_R + 2) {
    evs.push({ kind: "lost" });
  }

  // keep constant speed + minimum vertical component (deterministic)
  const speed = Math.hypot(r.bvx, r.bvy);
  if (speed > 0.0001 && Math.abs(speed - r.speed) > 0.5) {
    const k = r.speed / speed;
    r.bvx *= k;
    r.bvy *= k;
  }
  if (Math.abs(r.bvy) < MIN_VY) {
    r.bvy = r.bvy < 0 ? -MIN_VY : MIN_VY;
    const k = Math.sqrt(Math.max(0, r.speed * r.speed - r.bvy * r.bvy));
    r.bvx = (r.bvx < 0 ? -1 : 1) * k;
  }
  return evs;
}

function exportSave(meta: Meta, filename: string) {
  const payload = {
    saveVersion: meta.saveVersion,
    rk: meta.rk,
    rb: meta.rb,
    dz: meta.dz,
    se: meta.se,
    seEarned: meta.seEarned,
    cartTier: meta.cartTier,
    bays: [...meta.bays],
    layoutIndex: { ...meta.layoutIndex },
    coursesLaid: meta.coursesLaid,
    bricksLaid: meta.bricksLaid,
    badges: [...meta.badges],
    powers: { ...meta.powers },
    stats: { ...meta.stats },
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
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

/* ------------------------------ route ------------------------------------ */

export const Route = createFileRoute("/brick-break")({
  component: BrickBreak,
});

function BrickBreak() {
  const [meta, setMeta] = useState<Meta>(SEED_META);
  const [hydrated, setHydrated] = useState(false);
  const [phase, setPhase] = useState<Phase>("start");
  const [tick, setTick] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [lastRun, setLastRun] = useState<RunSummary | null>(null);
  const [upkeepPaid, setUpkeepPaid] = useState<{ rb: number; dz: number } | null>(null);
  const [selectedBay, setSelectedBay] = useState(1);
  const [confirmReset, setConfirmReset] = useState(false);

  const runRef = useRef<RunState | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const noticeTimer = useRef<number | null>(null);
  const keysRef = useRef({ left: false, right: false });
  const metaRef = useRef<Meta>(meta);
  const phaseRef = useRef<Phase>(phase);
  const selectedBayRef = useRef(selectedBay);
  metaRef.current = meta;
  phaseRef.current = phase;
  selectedBayRef.current = selectedBay;

  const flash = (msg: string) => {
    setNotice(msg);
    if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(null), 1600);
  };

  /* persistence */
  useEffect(() => {
    setMeta(loadMeta());
    const m = loadMeta();
    setSelectedBay(Math.max(...m.bays));
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

  /* -------------------------- run lifecycle ------------------------------ */

  const endRun = (reason: "sw" | "seal" | "manual") => {
    const r = runRef.current;
    if (!r) return;
    const summary: RunSummary = {
      bay: r.bay,
      reason,
      bricks: r.bricksBroken,
      rows: r.rowsCleared,
      ramsLost: r.ramsLost,
      returns: r.returns,
      runRk: r.runRk,
      runRb: r.runRb,
      runDz: r.runDz,
      sealsRun: r.rowsCleared,
      wallSealed: r.wallSealed,
      forfeited: reason === "sw" ? 0 : r.sw,
    };
    setMeta((m) => ({
      ...m,
      stats: {
        ...m.stats,
        runs: m.stats.runs + 1,
        bricks: m.stats.bricks + r.bricksBroken,
        rows: m.stats.rows + r.rowsCleared,
        wallsSealed: m.stats.wallsSealed + (r.wallSealed ? 1 : 0),
        ramsLost: m.stats.ramsLost + r.ramsLost,
        perfectRuns: m.stats.perfectRuns + (r.wallSealed && r.ramsLost === 0 ? 1 : 0),
      },
    }));
    setLastRun(summary);
    runRef.current = null;
    setPhase("intermission");
  };

  const startRun = () => {
    const upfrontRb = Math.min(meta.rb, UPKEEP_RB);
    const upfrontDz = Math.min(meta.dz, UPKEEP_DZ);
    setMeta((m) => ({ ...m, rb: m.rb - upfrontRb, dz: m.dz - upfrontDz }));
    setUpkeepPaid({ rb: upfrontRb, dz: upfrontDz });
    const bay = selectedBay;
    const base = CART_BASE[meta.cartTier];
    const bricks = buildBricks(bay);
    const cx = clamp(FIELD_W / 2, base / 2, FIELD_W - base / 2);
    runRef.current = {
      bay,
      sw: SW_START,
      granted: SW_START,
      rowsCleared: 0,
      patches: 0,
      cartW: base,
      bricksBroken: 0,
      returns: 0,
      ramsLost: 0,
      runRk: 0,
      runRb: 0,
      runDz: 0,
      wallSealed: false,
      forfeited: 0,
      // M2 THE STEADY RAM — the ram travels at 85% speed. Nothing in the
      // transform is a rate per second, so this moves no payout (A16).
      speed: BALL_SPEED * (meta.powers.m2 > 0 ? M2_SPEED : 1),
      spareArmed: false,
      m4Uses: 0,
      bx: cx,
      by: CART_Y - BALL_R,
      bvx: 0,
      bvy: 0,
      resting: true,
      cartX: cx - base / 2,
      bricks,
    };
    setLastRun(null);
    setNotice(null);
    setPhase("run");
    setTick((t) => t + 1);
  };

  const launchRam = () => {
    const r = runRef.current;
    if (!r) return;
    if (!r.resting) return;
    r.resting = false;
    r.bx = clamp(r.cartX + r.cartW / 2, BALL_R, FIELD_W - BALL_R);
    r.by = CART_Y - BALL_R;
    r.bvx = 0;
    r.bvy = -r.speed;
    setTick((t) => t + 1);
  };

  /* auto dust patching + credit banking, resolved atomically per frame     */
  const bankBricks = (evs: GameEvent[], r: RunState) => {
    let dRk = 0;
    let dRb = 0;
    let dDz = 0;
    for (const ev of evs) {
      if (ev.kind !== "brick") continue;
      const y = BRICK_YIELD[ev.c];
      dRk += y.rk;
      dRb += y.rb;
      dDz += y.dz;
      r.bricksBroken += 1;
      r.runRk += y.rk;
      r.runRb += y.rb;
      r.runDz += y.dz;
    }
    if (dRk === 0 && dRb === 0 && dDz === 0) return;
    // one dust pool — the patch check sees the projected pool
    let projDz = metaRef.current.dz + dDz;
    let patchCount = 0;
    while (projDz >= PATCH_DUST && r.patches + patchCount < PATCH_MAX) {
      projDz -= PATCH_DUST;
      patchCount += 1;
    }
    if (patchCount > 0) {
      r.patches += patchCount;
      r.cartW += PATCH_PX * patchCount;
      flash(`CART PATCHED ${r.patches}/${PATCH_MAX}  −5 DZ`);
    }
    setMeta((m) => ({
      ...m,
      rk: m.rk + dRk,
      rb: m.rb + dRb,
      dz: m.dz + dDz - PATCH_DUST * patchCount,
    }));
    setTick((t) => t + 1);
  };

  const resolveRowAndSeal = (r: RunState, evs: GameEvent[]) => {
    // One credit per row even if two bricks of the same row die in the same
    // frame — the published ceiling counts each row exactly once (design A3).
    const credited = new Set<number>();
    for (const ev of evs) {
      if (ev.kind !== "brick") continue;
      if (credited.has(ev.row)) continue;
      const rowAlive = r.bricks.some((b) => b.row === ev.row);
      if (!rowAlive) {
        credited.add(ev.row);
        r.sw += SW_PER_ROW;
        r.granted += SW_PER_ROW;
        r.rowsCleared += 1;
        setMeta((m) => ({ ...m, se: m.se + ROW_SE, seEarned: m.seEarned + ROW_SE }));
        flash(`ROW CLEARED  +1 SE  +4 SW`);
        setTick((t) => t + 1);
      }
    }
    const left = r.bricks.filter((b) => !b.dead).length;
    if (left === 0 && !r.wallSealed) {
      r.wallSealed = true;
      setMeta((m) => ({ ...m, se: m.se + SEAL_WALL_BONUS, seEarned: m.seEarned + SEAL_WALL_BONUS }));
      flash(`WALL SEALED  +3 SE`);
      setTick((t) => t + 1);
      endRun("seal");
    }
  };

  /* ------------------------- game loop + canvas -------------------------- */

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let last = performance.now();

    const draw = () => {
      const r = runRef.current;
      const m = metaRef.current;
      // backdrop
      ctx.fillStyle = "#0d100b";
      ctx.fillRect(0, 0, FIELD_W, FIELD_H);
      ctx.fillStyle = "#141a10";
      ctx.fillRect(0, 0, FIELD_W, BRICK_TOP - 4);
      // brick rows
      const bricks = r ? r.bricks : buildBricks(selectedBayRef.current);
      for (const b of bricks) {
        drawBrick(ctx, b);
      }
      // cart
      const cartW = r ? r.cartW : CART_BASE[m.cartTier];
      const cartX = r ? r.cartX : clamp(FIELD_W / 2 - cartW / 2, 0, FIELD_W - cartW);
      ctx.fillStyle = "#cbd5e1";
      ctx.fillRect(cartX + 1, CART_Y, cartW - 2, CART_H - 2);
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(cartX + 1, CART_Y, cartW - 2, 2);
      ctx.fillStyle = "#475569";
      ctx.fillRect(cartX, CART_Y + CART_H - 2, cartW, 2);
      ctx.fillStyle = "#334155";
      ctx.fillRect(cartX + cartW / 2 - 1, CART_Y, 2, CART_H);
      // ram
      const bx = r ? r.bx : clamp(FIELD_W / 2, BALL_R, FIELD_W - BALL_R);
      const by = r ? r.by : CART_Y - BALL_R;
      ctx.fillStyle = "#e2e8f0";
      ctx.fillRect(bx - BALL_R, by - BALL_R, BALL_R * 2, BALL_R * 2);
      ctx.fillStyle = "#94a3b8";
      ctx.fillRect(bx + BALL_R - 2, by + BALL_R - 2, 2, 2);
      // target ring when resting
      if (r?.resting) {
        ctx.strokeStyle = "rgba(190, 242, 100, 0.5)";
        ctx.beginPath();
        ctx.moveTo(bx, CART_Y - 10);
        ctx.lineTo(bx, CART_Y - 4);
        ctx.stroke();
      }
      /* M1 THE SIGHT LINE — a dotted line showing where the ram will travel
       * before you release it: one bounce at rank 1, two at rank 2. The
       * return leg is drawn 3 px to the side so the two legs are visible
       * (the rendering is display-only; nothing here touches a yield). */
      const bounces = M1_BOUNCES[m.powers.m1] ?? 0;
      if (r?.resting && bounces > 0) {
        const startY = CART_Y - BALL_R - 2;
        ctx.save();
        ctx.setLineDash([3, 3]);
        ctx.lineWidth = 1;
        ctx.strokeStyle = "rgba(190, 242, 100, 0.65)";
        ctx.beginPath();
        ctx.moveTo(bx, startY);
        ctx.lineTo(bx, BALL_R); // leg 1 — up to the top wall
        ctx.stroke();
        if (bounces >= 2) {
          ctx.strokeStyle = "rgba(125, 211, 252, 0.65)";
          ctx.beginPath();
          ctx.moveTo(bx + 3, BALL_R);
          ctx.lineTo(bx + 3, startY); // leg 2 — back down to the cart
          ctx.stroke();
        }
        ctx.restore();
        ctx.fillStyle = "rgba(190, 242, 100, 0.9)"; // bounce 1 marker
        ctx.fillRect(bx - 2, BALL_R - 1, 4, 2);
        if (bounces >= 2) {
          ctx.fillStyle = "rgba(125, 211, 252, 0.9)"; // bounce 2 marker
          ctx.fillRect(bx + 1, startY - 1, 4, 2);
        }
      }
    };

    const drawBrick = (c: CanvasRenderingContext2D, b: Brick) => {
      const colors: Record<BrickChar, [string, string]> = {
        W: ["#b45309", "#f59e0b"], // WHOLE amber
        C: ["#52525b", "#a1a1aa"], // CRUMBLE grey
        L: ["#4d7c0f", "#bef264"], // LIME pale
      };
      const [edge, fill] = colors[b.c];
      c.fillStyle = fill;
      c.fillRect(b.x + 1, b.y + 1, b.w - 2, b.h - 2);
      c.fillStyle = edge;
      c.fillRect(b.x + 1, b.y + b.h - 3, b.w - 2, 2);
      c.fillRect(b.x + b.w - 3, b.y + 1, 2, b.h - 2);
    };

    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const r = runRef.current;

      if (phaseRef.current === "run" && r && !r.resting) {
        // keyboard cart movement
        if (keysRef.current.left) r.cartX -= CART_SPEED * dt;
        if (keysRef.current.right) r.cartX += CART_SPEED * dt;
        r.cartX = clamp(r.cartX, 0, FIELD_W - r.cartW);

        const evs = stepRun(r, dt);
        if (evs.length > 0) {
          // resolve returns / losses (deduct Swing)
          for (const ev of evs) {
            if (ev.kind === "return") {
              r.returns += 1;
              r.sw = Math.max(0, r.sw - SW_PER_RETURN);
              setTick((t) => t + 1);
            } else if (ev.kind === "lost") {
              r.ramsLost += 1;
              // M4 THE SPARE RAM — the 4 SE was already spent on the press;
              // this one lost ram is forgiven. The SW *grant* is untouched.
              if (r.spareArmed) {
                r.spareArmed = false;
                flash(`SPARE RAM USED — ${M4_SAVE_SW} SW FORGIVEN (0 SPENT)`);
              } else {
                r.sw = Math.max(0, r.sw - SW_LOST_RAM);
                flash(`RAM LOST  −${SW_LOST_RAM} SW`);
              }
              r.resting = true;
              r.bx = clamp(r.cartX + r.cartW / 2, BALL_R, FIELD_W - BALL_R);
              r.by = CART_Y - BALL_R;
              r.bvx = 0;
              r.bvy = 0;
              setTick((t) => t + 1);
            }
          }
          // bank brick credits + auto patches (even if the run ends this frame)
          const brickEvs = evs.filter((e) => e.kind === "brick");
          if (brickEvs.length > 0) bankBricks(brickEvs, r);
          r.bricks = r.bricks.filter((b) => !b.dead);
          if (r.wallSealed) {
            // already ended on seal; skip row logic
          } else {
            resolveRowAndSeal(r, evs);
          }
          // Swing exhausted ends the run at once
          if (!r.wallSealed && runRef.current === r && r.sw <= 0) {
            endRun("sw");
          }
        }
      } else if (phaseRef.current !== "run") {
        // idle backdrop redraws on phase change only
      }

      draw();
      // read-only snapshot for verification tooling (no gameplay effect)
      if (r) {
        (window as unknown as Record<string, unknown>).__brickbreak = {
          phase: phaseRef.current,
          bay: r.bay,
          sw: r.sw,
          granted: r.granted,
          patches: r.patches,
          cartW: r.cartW,
          resting: r.resting,
          bx: r.bx,
          by: r.by,
          bvx: r.bvx,
          bvy: r.bvy,
          cartX: r.cartX,
          bricksLeft: r.bricks.filter((b) => !b.dead).length,
          rowsCleared: r.rowsCleared,
          bricksBroken: r.bricksBroken,
          returns: r.returns,
          ramsLost: r.ramsLost,
          runRk: r.runRk,
          runRb: r.runRb,
          runDz: r.runDz,
          speed: r.speed,
          spareArmed: r.spareArmed,
          m4Uses: r.m4Uses,
          powers: { ...m.powers },
          // the published ceiling in EVERY power state (arcade-powers.md A10)
          ceiling: { ...BAY_CEILING[r.bay] },
          bricks: r.bricks
            .filter((b) => !b.dead)
            .map((b) => ({ x: b.x, y: b.y, w: b.w, h: b.h, row: b.row, col: b.col })),
        };
      }
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* input: keyboard */
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") keysRef.current.left = true;
      if (e.key === "ArrowRight" || e.key === "d") keysRef.current.right = true;
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        launchRam();
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") keysRef.current.left = false;
      if (e.key === "ArrowRight" || e.key === "d") keysRef.current.right = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = runRef.current;
    if (!r || phaseRef.current !== "run") return;
    const rect = e.currentTarget.getBoundingClientRect();
    const scale = rect.width / FIELD_W;
    const x = (e.clientX - rect.left) / scale;
    r.cartX = clamp(x - r.cartW / 2, 0, FIELD_W - r.cartW);
  };

  /* --------------------------- economy actions --------------------------- */

  const layCourse = () => {
    const m = metaRef.current;
    if (m.rk < COURSE.rk || m.rb < COURSE.rb || m.dz < COURSE.dz) {
      flash(
        `COURSE NEEDS 25 RK + 10 RB + 8 DZ  (have ${m.rk}/${m.rb}/${m.dz})`,
      );
      return;
    }
    setMeta((mm) => {
      if (mm.rk < COURSE.rk || mm.rb < COURSE.rb || mm.dz < COURSE.dz) return mm;
      const next = mm.coursesLaid + 1;
      const badges = [...mm.badges];
      if (next % 10 === 0) badges.push(`CHALK BADGE — ${next} COURSES`);
      return {
        ...mm,
        rk: mm.rk - COURSE.rk,
        rb: mm.rb - COURSE.rb,
        dz: mm.dz - COURSE.dz,
        coursesLaid: next,
        bricksLaid: mm.bricksLaid + 25,
        badges,
      };
    });
    flash(`COURSE LAID #${m.coursesLaid + 1} — THE YARD WALL GROWS`);
  };

  const buyFrame = (tier: 2 | 3) => {
    const m = metaRef.current;
    const cost = tier === 2 ? FRAME2 : FRAME3;
    if (m.cartTier >= tier) return;
    if (m.rk < cost.rk || m.rb < cost.rb || m.dz < cost.dz) {
      flash(
        `FRAME ${tier} NEEDS ${cost.rk} RK + ${cost.rb} RB + ${cost.dz} DZ  (have ${m.rk}/${m.rb}/${m.dz})`,
      );
      return;
    }
    setMeta((mm) =>
      mm.cartTier >= tier || mm.rk < cost.rk || mm.rb < cost.rb || mm.dz < cost.dz
        ? mm
        : { ...mm, rk: mm.rk - cost.rk, rb: mm.rb - cost.rb, dz: mm.dz - cost.dz, cartTier: tier },
    );
    flash(`CART FRAME T${tier} FITTED — BASE ${CART_BASE[tier]} PX`);
  };

  const unlockBay = (bay: number) => {
    const m = metaRef.current;
    const cost = BAY_COST[bay];
    if (m.bays.includes(bay)) return;
    if (m.se < cost) {
      flash(`BAY ${bay} NEEDS ${cost} SE  (have ${m.se})`);
      return;
    }
    setMeta((mm) =>
      mm.bays.includes(bay) || mm.se < cost
        ? mm
        : {
            ...mm,
            se: mm.se - cost,
            bays: [...mm.bays, bay].sort((a, b) => a - b),
            layoutIndex: { ...mm.layoutIndex, [bay]: 0 },
          },
    );
    flash(`BAY ${bay} UNLOCKED — ${BAY_NAME[bay]}`);
  };

  const reLay = (bay: number) => {
    const m = metaRef.current;
    if (m.se < RELAY_COST) {
      flash(`RE-LAY NEEDS ${RELAY_COST} SE  (have ${m.se})`);
      return;
    }
    setMeta((mm) => {
      if (mm.se < RELAY_COST) return mm;
      const index = (mm.layoutIndex[bay] ?? 0) + 1;
      return { ...mm, se: mm.se - RELAY_COST, layoutIndex: { ...mm.layoutIndex, [bay]: index } };
    });
    flash(`LAYOUT ${(m.layoutIndex[bay] ?? 0) + 2} QUEUED — 3 SE SPENT`);
  };

  /* ---------------------------- arcade powers ---------------------------- */

  /* Powers are bought with Seals and nothing else. M1 has two ranks; M2 and
   * M3 have one each. M4 has no purchase — it is 4 SE a press, in a run. */
  const buyPower = (id: "m1" | "m2" | "m3") => {
    const p = metaRef.current.powers;
    const price =
      id === "m1" ? M1_COST[Math.min(2, p.m1 + 1)] : id === "m2" ? M2_COST : M3_COST;
    const maxed = id === "m1" ? p.m1 >= 2 : p[id] >= 1;
    if (maxed) return;
    if (metaRef.current.se < price) {
      flash(`NEEDS ${price} SE  (have ${metaRef.current.se})`);
      return;
    }
    setMeta((mm) => {
      const cur = mm.powers;
      const already = id === "m1" ? cur.m1 >= 2 : cur[id] >= 1;
      if (already || mm.se < price) return mm;
      const next: Powers = { ...cur };
      if (id === "m1") next.m1 = Math.min(2, cur.m1 + 1);
      else next[id] = 1;
      return { ...mm, se: mm.se - price, powers: next };
    });
    const label =
      id === "m1"
        ? `M1 THE SIGHT LINE r${Math.min(2, p.m1 + 1)}`
        : id === "m2"
          ? "M2 THE STEADY RAM"
          : "M3 THE TALLY BOARD";
    flash(`${label} EARNED — ${price} SE SPENT`);
  };

  /* M4 THE SPARE RAM — 4 SE a press, charged only when pressed. It buys back
   * run fuel (one lost ram's 5 SW), never a brick and never the grant. */
  const buySpareRam = () => {
    const r = runRef.current;
    if (!r || phaseRef.current !== "run") return;
    if (r.spareArmed) {
      flash("A SPARE RAM IS ALREADY ARMED");
      return;
    }
    if (metaRef.current.se < M4_COST) {
      flash(`SPARE RAM NEEDS ${M4_COST} SE  (have ${metaRef.current.se})`);
      return;
    }
    r.spareArmed = true;
    r.m4Uses += 1;
    setMeta((mm) => ({
      ...mm,
      se: mm.se - M4_COST,
      stats: { ...mm.stats, m4Presses: mm.stats.m4Presses + 1 },
    }));
    flash(`SPARE RAM ARMED — ${M4_COST} SE SPENT · NEXT LOST RAM COSTS 0 SW`);
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
    runRef.current = null;
    setMeta(SEED_META);
    setSelectedBay(1);
    setPhase("start");
    setLastRun(null);
    setUpkeepPaid(null);
    setConfirmReset(false);
  };

  const m = meta;

  /* ------------------------------ render --------------------------------- */

  return (
    <div className="min-h-dvh bg-[#0a0f0a] text-lime-100" data-tick={tick}>
      <header className="flex flex-wrap items-center justify-between gap-3 border-b-4 border-lime-500/40 px-4 py-3">
        <div>
          <h1 className="font-pixel text-lg text-lime-300 drop-shadow-[3px_3px_0_rgba(0,0,0,0.9)]">
            BRICK BREAK
          </h1>
          <p className="text-[10px] uppercase tracking-[0.25em] text-lime-500/70">
            one wall at a time · Gaming Layer demo
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
            href="/paper-airplane"
            data-testid="link-to-paperairplane"
            className="pixel-btn bg-neutral-900 px-3 py-2 text-[9px] text-amber-300"
          >
            ✈ WINDWARD ▶
          </a>
          <a
            href="/"
            className="pixel-btn bg-neutral-900 px-3 py-2 text-[9px] text-lime-300"
          >
            ◀ BACK
          </a>
        </div>
      </header>

      {/* the shared π display scale — the loop's own unit is untouched */}
      <PiScaleBadge units={m.rk} unit="RK" />

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* ------------------------- left: loop + cabinet ---------------- */}
        <div className="min-w-0">
          <LoopPanel selectedBay={selectedBay} powers={m.powers} />
          <div className="relative mt-4 border-4 border-lime-500/50 bg-[#0c140c] p-4 shadow-[8px_8px_0_rgba(0,0,0,0.6)]">
            <div className="scanlines pointer-events-none absolute inset-0 z-10" />
            <canvas
              ref={canvasRef}
              data-testid="play-field"
              width={FIELD_W}
              height={FIELD_H}
              onPointerMove={onPointerMove}
              onClick={() => launchRam()}
              className="w-full max-w-[588px] [image-rendering:pixelated] border-2 border-lime-500/30 bg-[#0d100b]"
            />
            {phase === "start" && (
              <StartScreen
                meta={m}
                selectedBay={selectedBay}
                upkeepPaid={upkeepPaid}
                onSelectBay={setSelectedBay}
                onStart={startRun}
                onExport={() => exportSave(m, "brickbreak-save.json")}
              />
            )}
            {phase === "run" && runRef.current && (
              <RunScreen
                run={runRef.current}
                meta={m}
                notice={notice}
                onEnd={() => endRun("manual")}
                onSpareRam={buySpareRam}
              />
            )}
            {phase === "intermission" && (
              <IntermissionScreen
                meta={m}
                lastRun={lastRun}
                notice={notice}
                onLayCourse={layCourse}
                onBuyFrame={buyFrame}
                onUnlockBay={unlockBay}
                onReLay={reLay}
                onBackToYard={() => setPhase("start")}
                onExport={() => exportSave(m, "brickbreak-save.json")}
              />
            )}
          </div>
        </div>

        {/* ------------------------- right: economy ----------------------- */}
        <aside className="flex min-w-0 flex-col gap-4">
          <Panel title="INVENTORY — IN-GAME UNITS ONLY">
            <InvRow label="RK · RECLAIMED BRICK" value={m.rk} color="text-amber-300" />
            <InvRow label="RB · RUBBLE" value={m.rb} color="text-neutral-300" />
            <InvRow label="DZ · DUST" value={m.dz} color="text-lime-200" />
            <InvRow label="SE · SEAL" value={m.se} hint={`${m.seEarned} earned`} color="text-lime-300" />
            <InvRow
              label="CART"
              value={`TIER ${m.cartTier} · ${CART_BASE[m.cartTier]} PX`}
              color="text-cyan-300"
            />
            <InvRow
              label="SWING"
              value={`${SW_START} PER RUN`}
              hint="never stored"
              color="text-cyan-300"
            />
            <p className="mt-2 text-[9px] leading-relaxed text-lime-100/50">
              Nothing here converts to money. No purchases exist in this game.
            </p>
          </Panel>

          <Panel title="SEAL ECONOMY — EARN · SPEND · NEVER SELL">
            <ul className="space-y-1 text-[10px] leading-relaxed text-lime-100/80">
              <li>· Earned: +1 per row cleared · +3 per wall sealed</li>
              <li>· Spent: bay unlocks 9 / 24 / 54 SE · re-lay 3 SE</li>
              <li>· Spent: powers 6 + 16 + 10 + 12 = 44 SE</li>
              <li>· Spent: 4 SE a SPARE RAM press, unbounded</li>
              <li>· Never sold. Seals buy walls and powers, nothing else.</li>
            </ul>
          </Panel>

          <PowersPanel meta={m} onBuy={buyPower} />

          <Panel title="BAYS — UNLOCK TABLE (L10)">
            <div className="grid grid-cols-2 gap-2">
              {[1, 2, 3, 4].map((b) => {
                const unlocked = m.bays.includes(b);
                const cost = BAY_COST[b];
                return (
                  <div
                    key={b}
                    className={`border-2 p-2 ${
                      unlocked
                        ? "border-lime-400/60 bg-lime-900/20"
                        : "border-neutral-700 bg-neutral-900/40"
                    }`}
                  >
                    <div className="font-pixel text-[8px] text-lime-200">
                      BAY {b}
                    </div>
                    <div className="mt-1 text-[10px] text-lime-100/70">
                      {BAY_NAME[b]}
                    </div>
                    <div className="mt-1 text-[9px] text-lime-100/50">
                      LAYOUT v{(m.layoutIndex[b] ?? 0) + 1}
                    </div>
                    {b === 1 ? (
                      <div className="mt-1 text-[9px] text-lime-300">SEED — FREE</div>
                    ) : unlocked ? (
                      <div className="mt-1 text-[9px] text-lime-300">UNLOCKED ✓</div>
                    ) : (
                      <div className="mt-1 text-[9px] text-amber-300">
                        LOCKED · {cost} SE
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Panel>

          <Panel title="LIFETIME LEDGER">
            <InvRow label="RUNS" value={m.stats.runs} color="text-lime-200" />
            <InvRow label="BRICKS BROKEN" value={m.stats.bricks} color="text-lime-200" />
            <InvRow label="ROWS CLEARED" value={m.stats.rows} color="text-lime-200" />
            <InvRow label="WALLS SEALED" value={m.stats.wallsSealed} color="text-lime-200" />
            <InvRow label="RAMS LOST" value={m.stats.ramsLost} color="text-red-300" />
            <InvRow
              label="PERFECT RUNS (SEALED, 0 LOST)"
              value={m.stats.perfectRuns}
              color="text-yellow-200"
            />
            <button
              data-testid="export-save-side"
              onClick={() => exportSave(m, "brickbreak-save.json")}
              className="pixel-btn mt-3 w-full bg-cyan-950 px-2 py-2 text-[8px] text-cyan-200"
            >
              ⤓ EXPORT SAVE → brickbreak-save.json
            </button>
            <button
              data-testid="reset-save"
              onClick={resetSave}
              className={`pixel-btn mt-2 w-full px-2 py-2 text-[8px] ${
                confirmReset ? "bg-red-900 text-red-100" : "bg-neutral-900 text-neutral-400"
              }`}
            >
              {confirmReset ? "SURE? CLICK AGAIN" : "RESET PROGRESS"}
            </button>
          </Panel>
        </aside>
      </main>

      <footer className="border-t-4 border-lime-500/20 px-4 py-4 text-center">
        <p className="mx-auto max-w-3xl text-[10px] leading-relaxed text-lime-100/50">
          This demo is a game economy only. It does not produce income, health,
          or real-world environmental outcomes — a broken brick is a variable in
          a save file. No purchases · no ads · no accounts · free entrance, free
          exit — nothing decays while you are away. Loop arithmetic from the
          Brick Break incorporation form (design v1, 2026-10-01).
        </p>
      </footer>
    </div>
  );
}

/* ----------------------------- run screen -------------------------------- */

function RunScreen({
  run,
  meta,
  notice,
  onEnd,
  onSpareRam,
}: {
  run: RunState;
  meta: Meta;
  notice: string | null;
  onEnd: () => void;
  onSpareRam: () => void;
}) {
  const p = meta.powers;
  /* M3 THE TALLY BOARD — every value here is already published */
  const bricksLeft = run.bricks.filter((b) => !b.dead).length;
  const seToBay2 = Math.max(0, BAY_COST[2] - meta.se);
  return (
    <div className="relative z-20 flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2 border-2 border-lime-500/20 p-2 text-[10px] sm:grid-cols-4">
        <div>
          <span className="text-lime-100/50">SWING </span>
          <span className="font-pixel text-cyan-300">
            {run.sw}/{run.granted}
          </span>
          <div className="mt-1 h-2 w-full border border-cyan-500/40 bg-black/50">
            <div
              className="h-full bg-cyan-400"
              style={{ width: `${(run.sw / run.granted) * 100}%` }}
            />
          </div>
        </div>
        <div>
          <span className="text-lime-100/50">BRICKS </span>
          <span className="font-pixel text-lime-300">{run.bricksBroken}</span>
        </div>
        <div>
          <span className="text-lime-100/50">RETURNS · LOST </span>
          <span className="font-pixel text-cyan-300">
            {run.returns} · {run.ramsLost}
          </span>
        </div>
        <div>
          <span className="text-lime-100/50">SEALS THIS RUN </span>
          <span className="font-pixel text-lime-300">
            {run.rowsCleared + (run.wallSealed ? 3 : 0)}
          </span>
        </div>
      </div>

      <div className="border-2 border-lime-500/20 bg-black/40 p-2 font-pixel text-[9px] leading-relaxed text-lime-100/80">
        <span className="text-amber-300">RK +{run.runRk}</span>
        <span className="mx-2 text-lime-100/30">·</span>
        <span className="text-neutral-300">RB +{run.runRb}</span>
        <span className="mx-2 text-lime-100/30">·</span>
        <span className="text-lime-200">DZ +{run.runDz}</span>
        <span className="mx-2 text-lime-100/30">·</span>
        <span className="text-lime-100/50">
          BAY {run.bay} {BAY_NAME[run.bay]}
        </span>
      </div>

      <div className="min-h-4 text-[10px] text-yellow-200/90">
        {notice ?? (run.resting ? "RAM ON CART — SPACE / CLICK TO LAUNCH · ← → OR MOUSE TO MOVE" : "")}
      </div>

      {/* M3 THE TALLY BOARD — prints only published numbers, pays no unit */}
      {p.m3 > 0 && (
        <div
          data-testid="tally-board"
          className="border-2 border-dashed border-lime-500/40 bg-lime-950/20 p-2 font-pixel text-[8px] leading-relaxed text-lime-200"
        >
          TALLY BOARD · SW {run.sw} · BRICKS {run.bricksBroken} · {run.sw} SW LEFT,{" "}
          {bricksLeft} BRICKS TO A SEAL · SE TO BAY 2: {seToBay2}
          <span className="ml-1 text-lime-100/40">
            ({run.speed.toFixed(1)} PX/S RAM · {run.returns} RETURNS · {run.ramsLost}{" "}
            LOST)
          </span>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[9px] text-lime-100/40">
          SE {meta.se} IN THE BANK · {meta.dz} DZ IN THE PILE
        </span>
        <div className="flex flex-wrap gap-2">
          <button
            data-testid="spare-ram"
            onClick={onSpareRam}
            disabled={meta.se < M4_COST || run.spareArmed}
            className={`pixel-btn px-3 py-2 text-[8px] ${
              meta.se >= M4_COST && !run.spareArmed
                ? "bg-lime-800 text-lime-50"
                : "bg-neutral-900 text-neutral-500"
            }`}
            title={`M4 THE SPARE RAM — ${M4_COST} SE, charged only when pressed`}
          >
            {run.spareArmed
              ? `SPARE RAM ARMED ✓`
              : `🪵 SPARE RAM ${M4_COST} SE`}
            <span className="ml-1 text-[7px] opacity-70">
              ({run.m4Uses} USED · HAVE {meta.se})
            </span>
          </button>
          <button
            data-testid="end-run"
            onClick={onEnd}
            className="pixel-btn bg-neutral-900 px-3 py-2 text-[8px] text-neutral-300"
          >
            END RUN {run.sw > 0 ? `(−${run.sw} SW FORFEITED)` : ""}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------- start screen ------------------------------- */

function StartScreen({
  meta,
  selectedBay,
  upkeepPaid,
  onSelectBay,
  onStart,
  onExport,
}: {
  meta: Meta;
  selectedBay: number;
  upkeepPaid: { rb: number; dz: number } | null;
  onSelectBay: (b: number) => void;
  onStart: () => void;
  onExport: () => void;
}) {
  return (
    <div className="relative z-20 mt-3 flex flex-col items-center gap-3 py-2 text-center">
      <p className="font-pixel text-sm text-lime-300">
        RUN: take down the wall, lay it back
      </p>
      <ul className="space-y-1 text-[11px] leading-relaxed text-lime-100/80">
        <li>THE WALL IS THE RUN · 30 SWING · 1 PER CART RETURN · 5 PER LOST RAM</li>
        <li>SWING 30 PER RUN · ROW CLEARED +1 SE +4 SW · 9 SE OPENS BAY 2</li>
        <li>ROW CLEARED +1 SE · WALL SEALED +3 SE · RUN ENDS AT ONCE</li>
        <li>UPKEEP AT RUN START: −16 RB · −8 DZ (FLOORS AT 0)</li>
        <li>DUST PATCHES THE CART: 5 DZ → +6 PX WIDTH (MAX 3 PER RUN)</li>
        <li>BRICK YIELDS: W +2 RK +1 DZ · C +3 RB +2 DZ · L +1 RK +1 RB +1 DZ</li>
      </ul>

      {upkeepPaid && (
        <p className="border border-amber-500/40 bg-amber-950/30 px-2 py-1 text-[10px] text-amber-200">
          LAST RUN UPKEEP PAID: −{upkeepPaid.rb} RB · −{upkeepPaid.dz} DZ · ROLLED ON
        </p>
      )}

      <div className="flex flex-wrap items-center justify-center gap-2">
        {meta.bays.map((b) => (
          <button
            key={b}
            data-testid={`bay-select-${b}`}
            onClick={() => onSelectBay(b)}
            className={`pixel-btn px-3 py-2 text-[9px] ${
              selectedBay === b
                ? "bg-lime-300 text-neutral-950"
                : "bg-neutral-900 text-lime-300"
            }`}
          >
            BAY {b} {BAY_NAME[b]} · v{(meta.layoutIndex[b] ?? 0) + 1}
          </button>
        ))}
      </div>

      <button
        data-testid="start-run"
        onClick={onStart}
        className="pixel-btn blink bg-lime-300 px-6 py-4 text-sm text-neutral-950"
      >
        ▶ START RUN — BAY {selectedBay} {BAY_NAME[selectedBay]}
      </button>

      <p className="text-[10px] text-lime-100/50">
        YARD WALL: {meta.coursesLaid} COURSES · {meta.bricksLaid} BRICKS LAID
        {meta.badges.length > 0 ? ` · ${meta.badges.join(" · ")}` : ""}
      </p>
      <p className="text-[10px] text-lime-100/50">
        Runs: {meta.stats.runs} · Bricks broken: {meta.stats.bricks} · SE: {meta.se}
      </p>
      <div className="flex gap-2">
        <button
          data-testid="export-save-start"
          onClick={onExport}
          className="pixel-btn bg-cyan-950 px-3 py-2 text-[8px] text-cyan-200"
        >
          ⤓ EXPORT SAVE
        </button>
      </div>
    </div>
  );
}

/* --------------------------- intermission -------------------------------- */

function IntermissionScreen({
  meta,
  lastRun,
  notice,
  onLayCourse,
  onBuyFrame,
  onUnlockBay,
  onReLay,
  onBackToYard,
  onExport,
}: {
  meta: Meta;
  lastRun: RunSummary | null;
  notice: string | null;
  onLayCourse: () => void;
  onBuyFrame: (t: 2 | 3) => void;
  onUnlockBay: (b: number) => void;
  onReLay: (b: number) => void;
  onBackToYard: () => void;
  onExport: () => void;
}) {
  const canCourse = meta.rk >= COURSE.rk && meta.rb >= COURSE.rb && meta.dz >= COURSE.dz;
  const reasonText =
    lastRun?.reason === "seal"
      ? "WALL SEALED — RUN ENDED AT ONCE"
      : lastRun?.reason === "sw"
        ? "SWING DEPLETED"
        : "RUN ENDED EARLY";
  return (
    <div className="relative z-20 flex flex-col gap-3">
      <div className="border-2 border-lime-500/30 bg-black/40 p-3 text-center">
        <h2 className="font-pixel text-sm text-lime-300">RUN COMPLETE</h2>
        {lastRun && (
          <>
            <p className="mt-2 text-[11px] text-lime-100/80">
              {reasonText} · BAY {lastRun.bay} {BAY_NAME[lastRun.bay]}
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-lime-100/70">
              BRICKS {lastRun.bricks} · ROWS {lastRun.rows} · RAMS LOST{" "}
              {lastRun.ramsLost} · RETURNS {lastRun.returns}
            </p>
            <p className="mt-1 text-[11px] leading-relaxed">
              <span className="text-amber-300">RK +{lastRun.runRk}</span>
              <span className="mx-1 text-lime-100/30">·</span>
              <span className="text-neutral-300">RB +{lastRun.runRb}</span>
              <span className="mx-1 text-lime-100/30">·</span>
              <span className="text-lime-200">DZ +{lastRun.runDz}</span>
              <span className="mx-1 text-lime-100/30">·</span>
              <span className="text-lime-300">
                SE +{lastRun.sealsRun}
                {lastRun.wallSealed ? " +3 SEAL" : ""}
              </span>
            </p>
            <p className="mt-1 text-[9px] text-lime-100/50">
              {lastRun.reason === "sw"
                ? "ALL SWING SPENT — NOTHING CARRIES OVER"
                : `${lastRun.forfeited} SWING FORFEITED AT RUN END — THE DESIGN`}
            </p>
          </>
        )}
      </div>

      {/* INTERMISSION ECONOMY — every button shows price and shortfall */}
      <div className="border-2 border-amber-500/40 bg-amber-950/20 p-3">
        <h3 className="font-pixel text-[9px] text-amber-300">
          INTERMISSION ECONOMY — ALL PRICES IN LOOP UNITS
        </h3>

        <p className="mt-2 font-pixel text-[8px] text-lime-200">RECLAIM-WALL COURSE</p>
        <p className="mt-1 text-[10px] text-lime-100/70">
          25 RK + 10 RB + 8 DZ → one course on the yard wall · unbounded sink ·
          chalk badge every 10 courses
        </p>
        <button
          data-testid="lay-course"
          onClick={onLayCourse}
          disabled={!canCourse}
          className={`pixel-btn mt-2 w-full px-2 py-2 text-[9px] ${
            canCourse ? "bg-amber-700 text-amber-50" : "bg-neutral-900 text-neutral-500"
          }`}
        >
          {canCourse
            ? "▶ LAY A COURSE (25 RK + 10 RB + 8 DZ)"
            : `COURSE: 25 RK + 10 RB + 8 DZ — SHORT ${
                Math.max(0, COURSE.rk - meta.rk)
              } RK · ${Math.max(0, COURSE.rb - meta.rb)} RB · ${Math.max(0, COURSE.dz - meta.dz)} DZ`}
        </button>
        <p className="mt-1 text-[9px] text-lime-100/50">
          LAID: {meta.coursesLaid} COURSES · {meta.bricksLaid} BRICKS
          {meta.badges.length > 0 ? ` · ${meta.badges.join(" · ")}` : ""}
        </p>

        <p className="mt-3 font-pixel text-[8px] text-lime-200">CART FRAMES — EARNED ONLY</p>
        <div className="mt-1 grid gap-2 sm:grid-cols-2">
          {(
            [
              [2, FRAME2, "68 PX"],
              [3, FRAME3, "80 PX"],
            ] as Array<[2 | 3, { rk: number; rb: number; dz: number }, string]>
          ).map(([tier, cost, px]) => {
            const owned = meta.cartTier >= tier;
            const afford = meta.rk >= cost.rk && meta.rb >= cost.rb && meta.dz >= cost.dz;
            return (
              <button
                key={tier}
                data-testid={`buy-frame-${tier}`}
                onClick={() => onBuyFrame(tier)}
                disabled={owned || !afford}
                className={`pixel-btn px-2 py-2 text-[8px] ${
                  owned
                    ? "bg-lime-900/30 text-lime-400"
                    : afford
                      ? "bg-amber-800 text-amber-100"
                      : "bg-neutral-900 text-neutral-500"
                }`}
              >
                {owned
                  ? `FRAME T${tier} FITTED ✓ (BASE ${px})`
                  : afford
                    ? `▶ FRAME T${tier} — ${cost.rk} RK + ${cost.rb} RB + ${cost.dz} DZ`
                    : `FRAME T${tier}: ${cost.rk} RK + ${cost.rb} RB + ${cost.dz} DZ — SHORT ${Math.max(
                        0,
                        cost.rk - meta.rk,
                      )} RK · ${Math.max(0, cost.rb - meta.rb)} RB · ${Math.max(
                        0,
                        cost.dz - meta.dz,
                      )} DZ`}
              </button>
            );
          })}
        </div>
        <p className="mt-1 text-[9px] text-lime-100/50">
          Cart base 56 → 68 → 80 px. A wider cart is earned with loop units, never
          money — it removes no step and opens no gate (L6).
        </p>

        <p className="mt-3 font-pixel text-[8px] text-lime-200">
          BAY UNLOCKS + RE-LAY — CONTENT, NEVER POWER
        </p>
        <div className="mt-1 grid gap-2 sm:grid-cols-2">
          {[2, 3, 4].map((b) => {
            const unlocked = meta.bays.includes(b);
            const cost = BAY_COST[b];
            const afford = meta.se >= cost;
            return (
              <div key={b} className="border border-lime-500/20 p-2">
                <div className="text-[9px] text-lime-100/70">
                  BAY {b} {BAY_NAME[b]} · v{(meta.layoutIndex[b] ?? 0) + 1}
                </div>
                {unlocked ? (
                  <button
                    data-testid={`re-lay-${b}`}
                    onClick={() => onReLay(b)}
                    disabled={meta.se < RELAY_COST}
                    className={`pixel-btn mt-1 w-full px-1 py-1 text-[8px] ${
                      meta.se >= RELAY_COST
                        ? "bg-lime-900 text-lime-200"
                        : "bg-neutral-900 text-neutral-500"
                    }`}
                  >
                    {meta.se >= RELAY_COST
                      ? `▶ RE-LAY — 3 SE`
                      : `RE-LAY 3 SE — SHORT ${RELAY_COST - meta.se} SE`}
                  </button>
                ) : (
                  <button
                    data-testid={`unlock-bay-${b}`}
                    onClick={() => onUnlockBay(b)}
                    disabled={!afford}
                    className={`pixel-btn mt-1 w-full px-1 py-1 text-[8px] ${
                      afford
                        ? "bg-lime-300 text-neutral-950"
                        : "bg-neutral-900 text-neutral-500"
                    }`}
                  >
                    {afford
                      ? `▶ UNLOCK — ${cost} SE`
                      : `UNLOCK ${cost} SE — SHORT ${cost - meta.se} SE`}
                  </button>
                )}
              </div>
            );
          })}
        </div>
        <p className="mt-1 text-[9px] text-lime-100/50">
          SE: {meta.se} banked · {meta.seEarned} earned all-time. Re-lay cycles the
          bay's published layouts; the 3 SE is spent for real.
        </p>
      </div>

      <div className="min-h-5 text-center text-[10px] text-yellow-200/90">
        {notice ?? ""}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          data-testid="export-save-intermission"
          onClick={onExport}
          className="pixel-btn bg-cyan-950 px-3 py-3 text-[8px] text-cyan-200"
        >
          ⤓ EXPORT SAVE
        </button>
        <button
          data-testid="start-next-run"
          onClick={onBackToYard}
          className="pixel-btn blink bg-lime-300 px-4 py-3 text-xs text-neutral-950"
        >
          ▶ BACK TO YARD — READY NEXT RUN
        </button>
      </div>
    </div>
  );
}

/* ------------------------------ LOOP panel ------------------------------- */

function LoopPanel({
  selectedBay,
  powers,
}: {
  selectedBay: number;
  powers: Powers;
}) {
  const c = BAY_CEILING[selectedBay];
  const counts = brickCounts(selectedBay);
  return (
    <section className="border-2 border-lime-500/30 bg-black/30 p-4">
      <h2 className="font-pixel text-[10px] text-lime-300">
        THE LOOP — WALL IN → MATERIALS OUT → WALL OUT
      </h2>
      <div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr]">
        <StageCard
          title="INPUTS"
          accent="text-cyan-300"
          lines={[
            "Time: one run — no clock",
            "Skill: where you return the ram",
            "Seed: bay 1 · cart tier 1 · 30 SW per run",
          ]}
        />
        <Arrow />
        <StageCard
          title="TRANSFORMATION"
          accent="text-amber-300"
          lines={[
            "Ram strike breaks a brick",
            "W +2 RK +1 DZ · C +3 RB +2 DZ · L +1 RK +1 RB +1 DZ",
            "Fixed layouts · published rates",
            "No randomness anywhere",
          ]}
        />
        <Arrow />
        <StageCard
          title="OUTPUTS"
          accent="text-lime-300"
          lines={[
            "RK · RB · DZ — banked per brick",
            "SE: +1 row · +3 wall sealed",
            "Sinks: upkeep · patches · courses",
            "Frames · bay unlocks · re-lay",
          ]}
        />
        <Arrow />
        <StageCard
          title="REINVESTMENT"
          accent="text-emerald-300"
          lines={[
            "Dust patches the cart (5 DZ → +6 px)",
            "Row clear pays back +4 SW",
            "Upkeep returns a working cart",
            "Seals unlock walls — never sold",
          ]}
        />
      </div>

      <div className="mt-3 grid gap-2 lg:grid-cols-2">
        <div className="border-2 border-lime-500/20 bg-lime-950/20 p-2 text-[10px] leading-relaxed text-lime-100/80">
          <p className="font-pixel text-[8px] text-lime-200">
            BALANCE ARITHMETIC (BAY 1, PER RUN — COMPETENT: 24 BRICKS, 3 ROWS, 2 LOST RAMS)
          </p>
          <p className="mt-1">
            FAUCETS: RK +28 · RB +28 · DZ +32 · SE +3 · SW 42 (30 + 3×4)
          </p>
          <p>
            SINKS: RB −16 UPKEEP · DZ −8 UPKEEP −15 PATCHES · SW −42 (32 RETURNS + 2×5) · SE 0
          </p>
          <p>NET BEFORE COURSES: RK +28 · RB +12 · DZ +9</p>
          <p>
            ONE COURSE (−25 RK −10 RB −8 DZ) → RK +3 · RB +2 · DZ +1 ={" "}
            <span className="text-lime-300">+6 UNITS HELD</span>
          </p>
          <p className="mt-1 font-pixel text-[8px] text-yellow-200">
            PUBLISHED BAND: +6 TO +71 UNITS HELD (BAY 1)
          </p>
          <p>
            +6 competent + course · +28 full clear + course · +49 competent, no
            course · +71 full clear, no course
          </p>
          <p className="mt-1 text-lime-100/60">
            Swing closes exactly every run: granted = 30 + 4 × rows; sunk =
            returns + 5 × lost + forfeited. Nothing carries over.
          </p>
        </div>

        <div className="border-2 border-lime-500/20 bg-lime-950/20 p-2 text-[10px] leading-relaxed text-lime-100/80">
          <p className="font-pixel text-[8px] text-lime-200">
            CURRENT BAY CEILING (ONE FULL CLEAR)
          </p>
          <p>
            BAY {selectedBay} {BAY_NAME[selectedBay]}:{" "}
            <span className="text-lime-300">
              RK {c.rk} · RB {c.rb} · DZ {c.dz} · SE {c.se}
            </span>{" "}
            · {c.bricks} BRICKS · {c.sw} SW AVAILABLE
          </p>
          <p className="mt-1 text-lime-100/60">
            THIS BAY: {counts.W} WHOLE · {counts.C} CRUMBLE · {counts.L} LIME —
            the ceiling is set by the wall, not by a clock.
          </p>
          <div className="mt-2 grid grid-cols-4 gap-1 text-[9px]">
            {[1, 2, 3, 4].map((b) => {
              const cc = BAY_CEILING[b];
              return (
                <div
                  key={b}
                  className={`border p-1 ${
                    b === selectedBay
                      ? "border-lime-400/70 bg-lime-900/30 text-lime-200"
                      : "border-neutral-700 text-lime-100/50"
                  }`}
                >
                  <div className="font-pixel text-[7px]">BAY {b}</div>
                  <div>RK {cc.rk}</div>
                  <div>RB {cc.rb}</div>
                  <div>DZ {cc.dz}</div>
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-lime-100/60">
            Cart frames absorb 820 units in total (T2 220 + T3 600) ≈ 17 competent
            runs; the reclaim wall takes 43 units per course with no cap — no unit
            is created that no sink can consume (C2).
          </p>
          <p className="mt-2 text-[9px] text-yellow-200/80">
            Nothing here converts to money; no purchases exist in this game.
          </p>
        </div>
      </div>

      {/* arcade-powers.md §7 item 5 — the ceiling sentence, verbatim */}
      <p
        data-testid="powers-ceiling-line"
        className="mt-3 border-2 border-amber-500/40 bg-amber-950/20 p-2 font-pixel text-[8px] leading-relaxed text-amber-200"
      >
        POWERS — the ceiling is the wall — 30 bricks on bay 1, with every power on
        <span className="ml-1 text-amber-100/50">
          · M1 {powers.m1}/2 · M2 {powers.m2 ? "OWNED" : "—"} · M3{" "}
          {powers.m3 ? "OWNED" : "—"} · 35 RK · 35 RB · 40 DZ · 8 SE on bay 1
        </span>
      </p>
    </section>
  );
}

/* --------------------------- small pieces -------------------------------- */

function PowersPanel({
  meta,
  onBuy,
}: {
  meta: Meta;
  onBuy: (id: "m1" | "m2" | "m3") => void;
}) {
  const p = meta.powers;
  return (
    <Panel title="POWERS — EARNED WITH SEALS, NEVER SOLD">
      <p className="mb-2 text-[9px] leading-relaxed text-lime-100/50">
        Four powers, priced in SE — the currency finishing masonry pays. They
        move what you can DO, never what the wall can PAY: the ceiling is the
        wall, 30 bricks and 35 RK on bay 1, in every power state.
      </p>

      <PowerRow
        testid="power-buy-m1"
        name="M1 THE SIGHT LINE"
        state={p.m1 >= 2 ? "r2/2 · MAX" : p.m1 === 1 ? "r1/2" : "NOT OWNED"}
        effect={
          p.m1 === 0
            ? "A dotted line shows where the ram will travel before you release it — one bounce, then two at rank 2."
            : p.m1 === 1
              ? `The dotted line now shows ${M1_BOUNCES[1]} bounce. Rank 2 shows ${M1_BOUNCES[2]}.`
              : `The dotted line shows ${M1_BOUNCES[2]} bounces. Max rank.`
        }
        price={p.m1 >= 2 ? null : M1_COST[p.m1 + 1]}
        disabledLabel={`M1 r${p.m1 + 1} NEEDS ${M1_COST[p.m1 + 1]} SE`}
        se={meta.se}
        onBuy={() => onBuy("m1")}
      />

      <PowerRow
        testid="power-buy-m2"
        name="M2 THE STEADY RAM"
        state={p.m2 ? "OWNED" : "NOT OWNED"}
        effect={`The ram travels at ${Math.round(M2_SPEED * 100)}% speed, so the cart has longer to slide under it. Time, not material.`}
        price={p.m2 ? null : M2_COST}
        disabledLabel={`M2 NEEDS ${M2_COST} SE`}
        se={meta.se}
        onBuy={() => onBuy("m2")}
      />

      <PowerRow
        testid="power-buy-m3"
        name="M3 THE TALLY BOARD"
        state={p.m3 ? "OWNED" : "NOT OWNED"}
        effect="The board prints Swing, bricks, bricks to a seal and SE to bay 2 before you commit. Zero units."
        price={p.m3 ? null : M3_COST}
        disabledLabel={`M3 NEEDS ${M3_COST} SE`}
        se={meta.se}
        onBuy={() => onBuy("m3")}
      />

      <div className="mt-2 border-2 border-dashed border-cyan-500/40 bg-cyan-950/20 p-2">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-pixel text-[8px] text-cyan-200">
            M4 THE SPARE RAM
          </span>
          <span className="font-pixel text-[8px] text-cyan-300">
            {M4_COST} SE A PRESS · UNBOUNDED
          </span>
        </div>
        <p className="mt-1 text-[9px] leading-relaxed text-lime-100/70">
          The next lost ram costs 0 SW instead of {SW_LOST_RAM}. Pressed inside a
          run, charged only when pressed, one armed at a time. It buys run fuel
          back at {M4_COST} SE — never a brick, and never the Swing grant.
        </p>
        <p className="mt-1 text-[9px] text-lime-100/40">
          Not a purchase — no rank to own. The unbounded sink for a player who
          already has every wall.
        </p>
      </div>

      <p className="mt-2 text-[9px] leading-relaxed text-lime-100/40">
        Finite power list: 6 + 16 + 10 + 12 = 44 SE (A20). Cheapest first: M1 r1
        6 → M2 10 → M3 12 → M1 r2 16. No power sets a brick&apos;s yield, a row&apos;s
        Seal or the Swing grant (A15, A16).
      </p>
    </Panel>
  );
}

function PowerRow({
  testid,
  name,
  state,
  effect,
  price,
  disabledLabel,
  se,
  onBuy,
}: {
  testid: string;
  name: string;
  state: string;
  effect: string;
  price: number | null;
  disabledLabel: string;
  se: number;
  onBuy: () => void;
}) {
  const afford = price !== null && se >= price;
  return (
    <div className="mt-2 border-2 border-lime-500/20 bg-lime-950/20 p-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-pixel text-[8px] text-lime-200">{name}</span>
        <span
          className={`font-pixel text-[8px] ${
            price === null ? "text-lime-400" : "text-amber-300"
          }`}
        >
          {state}
        </span>
      </div>
      <p className="mt-1 text-[9px] leading-relaxed text-lime-100/70">{effect}</p>
      {price !== null && (
        <button
          data-testid={testid}
          onClick={onBuy}
          disabled={!afford}
          className={`pixel-btn mt-2 w-full px-1 py-1 text-[8px] ${
            afford ? "bg-lime-300 text-neutral-950" : "bg-neutral-900 text-neutral-500"
          }`}
        >
          {afford ? `▶ BUY — ${price} SE` : `${disabledLabel} — HAVE ${se}`}
        </button>
      )}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-2 border-lime-500/30 bg-black/30 p-3">
      <h2 className="font-pixel text-[9px] text-lime-300">{title}</h2>
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
    <div className="flex items-baseline justify-between gap-2 border-b border-lime-500/10 py-1">
      <span className="text-[10px] text-lime-100/70">{label}</span>
      <span className={`font-pixel text-[10px] ${color} text-right`}>
        {value}
        {hint ? <span className="ml-1 text-[8px] text-lime-100/40">{hint}</span> : null}
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
    <div className="border-2 border-lime-500/20 bg-lime-950/20 p-2">
      <h3 className={`font-pixel text-[8px] ${accent}`}>{title}</h3>
      <ul className="mt-1 space-y-1 text-[10px] leading-tight text-lime-100/80">
        {lines.map((l) => (
          <li key={l}>· {l}</li>
        ))}
      </ul>
    </div>
  );
}

function Arrow() {
  return <div className="hidden self-center text-2xl text-lime-500 md:block">▶</div>;
}