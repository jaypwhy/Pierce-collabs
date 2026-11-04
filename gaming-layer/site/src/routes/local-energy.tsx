import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { PiScaleBadge } from "~/components/pi-scale-badge";
/* ============================================================================
 * LOCAL ENERGY — KETTLE LANE — a playable closed-loop demo (The Gaming Layer)
 *
 * Every number here is the design's constants block (local-energy/design.md —
 * copied, not re-derived):
 *   Faucets  : CRANK +1 charge an action, free, unlimited, ungated (F1 r1 +2,
 *              r2 +3, refused above the battery's size and the refusal creates
 *              NOTHING) · ANSWER pays `call` tallies if the battery was FULL at
 *              that instant, `call//2` if not — the doubling is a comparison,
 *              read BEFORE the spend
 *   Calls    : SMALL = cap/3 (2/4/6 charge) · BIG = 2cap/3 (4/8/12 charge);
 *              F2 THE SHED'S DRAW makes each cost 1 less, never below 1
 *   Spare    : EVERY answered call hands 1 charge back — the line's own loss is
 *              the next call's input (created = drawn − 2, exactly, per sheet)
 *   Ceiling  : SMALL + BIG = cap tallies a sheet — 6 / 12 / 18, with every power
 *              on. No power, rank or multiplier can add one tally.
 *   Powers   : F1 THE THROTTLE (12 / 36 TL, 2 ranks MAX) · F2 THE SHED'S DRAW
 *              (24 TL) · F3 THE FAST CRANK (2 TL per use, repeatable, charged
 *              only when pressed, saves exactly 1 action) · F4 THE METER (8 TL,
 *              zero units: prints numbers this design already publishes)
 *   Sinks    : the calls themselves · LEND TO THE LANE 8 charge (unbounded) ·
 *              SHED PLATE 3 TL (unbounded) · F3 2 TL a use · the price list
 *              (8/12/18/24/36/60 = 158 TL finite)
 *   Rhythm   : THE SHEET WAITS — no setInterval, no setTimeout, no Date.now
 *              anywhere in this file; closing the tab freezes the save and a
 *              half-answered sheet is still there at the same price.
 * No purchases, no ads, no accounts, no network: meta persists in
 * localStorage only (kettlelane.save.v1). This is a FICTIONAL street: a sheet
 * of six tallies is six numbers in a save file, the counters measure the save
 * and nothing else, and no claim about real electricity, bills, carbon or the
 * grid is made anywhere (design Part E guardrail).
 * ==========================================================================*/
type Phase = "start" | "lane" | "shed" | "loop";
type Which = "small" | "big";
interface Sheet {
  small: boolean;
  big: boolean;
}
interface Stats {
  sheets: number;
  calls: number;
  fullCalls: number;
  cranks: number;
  lended: number;
  f3Uses: number;
  sheetActions: number; // actions in the sheet in progress — printed when it closes
  sheetTl: number; // tallies the sheet in progress has paid — same
}
interface Meta {
  saveVersion: 1;
  ch: number;
  tl: number;
  tlEarned: number;
  street: 1 | 2 | 3;
  sheet: Sheet;
  crankRank: 0 | 1 | 2;
  draw: boolean;
  meter: boolean;
  plates: number;
  lends: number;
  badges: string[];
  stats: Stats;
}
/* ------------------------- constants (verbatim) --------------------------- */
const SAVE_KEY = "kettlelane.save.v1";
export const EXPORT_FILENAME = "kettlelane-save.json";
const STREET = {
  1: { name: "THE SHED", cap: 6, cost: 0 },
  2: { name: "THE TWO SHEDS", cap: 12, cost: 18 },
  3: { name: "THE LANE", cap: 18, cost: 60 },
} as const;
const SPARE = 1; // charge handed back after EVERY answered call
const CRANK_GAIN = [1, 2, 3]; // by F1 rank; rank 0 is NEVER anything but 1
const F1_COST = [0, 12, 36]; // by rank; 2 ranks MAX
const F2_COST = 24; // F2 THE SHED'S DRAW, 1 rank MAX
const F4_COST = 8; // F4 THE METER, 1 rank MAX
const F3_COST = 2; // TL per use, repeatable
const PLATE_COST = 3; // unbounded TL sink
const LEND_CH = 8; // unbounded charge sink
const BADGE_EVERY = 10;
const LEDGER_KEEP = 30;
const FINITE_TABLE = F4_COST + F1_COST[1] + STREET[2].cost + F2_COST + F1_COST[2] + STREET[3].cost; // 158
/* --------------------- derived rules (verbatim from the design) ----------- */
const capOf = (street: number) => STREET[street as 1 | 2 | 3].cap;
const smallOf = (cap: number) => cap / 3; // 2 / 4 / 6
const bigOf = (cap: number) => (2 * cap) / 3; // 4 / 8 / 12
const callCost = (call: number, draw: boolean) => Math.max(1, call - (draw ? 1 : 0));
const callTl = (call: number, full: boolean) => (full ? call : Math.floor(call / 2));
const gainOf = (rank: number) => CRANK_GAIN[rank] ?? 1;
const callOf = (cap: number, which: Which) => (which === "small" ? smallOf(cap) : bigOf(cap));
/* ------------------------------ seed -------------------------------------- */
const SEED_META: Meta = {
  saveVersion: 1,
  ch: 0,
  tl: 0,
  tlEarned: 0,
  street: 1,
  sheet: { small: false, big: false },
  crankRank: 0,
  draw: false,
  meter: false,
  plates: 0,
  lends: 0,
  badges: [],
  stats: { sheets: 0, calls: 0, fullCalls: 0, cranks: 0, lended: 0, f3Uses: 0, sheetActions: 0, sheetTl: 0 },
};
/* ----------------------- dev checks (L1 + the ceilings) ------------------- */
function devChecks(): void {
  /* eslint-disable no-console */
  console.assert(CRANK_GAIN[0] === 1, "L1: rank 0 CRANK must add exactly 1");
  console.assert(F3_COST > 0, "A9: F3 must cost something — it buys an action, never a payout");
  // L1: from an empty save, 2 cranks + 1 answer pay the first tally (3 actions)
  console.assert(smallOf(capOf(1)) <= 2 * CRANK_GAIN[0], "L1: the first tally must be 3 actions away");
  // A1: a sheet pays at most the battery's size, with every power on
  console.assert(
    [6, 12, 18].every((cap) => callTl(smallOf(cap), true) + callTl(bigOf(cap), true) === cap),
    "A1: SMALL + BIG at FULL must equal the battery's size",
  );
  // A2: the tallies a sheet pays are identical in every power state
  console.assert(
    [6, 12, 18].every((cap) => callTl(smallOf(cap), true) === cap / 3 && callTl(bigOf(cap), true) === (2 * cap) / 3),
    "A2: no power may appear in the payout lookup",
  );
  // A8: an answer is always paid for — a call never costs less than 1
  console.assert([1, 2, 3, 4, 6, 8, 12].every((c) => callCost(c, true) >= 1), "A8: a call cost is never below 1");
  // A10: the finite unlock table is 158 tallies
  console.assert(FINITE_TABLE === 158, "A10: the finite price list must total 158 TL");
  /* eslint-enable no-console */
}
/* ------------------------- persistence + export --------------------------- */
function cloneMeta(m: Meta): Meta {
  return { ...m, sheet: { ...m.sheet }, badges: [...m.badges], stats: { ...m.stats } };
}
function loadMeta(): Meta {
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return cloneMeta(SEED_META);
    const parsed = JSON.parse(raw) as Partial<Meta>;
    const s: Meta = { ...cloneMeta(SEED_META), ...parsed } as Meta;
    s.saveVersion = 1;
    s.street = (parsed.street === 2 || parsed.street === 3 ? parsed.street : 1) as 1 | 2 | 3;
    s.crankRank = (parsed.crankRank === 1 || parsed.crankRank === 2 ? parsed.crankRank : 0) as 0 | 1 | 2;
    s.draw = !!parsed.draw;
    s.meter = !!parsed.meter;
    s.badges = Array.isArray(parsed.badges) ? [...(parsed.badges as string[])] : [];
    s.stats = { ...SEED_META.stats, ...(parsed.stats ?? {}) };
    s.sheet = {
      small: !!parsed.sheet?.small,
      big: !!parsed.sheet?.big,
    };
    // sanitize the battery so a stale save can never strand a sheet
    const cap = capOf(s.street);
    s.ch = Math.max(0, Math.min(cap, Math.floor(s.ch || 0)));
    s.tl = Math.max(0, Math.floor(s.tl || 0));
    s.tlEarned = Math.max(s.tl, Math.floor(s.tlEarned || 0));
    s.plates = Math.max(0, Math.floor(s.plates || 0));
    s.lends = Math.max(0, Math.floor(s.lends || 0));
    return s;
  } catch {
    return cloneMeta(SEED_META);
  }
}
function exportSave(meta: Meta) {
  // Documented schema (design B2) — the open sheet is in the file on purpose:
  // a stranger can export, close the tab mid-sheet, reopen and compare.
  const payload = {
    saveVersion: meta.saveVersion,
    ch: meta.ch,
    tl: meta.tl,
    tlEarned: meta.tlEarned,
    street: meta.street,
    sheet: { small: meta.sheet.small, big: meta.sheet.big },
    crankRank: meta.crankRank,
    draw: meta.draw,
    meter: meta.meter,
    plates: meta.plates,
    lends: meta.lends,
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
  // browser's download start and abort the file (blob: URLs).
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
/* ------------------------------ route ------------------------------------- */
export const Route = createFileRoute("/local-energy")({
  component: LocalEnergy,
});
function LocalEnergy() {
  const [meta, setMeta] = useState<Meta>(SEED_META);
  const [hydrated, setHydrated] = useState(false);
  const [phase, setPhase] = useState<Phase>("start");
  const [ledger, setLedger] = useState<string[]>([
    "THE SHEET IS POSTED — CRANK THE BATTERY, THEN ANSWER BOTH CALLS",
  ]);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const metaRef = useRef<Meta>(meta);
  const phaseRef = useRef<Phase>(phase);
  const log = (line: string) => setLedger((l) => [...l.slice(-(LEDGER_KEEP - 1)), line]);
  /** run one action on the current meta; returns the next meta and the ledger line */
  const apply = (fn: (m: Meta) => { m: Meta; line: string; notice?: string }) => {
    const { m, line, notice: nt } = fn(metaRef.current);
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
      `SAVE LOADED — STREET ${m.street} · CHARGE ${m.ch}/${capOf(m.street)} · TALLIES ${m.tl} · SHEET ${
        m.sheet.small && m.sheet.big ? "CLOSED" : "OPEN"
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
  /* ------------------------------- the crank ------------------------------- */
  const crank = (fast: boolean) =>
    apply((m) => {
      const cap = capOf(m.street);
      const gain = gainOf(m.crankRank) * (fast ? 2 : 1);
      if (fast && m.tl < F3_COST) {
        return { m, line: "CRANK — FREE · UNLIMITED", notice: `F3 NEEDS ${F3_COST} TL — HAVE ${m.tl}` };
      }
      if (m.ch >= cap) {
        return { m, line: `CRANK — BATTERY FULL — ${cap}/${cap}`, notice: `BATTERY FULL — ${cap}/${cap}` };
      }
      const n = cloneMeta(m);
      if (fast) {
        n.tl -= F3_COST;
        n.stats.f3Uses += 1;
      }
      const before = n.ch;
      n.ch = Math.min(n.ch + gain, cap); // refused charge is NOT created
      const delta = n.ch - before;
      n.stats.cranks += 1;
      n.stats.sheetActions += 1;
      const refused = gain - delta;
      const tag = fast ? `F3 FAST CRANK −${F3_COST} TL · ` : "";
      return {
        m: n,
        line: `${tag}CRANK +${delta} → CHARGE ${n.ch}/${cap}${refused > 0 ? ` · ${refused} REFUSED — BATTERY FULL` : ""}`,
      };
    });
  /* ------------------------------- the answer ------------------------------ */
  const answer = (which: Which) =>
    apply((m) => {
      const cap = capOf(m.street);
      const call = callOf(cap, which);
      const cost = callCost(call, m.draw);
      const name = which === "small" ? "SMALL" : "BIG";
      if (m.sheet[which]) {
        return { m, line: `ANSWER ${name} — ALREADY ANSWERED THIS SHEET`, notice: `${name} IS ALREADY ANSWERED` };
      }
      if (m.ch < cost) {
        return { m, line: `ANSWER ${name} — NEEDS ${cost} CHARGE`, notice: `NEEDS ${cost} CHARGE — HAVE ${m.ch}` };
      }
      const n = cloneMeta(m);
      const full = n.ch === cap; // read BEFORE spending
      const paid = callTl(call, full);
      n.tl += paid;
      n.tlEarned += paid;
      n.ch = n.ch - cost + SPARE;
      n.sheet[which] = true;
      n.stats.calls += 1;
      if (full) n.stats.fullCalls += 1;
      n.stats.sheetActions += 1;
      n.stats.sheetTl += paid;
      let line = `ANSWER ${name} · ${full ? "FULL" : "NOT FULL"} → +${paid} TL · DREW ${cost} · LINE +${SPARE} → CHARGE ${n.ch}`;
      if (n.sheet.small && n.sheet.big) {
        line += ` — SHEET CLOSED · ${n.stats.sheetActions} ACTIONS · ${n.stats.sheetTl} TALLIES · NEW SHEET POSTED`;
        n.sheet = { small: false, big: false };
        n.stats.sheets += 1;
        n.stats.sheetActions = 0;
        n.stats.sheetTl = 0;
      }
      return { m: n, line };
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
      if (m.ch < LEND_CH) {
        return { m, line: `LEND — NEEDS ${LEND_CH} CHARGE`, notice: `NEEDS ${LEND_CH} CHARGE — HAVE ${m.ch}` };
      }
      const n = cloneMeta(m);
      n.ch -= LEND_CH;
      n.lends += 1;
      n.stats.lended += 1;
      n.badges = doBadge(n.badges, "LAMP", n.lends);
      return { m: n, line: `LEND TO THE LANE — ${LEND_CH} CHARGE → LAMP POST #${n.lends} LIT` };
    });
  const onPlate = () =>
    apply((m) => {
      if (m.tl < PLATE_COST) {
        return { m, line: `SHED PLATE — NEEDS ${PLATE_COST} TL`, notice: `NEEDS ${PLATE_COST} TL — HAVE ${m.tl}` };
      }
      const n = cloneMeta(m);
      n.tl -= PLATE_COST;
      n.plates += 1;
      n.badges = doBadge(n.badges, "PLATE", n.plates);
      return { m: n, line: `SHED PLATE — ${PLATE_COST} TL → PLATE #${n.plates} ON THE SHED DOOR` };
    });
  /* ------------------------------- unlocks -------------------------------- */
  const buy = (label: string, cost: number, mutate: (n: Meta) => void) =>
    apply((m) => {
      if (m.tl < cost) {
        return { m, line: `${label} — NEEDS ${cost} TL`, notice: `NEEDS ${cost} TL — HAVE ${m.tl}` };
      }
      const n = cloneMeta(m);
      n.tl -= cost;
      mutate(n);
      return { m: n, line: `${label} — ${cost} TL PAID FROM THE SHED DOOR` };
    });
  const onF4 = () => buy("F4 THE METER", F4_COST, (n) => (n.meter = true));
  const onF1a = () => buy("F1 THE THROTTLE — RANK 1", F1_COST[1], (n) => (n.crankRank = 1));
  const onStreet2 = () =>
    buy(`STREET 2 — ${STREET[2].name}`, STREET[2].cost, (n) => {
      n.street = 2;
      n.ch = Math.min(n.ch, capOf(2));
    });
  const onF2 = () => buy("F2 THE SHED'S DRAW", F2_COST, (n) => (n.draw = true));
  const onF1b = () => buy("F1 THE THROTTLE — RANK 2 (MAX)", F1_COST[2], (n) => (n.crankRank = 2));
  const onStreet3 = () =>
    buy(`STREET 3 — ${STREET[3].name}`, STREET[3].cost, (n) => {
      n.street = 3;
      n.ch = Math.min(n.ch, capOf(3));
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
    setLedger(["THE SHEET IS POSTED — CRANK THE BATTERY, THEN ANSWER BOTH CALLS"]);
    setNotice(null);
    setConfirmReset(false);
  };
  /* input: keyboard — the same keys as the button faces */
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const ph = phaseRef.current;
      if (ph === "start" && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        setPhase("lane");
        return;
      }
      if ((ph === "shed" || ph === "loop") && e.key === "Escape") {
        setPhase("lane");
        return;
      }
      if (ph !== "lane") return;
      const k = e.key.toLowerCase();
      if (k === "c") crank(false);
      else if (k === "1") answer("small");
      else if (k === "2") answer("big");
      else if (k === "f") crank(true);
      else if (k === "s") setPhase("shed");
      else if (k === "l") setPhase("loop");
      else if (k === "x") exportSave(metaRef.current);
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  /* ------------------------- the lane canvas ------------------------------ */
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;
    const m = metaRef.current;
    const cap = capOf(m.street);
    const small = smallOf(cap);
    const big = bigOf(cap);
    const full = m.ch === cap;
    const F5 = "5px 'Press Start 2P', monospace";
    const F4 = "4px 'Press Start 2P', monospace";
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = PAL.shed;
    ctx.fillRect(0, 0, 320, 240);
    /* HUD — two 8-px lines */
    ctx.font = F5;
    ctx.fillStyle = PAL.cream;
    ctx.fillText(`STREET ${m.street} · BATTERY ${m.ch}/${cap} · FULL? ${full ? "YES" : "NO"}`, 4, 10);
    ctx.fillStyle = PAL.lamp;
    ctx.fillText(`CHARGE ${m.ch} · TALLIES ${m.tl} · CEILING ${cap}`, 4, 20);
    /* the battery — cap slots of 10×14 in rows of six */
    ctx.fillStyle = PAL.slate;
    ctx.fillRect(4, 26, 150, 124);
    ctx.strokeStyle = PAL.copper;
    ctx.lineWidth = 1;
    ctx.strokeRect(4.5, 26.5, 149, 123);
    if (full) {
      ctx.fillStyle = PAL.copper;
      ctx.fillRect(6, 28, 146, 10);
      ctx.fillStyle = PAL.cream;
      ctx.font = F4;
      ctx.fillText("FULL — ANSWER NOW PAYS DOUBLE", 8, 36);
    }
    for (let i = 0; i < cap; i += 1) {
      const col = i % 6;
      const row = Math.floor(i / 6);
      const x = 10 + col * 12;
      const y = 44 + row * 17;
      if (i < m.ch) {
        ctx.fillStyle = PAL.copper;
        ctx.fillRect(x, y, 10, 13);
      } else {
        ctx.fillStyle = PAL.shed;
        ctx.fillRect(x, y, 10, 13);
        ctx.strokeStyle = PAL.cream;
        ctx.strokeRect(x + 0.5, y + 0.5, 9, 12);
      }
    }
    ctx.fillStyle = PAL.cream;
    ctx.font = F4;
    ctx.fillText(`BATTERY ${m.ch}/${cap}${full ? " — FULL" : ""}`, 10, 104);
    /* the crank wheel */
    const cx = 40;
    const cy = 126;
    ctx.strokeStyle = PAL.cream;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 1;
    for (let s = 0; s < 4; s += 1) {
      const a = (s * Math.PI) / 2 + Math.PI / 4;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * 11, cy + Math.sin(a) * 11);
      ctx.stroke();
    }
    ctx.fillStyle = PAL.lamp;
    ctx.font = F5;
    ctx.fillText(`[C] CRANK +${gainOf(m.crankRank)}`, 60, 122);
    ctx.fillStyle = PAL.cream;
    ctx.font = F4;
    ctx.fillText("FREE · NEVER GATED", 60, 132);
    /* the call sheet — a paper panel with two ruled lines */
    ctx.fillStyle = PAL.cream;
    ctx.fillRect(160, 26, 152, 92);
    ctx.strokeStyle = PAL.copper;
    ctx.strokeRect(160.5, 26.5, 151, 91);
    ctx.fillStyle = PAL.shed;
    ctx.font = F5;
    ctx.fillText("THE CALL SHEET", 166, 38);
    ctx.fillStyle = PAL.copper;
    ctx.fillRect(165, 42, 142, 1);
    const ruled = (which: Which, y: number, label: string, call: number) => {
      const cost = callCost(call, m.draw);
      const done = m.sheet[which];
      const pays = callTl(call, full);
      ctx.fillStyle = done ? PAL.slate : PAL.shed;
      ctx.font = F5;
      ctx.fillText(`${label} · ${cost} CH`, 166, y);
      ctx.fillStyle = done ? PAL.slate : full ? PAL.copper : PAL.slate;
      ctx.fillText(done ? "DONE" : `NOW +${pays}`, 268, y);
      ctx.fillStyle = done ? PAL.slate : PAL.shed;
      ctx.font = F4;
      ctx.fillText(`PAYS ${callTl(call, false)} (${call} IF FULL)`, 166, y + 9);
      if (done) {
        ctx.strokeStyle = PAL.slate;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(164, y - 4);
        ctx.lineTo(310, y - 4);
        ctx.stroke();
      }
    };
    ruled("small", 56, "SMALL", small);
    ruled("big", 86, "BIG", big);
    /* the street — six houses and one lamp post */
    ctx.fillStyle = PAL.slate;
    ctx.fillRect(160, 122, 152, 56);
    for (let h = 0; h < 6; h += 1) {
      const x = 168 + h * 23;
      const lit = m.lends > 0 && h < m.lends % 7;
      ctx.fillStyle = lit ? PAL.cream : PAL.shed;
      ctx.fillRect(x, 154, 16, 14);
      ctx.strokeStyle = PAL.copper;
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, 154.5, 15, 13);
      ctx.fillStyle = PAL.copper;
      ctx.beginPath();
      ctx.moveTo(x - 2, 154);
      ctx.lineTo(x + 8, 146);
      ctx.lineTo(x + 18, 154);
      ctx.closePath();
      ctx.fill();
      if (lit) {
        ctx.fillStyle = PAL.lamp;
        ctx.fillRect(x + 6, 159, 4, 4);
      }
    }
    ctx.fillStyle = PAL.cream;
    ctx.font = F4;
    ctx.fillText(`LAMPS ${m.lends} · PLATES ${m.plates}`, 166, 176);
    /* the action bar + the honest line */
    ctx.fillStyle = PAL.lamp;
    ctx.font = F4;
    ctx.fillText("[C] CRANK  [1] SMALL  [2] BIG  [F] FAST CRANK", 4, 188);
    ctx.fillStyle = PAL.cream;
    ctx.fillText("[S] SHED  [L] LOOP  [X] EXPORT THE SAVE", 4, 197);
    ctx.fillText("A SHEET IS SIX NUMBERS IN A SAVE FILE.", 4, 214);
    ctx.fillText("NOTHING HERE IS REAL POWER.", 4, 223);
    ctx.fillStyle = PAL.lamp;
    ctx.fillText("THE SHEET WAITS — NO NUMBER MOVES WHILE YOU ARE AWAY", 4, 233);
  }, [meta, phase]);
  /* ------------------------------ render ---------------------------------- */
  const m = meta;
  return (
    <div className="min-h-dvh bg-[#0b0e12] text-amber-100">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b-4 border-amber-500/40 px-4 py-3">
        <div>
          <h1 className="font-pixel text-lg text-amber-300 drop-shadow-[3px_3px_0_rgba(0,0,0,0.9)]">KETTLE LANE</h1>
          <p className="text-[10px] uppercase tracking-[0.25em] text-amber-500/70">
            local energy · crank → answer the sheet → cut tallies · Gaming Layer demo
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a href="/soil-stack" className="pixel-btn bg-neutral-900 px-3 py-2 text-[9px] text-lime-300">
            🌱 HOT HEAP ▶
          </a>
          <a href="/paper-airplane" className="pixel-btn bg-neutral-900 px-3 py-2 text-[9px] text-yellow-200">
            ✈ PAPER AIRPLANE ▶
          </a>
          <a href="/local-energy-design" data-testid="link-to-design" className="pixel-btn bg-neutral-900 px-3 py-2 text-[9px] text-cyan-300">
            ▤ THE DESIGN
          </a>
          <a href="/" className="pixel-btn bg-neutral-900 px-3 py-2 text-[9px] text-amber-300">
            ◀ BACK
          </a>
        </div>
      </header>

      {/* the shared π display scale — the loop's own unit is untouched */}
      <PiScaleBadge units={m.tl} unit="TL" tone="amber" />

      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6">
        {phase === "start" && (
          <StartScreen
            meta={m}
            onStart={() => setPhase("lane")}
            onExport={() => exportSave(metaRef.current)}
            onReset={resetSave}
            confirmReset={confirmReset}
          />
        )}
        {phase === "lane" && (
          <LaneScreen
            meta={m}
            notice={notice}
            ledger={ledger}
            onCrank={() => crank(false)}
            onFastCrank={() => crank(true)}
            onAnswer={answer}
            onLend={onLend}
            onPlate={onPlate}
            onShed={() => setPhase("shed")}
            onLoop={() => setPhase("loop")}
            onExport={() => exportSave(metaRef.current)}
            canvasRef={canvasRef}
          />
        )}
        {phase === "shed" && (
          <ShedScreen
            meta={m}
            onBack={() => setPhase("lane")}
            onF4={onF4}
            onF1a={onF1a}
            onStreet2={onStreet2}
            onF2={onF2}
            onF1b={onF1b}
            onStreet3={onStreet3}
            onLend={onLend}
            onPlate={onPlate}
            onExport={() => exportSave(metaRef.current)}
          />
        )}
        {phase === "loop" && (
          <div className="flex flex-col gap-4">
            <LoopPanel />
            <div className="flex items-center justify-between">
              <button data-testid="go-lane" onClick={() => setPhase("lane")} className="pixel-btn bg-amber-300 px-5 py-3 text-xs text-neutral-950">
                ↩ BACK TO THE LANE
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
  shed: "#2b1d12",
  copper: "#b06a2b",
  lamp: "#e0c040",
  slate: "#33404a",
  cream: "#e8e0c8",
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
  const cap = capOf(meta.street);
  return (
    <div className="relative z-20 mt-3 flex flex-col items-center gap-3 py-2 text-center">
      <p className="font-pixel text-sm text-amber-300">THE LOOP IN FIVE LINES</p>
      <ul className="space-y-1 text-[11px] leading-relaxed text-amber-100/80">
        <li>CRANK IS FREE AND UNLIMITED</li>
        <li>ANSWER THE SMALL CALL AND THE BIG CALL</li>
        <li>A CALL ANSWERED FROM A FULL BATTERY PAYS DOUBLE</li>
        <li>THE SHEET WAITS FOR EVER — NOT ONE NUMBER MOVES WHILE YOU ARE AWAY</li>
        <li>18 TALLIES OPENS STREET 2</li>
      </ul>
      <p className="max-w-xl border-2 border-amber-500/30 bg-amber-950/20 px-4 py-2 text-[10px] leading-relaxed text-amber-100/70">
        A SHEET IS SIX NUMBERS IN A SAVE FILE. NOTHING HERE IS REAL POWER — the charge and the tallies are two
        integers, the battery is a capacity you bought with tallies, and the sheet advances only while you press a
        key. This is a fictional street.
      </p>
      <p className="text-[10px] text-amber-100/50">
        SEED: STREET 1 · BATTERY {cap} · 0 CHARGE · 0 TALLIES · CRANK +1 · NO POWERS · SMALL {smallOf(cap)} / BIG{" "}
        {bigOf(cap)} CHARGE
      </p>
      <p className="max-w-xl text-center text-[10px] leading-relaxed text-amber-100/50">
        SHEETS CLOSED {meta.stats.sheets} · CALLS {meta.stats.calls} · FULL CALLS {meta.stats.fullCalls} · CRANKS{" "}
        {meta.stats.cranks} · F3 USES {meta.stats.f3Uses} · CHARGE {meta.ch} · TALLIES {meta.tl} (EARNED{" "}
        {meta.tlEarned}) · PLATES {meta.plates} · LAMPS {meta.lends}
      </p>
      <button data-testid="to-lane" onClick={onStart} className="pixel-btn bg-amber-300 px-6 py-4 text-sm text-neutral-950">
        ▶ TO THE LANE — STREET {meta.street} · BATTERY {cap}
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
        Keys in the lane: C CRANK · 1 ANSWER SMALL · 2 ANSWER BIG · F FAST CRANK ({F3_COST} TL) · S SHED · L LOOP · X
        EXPORT. No clock, no timer, no cooldown: the sheet waits for ever at its full published price.
      </p>
    </div>
  );
}
/* ------------------------------- lane screen ------------------------------ */
function LaneScreen({
  meta,
  notice,
  ledger,
  onCrank,
  onFastCrank,
  onAnswer,
  onLend,
  onPlate,
  onShed,
  onLoop,
  onExport,
  canvasRef,
}: {
  meta: Meta;
  notice: string | null;
  ledger: string[];
  onCrank: () => void;
  onFastCrank: () => void;
  onAnswer: (which: Which) => void;
  onLend: () => void;
  onPlate: () => void;
  onShed: () => void;
  onLoop: () => void;
  onExport: () => void;
  canvasRef: RefObject<HTMLCanvasElement | null>;
}) {
  const m = meta;
  const cap = capOf(m.street);
  const full = m.ch === cap;
  const small = smallOf(cap);
  const big = bigOf(cap);
  const smallCost = callCost(small, m.draw);
  const bigCost = callCost(big, m.draw);
  const cranksToFull = Math.max(0, Math.ceil((cap - m.ch) / gainOf(m.crankRank)));
  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="relative w-full max-w-3xl border-4 border-amber-500/50 bg-[#0d1117] p-4 shadow-[8px_8px_0_rgba(0,0,0,0.6)]">
        <div className="scanlines pointer-events-none absolute inset-0 z-10" />
        {/* HUD strip */}
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 font-pixel text-[8px] text-amber-100/80">
          <span data-testid="hud-street">
            STREET {m.street} — {STREET[m.street].name} · BATTERY {cap}
          </span>
          <span data-testid="charge-value" className="text-amber-200">
            CHARGE {m.ch}/{cap}
          </span>
          <span data-testid="battery-full" className={full ? "text-amber-300" : "text-cyan-300"}>
            FULL? {full ? "YES — PAYS DOUBLE" : "NO"}
          </span>
          <span data-testid="tallies-value" className="text-pink-300">
            TALLIES {m.tl}
          </span>
          <span>CEILING {cap} TALLIES A SHEET · NO SHED PART RAISES IT</span>
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
        {/* F4 THE METER — every value it prints is already published */}
        {m.meter && (
          <p data-testid="meter-line" className="mt-1 text-center font-pixel text-[8px] text-amber-300">
            CHARGE {m.ch}/{cap} · CRANKS TO FULL {cranksToFull} · SMALL NEEDS {smallCost} · BIG NEEDS {bigCost} ·
            ANSWERING FULL PAYS {small + big}
          </p>
        )}
        {/* the sheet, DOM-readable */}
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <div
            data-testid="sheet-small-state"
            className={`border-2 px-3 py-2 text-[9px] ${m.sheet.small ? "border-neutral-700 bg-neutral-900 text-neutral-500" : "border-amber-500/40 bg-amber-950/20 text-amber-100"}`}
          >
            SMALL CALL · {smallCost} CHARGE · PAYS {callTl(small, false)} ({small} IF FULL) ·{" "}
            {m.sheet.small ? "ANSWERED" : "OPEN"}
          </div>
          <div
            data-testid="sheet-big-state"
            className={`border-2 px-3 py-2 text-[9px] ${m.sheet.big ? "border-neutral-700 bg-neutral-900 text-neutral-500" : "border-amber-500/40 bg-amber-950/20 text-amber-100"}`}
          >
            BIG CALL · {bigCost} CHARGE · PAYS {callTl(big, false)} ({big} IF FULL) · {m.sheet.big ? "ANSWERED" : "OPEN"}
          </div>
        </div>
      </div>
      {/* action bar */}
      <div className="grid w-full max-w-3xl grid-cols-2 gap-2 sm:grid-cols-4">
        <button data-testid="crank-btn" onClick={onCrank} className="pixel-btn bg-[#3a2510] px-3 py-3 text-[9px] text-amber-200">
          [C] CRANK +{gainOf(m.crankRank)} — FREE · UNLIMITED
        </button>
        <button
          data-testid="answer-small"
          onClick={() => onAnswer("small")}
          disabled={m.sheet.small}
          className={`pixel-btn px-3 py-3 text-[9px] ${m.sheet.small ? "bg-neutral-950 text-neutral-600" : m.ch >= smallCost ? "bg-amber-700 text-amber-50" : "bg-neutral-900 text-neutral-500"}`}
        >
          [1] ANSWER SMALL {full ? `· FULL +${small}` : `· +${callTl(small, false)}`} · {smallCost} CH
        </button>
        <button
          data-testid="answer-big"
          onClick={() => onAnswer("big")}
          disabled={m.sheet.big}
          className={`pixel-btn px-3 py-3 text-[9px] ${m.sheet.big ? "bg-neutral-950 text-neutral-600" : m.ch >= bigCost ? "bg-amber-300 text-neutral-950" : "bg-neutral-900 text-neutral-500"}`}
        >
          [2] ANSWER BIG {full ? `· FULL +${big}` : `· +${callTl(big, false)}`} · {bigCost} CH
        </button>
        <button
          data-testid="use-fast-crank"
          onClick={onFastCrank}
          className={`pixel-btn px-3 py-3 text-[9px] ${m.tl >= F3_COST ? "bg-pink-900 text-pink-100" : "bg-neutral-950 text-neutral-500"}`}
        >
          [F] FAST CRANK {F3_COST} TL → +{gainOf(m.crankRank) * 2}
        </button>
      </div>
      {/* the two unbounded sinks + nav */}
      <div className="grid w-full max-w-3xl grid-cols-2 gap-2 sm:grid-cols-5">
        <button data-testid="lend-charge" onClick={onLend} className="pixel-btn bg-neutral-800 px-2 py-3 text-[8px] text-lime-300">
          {m.ch >= LEND_CH ? `▶ LEND ${LEND_CH} CHARGE · LAMP #${m.lends + 1}` : `LEND: ${LEND_CH} CHARGE — SHORT ${LEND_CH - m.ch}`}
        </button>
        <button data-testid="shed-plate" onClick={onPlate} className="pixel-btn bg-neutral-800 px-2 py-3 text-[8px] text-amber-200">
          {m.tl >= PLATE_COST ? `▶ SHED PLATE ${PLATE_COST} TL · #${m.plates + 1}` : `PLATE: ${PLATE_COST} TL — SHORT ${PLATE_COST - m.tl}`}
        </button>
        <button data-testid="go-shed" onClick={onShed} className="pixel-btn bg-neutral-900 px-2 py-3 text-[8px] text-amber-100">
          [S] SHED — THE PRICE LIST
        </button>
        <button data-testid="go-loop" onClick={onLoop} className="pixel-btn bg-neutral-900 px-2 py-3 text-[8px] text-amber-100">
          [L] LOOP — THE PUBLISHED MATH
        </button>
        <button data-testid="export-save-lane" onClick={onExport} className="pixel-btn bg-cyan-950 px-2 py-3 text-[8px] text-cyan-200">
          ⤓ EXPORT SAVE
        </button>
      </div>
      <div className="w-full max-w-3xl border-2 border-amber-500/20 bg-black/40">
        <div className="flex items-center justify-between border-b border-amber-500/20 px-3 py-2">
          <span className="font-pixel text-[8px] text-amber-300">THE SHEET LEDGER — EVERY ACTION, PRINTED</span>
          <span className="font-pixel text-[8px] text-amber-100/40">
            SHEETS {m.stats.sheets} · FULL CALLS {m.stats.fullCalls}
          </span>
        </div>
        <div data-testid="sheet-ledger" className="max-h-40 overflow-y-auto px-3 py-2 font-pixel text-[8px] leading-relaxed text-amber-100/80">
          {ledger.map((l, i) => (
            <div key={`${i}-${l}`} className={i === ledger.length - 1 ? "text-amber-200" : "text-amber-100/40"}>
              {l}
            </div>
          ))}
        </div>
      </div>
      <div className="min-h-5 text-center text-[10px] text-yellow-200/90">{notice ?? ""}</div>
      <p className="max-w-3xl text-center text-[9px] leading-relaxed text-amber-100/40">
        THE SHEET WAITS — NOT ONE NUMBER MOVES WHILE THIS TAB IS CLOSED. A CALL WAITS FOR EVER AT ITS FULL PUBLISHED
        PRICE: NO FRESHNESS PENALTY, NO ABSENCE MAIL, NO STREAK, NO DAILY, NO COOLDOWN ANYWHERE.
      </p>
    </div>
  );
}
/* ------------------------------- shed screen ------------------------------ */
function ShedScreen({
  meta,
  onBack,
  onF4,
  onF1a,
  onStreet2,
  onF2,
  onF1b,
  onStreet3,
  onLend,
  onPlate,
  onExport,
}: {
  meta: Meta;
  onBack: () => void;
  onF4: () => void;
  onF1a: () => void;
  onStreet2: () => void;
  onF2: () => void;
  onF1b: () => void;
  onStreet3: () => void;
  onLend: () => void;
  onPlate: () => void;
  onExport: () => void;
}) {
  const m = meta;
  const tl = m.tl;
  return (
    <div className="flex w-full flex-col items-center gap-4" data-testid="shed-panel">
      <div className="flex w-full max-w-3xl flex-wrap items-center justify-between gap-2">
        <h2 className="font-pixel text-sm text-amber-300">THE SHED — THE PRICE LIST</h2>
        <div className="flex items-center gap-2">
          <span className="font-pixel text-[10px] text-pink-300">TALLIES {m.tl}</span>
          <span className="text-[9px] text-amber-100/50">
            PLATES {m.plates} · LAMPS {m.lends} · FINITE TABLE {FINITE_TABLE} TL
          </span>
        </div>
      </div>
      <div className="w-full max-w-3xl border-2 border-amber-500/30 bg-black/30 p-3">
        <h3 className="font-pixel text-[9px] text-amber-300">
          THE UNLOCK TABLE — EVERY ROW IS TALLIES, NEVER MONEY · FINITE TOTAL {FINITE_TABLE} TL
        </h3>
        <div className="mt-2 flex flex-col gap-2">
          <UnlockRow
            label="F4 THE METER"
            cost={F4_COST}
            have={tl}
            owned={m.meter}
            effect="prints CHARGE 4/6 · CRANKS TO FULL 2 · SMALL NEEDS 2 · BIG NEEDS 4 · ANSWERING FULL PAYS 6 before you commit"
            ceiling="zero units: every value it prints is already published — it changes what you can see, never what a sheet pays"
            onBuy={onF4}
            testid="buy-f4"
          />
          <UnlockRow
            label="F1 THE THROTTLE — RANK 1"
            cost={F1_COST[1]}
            have={tl}
            owned={m.crankRank >= 1}
            effect="each CRANK adds +2 charge instead of +1: a STREET 1 sheet goes from 6 actions to 5"
            ceiling="2 ranks, ever · a sheet still pays exactly 6 tallies — the ceiling is the battery's size"
            onBuy={onF1a}
            testid="buy-f1"
          />
          <UnlockRow
            label={`STREET 2 — ${STREET[2].name}`}
            cost={STREET[2].cost}
            have={tl}
            owned={m.street >= 2}
            effect="battery 6 → 12: calls 4 and 8 charge, ceiling 12 tallies a sheet"
            ceiling="SMALL + BIG = 12 — the ceiling moves because the battery did, and no power can raise it further"
            onBuy={onStreet2}
            testid="buy-street-2"
          />
          <UnlockRow
            label="F2 THE SHED'S DRAW"
            cost={F2_COST}
            have={tl}
            owned={m.draw}
            effect="the shed's standby draw is removed: every call costs 1 charge less, never below 1"
            ceiling="1 rank, ever · a discount on a COST, not on a payment — the call still pays call//2 or call"
            onBuy={onF2}
            testid="buy-f2"
          />
          <UnlockRow
            label="F1 THE THROTTLE — RANK 2"
            cost={F1_COST[2]}
            have={tl}
            owned={m.crankRank >= 2}
            ownedLabel="OWNED — MAX (2 RANKS, EVER)"
            effect="each CRANK adds +3 charge: a STREET 1 sheet goes from 6 actions to 4"
            ceiling="MAX rank · still exactly 6 tallies a sheet at STREET 1 — 3 actions, same payout"
            onBuy={onF1b}
            testid="buy-f1-2"
          />
          <UnlockRow
            label={`STREET 3 — ${STREET[3].name}`}
            cost={STREET[3].cost}
            have={tl}
            owned={m.street >= 3}
            effect="battery 18: calls 6 and 12 charge, ceiling 18 tallies a sheet"
            ceiling="SMALL + BIG = 18 — the top of the published band, every power on or off"
            onBuy={onStreet3}
            testid="buy-street-3"
          />
        </div>
        <p className="mt-2 text-[9px] text-amber-100/50">
          F3 THE FAST CRANK — {F3_COST} TL per use, repeatable: one action cranks twice, saves exactly 1 action,
          charged only when the use is pressed, and can never add a tally to any sheet. Buy it on the lane — [F].
        </p>
        <p className="mt-1 text-[9px] text-amber-300">
          NO ROW IS A TRAP — EVERY STREET PAYS 1.00 ACTION PER TALLY
        </p>
        <p className="mt-1 text-[9px] text-amber-100/50">
          All timing figures are designed, not measured — no player has reached the last row yet.
        </p>
      </div>
      <div className="w-full max-w-3xl border-2 border-amber-500/30 bg-black/30 p-3">
        <h3 className="font-pixel text-[9px] text-amber-300">THE UNBOUNDED SINKS — REAL SPENDS, BADGE EVERY {BADGE_EVERY}</h3>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <button data-testid="shed-plate-tl" onClick={onPlate} className="pixel-btn bg-neutral-800 px-2 py-3 text-[8px] text-amber-200">
            {m.tl >= PLATE_COST ? `▶ SHED PLATE — ${PLATE_COST} TL · #${m.plates + 1}` : `SHED PLATE: ${PLATE_COST} TL — SHORT ${PLATE_COST - m.tl}`}
          </button>
          <button data-testid="shed-lend-ch" onClick={onLend} className="pixel-btn bg-neutral-800 px-2 py-3 text-[8px] text-lime-300">
            {m.ch >= LEND_CH ? `▶ LEND — ${LEND_CH} CHARGE · LAMP #${m.lends + 1}` : `LEND: ${LEND_CH} CHARGE — SHORT ${LEND_CH - m.ch}`}
          </button>
        </div>
        <p className="mt-2 text-[9px] text-amber-100/50">
          BADGES: {m.badges.length ? m.badges.join(" · ") : "— none yet —"} · earn one every {BADGE_EVERY} of any sink.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button data-testid="go-lane-from-shed" onClick={onBack} className="pixel-btn bg-amber-300 px-5 py-3 text-xs text-neutral-950">
          ↩ BACK TO THE LANE (ESC)
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
  const short = Math.max(0, cost - have);
  return (
    <div className={`flex flex-col gap-1 border-2 px-3 py-2 sm:flex-row sm:items-center sm:justify-between ${owned ? "border-lime-600/40 bg-lime-950/20" : "border-amber-500/20 bg-black/20"}`}>
      <div className="min-w-0">
        <p className="font-pixel text-[9px] text-amber-200">
          {label} <span className="text-pink-300">· {cost} TL</span>
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
        {owned ? ownedLabel ?? "OWNED" : short === 0 ? `▶ BUY ${cost} TL` : `NEED ${short} MORE`}
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
function LoopPanel() {
  return (
    <section className="border-2 border-amber-500/30 bg-black/30 p-4" data-testid="loop-panel">
      <h2 className="font-pixel text-[10px] text-amber-300">
        THE LOOP — CRANK → CHARGE → ANSWER THE SHEET → TALLIES → SHED → BIGGER BATTERY
      </h2>
      <div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr]">
        <StageCard
          title="INPUTS"
          accent="text-cyan-300"
          lines={[
            "Player actions only — no clock, no timer",
            "Charge, made by CRANK (+1 an action, free)",
            "The decision at each answer: charge to FULL or answer now",
            "Seed: STREET 1 (battery 6) · 0 charge · 0 tallies · no powers",
          ]}
        />
        <Arrow />
        <StageCard
          title="TRANSFORMATION"
          accent="text-amber-300"
          lines={[
            "CRANK: ch = min(ch + gain, cap) — refused above cap",
            "ANSWER: pays call if ch == cap, else call//2",
            "cost = call (F2: call − 1, never below 1)",
            "ch = ch − cost + 1 — the line hands 1 back",
            "Zero random variables: an integer map end to end",
          ]}
        />
        <Arrow />
        <StageCard
          title="OUTPUTS"
          accent="text-amber-200"
          lines={[
            "TALLIES cut into the shed door",
            "+1 charge per answered call — the next call's input",
            "SMALL + BIG = cap tallies a sheet (6 / 12 / 18)",
            "Ceiling = the battery's size, with every power on",
          ]}
        />
        <Arrow />
        <StageCard
          title="REINVESTMENT"
          accent="text-pink-300"
          lines={[
            "Tallies buy shed parts: bigger battery, faster crank, cheaper draw, a meter",
            "New streets add decisions, not rates: 1.00 act/TL on all three",
            "Two unbounded sinks: SHED PLATE 3 TL · LEND 8 charge",
          ]}
        />
      </div>
      <div className="mt-3 grid gap-2 md:grid-cols-2">
        <div className="border-2 border-amber-500/20 bg-black/20 p-3">
          <p className="font-pixel text-[9px] text-amber-300">THE STREETS — WHAT A SHEET IS</p>
          <table className="mt-2 w-full text-left text-[9px] text-amber-100/70">
            <thead className="text-amber-100/40">
              <tr>
                <th className="py-1">STREET</th>
                <th>SMALL / BIG</th>
                <th>COST</th>
                <th>CEILING</th>
              </tr>
            </thead>
            <tbody>
              {([1, 2, 3] as const).map((s) => (
                <tr key={s}>
                  <td className="py-1">{STREET[s].cap}</td>
                  <td>
                    {smallOf(STREET[s].cap)} / {bigOf(STREET[s].cap)}
                  </td>
                  <td>{STREET[s].cost === 0 ? "seed" : `${STREET[s].cost} TL`}</td>
                  <td>{STREET[s].cap} TL</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-2 border-amber-500/20 bg-black/20 p-3">
          <p className="font-pixel text-[9px] text-amber-300">THE TWO PUBLISHED LINES — PER SHEET</p>
          <table className="mt-2 w-full text-left text-[9px] text-amber-100/70">
            <thead className="text-amber-100/40">
              <tr>
                <th className="py-1">STREET</th>
                <th>TAUGHT (FULL FIRST)</th>
                <th>FLAT (ANSWER NOW)</th>
              </tr>
            </thead>
            <tbody>
              {([1, 2, 3] as const).map((s) => (
                <tr key={s}>
                  <td className="py-1">{STREET[s].cap}</td>
                  <td>
                    {STREET[s].cap} actions · {STREET[s].cap} tallies · 1.00
                  </td>
                  <td>
                    {STREET[s].cap} actions · {STREET[s].cap / 2} tallies · 2.00
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-[9px] text-amber-100/50">
            Band: 0.42 to 2.00 player actions per tally over 18 machine-checked lines.
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
              <td className="py-1">F1 THE THROTTLE r1</td>
              <td>{F1_COST[1]} TL</td>
              <td>CRANK +2</td>
              <td>6 tallies a sheet, unchanged</td>
            </tr>
            <tr>
              <td className="py-1">F1 THE THROTTLE r2</td>
              <td>{F1_COST[2]} TL</td>
              <td>CRANK +3 (MAX)</td>
              <td>6 tallies a sheet, unchanged</td>
            </tr>
            <tr>
              <td className="py-1">F2 THE SHED'S DRAW</td>
              <td>{F2_COST} TL</td>
              <td>every call costs 1 charge less</td>
              <td>a discount on cost, never on payment</td>
            </tr>
            <tr>
              <td className="py-1">F3 THE FAST CRANK</td>
              <td>{F3_COST} TL a use</td>
              <td>one doubled crank, 1 action saved</td>
              <td>zero units — it makes the rate worse</td>
            </tr>
            <tr>
              <td className="py-1">F4 THE METER</td>
              <td>{F4_COST} TL</td>
              <td>prints charge, cranks to full, both costs</td>
              <td>zero units — all published numbers</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="mt-3 grid gap-2 md:grid-cols-2">
        <div className="border-2 border-amber-500/20 bg-black/20 p-3">
          <p className="font-pixel text-[9px] text-amber-300">THE PRICE LIST — {FINITE_TABLE} TALLIES, FINITE</p>
          <ul className="mt-2 space-y-1 text-[9px] text-amber-100/70">
            <li>F4 THE METER — {F4_COST} TL</li>
            <li>F1 THE THROTTLE r1 — {F1_COST[1]} TL</li>
            <li>STREET 2 — {STREET[2].cost} TL</li>
            <li>F2 THE SHED'S DRAW — {F2_COST} TL</li>
            <li>F1 THE THROTTLE r2 — {F1_COST[2]} TL</li>
            <li>STREET 3 — {STREET[3].cost} TL</li>
            <li>SHED PLATE {PLATE_COST} TL · F3 {F3_COST} TL a use · LEND {LEND_CH} charge — all unbounded</li>
          </ul>
        </div>
        <div className="border-2 border-amber-500/20 bg-black/20 p-3">
          <p className="font-pixel text-[9px] text-amber-300">CONSERVATION — CREATED = DRAWN − 2</p>
          <p className="mt-2 text-[9px] leading-relaxed text-amber-100/70">
            Charge is created only by CRANK and destroyed only by a call. Every answered call hands exactly 1 back,
            so a closed sheet creates exactly its two calls' worth minus 2 — to the unit, on every street and every
            power state. Tallies are capped at the battery's size and every tally has a sink.
          </p>
          <p className="mt-2 text-[9px] leading-relaxed text-amber-300">
            THE SHEET WAITS — NO NUMBER HERE CHANGES WHILE THIS TAB IS CLOSED.
          </p>
          <p className="mt-1 text-[9px] leading-relaxed text-amber-300">
            NOTHING HERE CONVERTS TO MONEY; NO PURCHASES EXIST IN THIS GAME.
          </p>
        </div>
      </div>
    </section>
  );
}
