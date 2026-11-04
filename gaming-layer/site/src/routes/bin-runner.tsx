import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { PiScaleBadge } from "~/components/pi-scale-badge";

/* ============================================================================
 * BIN RUNNER — a playable closed-loop demo (The Gaming Layer, spec v0.1 §5.1)
 *
 * Every number here is the spec's arithmetic:
 *   Correct sort  : +6 CS, +3 RS, costs 1 CH
 *   Wrong sort    : item -> Landfill, -2 CH, no material
 *   Perfect run   : 0 Landfill -> +1 GF
 *   CH            : starts at 20 per run, hard ceiling 20, unused CH lost
 *   Recycler      : 10 CS -> 5 CH, max 3 uses per run (in-run, same run)
 *   Assembler     : 40 CS + 25 RS -> 1 Repaired Jack, +5 ST, +12 CS offcut
 *   Bench tier 2  : 8 GF + 300 CS   (wired)
 *   Bench tier 3  : 20 GF + 800 CS  (display-only in this demo)
 *   Board unlocks : 40 / 120 / 200 ST -> boards 2 / 3 / 4 (ST is spent)
 *   Powers        : N1 30/70 ST · N2 45 ST · N3 40 ST · N4 5 ST a press
 *                   (arcade-powers.md §1 — earned only, ST only; every one of
 *                   them leaves 35 sorts / 258 CS / 105 RS untouched)
 * Meta persists in localStorage only. No purchases, no ads, no accounts.
 * ==========================================================================*/

type ChuteId = "copper" | "shell" | "chip";
type ItemKind = ChuteId;

interface ItemDef {
  id: ItemKind;
  name: string;
  chute: ChuteId;
  bg: string;
  border: string;
  text: string;
}
interface ChuteDef {
  label: string;
  key: string;
  bg: string;
  border: string;
  text: string;
  glow: string;
}
/* ARCADE POWERS (arcade-powers.md §1) — earned only, spent in ST only.
 * n1 / n2 / n3 are owned ranks; N4 is charged per press and never stored. */
interface Powers {
  n1: number; // THE STEADY HAND  · rank 0..2 · 30 / 70 ST
  n2: number; // THE CHUTE GUIDE  · rank 0..1 · 45 ST
  n3: number; // THE TALLY ROLL   · rank 0..1 · 40 ST
}
interface Meta {
  cs: number;
  rs: number;
  gf: number;
  st: number;
  stEarned: number;
  jacks: number;
  benchTier: 1 | 2 | 3;
  boards: number[];
  powers: Powers;
  stats: {
    runs: number;
    sorted: number;
    landfill: number;
    perfects: number;
    n4Presses: number;
  };
}
interface RunState {
  ch: number;
  landfill: number;
  sorted: number;
  recyclerUses: number;
  endsAt: number;
  item: ItemKind | null;
  nextSpawnAt: number;
  spent: number; // CH spent this run (the fuel ledger, N3)
  itemsSeen: number; // items offered this run (N2's first-8 window)
  fallEndsAt: number; // when the item reaches the chute unsorted (N1)
  n4Uses: number; // QUICK PICK presses this run — never persisted
}

/* ----------------------------- constants --------------------------------- */

const SAVE_KEY = "binrunner.save.v1";
const RUN_MS = 90_000;
const START_CH = 20;
const CH_CEILING = 20;
const SPAWN_MS = 3_000;
const FIRST_SPAWN_MS = 900;
const RECYCLE_LIMIT = 3;

const BOARD_COSTS: Record<number, number> = { 1: 0, 2: 40, 3: 120, 4: 200 };
const BOARD_NAMES: Record<number, string> = {
  1: "HOUSING ESTATE",
  2: "DOCKSIDE",
  3: "FACTORY YARD",
  4: "SKY GARDENS",
};

/* ---------------------- ARCADE POWERS — constants -------------------------
 * Copied verbatim from arcade-powers.md §7 (BUILD NOTES). Do not re-derive.
 * Every price is in ST, the currency a Repaired Jack pays. Nothing here
 * writes to ch, to a sort's 6 CS / 3 RS, or to a print's 5 ST.            */
const N1_COST = [0, 30, 70]; // ST by rank; rank 0 = not owned
const N2_COST = 45; // ST
const N3_COST = 40; // ST
const N4_COST = 5; // ST per press, unbounded
const N1_SPEED = [1.0, 0.7, 0.5]; // item fall speed by rank
const N2_GUIDE_ITEMS = 8; // first 8 items of a run labelled
const N4_SAVE_MS = 1200; // one press = 1.2 s saved

/* The read window. The descent is the seconds a player has to read an item
 * before it reaches the chute; a missed item pays nothing and costs nothing
 * (it simply never lands). Base 6000 ms is a build figure — the design marks
 * the exact fall curve display-only — and N1_SPEED only ever LENGTHENS it,
 * so owning N1 can never take material away (A9).                          */
const FALL_MS = 6000;

/* The run's fuel budget: 20 at start + 3 recycler uses x 5 = 35 CH, i.e.
 * 35 sorts. The ceiling in every power state (arcade-powers.md A3).        */
const FUEL_CEILING = START_CH + RECYCLE_LIMIT * 5;

const ITEMS: Record<ItemKind, ItemDef> = {
  copper: {
    id: "copper",
    name: "COPPER CABLE",
    chute: "copper",
    bg: "bg-amber-900",
    border: "border-amber-400",
    text: "text-amber-300",
  },
  shell: {
    id: "shell",
    name: "GREEN SHELL",
    chute: "shell",
    bg: "bg-emerald-900",
    border: "border-emerald-400",
    text: "text-emerald-300",
  },
  chip: {
    id: "chip",
    name: "BLUE CHIP",
    chute: "chip",
    bg: "bg-blue-900",
    border: "border-blue-400",
    text: "text-blue-300",
  },
};

const CHUTES: Record<ChuteId, ChuteDef> = {
  copper: {
    label: "COPPER CHUTE",
    key: "1",
    bg: "bg-amber-950",
    border: "border-amber-500",
    text: "text-amber-300",
    glow: "hover:bg-amber-900",
  },
  shell: {
    label: "SHELL CHUTE",
    key: "2",
    bg: "bg-emerald-950",
    border: "border-emerald-500",
    text: "text-emerald-300",
    glow: "hover:bg-emerald-900",
  },
  chip: {
    label: "CHIP CHUTE",
    key: "3",
    bg: "bg-blue-950",
    border: "border-blue-500",
    text: "text-blue-300",
    glow: "hover:bg-blue-900",
  },
};

const ITEM_KINDS: ItemKind[] = ["copper", "shell", "chip"];

const SEED_META: Meta = {
  cs: 0,
  rs: 0,
  gf: 0,
  st: 0,
  stEarned: 0,
  jacks: 0,
  benchTier: 1,
  boards: [1],
  powers: { n1: 0, n2: 0, n3: 0 },
  stats: { runs: 0, sorted: 0, landfill: 0, perfects: 0, n4Presses: 0 },
};

function loadMeta(): Meta {
  if (typeof window === "undefined") return SEED_META;
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return SEED_META;
    const parsed = JSON.parse(raw) as Partial<Meta>;
    if (typeof parsed.cs !== "number") return SEED_META;
    return {
      ...SEED_META,
      ...parsed,
      powers: { ...SEED_META.powers, ...(parsed.powers ?? {}) },
      stats: { ...SEED_META.stats, ...(parsed.stats ?? {}) },
    };
  } catch {
    return SEED_META;
  }
}

function randomItem(): ItemKind {
  return ITEM_KINDS[Math.floor(Math.random() * ITEM_KINDS.length)];
}

/* EXPORT SAVE — advertised by the spec's form (B2: binrunner-save.json);
 * wired here so the button really downloads the save file. */
function exportSave(meta: Meta) {
  const payload = {
    saveVersion: 1,
    cs: meta.cs,
    rs: meta.rs,
    gf: meta.gf,
    st: meta.st,
    stEarned: meta.stEarned,
    jacks: meta.jacks,
    benchTier: meta.benchTier,
    boards: [...meta.boards],
    powers: { ...meta.powers },
    stats: { ...meta.stats },
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "binrunner-save.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Defer the revoke: revoking synchronously right after click() can race the
  // browser's download start and abort the file (blob: URLs).
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ------------------------------ route ------------------------------------ */

export const Route = createFileRoute("/bin-runner")({
  component: BinRunner,
});

function BinRunner() {
  const [meta, setMeta] = useState<Meta>(SEED_META);
  const [hydrated, setHydrated] = useState(false);
  const [phase, setPhase] = useState<"start" | "run" | "intermission">("start");
  const [tick, setTick] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [lastSort, setLastSort] = useState<string | null>(null);
  const [lastRun, setLastRun] = useState<{
    sorted: number;
    landfill: number;
    perfect: boolean;
  } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const runRef = useRef<RunState | null>(null);
  const noticeTimer = useRef<number | null>(null);
  // Live meta for the run interval (powers are read from here, not a closure).
  const metaRef = useRef<Meta>(meta);
  metaRef.current = meta;

  // Live value of the run for rendering (re-rendered by `tick`).
  const run = runRef.current;

  useEffect(() => {
    setMeta(loadMeta());
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

  const flash = (msg: string) => {
    setNotice(msg);
    if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(null), 1500);
  };

  const finishRun = () => {
    const r = runRef.current;
    if (!r) return;
    const perfect = r.landfill === 0;
    setMeta((m) => ({
      ...m,
      gf: m.gf + (perfect ? 1 : 0),
      stats: {
        ...m.stats,
        runs: m.stats.runs + 1,
        sorted: m.stats.sorted + r.sorted,
        landfill: m.stats.landfill + r.landfill,
        perfects: m.stats.perfects + (perfect ? 1 : 0),
      },
    }));
    setLastRun({ sorted: r.sorted, landfill: r.landfill, perfect });
    runRef.current = null;
    setPhase("intermission");
  };

  const startRun = () => {
    runRef.current = {
      ch: START_CH,
      landfill: 0,
      sorted: 0,
      recyclerUses: 0,
      endsAt: Date.now() + RUN_MS,
      item: null,
      nextSpawnAt: Date.now() + FIRST_SPAWN_MS,
      spent: 0,
      itemsSeen: 0,
      fallEndsAt: 0,
      n4Uses: 0,
    };
    setLastRun(null);
    setLastSort(null);
    setNotice(null);
    setPhase("run");
    setTick((t) => t + 1);
  };

  const sortTo = (chute: ChuteId) => {
    const r = runRef.current;
    if (!r) return;
    if (!r.item) return;
    if (r.ch < 1) {
      flash("NO CHARGE — RECYCLE OR END RUN");
      return;
    }
    if (ITEMS[r.item].chute === chute) {
      r.ch -= 1;
      r.spent += 1;
      r.sorted += 1;
      setLastSort("CORRECT  +6 CS  +3 RS  -1 CH");
      setMeta((m) => ({ ...m, cs: m.cs + 6, rs: m.rs + 3 }));
    } else {
      r.ch = Math.max(0, r.ch - 2);
      r.spent += 2;
      r.landfill += 1;
      setLastSort("WRONG  -> LANDFILL  -2 CH");
    }
    r.item = null;
    setTick((t) => t + 1);
  };

  /* N4 THE QUICK PICK — 5 ST a press, charged only when pressed. It files the
   * item in front of you exactly as a correct sort does (1 CH -> 6 CS + 3 RS)
   * and pulls the next item 1.2 s closer. It adds no unit and no rate: the
   * player has simply bought the seconds with Stamps a print already paid. */
  const quickPick = () => {
    const r = runRef.current;
    if (!r || phase !== "run") return;
    if (!r.item) {
      flash("QUICK PICK — NO ITEM AT THE CHUTE");
      return;
    }
    if (r.ch < 1) {
      flash("QUICK PICK — NO CHARGE TO SORT WITH");
      return;
    }
    if (metaRef.current.st < N4_COST) {
      flash(`QUICK PICK NEEDS ${N4_COST} ST  (have ${metaRef.current.st})`);
      return;
    }
    const kind = r.item;
    r.ch -= 1;
    r.spent += 1;
    r.sorted += 1;
    r.n4Uses += 1;
    r.item = null;
    r.nextSpawnAt -= N4_SAVE_MS; // the 1.2 s saved is real: the stream moves up
    setMeta((m) => ({
      ...m,
      cs: m.cs + 6,
      rs: m.rs + 3,
      st: m.st - N4_COST,
      stats: { ...m.stats, n4Presses: m.stats.n4Presses + 1 },
    }));
    setLastSort(
      `QUICK PICK  ${ITEMS[kind].name} FILED  +6 CS +3 RS -1 CH  -${N4_COST} ST`,
    );
    setTick((t) => t + 1);
  };

  /* Powers are bought with Stamps and nothing else. One function for all of
   * N1 (two ranks) / N2 / N3 (one rank each); N4 has no purchase at all. */
  const buyPower = (id: "n1" | "n2" | "n3") => {
    const p = metaRef.current.powers;
    const price =
      id === "n1" ? N1_COST[Math.min(2, p.n1 + 1)] : id === "n2" ? N2_COST : N3_COST;
    const maxed = id === "n1" ? p.n1 >= 2 : p[id] >= 1;
    if (maxed) return;
    if (metaRef.current.st < price) {
      flash(`NEEDS ${price} ST  (have ${metaRef.current.st})`);
      return;
    }
    setMeta((m) => {
      const cur = m.powers;
      const already = id === "n1" ? cur.n1 >= 2 : cur[id] >= 1;
      if (already || m.st < price) return m;
      const next: Powers = { ...cur };
      if (id === "n1") next.n1 = Math.min(2, cur.n1 + 1);
      else next[id] = 1;
      return { ...m, st: m.st - price, powers: next };
    });
    const label =
      id === "n1"
        ? `N1 THE STEADY HAND r${Math.min(2, p.n1 + 1)}`
        : id === "n2"
          ? "N2 THE CHUTE GUIDE"
          : "N3 THE TALLY ROLL";
    flash(`${label} EARNED — ${price} ST SPENT`);
  };

  const recycle = () => {
    const r = runRef.current;
    if (!r) return;
    if (r.recyclerUses >= RECYCLE_LIMIT) {
      flash("RECYCLER USED UP THIS RUN (3/3)");
      return;
    }
    if (r.ch >= CH_CEILING) {
      flash("CHARGE ALREADY FULL");
      return;
    }
    if (meta.cs < 10) {
      flash("NEED 10 CS TO RECYCLE");
      return;
    }
    setMeta((m) => ({ ...m, cs: m.cs - 10 }));
    r.ch = Math.min(CH_CEILING, r.ch + 5);
    r.recyclerUses += 1;
    setLastSort("RECYCLED  10 CS -> +5 CH");
    setTick((t) => t + 1);
  };

  const assemble = () => {
    if (meta.cs < 40 || meta.rs < 25) {
      flash(`NEED 40 CS + 25 RS  (have ${meta.cs}/${meta.rs})`);
      return;
    }
    setMeta((m) => ({
      ...m,
      cs: m.cs - 40 + 12,
      rs: m.rs - 25,
      st: m.st + 5,
      stEarned: m.stEarned + 5,
      jacks: m.jacks + 1,
    }));
  };

  const unlockBoard = (board: number) => {
    const cost = BOARD_COSTS[board];
    if (meta.boards.includes(board)) return;
    if (meta.st < cost) {
      flash(`BOARD ${board} NEEDS ${cost} ST  (have ${meta.st})`);
      return;
    }
    setMeta((m) =>
      m.boards.includes(board) || m.st < cost
        ? m
        : {
            ...m,
            st: m.st - cost,
            boards: [...m.boards, board].sort((a, b) => a - b),
          },
    );
    flash(`BOARD ${board} UNLOCKED — ${BOARD_NAMES[board]}`);
  };

  const buyTier2 = () => {
    if (meta.benchTier >= 2) return;
    if (meta.gf < 8 || meta.cs < 300) {
      flash(`TIER 2 NEEDS 8 GF + 300 CS  (have ${meta.gf}/${meta.cs})`);
      return;
    }
    setMeta((m) =>
      m.benchTier >= 2 || m.gf < 8 || m.cs < 300
        ? m
        : { ...m, gf: m.gf - 8, cs: m.cs - 300, benchTier: 2 },
    );
    flash("BENCH RESTORED TO TIER 2");
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
    setPhase("start");
    setLastRun(null);
    setLastSort(null);
    setConfirmReset(false);
  };

  // The 90-second run clock + item spawner.
  useEffect(() => {
    const id = window.setInterval(() => {
      const r = runRef.current;
      if (!r) return;
      const now = Date.now();
      if (now >= r.endsAt) {
        finishRun();
        return;
      }
      if (!r.item && now >= r.nextSpawnAt) {
        r.item = randomItem();
        r.itemsSeen += 1;
        r.nextSpawnAt = now + SPAWN_MS;
        // N1 THE STEADY HAND: the descent IS the read window, and it only
        // ever gets longer (70% / 50% speed). No rate is touched.
        const speed = N1_SPEED[metaRef.current.powers.n1] ?? 1;
        r.fallEndsAt = now + FALL_MS / speed;
      }
      // an item that reaches the chute unsorted simply never lands: no
      // material, no charge spent, no unit created (a miss is not a sort).
      if (r.item && r.fallEndsAt > 0 && now >= r.fallEndsAt) {
        r.item = null;
        r.fallEndsAt = 0;
        r.landfill += 1;
        r.nextSpawnAt = now + 600;
        setLastSort("MISSED — FELL PAST THE CHUTE · NO MATERIAL · NO CHARGE");
      }
      setTick((t) => t + 1);
    }, 100);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keyboard chutes: 1 / 2 / 3.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "1") sortTo("copper");
      else if (e.key === "2") sortTo("shell");
      else if (e.key === "3") sortTo("chip");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const remaining =
    run && phase === "run"
      ? Math.max(0, Math.ceil((run.endsAt - Date.now()) / 1000))
      : 0;

  /* read-only snapshot for verification tooling — no gameplay effect */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const r = runRef.current;
    (window as unknown as Record<string, unknown>).__binrunner = {
      phase,
      powers: { ...meta.powers },
      st: meta.st,
      cs: meta.cs,
      rs: meta.rs,
      gf: meta.gf,
      jacks: meta.jacks,
      // the published ceiling in EVERY power state (arcade-powers.md A3)
      ceiling: { sorts: FUEL_CEILING, cs: 258, rs: 105, st: 20, gf: 1, prints: 4 },
      run: r
        ? {
            ch: r.ch,
            spent: r.spent,
            sorted: r.sorted,
            landfill: r.landfill,
            itemsSeen: r.itemsSeen,
            n4Uses: r.n4Uses,
          }
        : null,
    };
  });

  /* ------------------------------ render --------------------------------- */

  return (
    <div className="min-h-dvh bg-[#0a0f0a] text-lime-100" data-tick={tick}>
      <header className="flex flex-wrap items-center justify-between gap-3 border-b-4 border-lime-500/40 px-4 py-3">
        <div>
          <h1 className="font-pixel text-lg text-lime-300 drop-shadow-[3px_3px_0_rgba(0,0,0,0.9)]">
            BIN RUNNER
          </h1>
          <p className="text-[10px] uppercase tracking-[0.25em] text-lime-500/70">
            a closed loop you can play · Gaming Layer demo
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/brick-break"
            data-testid="link-to-brickbreak"
            className="pixel-btn bg-neutral-900 px-3 py-2 text-[9px] text-lime-300"
          >
            BRICK BREAK ▶
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
      <PiScaleBadge units={meta.cs} unit="CS" />

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* ------------------------- left: loop + cabinet ---------------- */}
        <div className="min-w-0">
          <LoopPanel powers={meta.powers} />
          <div className="relative mt-4 border-4 border-lime-500/50 bg-[#0c140c] p-4 shadow-[8px_8px_0_rgba(0,0,0,0.6)]">
            <div className="scanlines pointer-events-none absolute inset-0 z-10" />
            {phase === "start" && (
              <StartScreen
                meta={meta}
                onStart={startRun}
                onExport={() => exportSave(meta)}
              />
            )}
            {phase === "run" && run && (
              <RunScreen
                run={run}
                meta={meta}
                remaining={remaining}
                notice={notice}
                lastSort={lastSort}
                onSort={sortTo}
                onRecycle={recycle}
                onQuickPick={quickPick}
                onEnd={finishRun}
              />
            )}
            {phase === "intermission" && (
              <IntermissionScreen
                meta={meta}
                lastRun={lastRun}
                notice={notice}
                onAssemble={assemble}
                onNextRun={startRun}
                onExport={() => exportSave(meta)}
              />
            )}
          </div>
        </div>

        {/* ------------------------- right: economy ----------------------- */}
        <aside className="flex min-w-0 flex-col gap-4">
          <Panel title="INVENTORY — IN-GAME UNITS ONLY">
            <InvRow
              label="CS · COPPER STRAND"
              value={meta.cs}
              color="text-amber-300"
            />
            <InvRow
              label="RS · RECLAIM SHELL"
              value={meta.rs}
              color="text-emerald-300"
            />
            <InvRow
              label="GF · GOLD FLAKE"
              value={meta.gf}
              color="text-yellow-200"
            />
            <InvRow
              label="ST · STAMP"
              value={meta.st}
              hint={`${meta.stEarned} earned`}
              color="text-lime-300"
            />
            <InvRow
              label="CH · CHARGE"
              value={run && phase === "run" ? `${run.ch}/${CH_CEILING}` : "20 / run"}
              color="text-cyan-300"
            />
            <InvRow label="REPAIRED JACKS" value={meta.jacks} color="text-orange-300" />
            <p className="mt-2 text-[9px] leading-relaxed text-lime-100/50">
              Nothing here converts to money. No purchases exist in this game.
            </p>
          </Panel>

          <Panel title="STAMP ECONOMY — EARN · SPEND · NEVER SELL">
            <ul className="space-y-1 text-[10px] leading-relaxed text-lime-100/80">
              <li>· Earned: 5 ST per Repaired Jack printed</li>
              <li>· Spent: board unlocks (40 / 120 / 200 ST)</li>
              <li>· Spent: powers (30 + 70 + 45 + 40 = 185 ST)</li>
              <li>· Spent: 5 ST a QUICK PICK press, unbounded</li>
              <li>· Never sold. No unit -&gt; money conversion.</li>
            </ul>
          </Panel>

          <PowersPanel meta={meta} onBuy={buyPower} />

          <Panel title="BOARDS — UNLOCK TABLE (L10)">
            <div className="grid grid-cols-2 gap-2">
              {[1, 2, 3, 4].map((b) => {
                const unlocked = meta.boards.includes(b);
                const cost = BOARD_COSTS[b];
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
                      BOARD {b}
                    </div>
                    <div className="mt-1 text-[10px] text-lime-100/70">
                      {BOARD_NAMES[b]}
                    </div>
                    {b === 1 ? (
                      <div className="mt-1 text-[9px] text-lime-300">
                        SEED — FREE
                      </div>
                    ) : unlocked ? (
                      <div className="mt-1 text-[9px] text-lime-300">
                        UNLOCKED ✓
                      </div>
                    ) : (
                      <div className="mt-1 text-[9px] text-amber-300">
                        LOCKED · {cost} ST
                      </div>
                    )}
                    {b > 1 && !unlocked && (
                      <button
                        data-testid={`unlock-board-${b}`}
                        onClick={() => unlockBoard(b)}
                        disabled={meta.st < cost}
                        className="pixel-btn mt-2 w-full bg-neutral-800 px-1 py-1 text-[8px] text-lime-200"
                        title={`Spend ${cost} ST to unlock board ${b}`}
                      >
                        SPEND {cost} ST
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </Panel>

          <Panel title="BENCH — LONG-TERM GATE">
            <InvRow
              label="CHUTE BENCH"
              value={meta.benchTier === 1 ? "TIER 1" : meta.benchTier === 2 ? "TIER 2" : "TIER 3"}
              color="text-amber-300"
            />
            <p className="mt-1 text-[9px] leading-relaxed text-lime-100/50">
              The bench is restored with materials you earn — a long-term sink
              for the loop's working capital (C2).
            </p>
            <div className="mt-2 flex flex-col gap-2">
              <button
                data-testid="bench-tier-2"
                onClick={buyTier2}
                disabled={meta.benchTier >= 2}
                className={`pixel-btn px-2 py-2 text-[8px] ${
                  meta.benchTier >= 2
                    ? "bg-lime-900/30 text-lime-400"
                    : "bg-amber-950 text-amber-200"
                }`}
              >
                {meta.benchTier >= 2
                  ? "TIER 2 RESTORED ✓"
                  : "RESTORE TIER 2 — 8 GF + 300 CS"}
              </button>
              <div className="border-2 border-dashed border-neutral-700 p-2 text-[9px] leading-relaxed text-neutral-400">
                TIER 3 — 20 GF + 800 CS
                <span className="ml-1 text-neutral-600">
                  (display-only in this demo)
                </span>
              </div>
            </div>
          </Panel>

          <Panel title="LIFETIME LEDGER">
            <InvRow label="RUNS" value={meta.stats.runs} color="text-lime-200" />
            <InvRow label="ITEMS SORTED" value={meta.stats.sorted} color="text-lime-200" />
            <InvRow label="TO LANDFILL" value={meta.stats.landfill} color="text-red-300" />
            <InvRow label="PERFECT RUNS (+1 GF)" value={meta.stats.perfects} color="text-yellow-200" />
            <button
              data-testid="reset-save"
              onClick={resetSave}
              className={`pixel-btn mt-3 w-full px-2 py-2 text-[8px] ${
                confirmReset
                  ? "bg-red-900 text-red-100"
                  : "bg-neutral-900 text-neutral-400"
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
          or real-world environmental outcomes. No purchases · no ads · no
          accounts · free entrance, free exit — nothing decays while you are
          away. Loop arithmetic from layer-spec v0.1, Sample A (Bin Runner).
        </p>
      </footer>
    </div>
  );
}

/* --------------------------- subcomponents ------------------------------- */

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

function LoopPanel({ powers }: { powers: Powers }) {
  return (
    <section className="border-2 border-lime-500/30 bg-black/30 p-4">
      <h2 className="font-pixel text-[10px] text-lime-300">
        THE LOOP — INPUTS → TRANSFORMATION → OUTPUTS → REINVESTMENT
      </h2>
      <div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr]">
        <StageCard
          title="INPUTS"
          accent="text-cyan-300"
          lines={[
            "Time: one 90 s run",
            "Skill: sorting accuracy",
            "Seed capital: 20 CH, bench 1, board 1",
          ]}
        />
        <Arrow />
        <StageCard
          title="TRANSFORMATION"
          accent="text-amber-300"
          lines={[
            "Sort each item to its chute",
            "Correct: +6 CS · +3 RS · −1 CH",
            "Wrong: → Landfill · −2 CH",
            "Published rates · bounded by CH",
          ]}
        />
        <Arrow />
        <StageCard
          title="OUTPUTS"
          accent="text-lime-300"
          lines={[
            "CS · RS · GF (perfect runs)",
            "Repaired Jacks · Stamps",
            "Board unlocks",
            "Sinks: Landfill, CH, board costs",
          ]}
        />
        <Arrow />
        <StageCard
          title="REINVESTMENT"
          accent="text-emerald-300"
          lines={[
            "Recycler: 10 CS → 5 CH (3× per run)",
            "Assembler offcut: +12 CS per print",
            "ST → boards, never sold",
            "Waste re-enters as input",
          ]}
        />
      </div>
      <p className="mt-3 text-[10px] leading-relaxed text-lime-100/60">
        Closed-loop arithmetic (per run, ~30 sorts + ~3 prints): CS in 216
        (sorting 180 + offcut 36) vs sinks 150 → +66 held; RS in 90 vs 75+4 →
        +11 held. Held stock is working capital, absorbed by the bench tiers —
        no unit is created that no sink can consume (C2). Everything is
        in-game; nothing crosses to real money.
      </p>
      {/* arcade-powers.md §7 item 5 — the ceiling sentence, verbatim */}
      <p
        data-testid="powers-ceiling-line"
        className="mt-3 border-2 border-amber-500/40 bg-amber-950/20 p-2 font-pixel text-[8px] leading-relaxed text-amber-200"
      >
        POWERS — the ceiling is 35 sorts a run, with every power on
        <span className="ml-1 text-amber-100/50">
          · N1 {powers.n1}/2 · N2 {powers.n2 ? "OWNED" : "—"} · N3{" "}
          {powers.n3 ? "OWNED" : "—"} · 35 sorts · 258 CS · 105 RS · 20 ST · 1 GF
        </span>
      </p>
    </section>
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

function PowersPanel({
  meta,
  onBuy,
}: {
  meta: Meta;
  onBuy: (id: "n1" | "n2" | "n3") => void;
}) {
  const p = meta.powers;
  return (
    <Panel title="POWERS — EARNED WITH STAMPS, NEVER SOLD">
      <p className="mb-2 text-[9px] leading-relaxed text-lime-100/50">
        Four powers, priced in ST — the currency a printed Repaired Jack pays.
        They move what you can DO, never what the run can PAY: the ceiling is 35
        sorts, 258 CS, 105 RS in every power state.
      </p>

      <PowerRow
        testid="power-buy-n1"
        name="N1 THE STEADY HAND"
        state={p.n1 >= 2 ? "r2/2 · MAX" : p.n1 === 1 ? "r1/2" : "NOT OWNED"}
        effect={
          p.n1 === 0
            ? "Items fall at 70% then 50% speed — more seconds to read each item before it reaches the chute."
            : p.n1 === 1
              ? `Items now fall at ${Math.round(N1_SPEED[1] * 100)}% speed. Rank 2 makes it 50%.`
              : `Items fall at ${Math.round(N1_SPEED[2] * 100)}% speed. Max rank.`
        }
        price={p.n1 >= 2 ? null : N1_COST[p.n1 + 1]}
        disabledLabel={`N1 r${p.n1 + 1} NEEDS ${N1_COST[p.n1 + 1]} ST`}
        st={meta.st}
        onBuy={() => onBuy("n1")}
      />

      <PowerRow
        testid="power-buy-n2"
        name="N2 THE CHUTE GUIDE"
        state={p.n2 ? "OWNED" : "NOT OWNED"}
        effect={`The bin prints the correct chute on the first ${N2_GUIDE_ITEMS} items of every run. Information, not material.`}
        price={p.n2 ? null : N2_COST}
        disabledLabel={`N2 NEEDS ${N2_COST} ST`}
        st={meta.st}
        onBuy={() => onBuy("n2")}
      />

      <PowerRow
        testid="power-buy-n3"
        name="N3 THE TALLY ROLL"
        state={p.n3 ? "OWNED" : "NOT OWNED"}
        effect="The run ledger prints CH, sorts left in the ceiling and CS to the next jack before you commit. Zero units."
        price={p.n3 ? null : N3_COST}
        disabledLabel={`N3 NEEDS ${N3_COST} ST`}
        st={meta.st}
        onBuy={() => onBuy("n3")}
      />

      <div className="mt-2 border-2 border-dashed border-cyan-500/40 bg-cyan-950/20 p-2">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-pixel text-[8px] text-cyan-200">
            N4 THE QUICK PICK
          </span>
          <span className="font-pixel text-[8px] text-cyan-300">
            {N4_COST} ST A PRESS · UNBOUNDED
          </span>
        </div>
        <p className="mt-1 text-[9px] leading-relaxed text-lime-100/70">
          One item enters the bin instantly — about {N4_SAVE_MS / 1000} s saved.
          Charged only when pressed, inside a run, with an item at the chute.
          The sort it files pays exactly a sort&apos;s rate; nothing extra is
          created.
        </p>
        <p className="mt-1 text-[9px] text-lime-100/40">
          Not a purchase — no rank to own. The unbounded sink for a player who
          already has everything.
        </p>
      </div>

      <p className="mt-2 text-[9px] leading-relaxed text-lime-100/40">
        Finite power list: 30 + 70 + 45 + 40 = 185 ST (A20). Cheapest first: N1
        r1 30 → N3 40 → N2 45 → N1 r2 70. No power sets a per-sort rate, a
        print&apos;s Stamp or the fuel budget (A8).
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
  st,
  onBuy,
}: {
  testid: string;
  name: string;
  state: string;
  effect: string;
  price: number | null;
  disabledLabel: string;
  st: number;
  onBuy: () => void;
}) {
  const afford = price !== null && st >= price;
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
          {afford ? `▶ BUY — ${price} ST` : `${disabledLabel} — HAVE ${st}`}
        </button>
      )}
    </div>
  );
}

function StartScreen({
  meta,
  onStart,
  onExport,
}: {
  meta: Meta;
  onStart: () => void;
  onExport: () => void;
}) {
  return (
    <div className="relative z-20 flex flex-col items-center gap-4 py-6 text-center">
      <p className="font-pixel text-sm text-lime-300">RUN: one item at a time</p>
      <ul className="space-y-1 text-[11px] leading-relaxed text-lime-100/80">
        <li>CORRECT SORT → +6 CS · +3 RS · −1 CH</li>
        <li>WRONG SORT → LANDFILL · −2 CH · no material</li>
        <li>PERFECT RUN (0 LANDFILL) → +1 GF</li>
        <li>CHARGE: 20 per run · RECYCLE 10 CS → 5 CH (3× per run)</li>
        <li>PRINT JACKS FOR +5 ST · 40 ST UNLOCKS BOARD 2</li>
      </ul>
      <button
        data-testid="start-run"
        onClick={onStart}
        className="pixel-btn blink bg-lime-300 px-6 py-4 text-sm text-neutral-950"
      >
        ▶ START RUN — 90 SECONDS
      </button>
      <button
        data-testid="export-save"
        onClick={onExport}
        className="pixel-btn bg-cyan-950 px-3 py-2 text-[8px] text-cyan-200"
      >
        ⤓ EXPORT SAVE → binrunner-save.json
      </button>
      <p className="text-[10px] text-lime-100/50">
        Runs played: {meta.stats.runs} · Sorted: {meta.stats.sorted} · ST:{" "}
        {meta.st}
      </p>
    </div>
  );
}

function RunScreen({
  run,
  meta,
  remaining,
  notice,
  lastSort,
  onSort,
  onRecycle,
  onQuickPick,
  onEnd,
}: {
  run: RunState;
  meta: Meta;
  remaining: number;
  notice: string | null;
  lastSort: string | null;
  onSort: (c: ChuteId) => void;
  onRecycle: () => void;
  onQuickPick: () => void;
  onEnd: () => void;
}) {
  const mm = Math.floor(remaining / 60);
  const ss = remaining % 60;
  const item = run.item ? ITEMS[run.item] : null;
  const p = meta.powers;

  /* N1 THE STEADY HAND — the descent is the read window, and it only lengthens */
  const fallMs = FALL_MS / (N1_SPEED[p.n1] ?? 1);
  const fallPct = Math.max(
    0,
    Math.min(100, ((run.fallEndsAt - Date.now()) / fallMs) * 100),
  );

  /* N2 THE CHUTE GUIDE — the first 8 items of a run are labelled */
  const guideOn = p.n2 > 0 && run.itemsSeen <= N2_GUIDE_ITEMS && run.item !== null;
  const guide = guideOn && item ? CHUTES[item.chute] : null;

  /* N3 THE TALLY ROLL — every number here is already published */
  const sortsLeft = Math.max(0, FUEL_CEILING - run.spent);
  const csToJack = Math.max(0, 40 - meta.cs);
  const rsToJack = Math.max(0, 25 - meta.rs);

  return (
    <div className="relative z-20 flex flex-col gap-3">
      {/* HUD */}
      <div className="grid grid-cols-2 gap-2 border-2 border-lime-500/20 p-2 text-[10px] sm:grid-cols-4">
        <div>
          <span className="text-lime-100/50">TIME </span>
          <span className="font-pixel text-cyan-300">
            {mm}:{String(ss).padStart(2, "0")}
          </span>
        </div>
        <div>
          <span className="text-lime-100/50">CHARGE </span>
          <span className="font-pixel text-cyan-300">
            {run.ch}/{CH_CEILING}
          </span>
          <div className="mt-1 h-2 w-full border border-cyan-500/40 bg-black/50">
            <div
              className="h-full bg-cyan-400"
              style={{ width: `${(run.ch / CH_CEILING) * 100}%` }}
            />
          </div>
        </div>
        <div>
          <span className="text-lime-100/50">LANDFILL </span>
          <span className={`font-pixel ${run.landfill > 0 ? "text-red-400" : "text-lime-300"}`}>
            {run.landfill}
          </span>
        </div>
        <div>
          <span className="text-lime-100/50">SORTED </span>
          <span className="font-pixel text-lime-300">{run.sorted}</span>
        </div>
      </div>

      {/* item slot */}
      <div className="min-h-24 border-2 border-lime-500/20 bg-black/40 p-3 text-center">
        <div className="flex min-h-16 items-center justify-center">
          {item ? (
            <div className={`border-4 ${item.border} ${item.bg} px-6 py-3`}>
              <div className={`font-pixel text-xs ${item.text}`}>{item.name}</div>
              <div className="mt-2 text-[9px] text-lime-100/60">
                WHICH CHUTE?
              </div>
            </div>
          ) : (
            <span className="font-pixel text-[10px] text-lime-100/40">
              ··· NEXT ITEM ···
            </span>
          )}
        </div>
        {/* the descent — slower with N1, and it never pays a unit */}
        {item && (
          <div className="mx-auto mt-2 max-w-xs">
            <div className="h-2 w-full border border-amber-500/40 bg-black/50">
              <div
                className="h-full bg-amber-400"
                style={{ width: `${fallPct}%` }}
                data-testid="fall-bar"
              />
            </div>
            <div className="mt-1 flex justify-between text-[8px] text-lime-100/40">
              <span>READ WINDOW {(fallMs / 1000).toFixed(1)} S (N1 r{p.n1})</span>
              <span>A MISS PAYS NOTHING AND COSTS NOTHING</span>
            </div>
          </div>
        )}
        {guide && (
          <div
            data-testid="chute-guide"
            className={`mx-auto mt-2 max-w-xs border-2 ${guide.border} ${guide.bg} px-2 py-1 font-pixel text-[8px] ${guide.text}`}
          >
            GUIDE · ITEM {run.itemsSeen}/{N2_GUIDE_ITEMS} · CHUTE {guide.key} ·{" "}
            {guide.label}
          </div>
        )}
      </div>

      {/* chutes */}
      <div className="grid grid-cols-3 gap-2">
        {(Object.keys(CHUTES) as ChuteId[]).map((c) => {
          const d = CHUTES[c];
          const isGuide = guide !== null && item !== null && item.chute === c;
          return (
            <button
              key={c}
              data-chute={c}
              onClick={() => onSort(c)}
              className={`pixel-btn ${d.bg} ${d.border} ${d.glow} flex flex-col items-center gap-1 border-4 px-2 py-4 text-center ${
                isGuide ? "ring-2 ring-amber-300" : ""
              }`}
              title={`${d.label} (key ${d.key})`}
            >
              <span className={`font-pixel text-[8px] ${d.text}`}>{d.key}</span>
              <span className={`font-pixel text-[8px] ${d.text}`}>
                {d.label.split(" ")[0]}
              </span>
            </button>
          );
        })}
      </div>

      {/* N3 THE TALLY ROLL — prints only published numbers, pays no unit */}
      {p.n3 > 0 && (
        <div
          data-testid="tally-roll"
          className="border-2 border-dashed border-lime-500/40 bg-lime-950/20 p-2 font-pixel text-[8px] leading-relaxed text-lime-200"
        >
          TALLY ROLL · CH {run.ch}/{CH_CEILING} · SORTS LEFT IN CEILING{" "}
          {sortsLeft} · CS TO THE NEXT JACK {csToJack}
          <span className="ml-1 text-lime-100/40">
            (RS TO THE NEXT JACK {rsToJack} · {run.spent}/{FUEL_CEILING} CH SPENT)
          </span>
        </div>
      )}

      {/* feedback + controls */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="min-h-4 text-[10px] text-yellow-200/90">
          {notice ?? lastSort ?? ""}
        </span>
        <div className="flex flex-wrap gap-2">
          <button
            data-testid="quick-pick"
            onClick={onQuickPick}
            disabled={meta.st < N4_COST || !run.item}
            className={`pixel-btn px-3 py-2 text-[8px] ${
              meta.st >= N4_COST && run.item
                ? "bg-cyan-800 text-cyan-50"
                : "bg-neutral-900 text-neutral-500"
            }`}
            title={`N4 THE QUICK PICK — ${N4_COST} ST, charged only when pressed`}
          >
            ⚡ QUICK PICK {N4_COST} ST
            <span className="ml-1 text-[7px] opacity-70">
              ({run.n4Uses} USED · HAVE {meta.st})
            </span>
          </button>
          <button
            data-testid="recycle"
            onClick={onRecycle}
            disabled={run.recyclerUses >= RECYCLE_LIMIT}
            className="pixel-btn bg-emerald-950 px-3 py-2 text-[8px] text-emerald-300"
            title="10 CS → 5 CH, max 3 per run"
          >
            ♻ RECYCLE 10CS→5CH ({RECYCLE_LIMIT - run.recyclerUses} LEFT)
          </button>
          <button
            data-testid="end-run"
            onClick={onEnd}
            className="pixel-btn bg-neutral-900 px-3 py-2 text-[8px] text-neutral-300"
          >
            END RUN EARLY
          </button>
        </div>
      </div>
    </div>
  );
}

function IntermissionScreen({
  meta,
  lastRun,
  notice,
  onAssemble,
  onNextRun,
  onExport,
}: {
  meta: Meta;
  lastRun: { sorted: number; landfill: number; perfect: boolean } | null;
  notice: string | null;
  onAssemble: () => void;
  onNextRun: () => void;
  onExport: () => void;
}) {
  const canPrint = meta.cs >= 40 && meta.rs >= 25;
  return (
    <div className="relative z-20 flex flex-col gap-3">
      <div className="border-2 border-lime-500/30 bg-black/40 p-3 text-center">
        <h2 className="font-pixel text-sm text-lime-300">RUN COMPLETE</h2>
        {lastRun && (
          <p className="mt-2 text-[11px] text-lime-100/80">
            SORTED {lastRun.sorted} · LANDFILL {lastRun.landfill}
            {lastRun.perfect ? " · PERFECT RUN +1 GF" : ""}
          </p>
        )}
        <p className="mt-1 text-[9px] text-lime-100/50">
          Unused charge is lost at run end — that is the design. Materials stay
          yours (C5).
        </p>
      </div>

      <div className="border-2 border-amber-500/40 bg-amber-950/20 p-3">
        <h3 className="font-pixel text-[9px] text-amber-300">ASSEMBLER</h3>
        <p className="mt-1 text-[10px] text-lime-100/80">
          40 CS + 25 RS → 1 REPAIRED JACK · +5 ST · +12 CS OFFCUT
        </p>
        <button
          data-testid="assemble"
          onClick={onAssemble}
          disabled={!canPrint}
          className="pixel-btn mt-2 w-full bg-amber-800 px-2 py-3 text-[9px] text-amber-100"
        >
          {canPrint
            ? "▶ PRINT JACK (+5 ST)"
            : `NEED 40 CS + 25 RS  (${meta.cs}/40 · ${meta.rs}/25)`}
        </button>
        <p className="mt-2 text-[9px] leading-relaxed text-lime-100/60">
          PRINTS: {meta.jacks} · ST: {meta.st} <span className="text-lime-100/40">
            ({meta.stEarned} earned all-time)
          </span>{" "}
          · NEXT BOARD: 40 / 120 / 200 ST
        </p>
        <p className="mt-1 text-[9px] text-lime-100/40">
          Stamps are earned by printing, spent on boards, never sold.
        </p>
      </div>

      <div className="min-h-5 text-center text-[10px] text-yellow-200/90">
        {notice ?? ""}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          data-testid="export-save"
          onClick={onExport}
          className="pixel-btn bg-cyan-950 px-3 py-2 text-[8px] text-cyan-200"
        >
          ⤓ EXPORT SAVE → binrunner-save.json
        </button>
        <button
          data-testid="start-next-run"
          onClick={onNextRun}
          className="pixel-btn blink bg-lime-300 px-4 py-3 text-xs text-neutral-950"
        >
          ▶ START NEXT RUN
        </button>
      </div>
    </div>
  );
}