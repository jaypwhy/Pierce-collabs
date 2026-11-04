# ARCADE POWERS — build + browser verification (engineer)

**Built from:** `Documents/Shared/designs/arcade-powers.md` §7 build notes (constants copied verbatim).
**Files:** `site/src/routes/bin-runner.tsx` (N1–N4, ST) · `site/src/routes/brick-break.tsx` (M1–M4, SE).
**Date:** 2026-11-02. Working site only — not published (lead reviews before `publish_site`).
**Scope honoured:** no published payout, ceiling or existing sink price was changed. The CS/RS
unbounded-sink gap the design flags in §5 is untouched, as instructed.

## What was wired

| Game | Power | Wired as |
| --- | --- | --- |
| Bin Runner | N1 THE STEADY HAND (30 / 70 ST, 2 ranks) | item's descent is the read window: `FALL_MS / N1_SPEED[rank]` = 6.0 s / 8.6 s / 12.0 s. Only ever lengthens (A9). |
| | N2 THE CHUTE GUIDE (45 ST) | correct chute printed for the first 8 items of every run, plus a ring on the right chute |
| | N3 THE TALLY ROLL (40 ST) | run ledger: `CH n/20 · SORTS LEFT IN CEILING n · CS TO THE NEXT JACK n` (+ RS, + CH spent/35) |
| | N4 THE QUICK PICK (5 ST a press) | files the item in front of you as a correct sort (1 CH → 6 CS + 3 RS) and pulls the next item 1.2 s closer. Charged only on press, only with an item present. |
| Brick Break | M1 THE SIGHT LINE (6 / 16 SE) | dotted trace on the canvas from the resting ram: 1 bounce (r1) / 2 bounces (r2), with bounce markers |
| | M2 THE STEADY RAM (10 SE) | ram speed × 0.85 (110 → 93.5 px/s), set at run start |
| | M3 THE TALLY BOARD (12 SE) | `SW n · BRICKS n · n SW LEFT, n BRICKS TO A SEAL · SE TO BAY 2: n` |
| | M4 THE SPARE RAM (4 SE a press) | arms one lost ram to cost 0 SW; the 5 SW grant is untouched |

Saves: one new field each — `powers` (`{n1,n2,n3}` / `{m1,m2,m3}`), merged with defaults on load,
included in export. `n4Uses` / `m4Uses` are per-run only, never persisted (design §6). Lifetime
press counters `stats.n4Presses` / `stats.m4Presses` added to the ledger. π strip untouched.
POWERS panel added to each right-hand column; `POWERS` ceiling sentence published verbatim in each
LOOP panel (`data-testid="powers-ceiling-line"`).

## Browser verification (agent-browser, localhost:3000, 2026-11-02)

ST/SE balances were seeded into localStorage as a **test fixture** so the purchase path could be
exercised without grinding; every purchase and press below then ran through the real UI buttons.

**Bin Runner — purchases cost ST and pay nothing out** (ST seeded 200):
200 → 170 (N1 r1, −30) → 130 (N3, −40) → 85 (N2, −45) → 15 (N1 r2, −70). Total **185 ST**,
matching A20. `cs`, `rs`, `gf` read **0 before and 0 after every purchase**. Buy buttons disappear
once a rank is maxed (no second charge).

**Bin Runner — ceiling and rates with every power on** (n1:2, n2:1, n3:1):
- published line reads *"POWERS — the ceiling is 35 sorts a run, with every power on · 35 sorts · 258 CS · 105 RS · 20 ST · 1 GF"*;
- a real sort paid **+6 CS, +3 RS, −1 CH** (cs 0→6, rs 0→3, ch 20→19, spent 0→1) — unchanged;
- N4 press: **ST 15→10 (−5)**, cs 6→12, rs 3→6, ch 19→18, n4Uses 0→1 — it charges and pays exactly a sort's rate, nothing extra;
- TALLY ROLL printed *"CH 18/20 · SORTS LEFT IN CEILING 33 · CS TO THE NEXT JACK 28"*.
- snapshot `window.__binrunner.ceiling` = `{sorts:35, cs:258, rs:105, st:20, gf:1, prints:4}`.

**Bin Runner — saves survive reload:** after `location.reload()`, `powers {n1:2,n2:1,n3:1}` and
`st 15` were restored from `binrunner.save.v1`.

**Brick Break — purchases cost SE and pay nothing out** (SE seeded 100):
100 → 94 (M1 r1, −6) → 84 (M2, −10) → 72 (M3, −12) → 56 (M1 r2, −16). Total **44 SE** (A20).
`rk`, `rb`, `dz` read **0 throughout**.

**Brick Break — ceiling and grant with every power on:**
- published line reads *"POWERS — the ceiling is the wall — 30 bricks on bay 1, with every power on · 35 RK · 35 RB · 40 DZ · 8 SE on bay 1"*;
- run started with `sw 30 / granted 30` (grant unchanged), `bricksLeft 30`, and
  `ceiling {rk:35, rb:35, dz:40, se:8, sw:50, bricks:30}` — the published bay-1 line;
- ram speed **93.5 px/s** (M2 live) while every yield stayed published;
- TALLY BOARD printed *"SW 30 · BRICKS 0 · 30 SW LEFT, 30 BRICKS TO A SEAL · SE TO BAY 2: 0"*;
- M4 press: **SE 56→52 (−4)**, `spareArmed true`, `m4Uses 1`, and the save on disk read `se: 52`.

**Screenshots:** `arcade-powers-shots/binrunner-powers-panel.png`,
`arcade-powers-shots/brickbreak-powers-run.png`.

## Known cosmetic notes (not bugs in the loop)

1. The `__brickbreak` debug snapshot's `powers` object can lag one render behind the live meta
   (it showed `{m1:0,…}` while the run had already started at the M2 speed). Behaviour is correct;
   only the read-only verification blob is stale for a frame.
2. A missed item in Bin Runner (the descent completing) counts toward LANDFILL and pays nothing —
   it costs no CH and no unit, so it can only reduce realised material, never the ceiling. This is
   how N1's "more seconds to read" is made real; it is the only new rule the retrofit adds.
