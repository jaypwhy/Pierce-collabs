---
name: layer-loop-design
description: "Use when designing the closed-loop economy of a new sample game for The Gaming Layer (faucets, sinks, meta currency, earned powers, incorporation form, balance arithmetic) — the repeatable method behind brick-break-design.md and paper-airplane-design.md."
---

# Designing a Gaming Layer closed loop for a new game

Proven on Bin Runner (spec §5.1), Brick Break (`/home/team/shared/brick-break-design.md`), Windward / paper airplane (`/home/team/shared/paper-airplane-design.md`).

## Read first

1. `/home/team/shared/layer-spec-v0.1.md` — §2 (form + C1–C5), §3 (L1–L15, §3.4 revenue), §4 (Parts A–E form), §5.1 (a filled sample; also the style the LOOP panel prints).
2. The already-built game's route file under `/home/team/shared/site/src/routes/` — match its build level: one route file, localStorage meta, phases start/run/intermission, no backend, no accounts.

## Order of work that avoids rework

1. **Pick the bound first.** Every genre has a natural per-run bound, and it drives the whole proof. Arcade-with-a-clock → charge/energy; breakout → the wall's own brick count; sim → stock caps + rot; **fold-and-fly → the landing itself (no clock, no fuel, no board)**. Then pick the *ceiling shape* the bound can support (see "ceiling patterns" below).
2. **Name units differently from the previous sample and make the faucet SHAPE differ** (per action vs per brick type vs per milestone vs per craft vs **per performance grade**). A renamed copy of the previous loop is a reskin and does not show the layer's form. Prove it with a divergence table in §0 of the doc.
3. **Write the arithmetic as you go**, not after — and ship it as a script, not a scratch heredoc: `/home/team/shared/<game>-checks.py`, so the engineer and the lead can re-run it and the published numbers and the built numbers stay the same numbers (paper-airplane-checks.py is the template; it prints the tables the doc quotes and ends in asserts). Re-run it after every edit, then **read its output back against the doc**: hand-writing a number from memory is how errors get in (F2's ceiling was quoted from the wrong course's bases once).
4. **Name an unbounded sink for every persistent unit.** Finite sinks alone leave stock growing forever, which fails C2. The clean patterns: a player-paced repeatable sink (Brick Break's reclaim-wall courses, Windward's baling order) or a repeatable meta purchase (bench plates, re-charts).
5. **Every number gets a MUST-wire or display-only label** in BUILD NOTES, and the headline loop gets one sentence naming the unlock cost and the run count to reach it (~3–5 runs / 5–8 min, mirroring 40-ST → board 2).
6. **Label every time estimate "designed, not playtested".** L10's violation test needs a real player; never present an invented time as measured.

## Ceiling patterns (pick one and prove it)

The strongest single thing a design can publish is a *structural* faucet cap, because no future upgrade can inflate it. In order of strength:

1. **A ladder cap plus no overshoot** (Windward): the payout is a lookup on the graded outcome, the top rung is the last one there is, and surplus performance is absorbed. Then "no power, skill or multiplier can pay more than rung 4" is provable, not tuned.
2. **Finite content per run** (Brick Break): the faucet cannot exceed the board's contents.
3. **A clock plus a charge** (Bin Runner): bounded, but the weakest — nothing caps a session, only a run.

## Powers, skills and multipliers (required in every new sample from now on)

Write them as a table of **kind / cost in the loop's own meta / published exact effect / published ceiling**, then prove the ceiling:
- Costs are **MD-only**, never money, and the build has no store surface at all.
- Make at least one power's contribution **exactly zero units** (a tool that reveals information; a retry that re-rolls your *action* but not the game's randomness). Zero-unit powers are how a design shows it understands the difference between capability and faucet.
- Show a **per-fold / per-unit band table with and without the power** (worst-case delta included), and print that table in the in-game LOOP panel.
- Assert in the check script: (a) the gross faucet ceiling is identical with every power on, (b) no power ever makes a line worse (monotonicity), (c) exactly which lines, if any, can go negative.
- A per-flight power or multiplier may raise the *net* band (it lets a cheap fold reach the top rung). Publish it as that, and keep the *gross* ceiling untouched. Then flag the reading to the lead: the layer forbids purchased power, not earned power — powers may raise what a player can do, never what a game can pay.

## Arithmetic that satisfies the audit

- Sum faucets and sinks for one run for the *same* period, list the net per unit, then convert to a **band** with 2–4 named reference points (competent, best line, with/without the unbounded sink spend).
- Show absorption: total cost of finite sinks ÷ net-per-run ≈ runs to absorb; then point at the unbounded sink.
- Publish **ceilings** derived from the content itself — bricks × per-brick yield, or the ladder's top rung × the payout table. That is the cleanest "bounded faucet" evidence available.
- Bank credits **the moment they are earned**, never at run end, so quitting mid-run forfeits nothing (L2/L3); per-run fuel that is forfeited at run end is fine *only* if it is granted free and fresh every run and never purchasable — say so explicitly, or a reader will call it decay.
- Run four asserts the docs always need: **lockout** (the free/zero-cost action always pays ≥ its cost, on every course, at the worst random outcome, so a player at zero stock is never blocked — this is what makes L1 real rather than rhetorical), **ceiling with all powers on**, **monotonicity**, **negative lines** (name every case, or show there are none).

## Disclosed randomness (C1 / L8)

Allowed and often good, but wire it defensibly: **band announced before the outcome, exact value printed after, drawn uniformly from the game's own simulation (never from a purchase), drawn on a counter kept in the save with the last N values in the export so a stranger can audit the distribution, and unable to create a unit the published ceiling does not already pay.** No power may re-roll it — a retry re-rolls the player's *action* only. Propose the v0.2 L8 clarification in the tensions section, and add the matching exclusion to D2 ("never sell calmer weather, a forecast, a retry or an extra attempt").

## Rule fit gotchas that keep recurring

- **L13** for a game about destroying anything: state whether the target can be a being. Demolition of inanimate scenery with no opponent should be PASS (N/A) *with the fiction stated*. A game where nothing is destroyed and nobody is an opponent is the cleanest fit — say so, and ask for no clarification.
- **Earned in-run upgrades (wider paddle, faster tool, extra reach)** are the design's closest thing to a shortcut: they must open no gate and remove no loop step, and they belong in BUILD NOTES as an explicitly reasoned L6 call. A repeatable meta sink that buys a *retry of an action* is the closest thing to "currency → advantage" any sample has reached — flag it and propose a rule.
- **Thematic trap:** a reclaim/demolition/circular/energy theme invites the forbidden L15 claim ("play diverts real waste", "the loop returns real resources"). Add an explicit guardrail note listing the sentences that must never be written, and hold back the owner-reserved words (L15 / spec §7 Q5). Say plainly that an in-game counter measures the save file and nothing else.
- Do **not** invent a dated player vote or a dated revenue report to fill D4/D5. Write "none yet — no paid release exists", with the mechanism named. The spec's samples use placeholders; a real form must not.

## Presentation

One self-contained file at `/home/team/shared/<game>-design.md`: §0 divergence table, Parts A–E filled in the §4 format (A1–A7 + C-conditions + balance arithmetic, B1–B5, all 15 rule lines with one-line evidence, D1–D5, E1–E3), the powers section with its ceiling arithmetic, then BUILD NOTES (constants block the engineer can copy verbatim, layout grids, field geometry in px, MUST-wire list including the headline loop, MAY-be-display-only list, simplifications-with-reasons), then the rule tensions flagged for the lead, then an appendix quoting the check script's load-bearing output.

## Cost-only powers, exact sub-loops and micro-run farms (added after Compost to Soil / Hot Heap, 2026-10-08)

Proven on `/home/team/shared/compost-to-soil-design.md` + `compost-to-soil-checks.py`. Five patterns worth reusing on the remaining sims (Local Energy, Repair Cafe, Preventative Health):

1. **The strongest power shape is a power that moves only the *action count*, never the payout.** Give the transform a threshold expressed in ripeness points (`RIPE = max(1, 2*loads − 4*rank)`) and let the power cut the threshold. Then the run's output stays a pure lookup on the player's own inputs (1 unit per unit loaded), so "no power can raise the top of the band" is provable *by construction* instead of by tuning — the cleanest ceiling evidence in the layer so far, stronger than a ladder cap. Phrase the rule as one sentence in the doc: **"powers move cost, never payout."**
2. **Make the run's gate openable with a free action.** A transform step that costs zero units (a TURN) means any started run is always completable and the L1 lockout proof becomes two lines: the free step is always available, and the free faucet (`GLEAN`, always on the button bar) has no gate. Assert both in code.
3. **Size the capacities as multiples of the sink's feed, and get *exact* conservation.** Bins of 6/12/18 loads against a bed that takes 6 soil gave `SO in = SO out` and `BR in = BR out` exactly 0 per period, at every tier — a much stronger C2 statement than a band, and it fell out of the numbers rather than being tuned. Look for that pairing deliberately.
4. **Hunt for the micro-run farm before publishing a meta step.** A step of `floor(n/k) × bonus` (and any `max(1, …)` or `ceil` variant) pays a tiny run the same as a full one; on this design a 2-load batch at `ceil` paid 2 Marks for 5 actions (2.5 actions a Mark) against 3.08 for the best real line. Add an assert that the per-Mark rate only improves as the run fills, and that runs below the step pay nothing. A published cliff at the step is fine — check it is a *cliff*, not a farm.
5. **Two more non-decay readings to reuse** (beyond "unused Swing is lost at run end"): a *capped* counter that never banks (`ripeness = min(ripeness + gain, threshold)` — over-working buys nothing and nothing is destroyed), and a run whose intermediate state is **persisted in the save** so no run end, session end or absence can take it away. Both let a design say "nothing decays" with evidence rather than a promise.

**Owner's decay-free cadence (binding as of 2026-10-08).** New sims must advance only on player actions: no clock, no cooldown, no daily, no absence mail, no decay; a ready output waits indefinitely at its full published price. Write it as (a) the game's own fiction ("the bin is sealed when you leave"), (b) the B5 text, and (c) a **greppable wiring MUST** — the built file may contain no `setInterval`, no state-changing `setTimeout`, no `Date.now()` comparison and no catch-up on load — plus a save-export test on both sides of closing the tab. Exporting the in-progress state (`loads`, `browns`, `ripeness`) is what lets a stranger verify the promise without waiting a week.

## Retrofitting powers onto an arcade run (added after arcade-powers.md, 2026-11-02)

Proven on `/home/team/shared/Documents/Shared/designs/arcade-powers.md` + `arcade-powers-checks.py` (Bin Runner and Brick Break, 25 asserts).

1. **Restate the rule per genre before designing anything.** The sims prove "actions per credit"; an arcade run has **fuel** (CH, Swing) and **material** (CS/RS/RK/RB/DZ), so the sentence becomes *"powers move what a player can DO, never what a game can PAY"*, and the proof is structural: **name which bound actually binds the run's ceiling.** Bin Runner's ceiling is its **fuel** (20 CH + 3×5 recycler = 35 sorts), so no power may touch CH. Brick Break's is its **board** (a finite wall smaller than the Swing on every bay), so even a power that hands back fuel cannot raise it. Publishing *which* bound binds — with an assert that says so (A11) — is worth more than any amount of prose.
2. **A power may only set a channel, and the channel list is the proof.** Give every power a dict of allowed channels (`speed`, `guide_items`, `ledger`, `quick_pick`, `spare_ram`, `hit_permille`) and a separate `FORBIDDEN_CHANNELS` (`ch_bonus`, `sort_cs_bonus`, `per_brick_bonus`, `sw_bonus`, …). Then assert no declared power sets a forbidden one.
3. **Ship sensitivity controls, or "unchanged" means nothing.** Two asserts that make the harness able to *fail*: a hypothetical `ch_bonus=+1` must move the Bin Runner ceiling (35 → 36 sorts, 258 → 264 CS) and a hypothetical `+1 RK a brick` must move Brick Break's (35 → 65 RK); while `+10 SW` must **not** move it (the wall binds). Without these, "identical in all 24 power states" is a tautology a reader cannot check.
4. **Publish the gap the powers close, not just the ceiling they hold.** The realised tables (sorts 21 → 28 against a fixed 35; bricks 20 → 30 against a fixed 30) are what show a power does something. Both saturate at the ceiling and the last rows prove it — M4 ×2 buys five more Swing than ×1 and breaks no extra brick.
5. **Add doc-cross-check asserts (A22–A25):** the script reads `arcade-powers.md` and asserts the published ceiling/price/grind strings are literally present. This is the cheapest defence against the doc drifting from the derivation.
6. **Check the parent's conservation while you are in there.** The retrofit found Bin Runner's CS/RS have **no unbounded sink** after bench tier 3 (1,100 CS of finite tiers ≈ 17 runs), so C2 leaks — flag it rather than quietly adding a mechanic to a published sample.

