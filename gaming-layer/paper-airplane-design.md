# PAPER AIRPLANE (working title: **WINDWARD**) — closed-loop design + Gaming Layer incorporation

**Game:** Windward — an 8-bit single-screen **fold-and-fly** game: you press a sheet into a plane at the mill's bench, throw it off the roofline rail over the mill yard, and the flight ends when the paper touches down in one of the yard's balers. The third playable sample of The Gaming Layer, built third, after Bin Runner and Brick Break.
**Written by:** game-systems designer, team The Gaming Layer. **Date:** 2026-10-01.
**Status:** design document. **No build exists yet.** No studio is attached. Every rate, price and time estimate below is **designed, not playtested** — none of it has been measured in a running game. Numbers are stated here so the engineer can wire them without inventing any.
**Conforms to:** `/home/team/shared/layer-spec-v0.1.md` — five closed-loop conditions (C1–C5, §2.3), fifteen rules (L1–L15, §3.1–3.3), five permitted revenue models (§3.4), incorporation form (Parts A–E, §4). This document is a filled-in form in the same shape as the spec's samples (§5.1 Bin Runner, §5.2 Ledger Vale) and as `/home/team/shared/brick-break-design.md`.
**Machine-checked:** every sum below is derived and asserted by `/home/team/shared/paper-airplane-checks.py` (`python3 paper-airplane-checks.py`). If a number here changes, that script must be re-run and this document re-published — the form's last line is the whole point.
**What it is not:** not ratified by the owner; not a product announcement; not a claim that any studio has adopted anything.

---

## 0. The game, and why it is not a reskin of Bin Runner or Brick Break

**Fiction.** A paper mill sits on a hill above its own yard. The presses make **sheets**; the chimneys make **draft**. You work the mill's roofline: you fold a sheet into a plane at the bench, walk to the launch rail, and throw it out over the yard, where four **balers** stand at increasing distance down the slope. A folded wing catches the chimney draft and is carried further; a dart slips through it. The headwind off the valley is charted every day and is always announced before you throw. The recovery crew walks out and brings back the delivery: the baler's count, and the mill's **medallion** for a delivery that got far enough to be worth striking. The plane's own paper comes back to the bench as the next plane.

**Play unit:** one **flight** — **one fold, one throw, and it ends where the paper lands.** There is no clock, no charge, no lives and no board to clear. The bound is gravity.

| | Bin Runner (sample 1) | Brick Break (sample 2) | **Windward (sample 3)** | Why it differs |
|---|---|---|---|---|
| Skilled input | **classification** — sort item → chute | **spatial** — angle the ram off the cart | **fold choice + release timing** (an aim meter, exact integer 0–10) | a decision followed by an execution test; not labelling, not geometry |
| Run bound | 90-second wall clock + 20 Charge | Swing (in-run charge) + the wall's brick count | **the landing itself; no clock, no charge, no board** | the third distinct bound: none of the previous two |
| Transformation | item → materials, one decision per item | ram → brick → cart, per placement | **sheet → fold → flight → landing grade**, one physical event end to end | the transformation has a *middle* (a flight) that the previous two do not have |
| Faucet shape | per action (+6 CS / +3 RS) | per brick type (+2 RK / +3 RB / +1 DZ) | **per landing grade — a position on a ladder (+1 / +3 / +7 / +12 / +18 SH)** | the first faucet that is *banded by performance* rather than counted |
| Meta faucet | per craft (print a Jack → +5 ST) | per milestone (row cleared → +1 Seal) | **per grade band** (SHORT 0 · PAD 1–4 → **1 / 2 / 4 / 6 MD**) | a grade, not a count |
| Meta currency | **ST — Stamp** | **SE — Seal** | **MD — Medallion** | different fiction, different earn condition |
| In-run reinvestment | recycler (10 CS → 5 CH); assembler offcut | dust patches the cart; a cleared row pays +4 Swing | **the mill's chimney draft (its own waste heat) is the lift that carries the plane; the plane's own paper returns as the next plane** | reinvestment is *physical*: the waste product of the mill's process is the input to the flight |
| Material sink | bench tiers (finite) | reclaim-wall courses (unbounded) | **the baling order (unbounded) + a per-flight fold cost** | the sink is *pressing bales*, and the transform itself consumes the material |
| Powers / skills | none | cart frames (a durability step) | **the powers sample: 2 skills, 1 multiplier, 1 tool, 1 per-flight power — all earned with MD, all capped, and the faucet ceiling provably does not move** | this is the sample that demonstrates the "powers" pattern for the whole layer |
| Randomness | none | none | **one disclosed headwind gust**, published band, seeded counter, auditable in the save | the sample that exercises C1's "deterministic **or honestly random**" |
| Crafting | yes (assembler recipe) | none | none (the fold is not a recipe; it is a choice of plane) | — |

All three games are one route file, browser-playable, localStorage-only, no backend, no accounts.

---

## PART A — LOOP SUMMARY

```
THE GAMING LAYER — INCORPORATION FORM                    Form version: v0.1
==========================================================================
GAME  Paper Airplane ("Windward")     BUILD/DATE  design only / 2026-10-01
STUDIO  (sample) two-person indie      SIZE  2      CONTACT  (sample)
GENRE  8-bit arcade, fold + throw      PLAY UNIT  one flight (ends on landing)
```

### A1 — Units (name each, with symbol)

| Symbol | Name | Lives where | Faucet | Sink |
|---|---|---|---|---|
| **SH** | **Sheet** | persistent stock | +1 / +3 / +7 / +12 / +18 per flight, by landing grade (SHORT / PAD 1 / PAD 2 / PAD 3 / PAD 4) | 4 per GLIDER fold, 8 per KITE fold (per flight); **8 per bale** at the baling order (unbounded) |
| **MD** | **Medallion** | persistent meta | +0 / +1 / +2 / +4 / +6 per flight, by the same grade | 6 / 10 / 10 / 12 / 18 / 24 / 48 for the unlock table (finite, 128 MD in total); 5 per bench plate and 3 per re-chart (unbounded); 4 per SECOND PRESS actually taken |
| **YARD** | **the reach** (yards) | **a measurement, never a stock** | — | — |
| **GUST** | the headwind (yards) | **an environmental value for one flight, never stored** | — | — |
| **FOLD** | the plane in your hands | **one flight only** | folded from SH at the bench | consumed at the throw; its paper returns as the next plane |

Not currencies and deliberately not units: **the four balers** (fixed marks on a course, not stock), **the draft columns** (a property of the course), **skills** (permanent ranks with published ceilings — a capability, not a balance), **bales and bench plates** (counters of what you pressed — earned, not sellable, not spendable), **badges** (cosmetic records, earned only).

### A2 — Inputs

- **Time** — one flight, ~10–20 seconds including the fold. Flights are unlimited and can be started the instant one lands.
- **Skill** — two decisions per flight: **which fold** (a plane with wing area rides the mill draft and flies further; a dart slips through it and is nearly free), and **when to release** (the aim meter is an exact integer 0–10, displayed as a number, with the aim each baler needs printed on it). Read the announced gust band and hedge with aim; that is the whole skill.
- **Contribution** — a player may submit a **course chart** (a four-pad ladder, a three-value gust band, and a draft layout) as free content; credited by name on the chart header in-game. Rewarded with the same units as play (MD), never a separate currency and never a power.
- **Seed capital** (granted once, identical for everyone, never purchasable) — **COURSE 1 (MILL YARD) unlocked, the DART fold available at zero cost, 0 SH, 0 MD, no skills, gustIndex 0**. Enough to reach the first output immediately: the DART costs nothing and always returns at least one sheet.

### A3 — Transformation

Published, deterministic except for one disclosed variable, bounded, skill-weighted, legible.

```
reach (yards) = base(fold, course)  +  aim (0..10)  -  gust (announced band)
  base  = FOLD.glide  +  (draft columns x lift, if the fold has wing area to ride them)
          x 1.25 (rounded down) if SQUALL FOLD is owned

base reach by fold and course       C1 MILL YARD   C2 HARBOUR FLAT   C3 RIDGE LINE   C4 NIGHT RUN
  DART   glide 20, no lift                20              20               20             20
  GLIDER glide 32, rides the draft        44              40               47             48
  KITE   glide 40, rides the draft        52              48               55             56
  (with SQUALL FOLD)                  25/55/65        25/50/60         25/58/68       25/60/70
```

1. **Fold.** Choose DART (0 SH), GLIDER (4 SH) or KITE (8 SH); the sheets leave the stock **at the throw**, so changing your mind before throwing costs nothing. Only a fold with wing area rides the mill draft: a DART adds no lift, on any course.
2. **Throw.** The aim meter returns an exact integer 0–10, shown on screen before and after. Nothing hidden, no physics to guess: the number is published.
3. **Gust.** One value per flight, drawn **uniformly** from the course's published three-value band (C1/C2 `0 · 3 · 6`; C3 `0 · 4 · 8`; C4 `0 · 5 · 10`), from a counter stored in the save. The **band is announced before the throw**; the **exact value appears in the flight ledger after the landing**. See A8 for why this is not gambling, and Part C L8 for the rule reading.
4. **Land.** The grade is the last baler the reach clears:

```
                 SHORT  PAD 1   PAD 2   PAD 3    PAD 4
C1 MILL YARD        -      16      32      46       58    (yard thresholds)
C2 HARBOUR FLAT     -      12      32      42       58
C3 RIDGE LINE       -      18      34      46       64
C4 NIGHT RUN        -      20      38      56       72
payout (per course, identical everywhere):
SHEETS  SH        +1      +3      +7     +12      +18
MEDALLIONS MD      0      +1      +2      +4       +6
```

5. **Bank.** The payout is credited to the save **the instant the plane lands** — never batched to a session end, so closing the tab mid-flight loses nothing.
6. **No overshoot, ever.** Beyond the last baler the reach is absorbed by the far net: more reach is never worse, so grading is monotone and the ladder's top is a hard cap on every faucet in the game (proved in A4).
7. **The plane's paper returns.** The SHORT payout of **+1 SH is the recovery of the sheet you folded** — a flight always hands its own paper back for the next plane; on a DART (0 SH) it is strictly new paper.

### A4 — Faucets (per flight, with rate, cost, and ceiling)

**The ceiling is the ladder's top, and no power, skill or multiplier can move it.** Every flight's faucet is a lookup on the grade, and the grade is at most PAD 4 — so the whole economy has a published hourly ceiling that is *structural*, not tuned.

| Faucet | Unit | Rate | Cost to the player | Ceiling |
|---|---|---|---|---|
| Landing grade | **SH** | +1 / +3 / +7 / +12 / +18 by grade | the throw's aim, the fold's sheet cost, the flight's time | **+18 SH per flight** — the far baler |
| Landing grade | **MD** | 0 / +1 / +2 / +4 / +6 by grade | as above (MD costs nothing extra) | **+6 MD per flight** — the far baler |

**Cost to the player of every faucet:** one fold decision, one aim input, and 10–20 seconds. The DART's sheet cost is **0**, so the entry faucet is free of material cost; the GLIDER costs 4 SH and the KITE 8 SH per flight out of what the previous flights returned. Nothing is time-gated, nothing is capped per day, and no faucet is purchasable — there is no store in the build.

**The grade matrix (which baler each fold can reach, at the worst and best conditions):**

| Course | Fold | reach (min..max) | unpowered | with SQUALL FOLD + MILL HAND 2 |
|---|---|---|---|---|
| C1 MILL YARD | DART | 14..30 | SHORT, PAD 1 | PAD 1, PAD 2 |
| | GLIDER | 38..54 | PAD 2, PAD 3 | PAD 3, PAD 4 |
| | KITE | 46..62 | PAD 3, PAD 4 | **PAD 4 only** |
| C2 HARBOUR FLAT | DART | 14..30 | PAD 1 | PAD 1, PAD 2 |
| | GLIDER | 34..50 | PAD 2, PAD 3 | PAD 3, PAD 4 |
| | KITE | 42..58 | PAD 3, PAD 4 | PAD 3, PAD 4 |
| C3 RIDGE LINE | DART | 12..30 | SHORT, PAD 1 | PAD 1, PAD 2 |
| | GLIDER | 39..57 | PAD 2, PAD 3 | PAD 3, PAD 4 |
| | KITE | 47..65 | PAD 3, PAD 4 | PAD 3, PAD 4 |
| C4 NIGHT RUN | DART | 10..30 | SHORT, PAD 1 | SHORT, PAD 1 |
| | GLIDER | 38..58 | PAD 2, PAD 3 | PAD 2, PAD 3 |
| | KITE | 46..66 | PAD 2, PAD 3 | PAD 3, PAD 4 |

**Every course's far baler is reachable, and the design says by what:** C1 unpowered with a 10-aim KITE (62 ≥ 58); C2 unpowered only on the exact line (58 = 58); C3 unpowered on the exact line (65 ≥ 64); **C4 unpowered is impossible (66 < 72) — the night run's far baler requires the earned SQUALL FOLD (70 + 10 = 80 ≥ 72)**. That is earned progression under L10, not a purchase: MD is made only by flying.

### A5 — Sinks (per flight, with what they return)

| Sink | Rate | What it returns to the player |
|---|---|---|
| **Fold cost** (per flight, at the throw) | 0 / 4 / 8 SH for DART / GLIDER / KITE | the plane you are about to fly. The cheapest fold is free, so the loop can never be blocked (see the lockout test below) |
| **The baling order** (player-chosen, **unbounded**) | **8 SH per bale** | a bale added to the yard stack in the start screen, and a stencil badge every 10 bales (earned cosmetic) |
| **Unlock table** (one-off, earned-only) | see the table in Part C | a course chart, a skill rank, a tool, or a multiplier |
| **Bench plates** (player-chosen, **unbounded**) | **5 MD per plate** | an engraved plate on the bench, and a badge every 10 |
| **Re-chart a course** (repeatable) | **3 MD** | the course's next published chart (ladder / gust band / draft layout) |
| **SECOND PRESS** (per flight, repeatable) | **4 MD**, charged only if you actually take the retry | the throw again, on the same fold and the same wind (A7) |

Every faucet has at least one sink able to absorb it, and the two material sinks (bales, plates) are unbounded (C2). The MD faucet is bounded per flight at +6; the finite MD sinks total 128 MD and the unbounded ones take the rest.

### A6 — Reinvestment, in-loop (mechanical)

1. **The mill's own exhaust is the lift.** The chimney draft — the mill's waste heat, which is otherwise wasted — is what carries a folded wing: +6 yards per column on C1, +8 on C2 and C4, +5 on C3. A DART gets none of it because a dart has no wing area to catch draft. This is the loop's centre: **the by-product of the mill's process is the input to the flight.**
2. **The plane's paper returns as the next plane.** The minimum payout on the ladder (+1 SH) is the sheet you folded, recovered by the crew. For the free DART it is strictly new paper, which is exactly why the loop cannot stall.
3. **One flight's output is the next flight's input.** Sheets pay for folds; a longer flight's sheets pay for a bigger fold; MD pays for the skills that make the bigger fold reach the far baler. No step of that chain can be bought.

### A7 — Reinvestment, meta (studio-level)

Free course charts and new folds add decisions, **never numbers** — the payout table is identical on every course. Quarterly reinvestment report (L11). Monetisation change log and pre-release consultation (L12). Submitted course charts are published with credit and become free content for everyone. MD is never sold and never converts to anything outside the game. **Four earned powers — two permanent skills, one permanent multiplier, one repeatable per-flight power, plus one zero-unit tool — are the studio's answer to the owner's request for powers and multipliers, and their full arithmetic is in A8.**

### C-conditions: **C1 [x] C2 [x] C3 [x] C4 [x] C5 [x]**

### Balance arithmetic (published, per flight on COURSE 1)

```
line (per flight)                            base  aim gust  reach  grade   sheets        medallions
free DART line (0 sheets held)                 20    7    3     24   PAD 1   +3 - 0 = +3      +1
competent GLIDER line                          44    7    3     48   PAD 3   +12 - 4 = +8     +4
skilled KITE line                              52    9    0     61   PAD 4   +18 - 8 = +10    +6
KITE + SQUALL FOLD + MILL HAND 2 (ALL POWERS)  65   10    6     71   PAD 4   +18 - 8 = +10    +6
```

- **Faucet ceiling per flight, immovable:** **+18 SH / +6 MD.** Machine-checked with every skill, multiplier and power switched on, across all four courses and all three folds: the top of the band does not move by one unit. The extra reach a power buys is **absorbed by the far net**.
- **Net band (payout − fold cost) per flight:** **−1 to +10 SH** with no skills; **−1 to +14 SH** with SQUALL FOLD. Gross payout 1..18 SH, **MD 0..+6**.
- **Reference points, all four shown in the LOOP panel:** free DART **+3 SH / +1 MD** · competent GLIDER **+8 SH / +4 MD** · skilled KITE **+10 SH / +6 MD** · everything-on KITE **+10 SH / +6 MD** (identical to the unpowered skilled line — that is the proof, not a coincidence).
- **Absorption.** 10 competent GLIDER flights = **80 SH of faucet**. The baling order takes 8 SH a bale, no cap: **one competent flight presses exactly one bale.** The free-DART-only player accrues +3 SH a flight = one bale per 2.67 flights, still absorbed, with no cap — so C2 holds even for a player who never flies anything but the free fold. 10 flights of MD faucet = 40 MD against the **128 MD** finite unlock table (**32 flights ≈ 24 minutes** of a competent line to exhaust every finite MD sink), then bench plates (5 MD) and re-charts (3 MD) take the rest without limit.
- **Every 128 MD of faucet has a sink, and every sink is earned**: no MD can be bought, no SH can be bought, and no unit in this game converts to money.

### The lockout test (L1/L2 in one line of arithmetic)

| Course | DART (cost 0 SH), worst and best reach | Grades | Worst payout |
|---|---|---|---|
| C1 | 14..30 | SHORT, PAD 1 | **+1 SH** |
| C2 | 14..30 | PAD 1 | **+3 SH** |
| C3 | 12..30 | SHORT, PAD 1 | **+1 SH** |
| C4 | 10..30 | SHORT, PAD 1 | **+1 SH** |

**At zero sheets, at the worst gust, on every course, the free DART still returns at least one sheet.** The DART can never reach PAD 2 on any course (max reach 30, lowest PAD 2 threshold 32), so the free fold is a genuine floor faucet rather than a shortcut to the top. No player can be locked out of the loop by their own stock, ever — that is a wiring requirement in BUILD NOTES, not a hope.

---

### A8 — POWERS, SKILLS AND MULTIPLIERS (the sample that demonstrates the pattern)

The owner asked for powers, skills and multipliers. This is the design's answer, and its rule is one sentence:

> **Every power is earned with the meta currency the loop itself pays out, every power has a published effect, a published cost and a published ceiling, and no power can raise the top of the published band by one unit.** The pad ladder is the cap, so the ceiling is structural.

| # | Name | Kind | Cost | Effect (published, exact) | Ceiling |
|---|---|---|---|---|---|
| **F1** | **MILL HAND** | skill, folding | **6 MD** (rank 1), **18 MD** (rank 2) | A tighter crease holds its line: the headwind costs **1 yard less per rank** (never below 0) | **2 ranks, ever.** Maximum **+2 yards of reach**, which can lift a borderline landing by one baler and **can never carry any landing past the far baler** |
| **F2** | **SQUALL FOLD** | multiplier, permanent | **12 MD** | An extra crease in the leading edge: **base reach × 1.25, rounded down**, on every flight | **1 rank, ever.** Maximum base **25 / 55 / 65** (DART / GLIDER / KITE) on COURSE 1 — **25 / 60 / 70** on COURSE 4, the longest chart. Extra reach above the far baler's threshold pays **nothing** |
| **F3** | **SECOND PRESS** | power, **one flight** | **4 MD**, charged only when the retry is taken | If the landing was short of the baler you wanted, fold the crease back out and throw **once more**: same plane, **same wind**, and the flight pays **the better of the two landings** | **Zero units.** The best of two throws can never exceed the best possible single throw, so it adds nothing to the ceiling and nothing to the band's top |
| **F4** | **WIND CHART** | tool | **10 MD** | The exact gust is shown **before** the throw instead of the announced band | **Zero units.** The gust is already a published variable *within* the band; knowing it earlier changes the distribution of where you land, never what a landing pays |

**The with/without arithmetic, per fold, on COURSE 1** (machine-checked; the same table is printed in the LOOP panel):

| Fold | without SQUALL FOLD | with SQUALL FOLD | worst-case delta |
|---|---|---|---|
| DART | +1..+3 SH / 0–1 MD | +3..+7 SH / 1–2 MD | **+2 SH / +1 MD** |
| GLIDER | +3..+8 SH / 2–4 MD | +8..+14 SH / 4–6 MD | **+5 SH / +2 MD** |
| KITE | +4..+10 SH / 4–6 MD | +10..+10 SH / 6–6 MD | **+6 SH / +2 MD** |

Read the last row and the "everything on" reference point together: SQUALL FOLD lifts **the fold that reaches further**, and it lifts it **exactly one baler** (the GLIDER's band moves from PAD 2–3 to PAD 3–4). The **gross faucet ceiling stays +18 SH / +6 MD** for the whole game, with every power on. Powers move *which fold reaches which baler*; they never move what a baler pays.

**Why this cannot become pay-to-win, in the layer's terms.** MD is produced only by flying, is never sold, and the build has no store, no account and no payment path of any kind. C3's violation test ("two accounts, same time, different spending") cannot be run against a build with no spending side — and the transform itself contains no money term. A player who buys nothing has every power available to them for the same in-game price as anyone else; a player who cannot aim still cannot reach the far baler with all four owned.

**The three readings the lead should confirm** are in the tensions section (items 3, 4 and 10): earned-but-real power, a *repeatable* meta sink that buys a retry, and course 4's far baler being open only to a player who owns SQUALL FOLD.

---

## PART B — EXIT PATH

**B1 — Save and offline play.** `localStorage["paperairplane.save.v1"]`, one JSON object: sheets, medallions, courses unlocked, chart index per course, skills (MILL HAND rank, SQUALL FOLD, WIND CHART), bales, bench plates, badges, statistics, `gustIndex`, the last 20 gust values, `saveVersion`. **Fully playable offline, yes** — the demo makes no network request of any kind (no leaderboard, no telemetry, no fonts fetched at runtime).

**B2 — Export.** An **"EXPORT SAVE"** button on the start screen and on the bench screen. It downloads `paperairplane-save.json`, documented schema:

```
{ saveVersion, sh, md, mdBurned, courses:[1,2,…], chartIndex:{course:n},
  skills:{millHand:0|1|2, squallFold:false, windChart:false},
  bales, plates, badges:[], gustIndex, gustHistory:[…≤20],
  stats:{flights, bestReach, bestGrade, farBalers, secondPresses, shortLandings} }
```

No account, no email, no server round-trip. `gustHistory` exists so a stranger can audit the published gust band from the file.

**B3 — If the studio closes something.** Courses, skills, bales and plates are numbers inside the save; retiring or renaming a chart changes nothing about what the player holds, and the export keeps them. There is no live service, no login and no key, so nothing a player earned can expire because a studio stopped shipping.

**B4 — Deletion.** The demo holds no account, no server record, no analytics identifier and no personal data beyond the optional chart-credit name. **"RESET SAVE" (double-confirm, as in Bin Runner and Brick Break) therefore deletes everything, immediately and completely.** If a leaderboard or chart credits are ever added, deletion removes the display name, the submission list and the telemetry id, and completes inside **30 days** — stated here so the promise exists before the feature does.

**B5 — Offline decay.** **None.** Nothing decays, expires, resets or is forfeited while the player is away; there is no streak, no daily, no notification, no mail of any kind. There is no in-run fuel to lose: the plane is folded at the moment of the throw and exists for one flight. A gust value is drawn per flight and is not stored, so there is nothing between sessions to lose — "absence cannot punish" is satisfied by having no offline process at all.

---

## PART C — PER-RULE PASS/FAIL

```
L1  Free entrance ............. PASS  Free build, no store, no account, no
   ad view. Fresh save = COURSE 1 + the free DART + 0 SH + 0 MD. The DART
   costs 0 sheets and returns at least +1 SH at the worst gust on every
   course (test above), so the loop is reachable at zero stock forever.
   First unlock (COURSE 2, 10 MD) in ~5 flights, ~5-8 min for a first-time
   player (designed, not playtested).
L2  Free exit ................. PASS  Close the tab at any moment. The payout
   banks the instant the paper lands, so an abandoned flight forfeits
   nothing earned; there is no clock, no fee, no cancel step, no offline
   decay, no notification, and no in-run fuel to lose. A KITE flight flown
   into a headwind on the night run can return 1 sheet less than it cost
   (the design's only negative line — tension 1); it is in-game paper,
   earned free, never purchased, and can never take the player below the
   free DART.
L3  No locked value ........... PASS  Everything earned is in one local JSON
   object: SH, MD, courses, charts, skill ranks, bales, plates, badges.
   Readable and playable with no network; exports to a file (B2).
L4  Data portability + delete . PASS  Export button + documented schema
   above, including the gust history; deletion = one button, complete and
   immediate; 30-day window stated for any future account feature.
L5  No pay-to-win ............. PASS  Nothing is for sale; there is no store
   surface in the build. Skills, the multiplier, the tool and the per-flight
   power are MD-only, MD is only produced by flying, and the payout table is
   identical on every course. The transform contains no money term.
L6  No pay-to-skip ............ PASS  No purchase exists. The only
   accelerators are earned: skills and the multiplier lift reach, which opens
   no gate that removes a step of the loop (a fold, a throw and a landing are
   always required, and MD never folds or throws for you).
L7  No injected ads ........... PASS  No ad SDK, no sponsor placement, no
   pre-roll, no "watch to continue". Nothing auto-plays. If a sponsor ever
   appears it sits on the credits screen, labelled, carrying no reward.
L8  No scarcity/FOMO/gambling . PASS  No clock, no rotation, no "ends in",
   no streak, no daily. The one random variable is the headwind: its band is
   announced before every throw, its values are published, it is drawn
   uniformly from the game's own simulation and never from a purchase, and
   it cannot create a unit the published ladder does not already pay. There
   is no loot box, no gacha, no paid chance, and nothing for sale at all.
   Full reading in A8 and in the L8 note below.
L9  Cosmetics only ............ PASS  Cosmetics in the build are **earned**
   only: stencil badges for every 10 bales pressed, engraved plates for every
   10 bench plates. No paid cosmetic exists, so no earned/bought confusion is
   possible.
L10 Earned-only progression ... PASS  Unlock table published below; every row
   is opened by MD, which only flying produces. Designed times: MILL HAND r1
   at 6 MD ~3 flights; COURSE 2 at 10 MD ~5 flights; SQUALL FOLD 12 MD ~3
   competent flights; MILL HAND r2 18 MD ~5; COURSE 3 24 MD ~6; COURSE 4
   48 MD ~12. A slower player should expect roughly double. C4's far baler
   additionally requires SQUALL FOLD — earned progression, spelled out.
L11 Reinvestment report ....... PASS  Quarterly, one page, revenue by source,
   spend by category, and the excluded list. First report due six months after
   the first revenue; **no revenue has been taken, so no report exists yet** —
   this is a commitment, not a published artefact.
L12 Player voice .............. PASS  Mechanism = in-game poll + open thread
   before any paid release, outcome published including disagreement. **Last
   consultation: none — no paid release exists yet.** The monetisation log
   opens with the first entry rather than back-dating one.
L13 Conflict isolated ......... PASS (N/A)  Nothing is destroyed, nobody is
   an opponent, and there is no combat, no PvP and no being anywhere in the
   game. The plane lands in a baler; a baler is paper; the wind is weather. Of
   the three samples this is the cleanest L13 fit — no rule clarification is
   being asked for here, unlike Brick Break.
L14 Data & API boundary ....... PASS  Nothing leaves the device: no analytics,
   no identifiers, no third party, no network call. The only personal datum
   that could ever exist is an optional credit name on a submitted course
   chart, chosen by the player, deletable with the save.
L15 Honest claims ............. PASS  Claims list in Part E, each in-game
   verifiable today. No money, health, or real-environment claim is made
   anywhere — see the guardrail note under Part E, which matters here because
   the fiction is a paper mill and wind.
```

### The L8 note, in full (this is the sample's novel rule question)

The headwind is **one random variable affecting a flight outcome**, and the layer's position on it is:

1. **Published** — the band is on screen before the throw ("GUST 0/3/6"), its values are in the LOOP panel, and the drawing rule is stated in plain words.
2. **Honest** — the exact value is written into the flight ledger after the landing and the last 20 values are kept in the export, so anyone can check the band is real and roughly uniform rather than a lie behind a nice animation.
3. **Free, and never a reward roll** — the gust moves you between balers; it never invents a unit. There is no item, drop, chest or "chance to win" anywhere in the game, and nothing is for sale, so no purchase can be attached to chance (L8's actual target).
4. **Hedgeable, not blindsiding** — the band is announced, an aim of 10 outsizes the worst gust on C1–C3, and the WIND CHART tool (earned, 10 MD) reveals the exact value for a player who wants to stop hedging.
5. **Never re-rolled by a power.** SECOND PRESS re-rolls the **throw**, never the wind: a retry is a second attempt at the same conditions, which is why its ceiling contribution is exactly zero units.

**Proposed one-line clarification for spec v0.2** (the lead should take this to the owner): *"L8 permits randomness that (a) is disclosed in a published band before the outcome, (b) is drawn from the game's own simulation rather than from a purchase, and (c) cannot create a unit that the game's published ceiling does not already pay."* **And one explicit new exclusion for L8's list: a game may not sell, rent or grant calmer weather, an exact forecast, extra throws, or a retry.** That exclusion is written into D2 below so the temptation is answered before it is built.

### Published unlock table (L10)

| Row | Cost | What opens | Designed time (competent) | Advertised? |
|---|---|---|---|---|
| MILL HAND rank 1 | 6 MD | −1 yard of headwind on every future flight | ~3 flights (~2 min) | free content |
| **COURSE 2 — HARBOUR FLAT** | **10 MD** | new chart: pads 12/32/42/58, one wide 8-yard draft column | **~5 flights (~5–8 min for a first-time player)** | free content |
| WIND CHART | 10 MD | the exact gust before the throw | ~5 flights | free content |
| SQUALL FOLD | 12 MD | base reach × 1.25 on every flight | ~3 competent flights | free content |
| MILL HAND rank 2 | 18 MD | −2 yards of headwind in total (MAX rank) | ~5 flights | free content |
| COURSE 3 — RIDGE LINE | 24 MD | pads 18/34/46/64, gust 0/4/8, three 5-yard columns | ~6 flights | free content |
| COURSE 4 — NIGHT RUN | 48 MD | pads 20/38/56/72, gust 0/5/10; the far baler needs SQUALL FOLD | ~12 flights (~20–25 min) | free content |
| Bench plate | 5 MD | an engraved plate; badge every 10 (unbounded sink) | immediate | earned cosmetic |
| Re-chart a course | 3 MD | the course's next published chart | immediate | free content |
| SECOND PRESS | 4 MD | one retry of the throw on the current flight | immediate | earned power |

All timing figures are **designed, not measured**. The last row of this table has no player who has reached it yet, and this form must not pretend otherwise: COURSE 4's ~12-flight estimate is an estimate.

### Cheapest honest way to verify any of this (for a sceptical stranger)

Fly one flight on COURSE 1 with a GLIDER and read the ledger: `REACH 48 = 44 BASE + 7 AIM − 3 GUST → PAD 3 RIDGE BALE → SH +12 · MD +4`, and the HUD's two counters moving by exactly those numbers. Then set the aim to 0 and read the ledger again — the gust value it prints must be one of 0, 3 or 6 and nothing else. Export the save and count the gust history against the published band. Then press a bale and watch 8 SH disappear for one printed bale; press a course-2 button at 9 MD and read the shortfall. Everything in the HUD is in the save file, and every number a flight pays is a lookup on which baler the paper landed in.

---

## PART D — REVENUE AND VOICE

**D1 — Revenue models in use (only §3.4).**
- Base game: **free**, loop complete, nothing sold inside it (§3.4 model 1's precondition; the free branch is chosen deliberately — the owner's open Q4 in the spec's §7 is unresolved, so this form takes the branch that cannot FAIL).
- **Optional paid expansion "THE LONG FLIGHT"** — new course charts, new draft layouts and submitted player charts chosen for publication. Geometry and decisions, **no power, no number, no shortcut**: the payout table is identical in the expansion.
- **Voluntary patron tier** — the same game everyone has, plus development notes, credits, and badge cosmetics that pass L9; cancelling costs nothing and the tier holds no game value.
- **Funded pilots with studios, educators, or public bodies** — a paid adaptation of the fold-and-fly loop for a classroom (a bench that teaches how a landing ladder bounds a faucet), disclosed in the L11 report.
- **Optional, separately sold educational material** — "Flight notes: why the far baler is the ceiling", a one-page teaching sheet on ceiling-by-ladder arithmetic. Content, not power.

**D2 — Excluded on purpose.** Advertisements and any rewarded ad. Loot boxes, gacha, spin wheels, or any purchase of a chance. Power of any kind, including **calmer wind, an exact forecast, a wider baler, extra throws, a retry, or a better payout per baler**. Shortcuts and instant unlocks. Paid exclusivity or paid entrance to the loop. Sale, sharing or trade of player data. **Any conversion of SH or MD into money or into anything outside the game** — there is no wallet, no token, no NFT, no chain, no exchange, and no unit in this game is a financial asset. Medallions buy creases.

**D3 — Monetisation change log.** `/layer/monetisation-log`.

**D4 — Consultation mechanism and last consultation.** Mechanism: in-game poll plus an open thread, run before any paid release or price change; both the players' answer and the studio's decision are published side by side, including a "we went against the majority" entry if that happens. **Last consultation: none yet** — no paid release exists and no price has been set, so there is nothing to have consulted on. The log's first entry will be dated, not back-dated.

**D5 — Reporting cadence and last report.** **Quarterly** (well inside L11's six-month limit). Latest report: **none yet** — no revenue has been taken through this game. The first report is due within three months of the first euro, and it will state a real number, even a tiny one.

---

## PART E — CLAIMS AND SIGN-OFF

**E1 — Public claims (each must be checkable in the game this week).**

1. "One fold, one throw, one landing — the flight ends where the paper lands, and there is no clock anywhere in this game." **[in-game verifiable]** — play, and watch nothing tick.
2. "The free fold costs no paper and always returns at least one sheet, so no player can ever be locked out of the loop." **[in-game verifiable]** — export the save, fly the DART at the worst gust on every course, read the ledger: +1 SH minimum.
3. "No power, skill or multiplier can pay more than the far baler's +18 sheets and +6 medallions." **[in-game verifiable]** — read the ladder in the LOOP panel; fly the far baler with every power bought and the payout is identical.
4. "The wind is announced before you throw and printed after you land, and it never pays a unit the ladder does not already pay." **[in-game verifiable]** — read the announced band, throw, read the ledger's gust value, check it against the published band.
5. "Your save is a file you can export, and it contains your gust history so you can check the wind was honest." **[in-game verifiable]** — press EXPORT SAVE; a text editor opens it.

**E2 — Claims intentionally NOT made.** No real-world income, no universal basic income, no health or wellbeing outcome, no environmental outcome arising from play, no crypto or financial-asset ownership: **confirmed yes.**

> **Guardrail note for this game specifically.** The fiction is a paper mill, "waste heat", wind and paper that "comes back". That is exactly where the forbidden claim is most tempting, so here are the sentences that **must not be written**: "playing saves real paper", "each bale keeps real paper out of landfill", "the loop returns real resources to the mill", "your flights reduce real energy use", "regenerative by design", "circular by design", "this game teaches aerodynamics" (educational *intent* may be described only with "may" or "intend" — never as an outcome), and anything implying that a gust, a baler or a medallion is a real-world object. A landed flight is a variable in a save file. The words "regenerative" and "circular" are also held back pending the owner's open question 5 in the spec's §7 (what the owner's other businesses already claim) — the page copy should not use them until that is answered.

**E3 — Signed (sample)** .................... Date 2026-10-01

---

## BUILD NOTES FOR THE ENGINEER

One route file `src/routes/paper-airplane.tsx`, same shape as `bin-runner.tsx` and `brick-break.tsx`: `createFileRoute`, meta in localStorage, phases `start | bench | aim | flight | landing`, keyboard + pointer input, no backend, no accounts, no network. A 320×240 logical canvas scaled with `image-rendering: pixelated` for the yard; the panels around it plain DOM like the other two.

### Constants to wire (copy these, do not re-derive)

```ts
const SAVE_KEY   = "paperairplane.save.v1";

const FOLD = {
  DART:   { glide: 20, rides: false, cost: 0 },  // free forever — the anti-lockout fold
  GLIDER: { glide: 32, rides: true,  cost: 4 },
  KITE:   { glide: 40, rides: true,  cost: 8 },
};
const AIM_MAX        = 10;      // exact integer, shown on screen before and after the throw
const SQUALL_MULT    = 1.25;    // F2: floor(base * 1.25)
const HAND_MAX       = 2;       // F1: 2 ranks, -1 yard of headwind each
const SECOND_PRESS   = 4;       // F3: MD, charged only when the retry is actually taken
const WIND_CHART     = 10;      // F4: MD, one rank
const MILL_HAND_COST = [6, 18]; // MD, rank 1 then rank 2

// one row per course chart
const COURSE = {
  1: { name: "MILL YARD",     pads: [16, 32, 46, 58], gust: [0, 3, 6],  columns: 2, lift: 6, cost: 0  },
  2: { name: "HARBOUR FLAT",  pads: [12, 32, 42, 58], gust: [0, 3, 6],  columns: 1, lift: 8, cost: 10 },
  3: { name: "RIDGE LINE",    pads: [18, 34, 46, 64], gust: [0, 4, 8],  columns: 3, lift: 5, cost: 24 },
  4: { name: "NIGHT RUN",     pads: [20, 38, 56, 72], gust: [0, 5, 10], columns: 2, lift: 8, cost: 48 },
};

const PAY_SH = [1, 3, 7, 12, 18];   // index 0 = SHORT, 1..4 = PAD 1..4  — IDENTICAL ON EVERY COURSE
const PAY_MD = [0, 1, 2, 4, 6];     // ditto. The lookup on grade IS the ceiling; never compute a
                                    // payout from reach, or the ladder's cap stops being structural.

const BALE_SH    = 8;   // unbounded sheet sink: 8 SH -> one bale, badge every 10
const PLATE_MD   = 5;   // unbounded MD sink: 5 MD -> one bench plate, badge every 10
const RECHART_MD = 3;   // repeatable
const GUST_KEEP  = 20;  // gust values kept in the save for audit

const SEED = { sh: 0, md: 0, courses: [1], chartIndex: { 1: 0 }, millHand: 0,
               squallFold: false, windChart: false, bales: 0, plates: 0,
               badges: [], gustIndex: 0, gustHistory: [] };
```

`base(fold, course) = FOLD[fold].glide + (FOLD[fold].rides ? COURSE[course].columns * COURSE[course].lift : 0)`, then `× 1.25` floored if `squallFold`; `reach = base + aim − max(0, gust − millHand)`; `grade = last index i where reach ≥ pads[i]`, else 0 (SHORT).

### Geometry, on a 320×240 field

- Logical canvas **320×240**, scaled up, `image-rendering: pixelated`. Sky from y 0–208, ground line y 208, 4-colour palette (cream paper, ink, mill grey, one accent).
- **x = 20 + reach × 3.4** for the landing position. That maps every reachable outcome inside the field: reach 10 → x 54, 20 → 88, 32 → 129, 46 → 176, 58 → 217, 72 → 265, and the highest reach the game can produce (80) → x 292 < 320. **Draw each baler's net sprite (12×16, sitting on the ground line) at its pad threshold's x, so the player can read the ladder as a picture.** The mill wall is the strip x 8–20; a SHORT flight lands at x < 74 on C1.
- **Draft columns** are dashed vertical columns, y 40–208, always placed *before* the nearest baler so the "a wing rides every column it passes" rule is literally true on screen: C1 at x 36 and 58; C2 at x 44; C3 at x 30, 46, 62; C4 at x 34, 56. The plane visibly rises as it crosses one.
- **Launch rail**: x 8, plane spawns at (12, 200). **Aim meter**: bottom strip y 216–232, 240 px wide, marker sweeping 0→10→0 at 12 units/second (a full sweep in 0.83 s), the integer value printed beside it, and a tick on the bar for the aim each baler needs at **zero gust** (the "clean line"), labelled with the baler's name. The HUD line above the yard reads `BASE 44 + AIM ? − GUST 0..6`.
- **Flight animation**: 2.4 s, a quadratic arc from the rail to the landing x with a visible lift step at each column, a horizontal streak overlay scrolling backwards while the gust is non-zero, then the landing flash `PAD 3 — RIDGE BALE · SH +12 · MD +4` and the permanent ledger line `REACH 48 = 44 BASE + 7 AIM − 3 GUST`.
- **HUD top strip:** `COURSE 1 MILL YARD · GUST 0/3/6 · SH n · MD n · FOLD KITE`.
- data-testids to match the other routes: `fold-DART`/`fold-GLIDER`/`fold-KITE`, `throw-btn`, `aim-value`, `flight-ledger`, `payout-line`, `meta-sh`, `meta-md`, `gust-band`, `gust-value`, `use-second-press`, `buy-millhand`, `buy-squallfold`, `buy-windchart`, `unlock-course-2`, `press-bale`, `bench-plate`, `rechart`, `export-save-start`, `reset-save`, `loop-panel`.

### MUST be implemented end to end (the headline loop)

**Fold at the bench → throw → land in a baler → bank SH + MD at the instant of landing → spend 10 MD to unlock COURSE 2 (HARBOUR FLAT).** A competent player should reach COURSE 2 in **~5 flights, ~5–8 minutes**, exactly as Bin Runner's 40-ST board 2 and Brick Break's 9-SE bay 2 do.

1. Fold picker with price and shortfall; **DART must always be selectable at 0 SH**; sheets leave the stock at the throw, so changing folds before throwing costs nothing.
2. Reach and grade: `base + aim − gust (− MILL HAND)`, graded against the current course's pad ladder, **with the ledger line printed on screen after every landing**: `REACH 48 = 44 BASE + 7 AIM − 3 GUST → PAD 3 → SH +12 · MD +4`. Without that line the design fails C1, so it is not optional decoration.
3. Payout as a **lookup on grade** (`PAY_SH[grade]`, `PAY_MD[grade]`), credited to the save **the instant the plane lands** — never batched. This is what keeps L2 true.
4. **Gust**: uniform draw from the course's three published values, advanced on `gustIndex` + a seeded counter stored in the save, pushed into `gustHistory` (keep 20). Band announced **before** the throw; the drawn value shown **after**; both visible in the export.
5. Aim meter: integer 0–10, value displayed, sweep speed as above, ticks for the clean line to each baler.
6. The lockout guarantee: assert in code (a dev-only check) that `FOLD.DART.cost === 0` and that `PAY_SH[min grade reachable by DART on every course] >= 1`.
7. Skills: MILL HAND rank 1/2 (`6 / 18 MD`, show `MAX` at rank 2), SQUALL FOLD (`12 MD`), WIND CHART (`10 MD`) — each button shows price, shortfall, effect line and ceiling.
8. SECOND PRESS: a per-flight button that appears when a landing is below the player's best grade, costs **4 MD only if taken**, keeps the **same** `gust` for the retry, and pays the better of the two landings.
9. Course unlock buttons for 2/3/4 with price and shortfall, and a re-chart button (3 MD) that advances `chartIndex` (the chart swap may be display-only, see below).
10. Baling order: **8 SH per bale**, unbounded counter, badge every 10. **The spend must be real** — it is the unbounded sink that makes C2 provable. Bench plates: 5 MD each, same rule.
11. Bench/intermission economy panel: every button shows price and shortfall, exactly as Bin Runner's and Brick Break's do.
12. LOOP panel publishing this document's arithmetic: the fold table, the ladder and payout table, the ceilings per course, the **powers table with cost / effect / ceiling**, the with-and-without SQUALL FOLD table, the reference points (DART +3/+1 · GLIDER +8/+4 · KITE +10/+6 · everything-on +10/+6), the gust band and the gust history, and the line **"nothing here converts to money; no purchases exist in this game"**.
13. **EXPORT SAVE** → `paperairplane-save.json` (Blob download), including `gustHistory`; reset with double-confirm.
14. Start screen stating the loop in five lines: `DART FOLD FREE · LAND A BALER FOR SHEETS + MEDALLIONS · THE FAR BALER PAYS +18 SH +6 MD · THE GUST BAND 0/3/6 IS ANNOUNCED BEFORE EVERY THROW · 10 MD OPENS COURSE 2`.
15. Offline: no network call of any kind anywhere in the file.

### MAY be display-only

- **Re-chart (3 MD):** wire the spend and the counter; if the alternate charts are not authored, show `CHART <n> QUEUED`. The sink is what conservation needs, the art is not.
- **Bale stack and bench plates:** a counter and a badge list are enough (`BALES 7 · PLATES 12`). The **spends must be real**.
- **The flight animation's fidelity:** a straight line with a rise at each draft column and a two-frame landing is enough, provided the landing x is derived from `reach` so the picture never contradicts the ledger.
- **Course charts 3 and 4:** if only two charts are authored, wire the unlock buttons and swap the pad/gust/column constants from `COURSE` — the arithmetic is already in that table.
- **The contribution path** (player-submitted course charts) is out of scope for this demo; the input is named in A2 so the form is honest about it, and the credit name is the only personal datum the design can ever hold.

### Arithmetic and mechanics I simplified, and why

1. **No clock, no charge, no board — the flight is the run.** That is the third distinct bound across the three samples, and it makes C2 exact in a new way: the faucet is capped by a *ladder*, not by a board's contents or a charge count. If flights ever feel too long, shorten the animation — **do not add a fuel or a timer.**
2. **The aim value is an exact integer 0–10**, not a continuous angle. The published arithmetic and the built arithmetic are then the same arithmetic, and a player can reproduce any payout on paper.
3. **The reach is one integer sum, not a physics integration.** The arc is decoration; the landing x comes from `reach × 3.4`. This is what makes the machine-checked sums in this document identical to what the build does.
4. **The gust has three published values per course**, not a continuous band. Auditable, legible, and it makes the disclosed randomness a decision ("hedge with aim") rather than noise.
5. **No overshoot.** The balers are catch nets, so surplus reach is absorbed and grading is monotone. This removes a failure mode a distance game normally has, and it is what lets me claim the ladder's top is a structural ceiling. If a designer later wants overshoot as a failure, the whole A4 ceiling argument has to be redone.
6. **The payout table is identical on every course.** Courses are geometry, gust and decisions — never rates. This is the same rule as Brick Break's "more surface, not better rates", and it is what stops the expansion from inflating anything.
7. **The free DART is a floor faucet, not a shortcut.** It cannot reach PAD 2 on any course (max reach 30 vs the lowest PAD 2 threshold 32), so it is a genuine minimum rather than a free path to the top.
8. **SECOND PRESS charges only when used**, keeps the same gust, and pays the better landing — so its ceiling contribution is provably zero units and it cannot be read as buying a re-roll.
9. **Nothing decays.** No stored per-flight resource exists, so B5's "no offline process" is literally true rather than a promise.

### Rule and condition tensions I want the lead to see

1. **The one negative line in three samples: a KITE flown without SQUALL FOLD on COURSE 4 can return 1 sheet less than it cost** (grade PAD 2, +7 SH, cost 8 SH = −1). Everything else in the economy is non-negative for every fold, every course, every gust, with or without powers. I kept it deliberately: it is the design's only real risk, it is bounded to 1 sheet of in-game paper that was earned free and cannot be bought, the free DART can never lose a sheet, and SECOND PRESS exists to insure exactly this flight. **If the lead prefers a zero-negative economy, the fix is one number: change COURSE 4's PAD 3 threshold from 56 to 46, which makes the unpowered C4 KITE line +4 SH instead of −1** and changes nothing else (re-run the check script to confirm). I am flagging it rather than deciding it, because "can a conforming run ever cost the player anything?" is a layer question, not a game question.
2. **L8 and the headwind** (full reading in Part C's L8 note). I believe the gust passes L8 as written: it is disclosed, free, drawn from the simulation and not from a purchase, and it pays nothing the ceiling does not. But this is the first sample to *use* §2.2's "or honestly random", so it wants the v0.2 clarification above, plus the new exclusion (never sell calmer wind, a forecast, a retry or a throw). If the owner wants zero randomness in layer games, delete the gust and the aim alone (0–10) becomes the skill variable — the ladder, the payouts and every number in A8 are unaffected.
3. **Earned power is real power, and this is the sample that proves the layer's reading.** The layer forbids *purchased* advantage (L5/L9, C3); it does not forbid *earned* power — L10 is literally "earned-only progression", which presumes earned capability. SQUALL FOLD raises the net band by up to +6 SH / +2 MD per flight over an unpowered player of identical skill, and it is the only route to COURSE 4's far baler. I claim that is conforming because MD cannot be bought, no purchase path exists in the build, and the *faucet ceiling* (+18 SH / +6 MD) is untouched. **The lead should confirm this reading before a studio copies the powers pattern**, because it is the pattern the whole layer will be judged on: powers may raise what a player can *do*; they may never raise what a game can *pay*.
4. **SECOND PRESS is the first repeatable meta sink that buys an in-flight advantage** (4 MD → a retry of the throw). It is earned-only and its ceiling contribution is zero, but it is closer to "currency → advantage" than anything in Bin Runner or Brick Break, and a studio could abuse the shape ("10 MD to skip the fold", "20 MD to land the far baler"). **Suggested v0.2 rule:** *a repeatable in-game sink may sell a second attempt at a required action, but never the completion of one, and never a change to a published payout.*
5. **The free DART is the economy's minimum wage.** Its rate (+1..+3 SH, 0..+1 MD per throw, unlimited throws) is the floor a player can always farm. If a playtest shows dart-grinding is dominant or mindless, the fix is one number per course (raise PAD 1's threshold, or move PAD 2 up), not a cooldown — a cooldown would be a timer, which this design does not have.
6. **The aim meter is a reaction test inside the run.** The layer forbids timers and absence pressure *outside* the run; a sweeping marker is a skill test, not a countdown, and it stops when you are not throwing. I am flagging the reading anyway, because it is a judgement call: a static "set your power and press throw" slider would be less skill-weighted (and the design's C3 argument leans on decisions). The alternative that keeps both is a hold-and-release meter with a published speed, which is what I have specified.
7. **The whole legibility claim (C1) rests on the ledger line** `REACH 48 = 44 BASE + 7 AIM − 3 GUST → PAD 3 → SH +12 · MD +4`. If the engineer ships the game without that line on screen, this design fails C1's violation test even though the arithmetic is right. It is REQUIRED inside MUST item 2 in the build list for that reason.
8. **Course 3 and course 4 are open only to a player with the right skill, and C4's far baler needs SQUALL FOLD specifically.** Earned by L10's letter, but it *is* content behind a meta spend, and a sceptical reader will ask whether that is a gate. My answer: a gate that any player can open by playing, with the cost published and the required skill published, is progression — the same answer Brick Break gives for its 54-SE bay. **Worth the lead confirming before a studio copies it.**
9. **Every time in this document is designed, not measured.** L10's compliance line asks for an estimated time in the unlock table and the spec's violation test asks for a real player who reached the last row. No such player exists yet.
10. **Powers were added at the owner's request and this is the only sample carrying them**, so the three samples are now deliberately uneven in that respect. If the owner wants the layer's games to be comparable, Bin Runner and Brick Break need the same treatment in a later pass — and neither has a structural ceiling as clean as this ladder: Brick Break's board bounds a *run*, but nothing in it bounds what an endless supply of runs can pay. **This pad ladder is the cleanest "bounded faucet" evidence in the layer so far and is worth naming in spec v0.2 §2.2 as an example of "bounded".**

---

## APPENDIX — the machine-checked sums (transcript excerpt)

`python3 /home/team/shared/paper-airplane-checks.py` prints 175 lines and ends with every assert green. The load-bearing lines:

```
FAUCET CEILING per flight, no powers : SH gross 1..18   MD gross 0..6
FAUCET CEILING per flight, ALL powers: SH gross 1..18   MD gross 0..6   -> the top of the band does NOT move
NET band (payout - fold cost), no powers : -1..+10 SH
NET band, all powers on                  : -1..+14 SH
ASSERT ok: no skill, power or multiplier can pay more than the far bale.

LOCKOUT: DART costs 0 SH; worst case on every course is SH +1; the DART's best is PAD 1
         (max reach 30 vs the lowest PAD 2 threshold 32)  -> no lockout at zero stock.

NEGATIVE-LINE: exactly one case in 4 courses x 3 folds x {with,without SQUALL} x {0,2 MILL HAND}:
         C4 KITE, unpowered, worst gust -> -1 SH. Nothing else is negative.

MONOTONICITY: 12 course x fold pairs checked, 0 regressions from SQUALL FOLD or MILL HAND.

REFERENCE (per flight, COURSE 1): DART +3 SH/1 MD · GLIDER +8 SH/4 MD · KITE +10 SH/6 MD ·
         KITE with every power +10 SH/6 MD  -> the top is provably identical.

C2 ABSORPTION: 128 MD of finite sinks = 32 competent flights; then bales (8 SH) and
         plates (5 MD) unbounded. 10 competent flights = 80 SH faucet = 10 bales = 80 SH sink.

UNLOCK TIMINGS: COURSE 2 at 10 MD = 5 flights at +2 MD/flight (a PAD-2 player).

COURSE LADDER: C1 far baler 58 reachable unpowered (62); C2 58 reachable at exactly 58;
         C3 64 reachable unpowered (65); C4 72 NOT reachable unpowered (66) and reachable
         with SQUALL FOLD (80)  -> C4's far baler is earned progression, by design.

GUST: bands (0,3,6) (0,3,6) (0,4,8) (0,5,10), uniform, mean 3/3/4/5, worst case = the band's
      top and never more. Drawn on a save-backed counter; kept 20 deep in the export.
```

---

*End of design. If any number here changes, change it here first, re-run `python3 paper-airplane-checks.py`, and re-publish the balance arithmetic, the grade matrix and the unlock table — the point of the form is that the published numbers and the built numbers are the same numbers.*
