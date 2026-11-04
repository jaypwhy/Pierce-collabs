# HOT HEAP (Compost to Soil) — Build + Verification Summary

Built by engineer · 2026-10-10 · Source of truth: `/home/team/shared/compost-to-soil-design.md` (639 lines) and `compost-to-soil-checks.py` (12 asserts green). No numbers were re-derived: every constant in the route is cloned verbatim from the design's BUILD NOTES constant block and the checks script's published figures.

**Route:** `/home/team/shared/site/src/routes/compost-to-soil.tsx` (~1,470 lines, single file, TanStack Start) — playable at `http://localhost:3000/compost-to-soil` (dev) and linked from the homepage (`home-compost-to-soil` card + CTA), cross-linking to bin-runner / brick-break / paper-airplane.

## Verified in a real browser (agent-browser, end to end)

### Headline loop, round by round (published order: HARVEST → FEED → BATCH)
- R1: 6 green, 12 cold turns (ledger: `TURN — COLD +1` ×12), cap holds at `RIPENESS 12/12` (over-turn check), EMPTY → `SO +6 · BR +3 · MK +2` — ledger line exactly the published arithmetic: `BATCH 1: 6 LOADS · 6 GREEN 0 BROWN · COLD ×12 TURNS · RIPE 12 = 2×6 − 4×FORK 0 · EMPTY: SO +6 · BR +3 · MK +2`.
- Feed bed 1 → STANDING; next EMPTY turns it READY.
- R3 hot: 2 brown + 4 green → HEATED, `×6 TURNS` (exactly half of 12 — the green:brown ratio rule halving turns, in the ledger), `MK +4` for a hot 6-load batch.
- R4 completes 12 MK → shed `BIN 2 — THE LONG BAY · CAP 12 LOADS` (12 MK paid), yard HUD confirms.
- Conservation across the 4 rounds: SO was flat at 6 (feed −6 / batch +6 each round) — this is the design's `SO in = SO out`; BR ended 6, MK 12. (Two of my test assertions "failed" only because the test script wrongly expected SO to accumulate — the game's conservation is correct and is the design's intended maths.)

### Sealed bin (owner's rhythm ruling)
- `setInterval`/`Date.now` counts: 0 in logic (3 grep hits are the honesty comments; the 3 `setTimeout`s are UI-only: blob revoke, notice flash, reset confirm — none change state).
- Closed the tab (full reload): mid-batch was byte-identical before/after — `LOADS 2/12 · BROWNS 0/2 · RIPENESS 1/4 · BIN 2 · bed READY`, SC/BR/SO/MK unchanged, in both DOM and the localStorage save.

### Powers (all Marks-only, all capped; verified on screen)
- F1 THE FORK: rank 1 → `RIPE 8 = 2×6 − 4×FORK 1` (6-load batch needs 8 not 12); rank 2 → `RIPENESS 0/4`, 2 hot turns.
- F2 THE RIDDLE: brown load button face becomes `1 BR`.
- F3 THE BAT HANDLE: 2 MK charged, ledger shows `+4 (DOUBLED)`, ripeness jumps 4.
- F4 THE GAUGE: line prints `RIPENESS 4/4 · HEATED · 0 TURNS TO RIPE`.
- Ceiling proof — with ALL four powers on, a 6-load hot batch still pays exactly `SO +6 · BR +3 · MK +4` and the ledger formula shows it: `BATCH 25: 6 LOADS · 4 GREEN 2 BROWN · HEATED ×2 TURNS · RIPE 4 = 2×6 − 4×FORK 2 · EMPTY: SO +6 · BR +3 · MK +4`. POWERS MOVE COST, NEVER PAYOUT — confirmed.

### Export / persistence
- EXPORT SAVE → real blob, captured and parsed: 526 bytes, full schema (`saveVersion, sc, br, so, mk, mkEarned, binTier, beds, loads, browns, ripeness, forkRank, riddle, gauge, tallies, borders, trenches, sacks, badges, stats`), mid-batch numbers included; filename `hotheap-save.json`. Reload + re-entry restored identical state.

### LOOP panel (published arithmetic on screen)
All present: the 3.00–11.50 act/MK band with the appendix reference rows (4.00 / 3.88 / 3.83 act/MK), the with/without powers table, ceilings `6 / 12 / 18 SO · 3 / 6 / 9 BR · 4 / 8 / 12 MK`, `SO in = SO out`, `BR in = BR out`, the 124 MK finite unlock table, the sealed-bin line, and the mandatory `NOTHING HERE CONVERTS TO MONEY; NO PURCHASES EXIST IN THIS GAME`.

### Guardrails + hygiene
- L15: no real-world claims anywhere; the only "real waste" hits are the two design-mandated honesty lines ("NOTHING HERE IS REAL WASTE" on the start screen; "not real waste" in the LOOP panel). No ads, no pay-to-win, no money anywhere; dev-lockout asserts gate L1 (TURN_COST 0, glean > 0, worst case ≥ 1, cold = 2× hot, powers never raise payout).
- Typecheck clean for the file (only the pre-existing `serve.ts`/`vercel-entry.ts` template errors remain); route HTTP 200; console: only the same environmental artifacts (fonts/HMR) that the already-verified paper-airplane page also shows.
- Also fixed a pre-existing public-facing subtitle on the `/compost-to-soil-design` page that used "regenerative" — a word held back by layer-spec open question 5 until the owner rules.

## Deliberate deviations from the brief (both follow the design, which the brief appoints as source of truth)
1. localStorage key `hotheap.save.v1` and export filename `hotheap-save.json` (design D2), instead of the brief's `compost-to-soil.save.v1` / `compost-to-soil-save.json`.
2. F1 THE FORK's TURN button face: the design's example text `+3 at fork rank 1` conflicts with every other published formula (gain is always 1 cold / 2 hot; fork only lowers the threshold). I wired the gain to the published formulas (`+2 HEATED` / `+1 COLD` — the ledger shows them), keeping fork's threshold cut only. Flag for the game-systems designer to resolve the doc's example text.

## Screenshots
`/home/team/shared/compost-to-soil-shots/01-start.png` (start screen, 5 loop lines + honest line) · `02-batch-mid.png` (BIN 2, LOADS 2/12, RIPENESS 1/4) · `03-bin2-unlocked.png` (BIN 2 cap 12, bed READY).

## Files
- Built: `site/src/routes/compost-to-soil.tsx`; edited `site/src/routes/index.tsx` (link + card) and `site/src/routes/compost-to-soil-design.tsx` (subtitle wording).
- Content copy `site/src/content/compost-to-soil-design.md` verified in sync with the source design (diff = 0).