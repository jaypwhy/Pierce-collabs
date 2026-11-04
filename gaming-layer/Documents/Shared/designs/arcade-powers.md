# ARCADE POWERS — earned, loop-funded powers for BIN RUNNER and BRICK BREAK

**What this is:** the retrofit the owner's five-item list asks for last — earned powers, paid for out of each game's own loop, added to the two oldest arcade samples. Bin Runner is spec v0.1 §5.1; Brick Break is `brick-break-design.md`. Both are already playable at `/bin-runner` and `/brick-break`.
**Written by:** game-systems designer, team The Gaming Layer. **Date:** 2026-11-02.
**Status:** design document. **Not built yet** — no power exists in either build, and every rate below is **designed, not playtested**. No studio is attached. Not ratified by the owner.
**Conforms to:** `layer-spec-v0.1.md` (L1–L15, C1–C5) and follows the powers pattern proven in `new-games/repair-cafe/design.md` §4 and `new-games/preventative-health/design.md` §4.
**Machine-checked by:** `arcade-powers-checks.py` beside this file — 25 assertions, all green, deriving every number here.
**What it is not:** not a change to either game's published economy. §6 shows, by re-deriving them, that both parents' published lines are untouched by this retrofit.

---

## 0. The one rule, and why the two games obey it differently

> **Powers move what a player can DO. They never move what a game can PAY.**
> In every power state the run's ceiling, and every per-unit rate, is the same number.

The sims proved this on **actions per credit**: a fix pays the same credits however many carries it took. An arcade run has no "actions per payout" — it has **fuel** (CH, Swing) and **material** (CS/RS/RK/RB/DZ). So the rule has to be restated for this genre, and restated *structurally*:

| | BIN RUNNER | BRICK BREAK |
| --- | --- | --- |
| **the run** | 90 seconds | until Swing runs out or the wall falls |
| **fuel** | **CH** — 20 at start, +15 from the recycler (3 uses × 5), so **35** a run | **SW** — 30 at start, +4 a row cleared |
| **what the run can pay** | 6 CS + 3 RS a correct sort; 12 CS + 5 ST a print | RK / RB / DZ a brick; 1 SE a row, +3 a sealed wall |
| **what binds the ceiling** | **the fuel** — 35 CH is 35 sorts, and nothing outside the run adds CH | **the wall** — a finite brick count, and one return breaks at most one brick |
| **the ceiling, every power state** | **35 sorts · 258 CS · 105 RS · 20 ST · 1 GF · 4 prints** | **bay 1: 30 bricks · 35 RK · 35 RB · 40 DZ · 8 SE** (and 36/35/48 bricks on bays 2/3/4) |

**This is the whole design in one sentence.** In Bin Runner the *fuel* is the ceiling, so no power may touch fuel. In Brick Break the *board* is the ceiling, so even a power that hands back fuel cannot raise it — the wall is already smaller than the Swing (30 bricks against 50 Swing on bay 1; true on all four bays, A11). Two different bounds, the same guarantee, and the check proves both rather than asserting them.

**The second half of the rule:** a power may close the *gap* between a player and the ceiling — that is what a power is for. §1 and §3 publish that gap honestly, per power state. Closing a gap is not raising a ceiling, and the two are kept visibly apart.

---

## 1. BIN RUNNER — four powers, priced in ST

**Stamp (ST)** is the game's only persistent meta currency and it is produced by exactly one act: printing a Repaired Jack, 5 ST a print. So the powers are funded by the loop's own output, and the loop's own output cannot be increased by any of them.

| Power | Cost / condition | What it lets the player DO | Why it is not a payout |
| --- | --- | --- | --- |
| **N1 THE STEADY HAND** | **30 ST** (rank 1), **70 ST** (rank 2); 2 ranks, ever | Items fall at **70%** (rank 1) or **50%** (rank 2) of their speed. More seconds to read each item before it reaches the chute | **Time appears in no yield.** A sort still costs 1 CH and pays 6 CS + 3 RS; the mis-sort rate changes, the rate per sort does not, and the 35-CH fuel budget is untouched (A3, A7) |
| **N2 THE CHUTE GUIDE** | **45 ST**, 1 rank, ever | The bin prints the correct chute on the **first 8 items** of every run | **Information, not material.** A wrong sort still costs 2 CH and pays nothing, so the guide can only help a player spend the same 35 CH correctly — it cannot add one CH (A1, A3) |
| **N3 THE TALLY ROLL** | **40 ST**, 1 rank, ever | The run ledger prints `CH 12/20 · SORTS LEFT IN CEILING 23 · CS TO THE NEXT JACK 18` before you commit | **Zero units.** Every value it prints is already published in this document and in the spec's §5.1 A4. Asserted to change **no number at all** in the realised line (§1, row 5) |
| **N4 THE QUICK PICK** | **5 ST per use**, charged only when pressed, repeatable | One item enters the bin instantly — about **1.2 s** saved | **Zero material.** It buys *seconds* with Stamps, and a Stamp only exists because a print already paid it. It is the unbounded sink for a player who owns everything, not an accelerator |

**The with/without arithmetic.** A stated player (designed, not measured — the same status as every rate in this team's designs) sorts 1 item in 3.0 s and mis-sorts 1 in 4. 90 seconds therefore offers 30 attempts; the 35-CH budget and the error rate decide how many of those land. `a` = attempts, `s` = correct sorts.

| Power state | attempts | mis-sorts | **sorts (s)** | CS | RS | CH spent | ceiling |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **no powers** | 28 | 7 | **21** | 126 | 63 | 35 | **35** |
| N1 THE STEADY HAND rank 1 | 30 | 5 | **25** | 150 | 75 | 35 | **35** |
| N1 THE STEADY HAND rank 2 | 30 | 4 | **26** | 156 | 78 | 34 | **35** |
| N2 THE CHUTE GUIDE | 29 | 6 | **23** | 138 | 69 | 35 | **35** |
| N3 THE TALLY ROLL | 28 | 7 | **21** | 126 | 63 | 35 | **35** |
| N4 THE QUICK PICK ×3 | 28 | 7 | **21** | 126 | 63 | 35 | **35** |
| N1 r2 + N2 | 30 | 3 | **27** | 162 | 81 | 33 | **35** |
| **every power on** (N1 r2 + N2 + N3 + N4 ×3) | 31 | 3 | **28** | 168 | 84 | 34 | **35** |

Read the last column: **35 in every row.** With every power on, the run is worth **168 CS instead of 126** and the ceiling is **still 35 sorts / 258 CS**. The powers buy eight sorts of the fourteen the player was leaving on the table; they buy none of the ceiling.

**Two honest notes, published rather than buried.**

1. **N4 does nothing on its own** (row 6, unchanged). At a 1-in-4 mis-sort rate the *fuel* binds before the clock does, so a run of 28 attempts cannot use three more seconds. It only pays once the error rate is low enough for the clock to bind — i.e. after N1. That is a sink that is deliberately not an accelerator, and it is priced at exactly one print's Stamp income (5 ST) per press.
2. **The spec's own competent line sits almost exactly on the fuel ceiling.** That line spends **30 of the 35 CH** (A5). A player who attempts the same 30 items at 1 mis-sort in 6 spends **exactly 35** — 25 correct at 1 CH plus 5 wrong at 2 CH — i.e. the whole budget. So the published run is the last one an unaided player of that skill can afford, and every power below simply makes the same run cheaper in mistakes. That is the cleanest possible statement of "the ceiling does not move".

---

## 2. BIN RUNNER — the ceiling, by construction

```
FUEL      20 CH at run start + 3 recycler uses x 5 CH = 35 CH
SORT      1 CH -> 6 CS + 3 RS      (a wrong sort: 2 CH -> nothing)
RECYCLE   10 CS -> 5 CH            (max 3 a run)
PRINT     40 CS + 25 RS -> 5 ST + 12 CS offcut
CEILING   min(sorts the fuel allows, sorts the clock allows) -> here the FUEL
          = 35 sorts = 258 CS (210 from sorting + 4 x 12 offcut) + 105 RS
            + 20 ST + 1 GF
```

`arcade-powers-checks.py` §[1] enumerates all **24** power states (3 N1 ranks × N2 × N3 × N4) and finds **one distinct ceiling**: `35 / 258 / 105 / 20 / 1`. §[4] is the sensitivity control — the proof that this is a test which *can* fail:

| what the harness is fed | ceiling | verdict |
| --- | --- | --- |
| time only (a slower item) | 35 sorts · 258 CS | **UNCHANGED** |
| information only | 35 sorts · 258 CS | **UNCHANGED** |
| ledger only | 35 sorts · 258 CS | **UNCHANGED** |
| fuel-saving only | 35 sorts · 258 CS | **UNCHANGED** |
| **CONTROL: +1 CH of fuel** | **36 sorts · 264 CS** | **MOVED — caught (A7)** |

The last row is the point. A power that handed out one Charge would raise the ceiling to 36 sorts and 264 CS, and this harness would fail loudly. None of N1–N4 does, and A8 asserts that no declared power sets any of the forbidden channels (`ch_bonus`, `sort_cs_bonus`, `sort_rs_bonus`, `print_st_bonus`, `gf_bonus`, `recycle_bonus`).

---

## 3. BRICK BREAK — four powers, priced in SE

**Seal (SE)** is the game's meta currency and it is produced by finishing masonry: **1 a row cleared, +3 a sealed wall**. Powers bought with it are paid for by structure, which is the thing the wall's own size limits.

| Power | Cost / condition | What it lets the player DO | Why it is not a payout |
| --- | --- | --- | --- |
| **M1 THE SIGHT LINE** | **6 SE** (rank 1), **16 SE** (rank 2); 2 ranks, ever | A dotted line shows where the ram will travel before you release it — one bounce (rank 1) or two (rank 2) | **Information.** A return still costs 1 SW and a brick still pays its published rate. The wall caps the run either way (A10) |
| **M2 THE STEADY RAM** | **10 SE**, 1 rank, ever | The ram travels at **85%** speed, so the cart has longer to slide under it | **Time.** The run is bounded by Swing and by the wall, not by a clock — nothing in the transform is a rate per second |
| **M3 THE TALLY BOARD** | **12 SE**, 1 rank, ever | The board prints `SW 14 · BRICKS 9 · 30 SW LEFT, 21 BRICKS TO A SEAL · SE TO BAY 2: 4` before the run | **Zero units.** Every value is already published in `brick-break-design.md` A4. Asserted to change no number in the realised line (§3, row 5) |
| **M4 THE SPARE RAM** | **4 SE per use**, charged only when pressed, repeatable | The next lost ram costs **0 SW** instead of 5 | **Run fuel, not material.** It buys back Swing at 4 SE a press — **half of a bay-1 full clear for five Swing** — and the Swing *grant* (30 + 4 a row) is untouched, so the ceiling stays the wall (A16) |

**The with/without arithmetic.** A stated player (designed, not measured): hit rate **500/1000** — one return in two finds a brick, where the published competent line needs 750 — with the published 2 lost rams a run. Bay 1: 50 Swing, 30 bricks.

| Power state | hit rate | returns | **bricks** | rows | SE | sealed | ceiling |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **no powers** | 500 | 40 | **20** | 3 | 3 | – | **30** |
| M1 THE SIGHT LINE rank 1 | 580 | 40 | **23** | 3 | 3 | – | **30** |
| M1 THE SIGHT LINE rank 2 | 640 | 40 | **25** | 4 | 4 | – | **30** |
| M2 THE STEADY RAM | 540 | 40 | **21** | 3 | 3 | – | **30** |
| M3 THE TALLY BOARD | 500 | 40 | **20** | 3 | 3 | – | **30** |
| M4 THE SPARE RAM ×2 | 500 | 50 | **25** | 4 | 4 | – | **30** |
| M1 r2 + M2 | 680 | 40 | **27** | 4 | 4 | – | **30** |
| M1 r2 + M2 + M4 ×1 | 680 | 45 | **30** | 5 | 8 | **yes** | **30** |
| **every power on** (M1 r2 + M2 + M3 + M4 ×2) | 680 | 50 | **30** | 5 | 8 | **yes** | **30** |

Read the last column: **30 in every row.** Every power on takes a 500-hit-rate player from 20 bricks to a full clear — and a full clear is exactly the wall. The ceiling is reached, never passed, and the last two rows show the saturation explicitly: M4 ×2 buys five more Swing than M4 ×1 and **breaks no additional brick**, because there are none left to break. That is the wall doing its job.

---

## 4. BRICK BREAK — the ceiling, by construction

```
SWING     30 at run start + 4 a row cleared  ->  50 (bay 1) / 54 / 50 / 54
RETURN    1 SW, and breaks at most 1 brick
LOST RAM  5 SW
CEILING   min(the wall's bricks, the Swing available) -> here THE WALL
          bay 1 30 bricks = 35 RK + 35 RB + 40 DZ + 8 SE
          bay 2 36 = 36 / 48 / 48 / 9   bay 3 35 = 20 / 75 / 60 / 8
          bay 4 48 = 54 / 60 / 66 / 9
```

`arcade-powers-checks.py` §[5] enumerates all **24** power states on bay 1 (3 M1 ranks × M2 × M3 × M4) and finds **one distinct ceiling**. §[7] is the sensitivity control:

| what the harness is fed | ceiling | verdict |
| --- | --- | --- |
| information only | 30 bricks · 35 RK | **UNCHANGED** |
| skill only (hit rate) | 30 bricks · 35 RK | **UNCHANGED** |
| fuel-saving only (spare ram) | 30 bricks · 35 RK | **UNCHANGED** |
| **CONTROL: +10 SW of fuel** | **30 bricks · 35 RK** | **UNCHANGED — the wall binds (A16)** |
| **CONTROL: +1 RK a brick** | 30 bricks · **65 RK** | **MOVED — caught (A15)** |

Two controls, two different jobs. The rate control proves the harness catches a payout. The Swing control proves something more interesting: **in Brick Break even a fuel power cannot raise the ceiling**, because the board is already smaller than the fuel. A studio copying this pattern should note which of its two bounds is the real one — the check names it (A11) instead of leaving it to prose.

---

## 5. The sinks that fund the powers

Neither game has a store, an account, a payment path or a money term. Both powers lists are priced in the currency the loop already produces, and each list has an **unbounded** sink at the end so that no unit piles up with nothing to spend it on.

| Game | Faucet | Finite sinks (existing + new) | Unbounded sink |
| --- | --- | --- | --- |
| **BIN RUNNER** | **ST**: 5 a Repaired Jack | boards 40 + 120 + 200 = **360 ST** · powers 30 + 70 + 45 + 40 = **185 ST** → **545 ST** finite | **N4 THE QUICK PICK, 5 ST a press** |
| **BRICK BREAK** | **SE**: 1 a row, +3 a sealed wall | bays 9 + 24 + 54 = **87 SE** · powers 6 + 16 + 10 + 12 = **44 SE** → **131 SE** finite; re-lay 3 SE a bay | **M4 THE SPARE RAM, 4 SE a press** |

**The grind, at the published rates** (A20, A21):

- **Bin Runner:** 545 ST at **15 ST a competent run** (the spec's 3 prints) = 36.33 → **37 runs**. At 90 seconds a run that is about **55 minutes** of play to own every power and every board.
- **Brick Break:** 131 SE at **8 SE a bay-1 full clear** = 16.38 → **17 clears**.
- **Cheapest-first, so a new player is not staring at a 70-ST wall:** Bin Runner — N1 r1 (30), N3 (40), N2 (45), N1 r2 (70), then boards 40 / 120 / 200. Brick Break — M1 r1 (6), M2 (10), M3 (12), M1 r2 (16), then bays 9 / 24 / 54.
- **Both lists sit under the existing sink,** so the retrofit does not lengthen the path to the content the games already publish — it adds a parallel choice: the same Stamps can buy a board or a power, never both.

**A finding for the lead, not a change made here.** Bin Runner's **CS and RS have no unbounded sink.** The spec's A5 claims the 300 / 800 CS bench tiers absorb the +66 CS a run, but those tiers are finite: **1,100 CS total, about 17 runs**, and RS has no tier cost at all (+11 a run against a 4-a-run amortised bench repair). After tier 3 both materials accumulate with nothing able to consume them, which is a **C2 conservation gap in the parent sample**, not in this retrofit. This document does not fix it — changing the sample the spec publishes is a bigger call than a powers retrofit — but it should be fixed before a studio copies Bin Runner as its template. Cheapest honest fix: an unbounded cosmetic sink priced in CS + RS (a spool on the shelf), which adds no power and no number.

---

## 6. What this retrofit does not touch

Re-derived by the checks, not asserted by hand:

- **Bin Runner's spec §5.1 A4 line is unchanged**: 30 sorts, 3 prints, 3 recycler uses, **216 CS / 90 RS / 1 GF / 15 ST**, 30 of 35 CH spent, 66 CS and 15 RS left over (A4, A5). The powers do not appear in any of it.
- **Brick Break's A4 / A5 tables are unchanged**: same per-brick rates, same Swing grant, same upkeep, same patches, same course price, same bay costs, same SE per row and per seal (A12, A13).
- **Neither build changes its save shape** beyond one new field each — `powers`, a small map of rank and owned — plus a per-run counter for the per-press powers (`n4Uses` / `m4Uses`, reset with the run, never persisted across one). Both saves stay local, exported, deletable (L3, L4).
- **No new currency, no new unit, no conversion.** ST and SE already existed; this document only spends them (L5, L6, D2 of both parents).
- **The π scale is not applied here.** The owner's π display convention (item 5 of the plan) is a separate change to every HUD and is deliberately out of scope: it multiplies what is *displayed*, never what a loop *pays*, and this document is about the second thing.

---

## 7. Build notes for the engineer

**Constants to wire — copy these, do not re-derive.**

```ts
// BIN RUNNER (site/src/routes/bin-runner.tsx) — add to the existing constants
const N1_COST = [0, 30, 70];      // ST by rank; rank 0 = not owned
const N2_COST = 45;               // ST
const N3_COST = 40;               // ST
const N4_COST = 5;                // ST per press, unbounded
const N1_SPEED = [1.0, 0.7, 0.5]; // item fall speed by rank
const N2_GUIDE_ITEMS = 8;         // first 8 items of a run labelled
const N4_SAVE_MS = 1200;          // one press = 1.2 s saved

// BRICK BREAK (site/src/routes/brick-break.tsx) — add to the existing constants
const M1_COST = [0, 6, 16];       // SE by rank
const M2_COST = 10;               // SE
const M3_COST = 12;               // SE
const M4_COST = 4;                // SE per press, unbounded
const M1_BOUNCES = [0, 1, 2];     // sight-line bounces by rank
const M2_SPEED = 0.85;            // ram speed multiplier
const M4_SAVE_SW = 5;             // one press = one lost ram forgiven
```

**MUST be implemented end to end (the headline loop):**

1. **The purchase, in the game, with the game's own currency.** A small POWERS panel beside the existing unlock panel: price, rank, effect, and a `BUY` button that is disabled with a legible reason (`N1 r2 NEEDS 70 ST — HAVE 44`). No store, no account, no purchase of any kind in money (L5).
2. **N1 and M1 ranks.** Two ranks each, bought, with the effect visibly different (fall speed; bounce count).
3. **N4 and M4 as per-press charges** — taken only when the press happens, never on purchase, never on a timer.
4. **The two ledgers (N3, M3)** printing only numbers this document already publishes.
5. **A `POWERS` line in each LOOP panel** publishing the ceiling sentence verbatim: *"the ceiling is 35 sorts a run, with every power on"* / *"the ceiling is the wall — 30 bricks on bay 1, with every power on"*.

**MAY be display-only:** the exact fall-speed curve, the dotted-line rendering, and the 1.2 s figure — the design's claims do not depend on their precision, only on the direction.

**Three wiring rules that must not be broken (each one is an assert):**

1. **No power may write to `ch`, `sw`, `st`-per-print, `se`-per-row, or any per-brick / per-sort rate.** Only N4/M4 may touch time, and M4 may only forgive a lost ram's 5 SW — never the grant. (A8, A16)
2. **Every power must be monotone:** owning it can never reduce the player's material. (A9: 21 → 25 → 26 → 27 → 27 → 28 sorts; A17: 20 → 23 → 25 → 27 → 30 → 30 bricks)
3. **The build must be greppable-free of any clock in the powers.** No `setInterval`, no cooldown, no daily, no decay — the owner's standing ruling for the sims applies to the arcade samples too, and both games are already clock-free in the transform (the 90-second run is the run's own length, not a timer over the player's absence).

---

## 8. Open questions for the lead and the owner

1. **Powers reading (spec §7 Q6).** This is the second genre in which the pattern is machine-checked: LEND & MEND and the herb sim prove it on actions per credit, these two prove it on fuel and on the board. The owner's **explicit confirmation is still wanted** before studios copy it — three samples is a pattern, not a licence.
2. **The Bin Runner C2 gap (§5).** CS and RS have no unbounded sink after bench tier 3. It predates this retrofit. Fix before studio outreach, or the template teaches a leak.
3. **Is a *skill* power acceptable to the owner's reading?** N1 and M1 make a player *more accurate*, which raises realised material toward the ceiling. It is earned-only, nothing is sold, and the ceiling provably does not move — but it is the closest this pattern comes to a payout, and the owner may want the line drawn tighter (e.g. information-only powers, no skill powers).
4. **Public names.** "THE STEADY HAND", "THE CHUTE GUIDE", "THE TALLY ROLL", "THE QUICK PICK", "THE SIGHT LINE", "THE STEADY RAM", "THE TALLY BOARD", "THE SPARE RAM" — all working names, same open question as KETTLE LANE / LEND & MEND.
5. **M4's price.** 4 SE a press is half a bay-1 full clear for five Swing. That is deliberate (it must be worse than playing well) but it is the one number here most likely to be wrong in playtesting.

---

## 9. The machine check

`python3 arcade-powers-checks.py` — 25 assertions, all green. What each one buys:

| # | assertion | why it matters |
| --- | --- | --- |
| A1 | Bin Runner ceiling identical in all 24 power states | the headline claim, enumerated |
| A2 | the ceiling is the fuel budget, not the clock | names *which* bound binds |
| A3 | 35 sorts / 258 CS / 105 RS / 20 ST / 1 GF | the published ceiling |
| A4 | spec §5.1 A4 line unchanged: 216 / 90 / 1 / 15 | the retrofit did not disturb the parent |
| A5 | the competent line fits the budget (30 of 35 CH) | the published run is affordable |
| A6 | every realised line ≤ the ceiling | no power passes it |
| A7 | **+1 CH moves the ceiling** | the test can fail |
| A8 | no declared power sets a forbidden channel | the channel list is honest |
| A9 | Bin Runner powers are monotone | no power punishes |
| A10 | Brick Break ceiling = the wall, 4 bays × 24 states | the headline claim, enumerated |
| A11 | the wall binds before Swing on every bay | says why a fuel power cannot move it |
| A12 | Swing = 30 + 4 × rows on every bay | the parent's numbers survive |
| A13 | SE = rows + 3 sealed on every bay | the parent's numbers survive |
| A14 | every realised line ≤ the wall | no power passes it |
| A15 | **+1 RK a brick moves the ceiling** | the test can fail |
| A16 | **+10 SW does not move it** | the bound is the board, not the fuel |
| A17 | Brick Break powers are monotone | no power punishes |
| A18 | every power is priced in ST or SE, never money | L5, structurally |
| A19 | ST comes from printing only, and no power adds a print's ST | the faucet is untouched |
| A20 | finite price lists sum as published (545 ST / 131 SE) | the sink ledger |
| A21 | grind as published (37 runs / 17 clears) | the player-facing cost |
| A22 | the document publishes the Bin Runner ceiling | this file and the script agree |
| A23 | the document publishes the Brick Break ceiling | this file and the script agree |
| A24 | the document publishes the finite price lists | this file and the script agree |
| A25 | the document publishes the grind and the realised lines | this file and the script agree |

*End of design. If any number here changes, change it here first, re-run `python3 arcade-powers-checks.py`, and re-publish the powers tables, the ceilings and the price list — the point of the form is that the published numbers and the built numbers are the same numbers.*
