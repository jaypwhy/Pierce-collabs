# COMPOST TO SOIL (working title: **HOT HEAP**) — closed-loop design + Gaming Layer incorporation

**Game:** Hot Heap — an 8-bit single-screen **yard sim**: you keep one compost bin behind the allotment shed. Food scraps and green waste go in as **loads**; you **turn** the pile with a fork until it is ripe; you **empty** it as **soil**; the soil feeds the beds; the beds give the street its crops and hand you back the scrap that fills the next bin. The bin has a **lid, not a clock**: it is sealed the moment you stop, so nothing in this game moves while you are not pressing a key. Fourth playable sample of The Gaming Layer, and the first of the owner's four new sims (order: Compost to Soil, Local Energy, Repair Cafe / Library of Things, Preventative Health; the powers extension is fifth).
**Written by:** game-systems designer, team The Gaming Layer. **Date:** 2026-10-08.
**Status:** design document. **No build exists yet.** No studio is attached. Every rate, price and time estimate below is **designed, not playtested** — none of it has been measured in a running game. Numbers are stated here so the engineer can wire them without inventing any.
**Conforms to:** `/home/team/shared/layer-spec-v0.1.md` — five closed-loop conditions (C1–C5, §2.3), fifteen rules (L1–L15, §3.1–3.3), five permitted revenue models (§3.4), incorporation form (Parts A–E, §4). This document is a filled-in form in the same shape as the spec's samples (§5.1 Bin Runner, §5.2 Ledger Vale) and as `/home/team/shared/brick-break-design.md` and `/home/team/shared/paper-airplane-design.md`.
**Machine-checked:** every sum below is derived and asserted by `/home/team/shared/compost-to-soil-checks.py` (`python3 compost-to-soil-checks.py`, 12 asserts, ends green). If a number here changes, that script must be re-run and this document re-published — the form's last line is the whole point.
**What it is not:** not ratified by the owner; not a product announcement; not a claim that any studio has adopted anything; **not a claim about real food waste, real soil, real carbon or real anything** (see the guardrail note in Part E, which matters more for this game than for any other sample).

---

## 0. The game, and why it is not a reskin — and why it is not Ledger Vale

**Fiction.** Behind a terraced street there is an allotment yard: a shed, a pail by the gate, and a bin made of pallets. The neighbours' kitchen scraps and hedge trimmings come to the gate; the leaves and torn cardboard go in as **browns**. You build a heap in the bin, you turn it with a fork until it is ripe, and you empty it as dark soil. The soil goes on the beds; the beds crop; the crop feeds the street, and what the street cannot eat comes back to the gate as scrap. The pile only ripens **while you work it** — leave it and it is sealed, exactly as you left it, until you come back and pick up the fork. Every finished batch is cut as a **tally mark** on the shed door, and the tallies buy tools.

**Play unit:** one **BATCH** — load the bin, turn the pile until it is ripe, empty it as soil. There is no clock, no charge, no lives, no board and no flight. The bound is the **bin's own capacity and the pile's own ripeness**, and the pile cannot advance one point without a turn from your hand.

### 0.1 Why this is not a reskin of the three built games

| | Bin Runner (1) | Brick Break (2) | Paper Airplane / Windward (3) | **Hot Heap (4)** | Why it differs |
|---|---|---|---|---|---|
| Skilled input | **classification** — sort item → chute | **spatial** — angle the ram off the cart | **fold choice + release timing** | **the green/brown ratio** — a loading decision whose whole effect is on the *number of turns the batch needs* | the first sample whose skill is a **recipe of inputs**, paid off in **actions saved**, not in a bigger payout |
| Run bound | 90-second wall clock + 20 Charge | Swing (in-run charge) + the wall's brick count | the landing itself; no clock, no charge, no board | **the bin: capacity loads, then a ripeness ladder the player's own loading choice sets, then the empty** | the fourth distinct bound — and the only one where **the player sets the length of their own round**, because turns are free and only the pile's threshold ends it |
| Transformation | item → materials, one decision per item | ram → brick → cart | sheet → fold → flight → landing grade | **loads → heat → ripeness → soil**, a *staged* conversion with a **state that persists mid-batch and across sessions** | the first transform with **saved intermediate state** (`ripeness`, `loads`) that neither advances nor spoils offline |
| Faucet shape | per action (+6 CS / +3 RS) | per brick type (+2 RK / +3 RB / +1 DZ) | per landing grade (a ladder lookup) | **per empty: 1 SO per load the bin holds** — a lookup on the bin's *contents* | counted from what the player chose to put in, not from a performance grade or a brick type |
| Meta faucet | per craft (a Jack → +5 ST) | per milestone (row cleared → +1 Seal) | per grade band (0/1/2/4/6 MD) | **per batch, doubled when the pile was hot** — 1 Mark per 3 loads, ×2 | the first meta faucet that pays for **how** the player worked, not how much or how far |
| Meta currency | **ST — Stamp** | **SE — Seal** | **MD — Medallion** | **MK — Mark** (a tally cut into the shed door) | different fiction, different earn condition |
| In-run reinvestment | recycler 10 CS → 5 CH; assembler offcut | dust patches the cart; a cleared row pays +4 Swing | the mill's waste heat is the lift; the plane's paper returns | **the batch's own coarse fraction comes back as the browns that heat the next batch**, and the soil comes back as scrap through the beds | reinvestment is **physical and exact**: BR in = BR out, SO in = SO out |
| Material sink | bench tiers | reclaim-wall courses (unbounded) | the baling order (unbounded) | **the beds** (fed with soil, returning scrap) + sacks / border / trench (unbounded) | the sink is **growing something**, not building or pressing |
| Randomness | none | none | one disclosed gust | **none — zero random variables in the whole game** | the design is a published integer map end to end |
| Offline | nothing stored | Swing granted fresh per run | nothing stored | **no offline process at all: the bin is sealed, and the owner's decay-free ruling is the game's own fiction** | the strongest form B5 has taken in the layer |
| Powers | none (retrofit queued) | cart frames only (retrofit queued) | 2 skills, 1 multiplier, 1 tool, 1 per-flight power | **4 powers from the start: a turning skill, a cost multiplier, a repeatable power and a zero-unit gauge** | the powers request, built in from the first draft |

All four games are one route file, browser-playable, localStorage-only, no backend, no accounts.

### 0.2 Why this is not Ledger Vale

The layer's spec already carries a **simulation** sample (§5.2, Ledger Vale) and this game is a simulation too, so the risk of a re-skin is real and worth answering head-on. Ledger Vale is a **12-household settlement** across a **calendar of turns**: one turn = one in-game week, labour-hours are allocated across five parallel tasks (tillage, woodlot, flax, compost, workshop), yield is `3 G per field × (Soil Health/100)`, soil health is a **0–100 stock** the player manages against a target band, grain above the granary cap **rots at 5 %/week**, dwellings add households (which add both labour and mouths), and offline decay is **bounded, not zero** (12 offline turns, then frozen).

| | Ledger Vale (spec §5.2) | **Hot Heap** |
|---|---|---|
| Scale | 12 households, four fields, a granary, a woodlot, a flax patch, a workshop | **one bin, up to three beds** — the whole yard is on one screen |
| Turn | one in-game **week**; several decisions per turn, made in parallel | one **player action** — a load, a turn of the fork, an empty, a feed, a harvest. No calendar exists anywhere in the fiction |
| Soil | **Soil Health**, a 0–100 stock, never spendable, compared against a target | **SO — Soil**, a plain unit you **hold and spend**; the design has no health bar and no target band |
| Compost rule | `3 G + 12 LH → +5 S` — a bulk conversion priced in labour-hours | `loads → HEAT → RIPENESS → 1 SO per load`; the ratio of browns to greens changes the **turns**, never the yield |
| Skill | **allocation** of a labour pool between tasks | **composition** of one heap: browns × 3 ≥ loads |
| Decay | grain rots above the cap; offline decay bounded to 12 turns then frozen | **nothing decays, ever, and there is no offline process to bound** — the owner's decay-free cadence, which is this game's fiction and its B5 promise in one sentence |
| Meta | **LP — Ledger Points**, earned per public work, spent on a tech tree | **MK — Mark**, earned per batch closed (doubled when the pile was hot), spent on tools, bins and beds |

The honest summary: Ledger Vale asks "how do you **allocate** a valley"; Hot Heap asks "how do you **build one heap** so that it heats". They share a genre and share nothing else — different units, different period (an action, not a week), different skill (composition, not allocation), and opposite answers on offline decay.

---

## PART A — LOOP SUMMARY

```
THE GAMING LAYER — INCORPORATION FORM                    Form version: v0.1
==========================================================================
GAME  Compost to Soil ("Hot Heap")    BUILD/DATE  design only / 2026-10-08
STUDIO  (sample) two-person indie      SIZE  2      CONTACT  (sample)
GENRE  8-bit yard sim, compost loop    PLAY UNIT  one batch (fill / turn / empty)
```

### A1 — Units (name each, with symbol)

| Symbol | Name | Lives where | Faucet | Sink |
|---|---|---|---|---|
| **SC** | **Scrap** (food & green waste) | persistent stock | **+4 per GLEAN** (free, unlimited); **+7 per HARVEST** of a bed | 2 per GREEN load, 1 per BROWN load; 8 per TRENCH (unbounded) |
| **BR** | **Browns** (leaves, torn card, chippings) | persistent stock | `+loads/2` (rounded down) on every EMPTY; **+1 per HARVEST** | 2 per BROWN load (1 with F2); 6 per BORDER (unbounded) |
| **SO** | **Soil** (finished compost) | persistent stock | **+1 per load** on every EMPTY (so at most the bin's capacity) | 6 per BED FEED; 8 per SACKS (unbounded) |
| **MK** | **Mark** (a tally cut on the shed door) | persistent meta | **1 per 3 loads** in the emptied bin, **doubled if the pile was hot** | the unlock table (124 MK in total); 3 per SHED TALLY (unbounded); 2 per F3 BAT HANDLE |
| **LOADS / BROWNS / RIPENESS** | the batch's own state | **the batch only — stored in the save, never decaying** | — (they are what the bin is holding) | — (paid out at the EMPTY) |
| **BATCH** | the round you are working | **one batch, ends at the EMPTY** | — | — |

Not currencies and deliberately not units: **the bin and the beds** (capacities, bought with Marks, never money), **HEATED / COLD** (a state of one pile, re-evaluated every turn), **RIPE** (a threshold, never a stock — ripeness above it is capped and does not bank), **tally marks, mulch runs, trenches and sacks** (counters of what you did — earned, not sellable, not spendable), **badges** (cosmetic records, earned only).

### A2 — Inputs

- **Time** — one batch: 9–25 player actions, ~40–90 seconds for a full bin. Batches are unlimited and can be started the instant one is emptied.
- **Skill** — two decisions, both published as integers: **how many browns per load** (a pile is HEATED when `browns × 3 ≥ loads`, and a heated pile ripens at twice the rate — so the ratio decides the turns), and **how much to put in** (a batch pays 1 SO per load, 1 Mark per 3 loads, and a bin holding fewer than three loads pays no Mark at all: loading in threes, and filling the bin, is the whole of the play skill).
- **Contribution** — a player may submit a **bed plan** (a crop name, a feed cost, a harvest yield and a drawing) as free content; credited by name on the bed, and paid in the same units as play (Marks) — never a separate currency and never a power.
- **Seed capital** (granted once, identical for everyone, never purchasable) — **BIN 1 (THE PALLET BIN, 6 loads) and BED 1 (THE HERB BED) unlocked, 12 SC, 0 BR, 0 SO, 0 MK, fork rank 0, no powers**. Enough to reach the first output immediately: the first batch is six green loads, and **GLEAN (+4 SC, one action, free forever) can always refill the pail**, so a player at zero of everything can always load a bin.

### A3 — Transformation

Published, deterministic, bounded, skill-weighted, legible. **There is not one random number in it.** Every rule below is the arithmetic the build must run.

```
HEATED      iff   browns x 3  >=  loads                    (re-checked at EVERY turn and at the EMPTY)
RIPE        =     max(1, 2 x loads  -  4 x forkRank)       (F1 THE FORK, ranks 0/1/2)
ripens      =     +2 per TURN if HEATED, else +1           (a TURN costs no unit at all)
turns       =     ceil( RIPE / (2 or 1) )
EMPTY pays  =     SO = loads        BR = floor(loads/2)    MK = floor(loads/3) x (2 if HEATED else 1)
```

1. **Load.** One action per load. A **GREEN load** costs **2 SC** and adds no brown; a **BROWN load** costs **1 SC + 2 BR** (1 BR with F2 THE RIDDLE) and counts as one brown. Loads and browns are counted, never hidden, and every load is printed as it goes in (`LOAD 5 — BROWN · SC −1 · BR −2 · BROWNS 2/6 → HEATED`).
2. **Turn.** One action, **costing nothing** — no scrap, no browns, no soil, no Marks, no time. Ripeness rises by 2 on a HEATED pile and 1 on a COLD one, **capped at RIPE**: ripeness above the threshold does not bank and does not carry into the next batch.
3. **Empty.** Available **only when ripeness ≥ RIPE**. It pays 1 SO per load the bin holds, `floor(loads/2)` browns, and 1 Mark per three loads doubled on a hot pile; then the bin is empty and ripeness is 0.
4. **Feed.** A bed that is EMPTY can be **fed 6 SO** (one action). It becomes **STANDING**.
5. **Grow — and this is the sim's second cadence.** A STANDING bed becomes **READY when a batch is emptied**. It advances on **your actions, never on time**: a bed fed and then left alone stands for ever. **The natural round order is harvest → feed → batch:** harvest the READY bed, feed it again with soil you already hold, then load and work the next batch — at the end of that batch the bed is READY again, so one bed gives exactly one harvest per round. (Feeding *after* the empty instead is allowed and costs you a round of the bed's output; nothing is lost, it is simply slower, which is why the round order is published here.)
6. **Harvest.** A READY bed pays **+7 SC and +1 BR** (one action) and returns to EMPTY. The crop is the street's, the scrap is yours.
7. **Glean.** One action, **free, unlimited**: the pail at the gate hands over **+4 SC**. It needs no input and no unlock, and it is the reason no player can ever be locked out of the loop.
8. **Bank.** Every unit is credited **the instant it is earned** — on the EMPTY, on the HARVEST, on the GLEAN, the moment the key is pressed. Nothing waits for a session end, so closing the tab mid-batch forfeits nothing.

### A4 — Faucets (per action, with rate, cost, and ceiling)

**The batch's ceiling is structural, and no power can move it.** Every empty is a lookup on the loads the bin holds: **SO = loads, always, 1 per load.** A bin can hold at most its capacity, so the whole game has a published per-batch ceiling that is a property of the bin, not a tuning knob.

| Faucet | Unit | Rate | Cost to the player | Ceiling |
|---|---|---|---|---|
| EMPTY a ripe batch | **SO** | **+1 per load in the bin** | the loads' materials, the turns (free), one action | **+6 / +12 / +18 SO** — BIN 1 / 2 / 3. **1 per load on every tier: no power, skill or multiplier can pay more** |
| EMPTY a ripe batch | **BR** | **+1 per 2 loads** | as above | **+3 / +6 / +9 BR** |
| EMPTY a ripe batch | **MK** | **1 per 3 loads, doubled if HEATED** | as above | **+4 / +8 / +12 MK** |
| HARVEST a bed | **SC** | **+7 per harvest** | 6 SO spent at the feed + one batch closed + one action | **+7 SC per bed per batch** (at most one harvest per bed per batch, by rule 5 of A3) |
| HARVEST a bed | **BR** | **+1 per harvest** | as above | **+1 BR per bed per batch** |
| GLEAN | **SC** | **+4 per action, unlimited** | one action, nothing else | **+4 SC per action** — the highest **scrap** yield in the game, and the only faucet that needs no stock, no unlock and no cooldown at all |

**Cost to the player of every faucet:** player actions and the materials the loads cost. There is no clock, no cooldown, no daily cap, no charge, no fuel and no purchasable acceleration. The one faucet that is free of material cost is GLEAN, and the one action that is free of unit cost is TURN.

### A5 — Sinks (what every faucet runs into)

| Sink | Rate | What it returns to the player |
|---|---|---|
| **GREEN load** | 2 SC | a load in the bin — 1 SO when the batch empties |
| **BROWN load** | 1 SC + 2 BR (1 BR with F2) | a load, and one third of the pile's heat requirement |
| **BED FEED** | **6 SO** | a crop that becomes READY after the next batch is emptied, and +7 SC +1 BR when harvested — **a sink that returns** |
| **SACKS TO THE LANE** | **8 SO each, unbounded** | a sack of soil for the street's window boxes; a badge every 10 |
| **THE BORDER** | **6 BR each, unbounded** | one run of mulch border along the beds; a badge every 10 |
| **THE TRENCH** | **8 SC each, unbounded** | a trench dug in the lane's beds; a badge every 10 |
| **SHED TALLY** | **3 MK each, unbounded** | one more tally cut on the shed door; a badge every 10 |
| **F3 THE BAT HANDLE** | **2 MK per use, repeatable** | one turn's ripeness gain +1 (A8) |
| **Unlock table** (one-off, earned-only) | see Part C | a bed, a bin, a fork rank, a riddle, a gauge |

Every faucet has a sink able to absorb it and **every unit has an unbounded one**: SO → the beds and the sacks; BR → the brown loads and the border; SC → the loads and the trench; MK → the unlock table and the shed tally. None of them expires, and none of them is a countdown.

### A6 — Reinvestment, in-loop (mechanical)

1. **The batch's waste is the next batch's heat.** Every empty hands back `floor(loads/2)` browns — the coarse fraction the pile could not break down. Those browns are what heats the next pile: the heat check needs `browns × 3 ≥ loads`, and a brown load costs two browns. **This is exact, not decorative: on the hot line, BR in = BR out at every bin tier** (6 loads: 2 brown loads cost 4 BR, the empty returns 3, the bed harvest returns 1 → 4 = 4; 12 loads: 8 in, 6 + 2 = 8; 18 loads: 12 in, 9 + 3 = 12). The loop's own output closes its own input.
2. **The soil goes to the beds and comes back as scrap.** A batch pays 6 SO per bed's feed; the bed pays 7 scrap. In the published round order (harvest → feed → batch) each bed gives **exactly one harvest and one feed per round, so SO in = SO out per round, exactly, on every tier** (6/12/18 SO per batch feeds 1/2/3 beds, which return 7/14/21 scrap). The crop is the loop's closing link.
3. **One round's output is the next round's input.** Soil feeds beds; beds feed scrap; scrap loads the bin; the bin's coarse fraction heats the pile. The player's own labour — gleaning — is the only thing that is not recycled, because **scrap is the fuel and it burns** (A5's first two rows, and the one negative line in Part C).

### A7 — Reinvestment, meta (studio-level)

Free bed plans and new bed types add decisions, **never numbers** — every bed feeds on 6 SO and harvests 7 SC +1 BR, on every tier. Published reinvestment report (L11), monetisation change log and pre-release consultation (L12). Player-submitted bed plans are published with credit and become free content for everyone. Marks are never sold and never convert to anything outside the game. **Four earned powers — a turning skill with two ranks, a cost multiplier, a repeatable per-use power and a zero-unit gauge — are built in from the first draft** (the owner's powers request), and their full arithmetic is in A8.

### C-conditions: **C1 [x] C2 [x] C3 [x] C4 [x] C5 [x]**

### Balance arithmetic (published, per ROUND — one batch and the beds it feeds)

A **round** is the game's natural period: **harvest** the beds that are READY → **feed** them again with soil you already hold → **load** the bin → **turn** the pile ripe → **empty** it (which turns every STANDING bed READY for the next round). The seed configuration is BIN 1 + BED 1. The round order matters and is machine-checked: harvest-then-feed gives **exactly one harvest and one feed per bed per round**, which is what makes soil exactly conserved; feeding after the empty instead gives a bed one harvest per *two* rounds (allowed, slower, nothing lost).

```
line (per round)                                loads turns act  SO  BR MK   SC(before glean->after)  BRnet SOnet  act/MK
R1 SEED hot, no powers (BIN1+BED1)                  6     6  16   6   3  4   -3  ->  +1 (1 glean)       0     0    4.00
R2 SEED cold, the first-time line                   6    12  23   6   3  2   -5  ->  +3 (2 gleans)      4     0   11.50
R3 SEED hot, F1 THE FORK rank 1                     6     4  14   6   3  4   -3  ->  +1                0     0    3.50
R4 SEED hot, F1 rank 2 (all turning skill)          6     2  12   6   3  4   -3  ->  +1                0     0    3.00
R5 SEED hot, ALL POWERS (F1 rank 2 + F2)            6     2  12   6   3  4   -3  ->  +1               +2     0    3.00
R6 BIN2+BED2 hot, no powers                        12    12  31  12   6  8   -6  ->  +2 (2 gleans)      0     0    3.88
R7 BIN2+BED2 hot, ALL POWERS                       12     8  27  12   6  8   -6  ->  +2               +4     0    3.38
R8 BIN3+BED3 hot, no powers                        18    18  46  18   9 12   -9  ->  +3 (3 gleans)      0     0    3.83
R9 BIN3+BED3 hot, ALL POWERS                       18    14  42  18   9 12   -9  ->  +3               +6     0    3.50
R10 BIN2+BED2 cold (the band's far end)            12    24  44  12   6  4  -10  ->  +2                8     0   11.00
R11 BIN3+BED3 cold                                 18    36  65  18   9  6  -15  ->  +1               12     0   10.83
```

- **Published band: 3.00 to 11.50 player actions per Mark per round**, over 24 machine-checked lines (3 bin tiers × 2 heat states × 4 power states). The seed hot line sits at **4.00**; the whole yard sits at **3.83–3.88**.
- **Reference points, all four shown in the LOOP panel:** SEED hot **4.00 act/MK · +4 MK/round** (BIN1+BED1, 6 loads) · SEED cold **11.50 act/MK · +2 MK/round** (the first-time line) · BIN2+BED2 hot **3.88 act/MK · +8 MK/round** · BIN3+BED3 hot **3.83 act/MK · +12 MK/round**. Every power on moves the seed line to **3.00 act/MK** and **not one unit of the batch's payout** (A8).
- **Conservation is exact, not approximate.** Per round at every bin tier and every fork rank: **SO in = SO out and BR in = BR out, both exactly 0.** The only net flows are scrap (which the loop burns) and Marks (which it banks).
- **Scrap burns, always.** The loop is net-negative in scrap on every full-batch line (−3 at BIN 1, −6 at BIN 2, −9 at BIN 3, before gleaning) because a load converts scrap into soil and only a bed turns soil back into scrap. **GLEAN (+4 SC, one action, free, unlimited) always pays that debt** — 1, 2 and 3 gleans respectively — so the deficit costs actions, never progress.
- **Absorption.** The finite unlock table takes **124 MK**; from the seed line (+4 MK a round) that is **31 rounds ≈ 500 actions ≈ 25–40 minutes** (designed, not playtested), and from the full yard (+12 MK a round) it is **~10 rounds ≈ 460 actions** — the same work per Mark, delivered in bigger rounds. After that the **Shed Tally (3 MK, no cap)** and **F3 (2 MK a use, no cap)** take everything the player cares to spend. **No unit is created that no sink can consume.**
- **Posted at** `/compost-to-soil` (the in-game LOOP panel) **and** `/layer`.

### The lockout test (L1 in one line of arithmetic)

| Starting state | What it costs | What it pays |
|---|---|---|
| **0 SC, 0 BR, 0 SO, 0 MK** (an empty save) | 2 gleans + 3 green loads + 6 cold turns + 1 empty = **12 actions** | **3 SO, 1 BR, 1 MK** |

- **A TURN COSTS ZERO UNITS.** Any loaded bin can be ripened by an unlimited number of free turns, so a pile can never be stranded below its threshold — and the threshold exists only to be opened by the player's own hand.
- **GLEAN costs no material and has no unlock, no cap and no cooldown.** A player at zero scrap can always get scrap.
- **Therefore no sequence of play can make the loop unplayable.** That is a wiring requirement in BUILD NOTES, not a hope: the build must assert that `TURN` has no cost term and that `GLEAN` has no gate.

### A8 — POWERS, SKILLS AND MULTIPLIERS (built in from the first draft, as the owner asked)

Four powers, all earned in-loop with **Marks**, which only emptying a batch produces. The design's rule is one sentence:

> **Powers in this game move cost, never payout.** Every power has a published cost, a published effect and a published ceiling, and **the batch's output is a lookup on the loads in the bin — no power, skill or multiplier can add one unit of soil, one brown or one Mark to any batch on any tier** (machine-checked, A1/A2/A10).

| # | Name | Kind | Cost (Marks only, never money) | Effect (published, exact) | Ceiling |
|---|---|---|---|---|---|
| **F1** | **THE FORK** | skill, turning | **6 MK** (rank 1), **18 MK** (rank 2) | The pile needs **4 fewer ripeness points per rank**: `RIPE = max(1, 2 × loads − 4 × rank)`. A 6-load hot batch ripens in **6 → 4 → 2 turns** | **2 ranks, ever.** At every rank a cold pile still takes **exactly twice** the turns of a hot one (A4), so the fork never repeals the ratio rule — it rewards a well-built heap and does nothing for a badly-built one |
| **F2** | **THE RIDDLE** | multiplier, on a **cost** | **12 MK** | A BROWN LOAD costs **1 BR instead of 2** — the screen keeps the coarse half and returns it to the heap | **1 rank, ever.** The batch's SO, BR and MK are untouched (A2). The brown balance moves from **exactly 0** to **+2 per seed round** / +4 at BIN 2 / +6 at BIN 3 — a surplus that pays for the border |
| **F3** | **THE BAT HANDLE** | power, **per use**, repeatable | **2 MK**, charged only when the use is taken | One action turns the pile **twice**: that turn's ripeness gain is **doubled** (2→4 hot, 1→2 cold), capped at RIPE | **Zero units** (A12). It saves **exactly 1 action** per use and can never add a unit of SO, BR or MK to a batch |
| **F4** | **THE GAUGE** | tool | **8 MK** | The shed's thermometer prints `RIPENESS 4/12 · HEATED · 4 TURNS TO RIPE` before a turn is committed | **Zero units.** Every value it prints is already published in this document; it changes what a player can **see**, never what a batch pays |

**The with/without arithmetic, seed configuration (BIN 1 + BED 1, 6 loads), per round** — machine-checked, and the same table is printed in the LOOP panel:

| Line | turns of the pile | actions per round | MK per round | SO paid by the batch | BR paid by the batch | BR net per round | **actions per Mark** |
|---|---|---|---|---|---|---|---|
| **no power, hot** (reference) | 6 | **16** | 4 | **6** | **3** | **0** | **4.00** |
| F1 rank 1 | 4 | 14 | 4 | 6 | 3 | 0 | **3.50** |
| F1 rank 2 (full turning skill) | 2 | 12 | 4 | 6 | 3 | 0 | **3.00** |
| F1 rank 2 + F2 (all powers) | 2 | 12 | 4 | 6 | 3 | **+2** | **3.00** |
| F3 THE BAT HANDLE, 1 use | 5 | 15 | 4 | 6 | 3 | 0 | **3.75** |
| F3, 2 uses (2 MK each) | 4 | 14 | 4 | 6 | 3 | 0 | **3.50** |
| **no power, COLD** (the band's other end) | 12 | **23** | **2** | 6 | 3 | +4 | **11.50** |

Read the two bold columns and the ceiling together: **every power moves the action count and the brown balance; not one of them moves what a batch pays.** With all four powers owned, the seed round costs 12 actions instead of 16 (−25 % of the work) **and the batch still pays at most 6 SO, 3 BR and 4 MK, exactly as it does with none** — the ceilings are 6 / 12 / 18 SO, 3 / 6 / 9 BR and 4 / 8 / 12 MK, on every tier, with everything switched on (A10). Powers move **actions**, and the band moves from **4.00 to 3.00 actions per Mark** at the seed and from **11.50 to 3.00 across the whole published band**; the gross faucet does not move by one unit.

**Why this cannot become pay-to-win, in the layer's terms.** Marks are produced only by emptying batches, are never sold, and the build has **no store, no account and no payment path of any kind**. C3's violation test ("two accounts, same time, different spending") cannot be run against a build with no spending side, and the transform contains no money term. A player who spends nothing has every power available at the same in-game price as anyone else, and a player who never learns the ratio cannot buy the heat: **F1 shortens the ladder for a hot pile and does nothing for a cold one** (A4).

---

## PART B — EXIT PATH

**B1 — Save and offline play.** `localStorage["hotheap.save.v1"]`, one JSON object: `sc`, `br`, `so`, `mk`, `mkEarned`, `binTier`, `beds[]`, `loads` (how many loads are in the bin), `browns` (how many of them are brown), `ripeness`, per-bed `state` (`empty|standing|ready`), `forkRank`, `riddle`, `gauge`, `tallies`, `borders`, `trenches`, `sacks`, `badges`, `statistics`, `saveVersion`. **Fully playable offline, yes** — the demo makes no network request of any kind (no leaderboard, no telemetry, no fonts fetched at runtime).

**B2 — Export.** An **"EXPORT SAVE"** button on the start screen and in the shed. It downloads `hotheap-save.json`, documented schema:

```
{ saveVersion, sc, br, so, mk, mkEarned, binTier, beds:[{state,fedRound}], loads, browns,
  ripeness, forkRank, riddle, gauge, tallies, borders, trenches, sacks, badges:[],
  stats:{batches, hotBatches, coldBatches, soEver, marksEver, bedHarvests, gleans, batUses} }
```

`loads`, `browns` and `ripeness` are in the file on purpose: they are the batch you were in the middle of, and a stranger can open the export **before and after closing the tab** and see that not one of them moved. No account, no email, no server round-trip.

**B3 — If the studio closes something.** Bins, beds, powers, badges and counters are numbers inside the save; retiring or renaming one changes nothing about what the player holds, and the export keeps them. There is no live service, no login and no key, so nothing a player earned can expire because a studio stopped shipping.

**B4 — Deletion.** The demo holds no account, no server record, no analytics identifier and no personal data beyond the optional bed-plan credit name. **"RESET SAVE" (double-confirm, as in the other three samples) therefore deletes everything, immediately and completely.** If a leaderboard or bed credits are ever added, deletion removes the display name, the submission list and the telemetry id, and completes inside **30 days** — stated here so the promise exists before the feature does.

**B5 — Offline decay: none, and no offline process at all. THE BIN IS SEALED.** *This is the owner's ruling, and in this game the fiction and the compliance sentence are the same text:*

> When you stop working, the bin is sealed. Decomposition proceeds only while you turn it. **Close the tab and nothing changes — not one number** — until you come back and pick up the fork. A batch ripens after a fixed number of your turns, never after a number of minutes. A ripe batch waits indefinitely at its full published price: **no freshness penalty, no rot, no "best before", no absence mail, no streak, no daily, and no cooldown anywhere in the game.**

Mechanically: `loads`, `browns`, `ripeness` and every bed's `state` live in the save and are written when you press a key; the build has **no `setInterval`, no timestamp comparison and no catch-up calculation of any kind**, so there is no code path through which time can change state. Scarcity comes only from published **capacities** (a bin holds its capacity in loads; a bed takes one feed at a time; a bed advances one stage per batch closed) — never from a timer. Beds grow on batches, not on calendars: a fed bed left alone for a month is still STANDING when you return.

---

## PART C — PER-RULE PASS/FAIL

```
L1  Free entrance ............. PASS  Free build, no store, no account, no ad
   view. Fresh save = BIN 1 (6 loads) + BED 1 + 12 SC + 0 BR/SO/MK, fork rank 0.
   GLEAN (+4 SC) is free, unlimited and ungated, and a TURN costs zero units,
   so from absolutely nothing a player is 12 actions from their first soil
   (lockout test in Part A). First unlock (BIN 2, 12 MK) in ~4 rounds, ~74
   player actions, ~5-8 min — machine-derived, not guessed: the script plays
   the seed capital out round by round and the fourth round's empty takes the
   tally to 12 MK (designed, not playtested).
L2  Free exit ................. PASS  Close the tab at any moment — mid-load,
   between turns, with the pile ripe and unemptied. Every unit banks at the
   press of the key that earned it, never at a session end, so an abandoned
   batch forfeits nothing. The bin is SEALED (B5): no clock, no cooldown, no
   offline decay, no notification, no absence mail, nothing that advances in
   your absence — a ready batch waits for ever at the same price. The design's
   only negative line is scrap (a batch consumes it and returns none); it is
   paid by free unlimited gleaning and can never block play (A4, Part A).
L3  No locked value ........... PASS  Everything earned is in one local JSON
   object: SC/BR/SO, MK, bin tier, bed states, the batch in progress, fork rank,
   the riddle, the gauge, counters and badges. Readable and playable with no
   network; exports to a file (B2).
L4  Data portability + delete . PASS  Export button + documented schema above,
   including the in-progress batch; deletion = one button, complete and
   immediate; 30-day window stated for any future account feature.
L5  No pay-to-win ............. PASS  Nothing is for sale; there is no store
   surface in the build. Bins, beds and all four powers are Mark-only, Marks are
   produced only by emptying batches, and the transform contains no money term.
   Per-load yields are identical on every bin tier; larger bins are more
   surface, not better rates, and F1-F4 provably cannot raise a payout.
L6  No pay-to-skip ............ PASS  No purchase exists, and no power removes a
   step of the loop: every batch still needs its loads, its turns and its empty,
   and no power can load, turn or empty for you. F1 shortens the ladder (it does
   not skip it), F2 discounts one material (it does not pay it), F3 sells one
   doubled turn, F4 only prints numbers the document already publishes. A batch
   below three loads pays no Mark at all, so there is no bought shortcut past
   the work.
L7  No injected ads ........... PASS  No ad SDK, no sponsor placement, no
   pre-roll, no "watch to continue". Nothing auto-plays. If a sponsor ever
   appears it sits on the credits screen, labelled, carrying no reward.
L8  No scarcity/FOMO/gambling . PASS  No clock in the yard and no clock around
   it, no rotation, no "ends in", no streak, no daily, no expiring bonus — and
   **no randomised reward of any kind: this game has zero random variables**
   (note below). Every limit is a published capacity (bin loads, one feed per
   bed, one stage per batch). Nothing is for sale, so nothing can be attached to
   chance.
L9  Cosmetics only ............ PASS  Cosmetics in the build are **earned**
   only: tally badges at every 10 tally marks, and badges for every 10 mulch
   runs, trenches and sacks. No paid cosmetic exists, so no earned/bought
   confusion is possible.
L10 Earned-only progression ... PASS  Unlock table published below; every row
   is opened by Marks, which only batches produce. Designed times: F1 rank 1 at
   6 MK ~2 rounds; BIN 2 at 12 MK ~4 rounds (~5-8 min for a first-time player);
   BED 2 at 16 MK ~4-5; F1 rank 2 at 18 MK ~5; BIN 3 at 30 MK ~8. A slower
   player should expect roughly double. All times are designed, not measured.
L11 Reinvestment report ....... PASS  Quarterly, one page, revenue by source,
   spend by category, and the excluded list. First report due six months after
   the first revenue; **no revenue has been taken, so no report exists yet** —
   this is a commitment, not a published artefact.
L12 Player voice .............. PASS  Mechanism = in-game poll + open thread
   before any paid release, outcome published including disagreement. **Last
   consultation: none — no paid release exists yet.** The monetisation log opens
   with the first entry rather than back-dating one. (The dated votes in the
   spec's §5 samples are illustrative placeholders; this form does not invent
   one.)
L13 Conflict isolated ......... PASS (N/A)  There is no combat, no opponent, no
   PvP and no being anywhere in the game. The only thing that is "destroyed" is
   a pile of food waste, and its breakdown *is* the product: the pile becomes
   the soil, the soil becomes the crop, the crop becomes scrap, and the scrap
   goes back in the bin. Nothing is demolished, not even scenery. Of the four
   samples this is the cleanest L13 fit — **no rule clarification is being
   asked for.**
L14 Data & API boundary ....... PASS  Nothing leaves the device: no analytics,
   no identifiers, no third party, no network call. The only personal datum that
   could ever exist is an optional credit name on a submitted bed plan, chosen
   by the player, deletable with the save.
L15 Honest claims ............. PASS  Claims list in Part E, each in-game
   verifiable today. No money, health or real-environment claim is made
   anywhere — see the guardrail note under Part E, which matters more for this
   game than for any other sample because its fiction is food waste and soil.
```

### The L8 note, in full — and this sample needs no clarification

**Hot Heap has zero random variables.** Every number in the transform is a published integer map of the player's own inputs: `HEATED` is a comparison, `RIPE` is an arithmetic expression, `turns` is a ceiling, and the EMPTY is a lookup on the loads. There is no draw, no roll, no drop, no "chance to win", no band and no seeded counter anywhere in the build — the export's `stats` block exists to prove what happened, not to audit a distribution. So this sample does **not** lean on §2.2's "or honestly random" at all, and it asks the owner for **no v0.2 L8 clarification** (unlike Windward, whose headwind did). The only L8-adjacent judgement call is the 3-load Mark step, which is a **published cliff**, not scarcity: it never expires, it is visible on the LOAD button before the player commits, and the fix for a player who dislikes it is one more load.

### Part C addendum — how this genre's borderline rules read (the "unused Swing" list)

Brick Break spells out that *unused Swing is lost at run end, and that is not decay*. Every sample needs the equivalent, so here is Hot Heap's, in full:

1. **Ripeness does not bank** (`ripeness = min(ripeness + gain, RIPE)`). A turn spent on an already-ripe pile buys nothing — and **it is not decay**: the turn costs no unit at all, nothing the player owns is destroyed, and the excess ripeness was never payable, because the payout is a lookup on the **loads**, not on the ripeness. A wasted turn costs one action, and an action is not a possession.
2. **Nothing in the bin can ever be taken away.** Brick Break forfeits its per-run fuel when a run ends; Hot Heap has no such pool. The bin's loads are in-progress work, not fuel: they pay out in full at the EMPTY, they are stored in the save, and **no run end, session end or absence can remove one** — the only way a load leaves the bin is the empty that pays for it.
3. **A full bin refuses a load** (capacity). The scrap and the browns **stay in the pail and the heap**; the refusal destroys nothing and costs nothing, and the button says why (`BIN FULL — 6/6 LOADS`).
4. **A bed advances one stage per batch emptied — growth without a clock.** A fed bed left alone stands for ever, still STANDING when the player returns; a READY bed never reverts and its harvest never shrinks.
5. **The heat check is re-evaluated at every turn, so late browns are a recovery, not an exploit.** A player who started cold may add brown loads to heat the pile mid-batch, and it costs them the load plus the turns already spent — so building the ratio up front is always cheaper. It cannot be gamed: browns never lower the RIPE threshold, and the EMPTY payout does not depend on heat at all (heat moves turns, and doubles the Mark).
6. **There is no cooldown anywhere, and none is needed.** Every rate limit in the game is either a **capacity** or a **count of player actions**. "Waiting a day" and "waiting a second" produce byte-identical save files.
7. **The one action that costs materials and returns nothing immediately is a LOAD** — an investment, not a loss, refunded by the EMPTY at one soil per load (see 2).
8. **Every gate in the game is opened by free actions** (the ripeness threshold), by Marks earned in play (the unlock table), or by nothing at all (GLEAN). **No gate is opened by money or by waiting.**

> **Wiring warning, and it is a condition of conformance.** If the engineer adds a tick, an `setInterval`, a `Date.now()` comparison, a cooldown, a "ready in 5 minutes", a daily limit, an absence mail, or any catch-up on load, **this game fails L2 and B5 and its own headline claim**. A pile that ripens while the tab is closed is a different game; this document does not cover it.

### Published unlock table (L10)

| Row | Cost (Marks only) | What opens | Designed time (competent) | Advertised? |
|---|---|---|---|---|
| SHED TALLY | 3 MK | one more tally cut into the shed door; badge every 10 | immediate | earned cosmetic (unbounded sink) |
| **F1 THE FORK rank 1** | **6 MK** | the pile needs 4 fewer ripeness points: a 6-load hot batch ripens in 4 turns instead of 6 | ~2 rounds (~2 min) | earned tool |
| F4 THE GAUGE | 8 MK | prints the exact turns to ripe before you commit | ~2–3 rounds | earned tool (zero units) |
| **BIN 2 — THE LONG BAY** | **12 MK** | **capacity 6 → 12 loads: a round goes from 16 actions / 4 MK to 31 actions / 8 MK** | **~4 rounds, ~74 player actions, ~5–8 min (first-time player)** | free content |
| F2 THE RIDDLE | 12 MK | a brown load costs 1 BR instead of 2; the brown balance goes from exactly 0 to +2 a round | ~3–4 rounds | earned tool |
| BED 2 — THE ROOT BED | 16 MK | a second bed: two harvests a round (+14 SC, +2 BR) | ~4–5 rounds | free content |
| F1 THE FORK rank 2 | 18 MK | 8 fewer ripeness points in total: a 6-load hot batch ripens in 2 turns (**MAX rank**) | ~5 rounds | earned tool |
| BED 3 — THE POTTING BED | 22 MK | a third bed | ~6 rounds | free content |
| BIN 3 — THE THREE-BAY YARD | 30 MK | capacity 18 loads: a round goes to 46 actions / 12 MK and feeds all three beds exactly | ~8 rounds | free content |
| F3 THE BAT HANDLE | 2 MK per use | one doubled turn (saves 1 action) | immediate | earned power |
| SACKS TO THE LANE / THE BORDER / THE TRENCH | 8 SO / 6 BR / 8 SC each | a sack, a mulch run, a trench; badge every 10 | immediate | earned cosmetic (unbounded sinks) |

**Finite unlock total: 124 MK.** The prices are ordered on purpose: **BIN 2 (12 MK) is deliberately cheaper than BED 2 (16 MK)**, because a 6-load bin pays 6 SO a batch and a bed's feed is 6 SO — a second bed bought before a second bin would sit idle. The table's price order is the game's only tutorial, and it leads **bin → bed → bed → bin**.

All timing figures are **designed, not measured**. No player has reached the last row, and this form must not pretend otherwise.

### Cheapest honest way to verify any of this (for a sceptical stranger)

Play one seed round on a fresh save and read the batch ledger: `BATCH 6 · 4 GREEN 2 BROWN · HEATED → +2 PER TURN · RIPE 12 = 2 × 6 LOADS − 4 × FORK 0 · 6 TURNS · EMPTY: SO +6 · BR +3 · MK +4`. Turn a seventh time and watch the ripeness bar refuse to move past 12. Then work the beds in the published order: **harvest** the READY bed (+7 SC +1 BR), **feed** it 6 SO, then empty the next batch — the bed is READY again the moment that batch empties, and the round's net reads `SC −3 → +1 (1 GLEAN) · BR 0 · SO 0`. Then do the two things that decide this design: **(1)** export the save, close the tab mid-batch, reopen, and compare — `LOADS 4/6 · RIPENESS 3/12` must be exactly where you left it, with no catch-up; **(2)** buy F1 rank 2 and watch the same 6-load batch need 4 ripeness points instead of 12, ripen in 2 turns, **and still pay exactly 6 SO, 3 BR and 4 MK**. Then press SHED TALLY four times: 12 MK leave, four tallies appear, and the Marks came from no source but the bin.

## PART D — REVENUE AND VOICE

**D1 — Revenue models in use (only §3.4).**
- Base game: **free**, loop complete, nothing sold inside it (§3.4 model 1's precondition; the free branch is chosen deliberately — the owner's open Q4 in the spec's §7 is unresolved, so this form takes the branch that cannot FAIL).
- **Optional paid expansion "THE WINTER HEAP"** — new beds, new crops, new bed plans and new yard art. Geometry and decisions, **no power, no number, no shortcut**: every bed in the expansion feeds on 6 SO and harvests 7 SC +1 BR, the capacities are the same capacities, and the unlock costs are the same costs.
- **Voluntary patron tier** — the same game everyone has, plus development notes, credits, and badge cosmetics that pass L9; cancelling costs nothing and the tier holds no game value.
- **Funded pilots with studios, educators or public bodies** — a paid classroom adaptation of the loop (a worksheet on how a **capacity** and a **threshold** bound a faucet, and why a pile that ripens on work rather than on time cannot punish absence), disclosed in the L11 report.
- **Optional, separately sold educational material** — "The sealed bin: why a loop with no clock cannot punish absence", a one-page teaching sheet. Content, not power.

**D2 — Excluded on purpose.** Advertisements and any rewarded ad. Loot boxes, gacha, spin wheels, or any purchase of a chance. **Power of any kind — and this game's list is specific: a faster-ripening pile, a bigger bin, an extra soil per load, an instant or early EMPTY, a purchased Mark, a purchased brown, extra turns, a doubled turn, or a head start on any unlock.** Shortcuts and instant unlocks. Paid exclusivity or paid entrance to the loop. Sale, sharing or trade of player data. **Any conversion of SC, BR, SO or MK into money or into anything outside the game** — there is no wallet, no token, no NFT, no chain, no exchange, and no unit in this game is a financial asset. Marks buy tools.

**D3 — Monetisation change log.** `/layer/monetisation-log`.

**D4 — Consultation mechanism and last consultation.** Mechanism: in-game poll plus an open thread, run before any paid release or price change; both the players' answer and the studio's decision are published side by side, including a "we went against the majority" entry if that happens. **Last consultation: none yet** — no paid release exists and no price has been set, so there is nothing to have consulted on. The log's first entry will be dated, not back-dated.

**D5 — Reporting cadence and last report.** **Quarterly** (well inside L11's six-month limit). Latest report: **none yet** — no revenue has been taken through this game. The first report is due within three months of the first euro, and it will state a real number, even a tiny one.

---

## PART E — CLAIMS AND SIGN-OFF

**E1 — Public claims (each must be checkable in the game this week).**

1. "The bin is sealed when you leave: nothing in this game happens while you are not pressing a key, and a ripe batch waits as long as you like at the same price." **[in-game verifiable]** — export the save before and after closing the tab and compare `loads / browns / ripeness`; not one number moves.
2. "A batch pays exactly one soil per load in the bin, and no power, tool or skill can make it pay more." **[in-game verifiable]** — read the batch ledger; buy every power and empty the same 6-load batch for the same 6 SO.
3. "A pile with one brown load for every three loads is hot, and a hot pile takes exactly half the turns of a cold one — the ratio, not the clock, is what this game rewards." **[in-game verifiable]** — load 6 greens and count 12 turns; reload 4 greens + 2 browns and count 6.
4. "Scrap can always be fetched free at the gate and a turn costs nothing at all, so no player can ever be locked out of the loop." **[in-game verifiable]** — press GLEAN at zero scrap; press TURN and watch every counter stay where it is.
5. "Your save is a file you can export, and every number in the HUD is in it — including the batch you were in the middle of." **[in-game verifiable]** — press EXPORT SAVE; a text editor opens it.

**E2 — Claims intentionally NOT made.** No real-world income, no universal basic income, no health or wellbeing outcome, no environmental outcome arising from play, no crypto or financial-asset ownership: **confirmed yes.**

> **Guardrail note for this game specifically — the hardest case in the layer so far.** The fiction is food waste, compost, soil and crops. That is exactly where the forbidden claim is most tempting, because the fiction *looks like* a real process. Here are the sentences that **must not be written anywhere**, in-game, in the store copy, in a pitch or on the site: "playing composts your real food waste", "each batch keeps food out of landfill", "your yard diverts real waste", "the loop reduces methane / emissions / carbon", "the loop returns real nutrients to real soil", "regenerative by design", "circular by design", "this game teaches composting" or "teaches soil science" or "teaches carbon literacy" (educational **intent** may be described only with "may" or "intend" — never as an outcome), "grow real food by playing", and anything implying that a Mark, a sack, a trench or a mulch run is a real-world object or a measured quantity. **The in-game counters measure the save file and nothing else** — a batch of 6 loads is six numbers in a JSON object, and the design says so on the start screen. The words **"regenerative"** and **"circular"** are also held back pending the owner's open question 5 in the spec's §7 (what the owner's other businesses already claim); the page copy should not use them until that is answered. The mode of play here is **fictional and deliberately simplified**: real composting involves moisture, oxygen, particle size, C:N ratio, time, temperature and failure modes, and this game models none of them — it models an action count.

**E3 — Signed (sample)** .................... Date 2026-10-08

---

## BUILD NOTES FOR THE ENGINEER

One route file `src/routes/compost-to-soil.tsx`, same shape as `bin-runner.tsx`, `brick-break.tsx` and `paper-airplane.tsx`: `createFileRoute`, meta in localStorage, phases `start | yard | shed`, keyboard + pointer input, no backend, no accounts, no network. A 320×240 logical canvas scaled with `image-rendering: pixelated` for the yard; the panels around it plain DOM like the other three.

### Constants to wire (copy these, do not re-derive)

```ts
const SAVE_KEY = "hotheap.save.v1";

const BIN = {                                   // capacity in LOADS
  1: { name: "THE PALLET BIN",     cap: 6,  cost: 0  },
  2: { name: "THE LONG BAY",       cap: 12, cost: 12 },
  3: { name: "THE THREE-BAY YARD", cap: 18, cost: 30 },
};
const BED = {                                   // beds 1..3; feed cost and harvest are IDENTICAL on all three
  1: { name: "THE HERB BED",    cost: 0  },
  2: { name: "THE ROOT BED",    cost: 16 },
  3: { name: "THE POTTING BED", cost: 22 },
};
const BED_FEED_SO = 6;   // FEED spends this; a STANDING bed becomes READY when a batch is EMPTIED
const BED_SC = 7;        // HARVEST pays this...
const BED_BR = 1;        // ...and this
const GREEN_SC = 2;      // a GREEN load: 2 SC, 0 brown
const BROWN_SC = 1;      // a BROWN load: 1 SC + BROWN_BR browns
const BROWN_BR = 2;      // F2 THE RIDDLE changes this to 1 (never below 1)
const BROWN_BR_RIDDLE = 1;
const GLEAN_SC = 4;      // free, unlimited, one action — the anti-lockout faucet
const TURN_COST = 0;     // NEVER CHANGE THIS. The L1 guarantee lives on this line.
const RIPE_PER_LOAD = 2;
const RIPE_PER_FORK = 4; // RIPE = max(1, RIPE_PER_LOAD*loads - RIPE_PER_FORK*forkRank)
const GAIN_COLD = 1;     // ripeness per TURN
const GAIN_HEATED = 2;
const HEAT_RATIO = 3;    // HEATED iff loads > 0 && browns * HEAT_RATIO >= loads
const FORK_COST   = [0, 6, 18];   // F1, by rank (0 = not owned); 2 ranks MAX
const RIDDLE_COST = 12;           // F2, 1 rank MAX
const GAUGE_COST  = 8;            // F4, 1 rank MAX
const BAT_COST    = 2;            // F3, MK per use, repeatable
const TALLY_COST  = 3;            // unbounded MK sink
const SACKS_SO = 8; const BORDER_BR = 6; const TRENCH_SC = 8;   // unbounded material sinks
const BADGE_EVERY = 10;

const SEED = { sc: 12, br: 0, so: 0, mk: 0, binTier: 1, beds: [{ id: 1, state: "empty" }],
               loads: 0, browns: 0, ripeness: 0, forkRank: 0, riddle: false, gauge: false,
               tallies: 0, borders: 0, trenches: 0, sacks: 0, badges: [], saveVersion: 1 };
```

Derived rules, verbatim:

```ts
const heated      = (loads, browns) => loads > 0 && browns * HEAT_RATIO >= loads;
const ripeAt      = (loads, forkRank) => Math.max(1, RIPE_PER_LOAD * loads - RIPE_PER_FORK * forkRank);
const gainFor     = (loads, browns) => heated(loads, browns) ? GAIN_HEATED : GAIN_COLD;
const turnsNeeded = (loads, browns, forkRank) => Math.ceil(ripeAt(loads, forkRank) / gainFor(loads, browns));
const emptyPay    = (loads, browns) => ({ so: loads, br: Math.floor(loads / 2),
                                          mk: Math.floor(loads / 3) * (heated(loads, browns) ? 2 : 1) });

// TURN  : ripeness = Math.min(ripeness + gainFor(loads,browns), ripeAt(loads,forkRank))   <-- the CAP is required
// LOAD  : green -> sc -= GREEN_SC, loads++            brown -> sc -= BROWN_SC, br -= (riddle ? 1 : 2), loads++, browns++
//         refuse when loads === BIN[binTier].cap, and say so; refuse when the stock is short, and show the shortfall
// EMPTY : enabled iff loads >= 1 && ripeness >= ripeAt(loads, forkRank)
//         pay emptyPay(...) INSTANTLY; ripeness = 0; loads = 0; browns = 0; then every bed with state "standing" -> "ready"
// FEED  : enabled iff bed.state === "empty" && so >= BED_FEED_SO; so -= BED_FEED_SO; bed.state = "standing"
// HARVEST: enabled iff bed.state === "ready"; sc += BED_SC; br += BED_BR; bed.state = "empty"
// GLEAN : sc += GLEAN_SC, always available, no cost, no cap
// F3 use: batCharge = BAT_COST taken when the use is pressed; that turn's gain is DOUBLED (gainFor * 2), capped at ripeAt
```

**There is no other state and no other function.** If a value in the build is not derivable from these lines, it is a bug against this document.

### Geometry, on a 320×240 field

- Logical canvas **320×240**, scaled up, `image-rendering: pixelated`. Five colours: earth `#2b1d12`, leaf `#6a8f4a`, brown `#8a5a2b`, cream `#e8e0c8`, amber `#e0a020`.
- **HUD**, two 8-px lines: `y 0–10` = `BIN 1 THE PALLET BIN · LOADS 4/6 · BROWNS 2/6 · HEATED · RIPENESS 4/12`; `y 11–20` = `SO 0 · BR 4 · SC 9 · MK 6 · TALLIES 2`.
- **The bin panel**, x 6–152, y 22–150. Load slots drawn as a **6 × 3 grid of 12×12 px squares**, 4-px gutters: slot (c,r) at `x = 14 + c*16`, `y = 30 + r*16` for c 0–5, r 0–2; filled leaf for a GREEN load, brown for a BROWN one, outlined for empty. **Ripeness bar** x 14, y 72, 128×10, filled `ripeness / ripeAt(...)`, with the integer printed beside it. **The heap**: a mound drawn from `(20, 134)` to `(140, 134)` whose peak height is `20 + loads * 4` px, in earth-brown shading toward amber as `ripeness / ripeAt` rises — **and three 2×2 steam puffs that only appear when HEATED**, because HEATED must be visible without reading a number. Below it, `y 140`: `SO n · BR n`.
- **The gate** (the pail and the leaf heap), x 6–90, y 154–176: the pail sprite with `GLEAN +4 SC` and the leaf heap with `BR n`. GLEAN is on screen from the first frame and never greys out.
- **The beds**, x 160–312: three panels 48×40 at `y 26`, `y 70`, `y 114` (x 160–208, 212–260, 264–312), each with the bed's name, its state art — EMPTY (three rows of tilth), STANDING (four 3-px sprouts), READY (sprouts plus an amber crop marker) — and its live line: `FEED 6 SO` / `STANDING` / `HARVEST +7 SC`. Unbought beds draw as bare earth with `BED 2 — 16 MK`.
- **The action bar**, y 180–204: `[1] LOAD GREEN · 2 SC` (x 6–96), `[2] LOAD BROWN · 1 SC · 2 BR` (x 98–200), `[T] TURN · +2` (x 202–250, and it reads `+1` when COLD and `+3` at fork rank 1), `[E] EMPTY` (x 252–314, greyed and reading `RIPENESS 4/12` until the gate opens).
- **The bottom row**, y 208–232: `[G] GLEAN` · `[F] FEED` · `[H] HARVEST` · `[B] BAT HANDLE 2 MK` · `[S] SHED` · `[L] LOOP` · `[X] EXPORT`, and the three unbounded sinks as small buttons with their prices (`SACKS 8 SO`, `BORDER 6 BR`, `TRENCH 8 SC`, `SHED TALLY 3 MK`).
- **The shed** is a separate phase (not an overlay): the unlock table as a list of buttons, each with its price, its shortfall, its effect line and its ceiling line; the four powers; and the hint `A SECOND BED NEEDS A SECOND BIN — 12 SO A ROUND` whenever `binTier < 2 && beds.length < 2`.
- Every button that spends anything **shows price and shortfall and refuses without a confirmation dialog**, exactly as the other three samples do. The spend must be real.
- data-testids, matching the other routes: `load-green`, `load-brown`, `turn-btn`, `empty-btn`, `glean-btn`, `feed-bed-1`…`feed-bed-3`, `harvest-bed-1`…`harvest-bed-3`, `loads-value`, `browns-value`, `heat-state`, `ripeness-value`, `ripeness-bar`, `batch-ledger`, `meta-sc`, `meta-br`, `meta-so`, `meta-mk`, `use-bat-handle`, `buy-fork`, `buy-fork2`, `buy-riddle`, `buy-gauge`, `buy-bin-2`, `buy-bin-3`, `buy-bed-2`, `buy-bed-3`, `sack-so`, `border-br`, `trench-sc`, `shed-tally`, `go-shed`, `go-yard`, `export-save-start`, `reset-save`, `loop-panel`, `shed-panel`.

### MUST be implemented end to end (the headline loop)

> **GLEAN scraps at the gate → LOAD the bin (2 SC a green load, 1 SC + 2 BR a brown load) → TURN the pile until ripeness reaches RIPE → EMPTY for soil + browns + Marks → HARVEST the bed that is READY and FEED it 6 SO → empty the next batch (the bed turns READY as it empties) → HARVEST +7 SC +1 BR and feed it again → spend 12 Marks to open BIN 2 (THE LONG BAY).**

A competent player should reach BIN 2 in **~4 rounds, ~74 player actions, ~5–8 minutes** — machine-derived, round by round, in the check script (§[7b] of the transcript below), exactly as Bin Runner's 40-ST board 2, Brick Break's 9-SE bay 2 and Windward's 10-MD COURSE 2 do.

1. **The batch ledger line after every action** — REQUIRED, and this is the design's C1 claim: after a load, `LOAD 5 — BROWN · SC −1 · BR −2 · BROWNS 2/6 → HEATED`; after a turn, `TURN 4 — HEATED +2 → RIPENESS 8/12`; after an empty, `BATCH 6 · 4 GREEN 2 BROWN · HEATED ×6 TURNS · RIPE 12 = 2×6 − 4×FORK 0 · EMPTY: SO +6 · BR +3 · MK +4`. Without those lines the game fails C1 even though the arithmetic is right.
2. **The ripeness cap** `ripeness = Math.min(ripeness + gain, ripeAt(loads, forkRank))` — REQUIRED. Over-turning must buy nothing and must never bank.
3. **Loading**: green and brown buttons with their prices on the face, the heat state re-computed on every load and every turn, capacity refusal (`BIN FULL — 6/6 LOADS`) and shortfall refusal (`NEEDS 2 BR — HAVE 1`).
4. **TURN** is free (assert `TURN_COST === 0` in a dev check), unlimited, and its effect is shown on the button face (`TURN +2` / `TURN +1 COLD` / `TURN +3` at fork rank 1).
5. **EMPTY** is gated on `ripeness >= ripeAt(...)`, pays the lookup, and credits **instantly** — never batched to a session end.
6. **GLEAN** is free, unlimited, ungated and visible from the first frame; a dev check must assert that it is always enabled.
7. **Beds**: the FEED → STANDING → (one batch emptied) → READY → HARVEST → EMPTY state machine, with the advance driven **only** by the EMPTY handler.
8. **The four unbounded sinks are real spends**: SACKS 8 SO, BORDER 6 BR, TRENCH 8 SC, SHED TALLY 3 MK, each with a badge every 10. This is what makes C2 provable, not decoration.
9. **The shed panel**: every row with price, shortfall, effect and ceiling; F1 rank 1 → 2 with `MAX` at rank 2; the bin-before-bed hint (item 12 of tensions).
10. **F1/F2/F4** as buys; **F3** as a per-use charge of 2 MK, taken only when the use is pressed, doubling that turn's gain.
11. **The LOOP panel** publishing this document's arithmetic: the batch table (loads → heat → turns → payment), the three ceilings (6/12/18 SO, 3/6/9 BR, 4/8/12 MK), A8's **powers table with cost / effect / ceiling**, the **with-and-without table** (with the four act/MK reference points 4.00 / 11.50 / 3.88 / 3.83), the closed sub-loops (`BR in = BR out`, `SO in = SO out`), the unlock table, the line **"the bin is sealed — no number here changes while this tab is closed"**, and the line **"nothing here converts to money; no purchases exist in this game"**.
12. **EXPORT SAVE** → `hotheap-save.json` (Blob download) including `loads`, `browns` and `ripeness`; RESET with double-confirm.
13. **No clock, no tick, no catch-up:** the file must contain **no `setInterval`, no `setTimeout` that changes state, no `Date.now()` comparison and no per-second render loop**. A dev check greps its own source for those four and fails the build's check if any state change depends on them.
14. **Start screen stating the loop in five lines:** `GLEAN IS FREE AND UNLIMITED · 2 SC A GREEN LOAD, 1 SC + 2 BR A BROWN LOAD · A HOT PILE (1 BROWN PER 3 LOADS) TAKES HALF THE TURNS · THE BIN IS SEALED WHEN YOU LEAVE — NOT ONE NUMBER MOVES WHILE YOU ARE AWAY · 12 MARKS OPENS BIN 2`. Plus the honest line: `A BATCH IS SIX NUMBERS IN A SAVE FILE. NOTHING HERE IS REAL WASTE.`
15. **Offline: no network call of any kind anywhere in the file.**

### MAY be display-only

- **Bed art and crop stages:** three states drawn as three shapes is enough; the state machine and the payouts are what must be real.
- **The heap's shading and steam:** the steam puff is a two-frame animation. The HEATED **state** must be real and readable (text is enough); the art is not.
- **The tally marks on the shed door and the badge lists:** counters and a badge array are enough (`TALLIES 7 · BORDERS 12`). The **spends must be real**.
- **Beds 2 and 3 and BIN 3:** if only two bins are authored, wire the buttons and read the cap from `BIN[binTier].cap` — the arithmetic is already in the constant block.
- **The contribution path** (player-submitted bed plans) is out of scope for this demo; the input is named in A2 so the form is honest about it, and the credit name is the only personal datum the design can ever hold.
- **F4 THE GAUGE:** if the HUD already prints `RIPENESS 4/12` and the TURN button prints the gain, the gauge's panel line is redundant — keep the buy (it is a published zero-unit power and must exist to be honest about it) but it may simply print `4 TURNS TO RIPE` beside the bar.

### Arithmetic and mechanics I simplified, and why

1. **One bin at a time.** A batch is atomic: loads and browns belong to the current batch, the bin refuses a seventh load, and the empty clears all three of `loads`, `browns` and `ripeness`. Parallel bins would make the per-round arithmetic a scheduling problem and the published band a range of strategies rather than four named lines.
2. **The ripeness ladder is an expression, not a simulated temperature curve** (`max(1, 2×loads − 4×rank)`). The published arithmetic and the built arithmetic are then **the same arithmetic**, and a player can reproduce any batch on paper. A real compost heap has moisture, oxygen, particle size and failure modes; this game models an action count and says so (Part E's guardrail).
3. **A cold pile takes exactly twice the turns of a hot one, at every fork rank** — that is a consequence of the two constants, not a coincidence, and it is asserted (A4). It is what lets the design say "the fork rewards a well-built heap and cannot repeal the ratio rule".
4. **Bin capacities are 6 / 12 / 18 — multiples of the bed's 6-SO feed**, so a full bin always feeds whole beds and **SO is exactly conserved per round** (0 in, 0 out). The same choice makes the brown balance exactly 0 on the hot line: `ceil(L/3) × 2` browns spent, `floor(L/2) + beds` browns returned.
5. **No early EMPTY.** The ripeness gate *is* the batch's bound, and a partial empty would add a second payout rule for no extra skill. The bin refuses; the load refuses; nothing is lost.
6. **No temperature, weather, pests, seasons, rats, smell or soil-health bar.** Every one of them would be a second variable, and a second variable would make the published band unfalsifiable. This game has **one** variable and it is the player's own loading ratio.
7. **Marks come in threes** (`floor(loads/3)`, doubled when hot) — integer cliffs rather than fractions, and a bin holding fewer than three loads pays no Mark at all, which is what stops a "spam two-load batches" farm. Without the floor, a 2-load batch would pay 2 Marks for 5 actions and beat every real line (checked and rejected: it would pay 2 MK for 5 actions against 4 MK for 13).
8. **F3 doubles one turn rather than adding a random bonus**, so its ceiling contribution is provably zero and a stranger can check it by counting actions.

### Rule and condition tensions I want the lead to see

1. **The 3-load Mark cliff is a published cliff, and I want the lead to confirm that is not scarcity.** `floor(loads/3)` means 5 loads pay the same 2 Marks as 3 loads, and 6 loads pay 4. It never expires, it is printed on the LOAD button before the player commits, and the remedy is one more load — but a reader may still call it an artificial incentive. **The one-number alternative is `ceil(loads/3)`, which I rejected and machine-checked: it pays 2 Marks for a 2-load batch in 5 actions — 2.50 actions a Mark, better than every real line in the game (the best real batch line is 3.08, at 18 loads).** The floor is the anti-farm rule, not a hook.
2. **"Earned power is real power" — this sample phrases it more strongly than Windward did: powers move cost, never payout.** F1 shortens the ladder for a hot pile only; F2 discounts a material; F3 sells a doubled turn; F4 sells nothing at all. The gross ceiling (6/12/18 SO, 3/6/9 BR, 4/8/12 MK) is identical with every power on (A1/A2/A10). I claim this is conforming because Marks cannot be bought, the build has no purchase path, and C3's violation test cannot be run at all. **This is the same reading the lead is already taking to the owner as open question 6** ("powers may raise what a player can *do*, never what a game can *pay*"), and this sample is the cleanest evidence for it in the layer so far: here the power provably cannot touch a payout.
3. **F3 THE BAT HANDLE is a repeatable Mark sink that buys an action** (2 MK for one doubled turn). Its ceiling contribution is exactly zero units (A12), it removes no step of the loop, and it cannot be hoarded into an advantage (it saves one action per use, and F1 is better value within two rounds). It is the same shape as Windward's SECOND PRESS, and it wants the same proposed v0.2 rule: *a repeatable in-game sink may sell a second attempt at a required action, but never the completion of one, and never a change to a published payout.*
4. **A bed returns more units than its feed costs in unit-count terms** (`6 SO → 7 SC + 1 BR`), and a sceptic will call that a free lunch. My answer: counting across units is meaningless; SO's only sinks are the beds and the sacks; the real cost of every faucet is stated in **player actions**, which is the only non-renewable input the layer recognises (§2.2); and no unit converts to money. If the lead prefers, the fix is one number (bed feed 6 SO, harvest 6 SC) which would make the loop scrap-neutral instead of scrap-negative — **and that would remove the design's only negative line, at the cost of making GLEAN decorative.** I have kept the negative line deliberately, and I flag it rather than deciding it.
5. **Scrap is the design's only negative line, and it is structural: a batch never returns scrap.** The loop burns it (−3 to −15 a round) and **free unlimited GLEAN pays it back**. That is a *published fuel*, not a decay: it is not stored, it cannot be lost, it never expires, and gleaning costs one action. Windward flagged its own single negative line for the same reason; this one is bigger in absolute terms and I want the lead to rule on whether "the loop consumes one of its own inputs, and the faucet that replaces it is free and unlimited" is acceptable under L2/C2. I believe it is — it is the layer's own "time is the only non-renewable input" made literal.
6. **The first batch on a fresh save is necessarily COLD**: browns can only come from emptied batches and bed harvests, so a new player has none, and their first pile takes 12 turns where a hot one takes 6. That is the game's tutorial (the cold batch *pays* the browns that heat the next pile — 3 BR from the empty plus 1 from the bed harvest funds the 4 BR that two brown loads cost). It is a forced line, it is 19 actions, and I am keeping it because it teaches the one rule the game is about. **If the lead wants a kindlier opening, the one-number fix is seed capital of 4 BR, which makes the first batch hot and removes the lesson.**
7. **Every time in this document is designed, not measured.** L10's compliance line asks for an estimated time in the unlock table and the spec's violation test asks for a real player who reached the last row. No such player exists yet.
8. **The unlock table's price order is the game's only tutorial, and getting it wrong is a trap for a player** (a second bed with a 6-load bin sits idle half the time). **This is a MUST-wire UI requirement** (build item 9, and the reasoning in the unlock table): the shed must say `A SECOND BED NEEDS A SECOND BIN` while `binTier < 2`, or the design punishes a reasonable purchase with an idle building. I have kept the prices honest rather than fudging them (BIN 2 12 MK < BED 2 16 MK) and made the hint mandatory.
9. **Zero randomness is the cleanest L8 fit in the layer and needs no v0.2 clarification** — but a deterministic sim can read as arithmetic homework, and the owner should know that the game's variety is **cadence and scale** (a 6-load round versus an 18-load round), not outcome variance. **If the owner wants per-batch variety, my recommendation is still no**: a disclosed per-batch "damp" flag would reopen the whole L8 question for a sample that currently answers it perfectly. The design's counter-argument to "homework" is that the player never has to compute anything to play — the HUD prints `HEATED` and the button prints `+2`.
10. **The "bin is sealed" claim is a structural claim about the code, not a promise about the design** (B5, the wiring warning in Part C). A reviewer cannot verify it by playing for a week; they verify it by grepping the built file for `setInterval`, `setTimeout` and `Date.now`, and by exporting the save on both sides of closing the tab. **Build item 13 makes that greppable check a MUST, and this is the requirement the owner's ruling turns on.**
11. **L15 is at its most dangerous here** (Part E's guardrail list). Every sentence in the guardrail is one a well-meaning community manager would write by accident, because the fiction is a real process. I would like the guardrail text carried into the site page and the store copy verbatim, not summarised.
12. **This sample is not a Ledger Vale re-skin and the divergence is worth stating in the owner-facing summary** (§0.2): Ledger Vale allocates a valley over weeks with a 0–100 soil-health stock and bounded offline decay; Hot Heap composes one heap over actions with no health bar, no weeks, and **no offline process at all**. The layer's two sims disagree on offline decay deliberately — Ledger Vale is a spec §5.2 placeholder written before the owner's decay-free ruling, and **if the ruling binds the whole layer, Ledger Vale is the sample that needs rewriting, not this one.** I am flagging that as a spec-revision item for the lead.

---

## APPENDIX — the machine-checked sums (transcript excerpt)

`python3 /home/team/shared/compost-to-soil-checks.py` prints 123 lines and ends with every assert green (12 checks). The load-bearing lines:

```
[1] A BATCH — BIN 1 (6 loads), fork rank 0
loads green brown  HEATED RIPE turns actions SC in BR in  SO  BR  MK
    3     2     1    True    6     3       7     5     2   3   1   2
    3     3     0   False    6     6      10     6     0   3   1   1
    6     4     2    True   12     6      13    10     4   6   3   4
    6     6     0   False   12    12      19    12     0   6   3   2

[2] F1 THE FORK — RIPE and turns by loads and fork rank
    6    R 12 6t /C12t    R  8 4t /C 8t    R  4 2t /C 4t   cold = 2x hot? True
   18   R 36 18t /C36t   R 32 16t /C32t   R 28 14t /C28t   True

[4] THE PUBLISHED LINES — one ROUND = harvest the beds, load, turn, empty, feed
R1 SEED hot (BIN1+BED1, no powers)   L6  HOT  turns 6  act 16  SO 6  BR 3 MK 4  SC -3->+1 BRnet +0 SOnet +0  4.00 act/MK
R2 SEED cold, first-time line        L6  COLD turns12  act 23  SO 6  BR 3 MK 2  SC -5->+3 BRnet +4 SOnet +0 11.50 act/MK
R3 SEED hot, F1 rank1                L6  HOT  turns 4  act 14  SO 6  BR 3 MK 4  SC -3->+1 BRnet +0 SOnet +0  3.50 act/MK
R4 SEED hot, F1 rank2                L6  HOT  turns 2  act 12  SO 6  BR 3 MK 4  SC -3->+1 BRnet +0 SOnet +0  3.00 act/MK
R5 SEED hot, ALL POWERS (F1 r2 + F2) L6  HOT  turns 2  act 12  SO 6  BR 3 MK 4  SC -3->+1 BRnet +2 SOnet +0  3.00 act/MK
R6 BIN2+BED2 hot                    L12  HOT  turns12  act 31  SO12  BR 6 MK 8  SC -6->+2 BRnet +0 SOnet +0  3.88 act/MK
R7 BIN2+BED2 hot, ALL POWERS        L12  HOT  turns 8  act 27  SO12  BR 6 MK 8  SC -6->+2 BRnet +4 SOnet +0  3.38 act/MK
R8 BIN3+BED3 hot                    L18  HOT  turns18  act 46  SO18  BR 9 MK12  SC -9->+3 BRnet +0 SOnet +0  3.83 act/MK
R9 BIN3+BED3 hot, ALL POWERS        L18  HOT  turns14  act 42  SO18  BR 9 MK12  SC -9->+3 BRnet +6 SOnet +0  3.50 act/MK
R10 BIN2+BED2 cold                  L12  COLD turns24  act 44  SO12  BR 6 MK 4  SC-10->+2 BRnet +8 SOnet +0 11.00 act/MK
R11 BIN3+BED3 cold                  L18  COLD turns36  act 65  SO18  BR 9 MK 6  SC-15->+1 BRnet+12 SOnet +0 10.83 act/MK

[5] WITH / WITHOUT THE POWERS — seed config, 6 loads, hot
line                               turns actions  MK SO out BR out BR net  act/MK
no power, hot                          6      16   4      6      3     +0    4.00
F1 rank 1                              4      14   4      6      3     +0    3.50
F1 rank 2                              2      12   4      6      3     +0    3.00
F1 rank 2 + F2 (all powers)            2      12   4      6      3     +2    3.00
F3 THE BAT HANDLE, 1 use               5      15   4      6      3     +0    3.75
F3, 2 uses (2 MK each)                 4      14   4      6      3     +0    3.50
no power, COLD (reference)            12      23   2      6      3     +4   11.50

[6] CEILINGS — per batch, with every power switched on
  BIN 1 (6 loads): SO <= 6  BR <= 3  MK <= 4;   a round is 16 actions at fork 0 (4.00)
  BIN 2 (12 loads): SO <= 12 BR <= 6  MK <= 8;  a round is 31 actions at fork 0 (3.88)
  BIN 3 (18 loads): SO <= 18 BR <= 9  MK <= 12; a round is 46 actions at fork 0 (3.83)

[7] THE LOCKOUT PATH FROM AN EMPTY SAVE (0 SC, 0 BR, 0 SO, 0 MK)
  a TURN costs 0 units; GLEAN pays +4 SC for one action, free, unlimited
  2 gleans -> 8 SC; 3 green loads -> 6 cold turns -> EMPTY pays 3 SO, 1 BR, 1 MK
  TOTAL from nothing: 12 actions -> first soil: 3 SO, first Mark: 1 MK

[7b] THE FIRST-TIME PATH — the seed capital played out, round by round (harvest -> feed -> batch)
round  loads  brown   HOT  turns  actions  act.total   MK   SC   BR   SO
    1      6      0 False     12       19         19    2    0    3    6
    2      6      0 False     12       23         42    4    0    6    6
    3      6      2  True      6       16         58    8    1    6    6
    4      6      2  True      6       16         74   12    2    6    6
    5      6      2  True      6       16         90   16    3    6    6
    6      6      2  True      6       15        105   20    0    6    6
  SO sits at exactly 6 the whole way (one round of pipeline, never a leak); the first two
  rounds are COLD because a fresh save holds no browns; BIN 2 lands at the end of round 4.

[8] ABSORPTION — the finite MK sinks and the unbounded ones
  finite unlock table  : 124 MK          -> 31 seed rounds, ~500 actions
  unbounded MK  : SHED TALLY 3 MK each (+ F3 2 MK/use)
  unbounded SO  : SACKS 8 SO   unbounded BR : BORDER 6 BR   unbounded SC : TRENCH 8 SC

[9] THE PUBLISHED BAND
  actions per Mark: 3.00  (BIN 1 + BED 1, hot, fork 2, riddle True)
                 to 11.50 (BIN 1 + BED 1, cold, fork 0)
  net held stock per round on every published line: SC -15..+3, BR 0..+12, SO 0

[10] RANDOMNESS
  random variables in the transform: 0 — the whole game is a published integer map.

[ASSERTS]
  ok A1  EMPTY always pays exactly 1 SO per load; no power can add one; ceiling = capacity
  ok A2  SO, BR and MK paid by a batch are IDENTICAL for every fork rank and with/without THE RIDDLE
  ok A3  no fork rank and no riddle ever raises the turns needed or lowers the payout
  ok A4  a COLD pile takes exactly twice the turns of a HEATED one — 48 (loads, fork rank) cases
  ok A5  the hot line is EXACTLY SO-neutral and BR-neutral at every bin tier and fork rank
  ok A6  a bin holding fewer than 3 loads pays no Mark at all, so there is no small-batch farm
  ok A7  a turn is free, gleaning is free and unlimited, 2 gleans + a 3-load cold batch pays 3 SO and 1 MK
  ok A8  the published band is 3.00..11.50 actions per Mark, over 24 published lines
  ok A9  BR and SO are never negative on any published line; all 6 full-batch rounds burn scrap
         before gleaning (worst -15 SC) and GLEAN always pays it back
  ok A10 with every power on, the top of the band is still 18 SO / 9 BR / 12 MK per batch
  ok A11 unlock table = 124 MK finite; BIN 2 (12 MK) arrives in the first-time trace at round 4
         after 74 player actions
  ok A12 F3 THE BAT HANDLE changes nothing but the action count: 1 action saved per 2 MK spent
ALL ASSERTS GREEN — 12 checks, every published number in compost-to-soil-design.md.
```

---

*End of design. If any number here changes, change it here first, re-run `python3 /home/team/shared/compost-to-soil-checks.py`, and re-publish the balance arithmetic, the batch table and the unlock table — the point of the form is that the published numbers and the built numbers are the same numbers.*

