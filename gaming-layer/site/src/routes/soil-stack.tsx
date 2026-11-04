/**
 * SOIL STACK — the main compost loop of The Gaming Layer.
 *
 * The SIMPLE spine, on one screen, readable from the first frame:
 *   GLEAN (free scraps) → LOAD the bin green/brown → TURN until ripe →
 *   EMPTY as soil → FEED the bed → HARVEST the crop → back to GLEAN.
 *
 * Closed loop: the only faucet is GLEAN, free and unlimited (L1 — the pile
 * can never lock you out); the only sink is the work itself; soil is spent on
 * the bed, the bed pays scraps back, and a hot pile (1 brown per 3 loads)
 * ripens twice as fast. No clock, no timer, no decay: the bin advances only
 * on your turn, and it is sealed when the tab closes.
 *
 * Fictional integers only. This makes no claim about real soil, real waste or
 * real anything (layer rule L15). localStorage only, key soilstack.save.v1.
 *
 * ADV. HOT HEAP — the deluxe comical variant (the older, stranger build) — is
 * not linked anywhere. It is unlocked from this screen by the old cartridge
 * code, and only by someone who remembers it.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HotHeapAdv } from "~/components/hot-heap-adv";
import { PiScaleBadge } from "~/components/pi-scale-badge";

export const Route = createFileRoute("/soil-stack")({
  component: SoilStackPage,
});

/* ------------------------------- numbers ---------------------------------- */
const CAP = 6; // loads the bin holds
const GLEAN_SC = 4; // free, unlimited — the anti-lockout faucet
const GREEN_SC = 2; // a GREEN load costs 2 scraps
const BROWN_SC = 1; // a BROWN load costs 1 scrap + 2 browns
const BROWN_BR = 2;
const RIPE_PER_LOAD = 2; // RIPE = 2 × loads
const GAIN_COLD = 1; // ripeness per TURN, cold
const GAIN_HEATED = 2; // ripeness per TURN, hot
const HEAT_RATIO = 3; // hot iff browns × 3 ≥ loads
const BED_SO = 6; // FEED spends this soil
const BED_SC = 7; // HARVEST pays this...
const BED_BR = 1; // ...and this

const SAVE_KEY = "soilstack.save.v1";
const ADV_KEY = "soilstack.adv.v1";

type BedState = "empty" | "standing" | "ready";
interface Stack {
  sc: number;
  br: number;
  so: number;
  loads: number;
  browns: number;
  ripeness: number;
  bed: BedState;
  batches: number;
  harvests: number;
}

const SEED: Stack = {
  sc: 12,
  br: 2,
  so: 0,
  loads: 0,
  browns: 0,
  ripeness: 0,
  bed: "empty",
  batches: 0,
  harvests: 0,
};

const isHot = (s: Stack) => s.loads > 0 && s.browns * HEAT_RATIO >= s.loads;
const ripeAt = (s: Stack) => Math.max(1, RIPE_PER_LOAD * s.loads);
const gainFor = (s: Stack) => (isHot(s) ? GAIN_HEATED : GAIN_COLD);
const turnsLeft = (s: Stack) =>
  s.loads === 0 ? 0 : Math.ceil(Math.max(0, ripeAt(s) - s.ripeness) / gainFor(s));

function loadSave(): Stack {
  if (typeof window === "undefined") return SEED;
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return SEED;
    const p = JSON.parse(raw) as Partial<Stack>;
    const num = (v: unknown, d: number) => (typeof v === "number" && isFinite(v) ? v : d);
    return {
      sc: num(p.sc, SEED.sc),
      br: num(p.br, SEED.br),
      so: num(p.so, SEED.so),
      loads: num(p.loads, 0),
      browns: num(p.browns, 0),
      ripeness: num(p.ripeness, 0),
      bed: p.bed === "standing" || p.bed === "ready" ? p.bed : "empty",
      batches: num(p.batches, 0),
      harvests: num(p.harvests, 0),
    };
  } catch {
    return SEED;
  }
}

/* --------------------------------- page ----------------------------------- */
function SoilStackPage() {
  const [adv, setAdv] = useState(false);
  const [stack, setStack] = useState<Stack>(SEED);
  const [line, setLine] = useState("THE PILE IS SEALED AND WAITING — GLEAN FIRST.");
  const [notice, setNotice] = useState("");
  const [mounted, setMounted] = useState(false);

  /* restore once, on the client */
  useEffect(() => {
    setStack(loadSave());
    try {
      if (window.localStorage.getItem(ADV_KEY) === "1") setAdv(true);
    } catch {
      /* private mode — no save, no unlock memory */
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      window.localStorage.setItem(SAVE_KEY, JSON.stringify(stack));
    } catch {
      /* ignore */
    }
  }, [stack, mounted]);

  /* ------------------------------ the code -------------------------------- */
  const seq = useRef<string[]>([]);
  useEffect(() => {
    const CODE = [
      "arrowup",
      "arrowup",
      "arrowdown",
      "arrowdown",
      "arrowleft",
      "arrowright",
      "arrowleft",
      "arrowright",
      "b",
      "a",
    ];
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (!CODE.includes(k)) {
        seq.current = [];
        return;
      }
      const next = [...seq.current, k].slice(-CODE.length);
      seq.current = next;
      if (next.length === CODE.length && next.every((v, i) => v === CODE[i])) {
        seq.current = [];
        setAdv(true);
        try {
          window.localStorage.setItem(ADV_KEY, "1");
        } catch {
          /* ignore */
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* ------------------------------- actions -------------------------------- */
  const act = useCallback((fn: (m: Stack) => { m: Stack; line: string; notice?: string }) => {
    setStack((m) => {
      const r = fn(m);
      setLine(r.line);
      setNotice(r.notice ?? "");
      return r.m;
    });
  }, []);

  const glean = () =>
    act((m) => ({
      m: { ...m, sc: m.sc + GLEAN_SC },
      line: `GLEAN — SCRAPS +${GLEAN_SC} · FREE, UNLIMITED, NO GATE`,
    }));

  const loadGreen = () =>
    act((m) => {
      if (m.loads >= CAP) return { m, line, notice: `BIN FULL — ${m.loads}/${CAP} LOADS` };
      if (m.sc < GREEN_SC) return { m, line, notice: `NEEDS ${GREEN_SC} SCRAPS — GLEAN IS FREE` };
      const n = { ...m, sc: m.sc - GREEN_SC, loads: m.loads + 1 };
      return {
        m: n,
        line: `LOAD ${n.loads}/${CAP} GREEN — SCRAPS −${GREEN_SC} · ${isHot(n) ? "HEATED" : "COLD"}`,
      };
    });

  const loadBrown = () =>
    act((m) => {
      if (m.loads >= CAP) return { m, line, notice: `BIN FULL — ${m.loads}/${CAP} LOADS` };
      if (m.sc < BROWN_SC) return { m, line, notice: `NEEDS ${BROWN_SC} SCRAP — GLEAN IS FREE` };
      if (m.br < BROWN_BR) return { m, line, notice: `NEEDS ${BROWN_BR} BROWNS — HARVEST THE BED` };
      const n = { ...m, sc: m.sc - BROWN_SC, br: m.br - BROWN_BR, loads: m.loads + 1, browns: m.browns + 1 };
      return {
        m: n,
        line: `LOAD ${n.loads}/${CAP} BROWN — SCRAPS −1 · BROWNS −${BROWN_BR} · ${isHot(n) ? "HEATED ×2" : "COLD"}`,
      };
    });

  const turn = () =>
    act((m) => {
      if (m.loads === 0) return { m, line, notice: "THE BIN IS EMPTY — LOAD FIRST" };
      const gain = gainFor(m);
      const target = ripeAt(m);
      const n = { ...m, ripeness: Math.min(m.ripeness + gain, target) };
      return {
        m: n,
        line: `TURN — ${isHot(m) ? "HEATED" : "COLD"} +${gain} → RIPE ${n.ripeness}/${target}`,
      };
    });

  const empty = () =>
    act((m) => {
      if (m.loads === 0) return { m, line, notice: "THE BIN IS EMPTY — LOAD FIRST" };
      const target = ripeAt(m);
      if (m.ripeness < target) return { m, line, notice: `NOT RIPE YET — ${m.ripeness}/${target}` };
      const so = m.loads;
      const br = Math.floor(m.loads / 2);
      const n: Stack = {
        ...m,
        so: m.so + so,
        br: m.br + br,
        loads: 0,
        browns: 0,
        ripeness: 0,
        batches: m.batches + 1,
        bed: m.bed === "standing" ? "ready" : m.bed,
      };
      return {
        m: n,
        line: `EMPTY — SOIL +${so} · BROWNS +${br} · BATCH ${n.batches} DONE${n.bed === "ready" ? " · THE BED IS READY" : ""}`,
      };
    });

  const feed = () =>
    act((m) => {
      if (m.bed !== "empty") return { m, line, notice: "THIS BED IS ALREADY FED" };
      if (m.so < BED_SO) return { m, line, notice: `NEEDS ${BED_SO} SOIL — HAVE ${m.so} — EMPTY A BATCH` };
      return {
        m: { ...m, so: m.so - BED_SO, bed: "standing" },
        line: `FEED — SOIL −${BED_SO} → THE BED IS STANDING (READY WHEN A BATCH EMPTIES)`,
      };
    });

  const harvest = () =>
    act((m) => {
      if (m.bed === "empty") return { m, line, notice: "NOTHING PLANTED — FEED THE BED FIRST" };
      if (m.bed === "standing") return { m, line, notice: "STILL STANDING — EMPTY ANOTHER BATCH" };
      return {
        m: { ...m, sc: m.sc + BED_SC, br: m.br + BED_BR, bed: "empty", harvests: m.harvests + 1 },
        line: `HARVEST — SCRAPS +${BED_SC} · BROWNS +${BED_BR} · HARVEST ${m.harvests + 1}`,
      };
    });

  const reset = () => {
    setStack(SEED);
    setLine("A FRESH PILE — GLEAN FIRST.");
    setNotice("");
  };

  /* keyboard: 1 green · 2 brown · T turn · E empty · F feed · H harvest · G glean */
  const keys = useRef({ glean, loadGreen, loadBrown, turn, empty, feed, harvest });
  keys.current = { glean, loadGreen, loadBrown, turn, empty, feed, harvest };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const h = keys.current;
      if (k === "g") h.glean();
      else if (k === "1") h.loadGreen();
      else if (k === "2") h.loadBrown();
      else if (k === "t") h.turn();
      else if (k === "e") h.empty();
      else if (k === "f") h.feed();
      else if (k === "h") h.harvest();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* which step of the loop is next — the hint a newcomer needs */
  const next = useMemo(() => {
    const s = stack;
    if (s.bed === "ready") return "harvest";
    if (s.loads === 0) return s.sc >= GREEN_SC || s.br >= BROWN_BR ? "load" : "glean";
    if (s.ripeness >= ripeAt(s)) return "empty";
    if (s.bed === "standing") return "turn";
    if (s.bed === "empty" && s.so >= BED_SO) return "feed";
    return "turn";
  }, [stack]);

  if (adv) {
    return (
      <div className="min-h-dvh bg-[#0a0a06] text-amber-100">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-amber-500/40 bg-amber-950/40 px-4 py-2">
          <p data-testid="adv-banner" className="font-pixel text-[9px] text-amber-300">
            ADV. HOT HEAP — SECRET VARIANT · THE OLD PILE, DUG UP
          </p>
          <button
            data-testid="back-to-soil-stack"
            onClick={() => setAdv(false)}
            className="pixel-btn bg-neutral-900 px-3 py-2 text-[8px] text-lime-300"
          >
            ◀ BACK TO SOIL STACK
          </button>
        </div>
        <HotHeapAdv />
      </div>
    );
  }

  return (
    <main className="min-h-dvh bg-[#120d07] px-4 py-5 text-amber-100">
      <header className="mx-auto max-w-4xl">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b-2 border-amber-700/40 pb-3">
          <div>
            <h1 className="font-pixel text-lg text-lime-300 drop-shadow-[3px_3px_0_rgba(0,0,0,0.9)]">
              SOIL STACK
            </h1>
            <p className="mt-2 text-[10px] leading-relaxed text-amber-100/60">
              Scraps in, soil out. One bin behind the shed, one bed, one pile — no clock,
              no timer, nothing decays while you are away.
            </p>
          </div>
          <div className="flex gap-2 font-pixel text-[9px]">
            <span data-testid="sc" className="border-2 border-lime-500/40 bg-neutral-900 px-2 py-1 text-lime-300">
              SCRAPS {stack.sc}
            </span>
            <span data-testid="br" className="border-2 border-amber-700/50 bg-neutral-900 px-2 py-1 text-amber-300">
              BROWNS {stack.br}
            </span>
            <span data-testid="so" className="border-2 border-stone-500/40 bg-neutral-900 px-2 py-1 text-stone-300">
              SOIL {stack.so}
            </span>
          </div>
        </div>

        {/* the shared π display scale — the loop's own unit is untouched */}
        <PiScaleBadge units={stack.so} unit="SO" />

        {/* the loop, in six words, with the next step lit */}
        <ol data-testid="loop" className="mt-3 flex flex-wrap items-center gap-1 text-[8px] font-pixel">
          {[
            ["glean", "1 GLEAN"],
            ["load", "2 LOAD"],
            ["turn", "3 TURN"],
            ["empty", "4 EMPTY"],
            ["feed", "5 FEED"],
            ["harvest", "6 HARVEST"],
          ].map(([id, label]) => (
            <li
              key={id}
              data-step={id}
              className={`border-2 px-2 py-1 ${
                next === id
                  ? "border-lime-400 bg-lime-400/20 text-lime-200"
                  : "border-amber-800/40 text-amber-100/40"
              }`}
            >
              {label}
            </li>
          ))}
          <li className="text-amber-100/30">→ BACK TO 1</li>
        </ol>
      </header>

      <section className="mx-auto mt-4 grid max-w-4xl gap-3 md:grid-cols-3">
        {/* THE GATE */}
        <div className="border-2 border-lime-600/30 bg-neutral-900/50 p-3">
          <p className="font-pixel text-[10px] text-lime-300">THE GATE</p>
          <p className="mt-2 text-[10px] leading-relaxed text-amber-100/50">
            Free scraps, no limit, no gate: whatever you spend, you can always glean again.
          </p>
          <button
            data-testid="glean"
            onClick={glean}
            className="pixel-btn mt-3 w-full bg-lime-300 px-3 py-3 text-[10px] text-neutral-950"
          >
            GLEAN +{GLEAN_SC} SCRAPS
          </button>
        </div>

        {/* THE BIN */}
        <div className="border-2 border-amber-700/40 bg-neutral-900/50 p-3">
          <div className="flex items-baseline justify-between">
            <p className="font-pixel text-[10px] text-amber-300">THE BIN</p>
            <p data-testid="bin-loads" className="font-pixel text-[9px] text-amber-100/60">
              {stack.loads}/{CAP} LOADS · {stack.browns} BROWN
            </p>
          </div>

          <div className="mt-2 h-3 w-full border-2 border-amber-800/60 bg-black/50">
            <div
              className="h-full bg-amber-400"
              style={{ width: `${stack.loads ? Math.round((stack.ripeness / ripeAt(stack)) * 100) : 0}%` }}
            />
          </div>
          <p data-testid="ripeness" className="mt-1 font-pixel text-[8px] text-amber-100/60">
            RIPE {stack.loads ? stack.ripeness : 0}/{stack.loads ? ripeAt(stack) : 0} ·{" "}
            {stack.loads === 0 ? "EMPTY" : isHot(stack) ? "HEATED ×2" : "COLD ×1"} ·{" "}
            {turnsLeft(stack)} TURN{turnsLeft(stack) === 1 ? "" : "S"} LEFT
          </p>

          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              data-testid="load-green"
              onClick={loadGreen}
              className="pixel-btn bg-emerald-800 px-2 py-2 text-[8px] text-emerald-100"
            >
              LOAD GREEN −{GREEN_SC}
            </button>
            <button
              data-testid="load-brown"
              onClick={loadBrown}
              className="pixel-btn bg-amber-900 px-2 py-2 text-[8px] text-amber-100"
            >
              LOAD BROWN −1/−{BROWN_BR}
            </button>
            <button
              data-testid="turn"
              onClick={turn}
              className="pixel-btn bg-stone-700 px-2 py-2 text-[8px] text-stone-100"
            >
              TURN +{stack.loads ? gainFor(stack) : 1}
            </button>
            <button
              data-testid="empty"
              onClick={empty}
              className="pixel-btn bg-amber-600 px-2 py-2 text-[8px] text-neutral-950"
            >
              EMPTY AS SOIL
            </button>
          </div>
          <p className="mt-2 text-[9px] leading-relaxed text-amber-100/40">
            A HOT PILE — 1 BROWN IN 3 LOADS — RIPENS TWICE AS FAST.
          </p>
        </div>

        {/* THE BED */}
        <div className="border-2 border-stone-500/30 bg-neutral-900/50 p-3">
          <div className="flex items-baseline justify-between">
            <p className="font-pixel text-[10px] text-stone-300">THE BED</p>
            <p data-testid="bed-state" className="font-pixel text-[9px] text-amber-100/60">
              {stack.bed.toUpperCase()}
            </p>
          </div>
          <p className="mt-2 text-[10px] leading-relaxed text-amber-100/50">
            Soil feeds the bed; the bed crops; the crop hands you back scraps and browns for
            the next pile.
          </p>
          <button
            data-testid="feed"
            onClick={feed}
            disabled={stack.bed !== "empty"}
            className="pixel-btn mt-3 w-full bg-stone-700 px-2 py-2 text-[8px] text-stone-100"
          >
            FEED −{BED_SO} SOIL
          </button>
          <button
            data-testid="harvest"
            onClick={harvest}
            disabled={stack.bed !== "ready"}
            className="pixel-btn mt-2 w-full bg-emerald-700 px-2 py-2 text-[8px] text-emerald-50"
          >
            HARVEST +{BED_SC} SC +{BED_BR} BR
          </button>
          <p className="mt-2 font-pixel text-[8px] text-amber-100/40">
            BATCHES {stack.batches} · HARVESTS {stack.harvests}
          </p>
        </div>
      </section>

      <section className="mx-auto mt-3 max-w-4xl border-2 border-amber-800/30 bg-black/30 p-3">
        <p data-testid="line" className="font-pixel text-[9px] leading-relaxed text-amber-200">
          {line}
        </p>
        {notice ? (
          <p data-testid="notice" className="mt-1 font-pixel text-[8px] text-red-300">
            {notice}
          </p>
        ) : null}
        <p className="mt-2 text-[9px] leading-relaxed text-amber-100/40">
          Keys: G GLEAN · 1 GREEN · 2 BROWN · T TURN · E EMPTY · F FEED · H HARVEST. Your pile
          saves itself in this browser.
        </p>
      </section>

      <footer className="mx-auto mt-3 flex max-w-4xl flex-wrap items-center justify-between gap-2">
        <p data-testid="adv-hint" className="font-pixel text-[8px] text-amber-100/25">
          · RUMOUR: THERE IS AN OLDER, STRANGER PILE UNDER THIS ONE — A CODE FROM THE OLD
          CARTRIDGES STILL DIGS IT UP ·
        </p>
        <button
          data-testid="reset"
          onClick={reset}
          className="pixel-btn bg-neutral-900 px-3 py-2 text-[8px] text-neutral-400"
        >
          RESET PILE
        </button>
      </footer>
    </main>
  );
}
