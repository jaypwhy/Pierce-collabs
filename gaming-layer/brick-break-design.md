# BRICK BREAK — closed-loop design + Gaming Layer incorporation

**Game:** Brick Break — an 8-bit single-screen paddle game (paddle, ball, wall of bricks). The second playable sample of The Gaming Layer, built after Bin Runner.
**Written by:** game-systems designer, team The Gaming Layer. **Date:** 2026-10-01.
**Status:** design document. **No build exists yet.** No studio is attached. Every rate, price and time estimate below is **designed, not playtested** — none of it has been measured in a running game. Numbers are stated here so the engineer can wire them without inventing any.
**Conforms to:** `/home/team/shared/layer-spec-v0.1.md` — five closed-loop conditions (C1–C5, §2.3), fifteen rules (L1–L15, §3.1–3.3), five permitted revenue models (§3.4), incorporation form (Parts A–E, §4). This document is a filled-in form in the same shape as the spec's samples (§5.1 Bin Runner, §5.2 Ledger Vale).
**What it is not:** not ratified by the owner; not a product announcement; not a claim that any studio has adopted anything.

---

## 0. The game, and why it is not a reskin of Bin Runner

**Fiction.** A disused brickworks is being taken down and put back up. You slide a **salvage cart** along the floor and keep a **ram** in the air; the ram knocks bricks out of a condemned wall; the cart catches what falls. The bricks, rubble and dust are sorted by *what you broke*, not by a chute you chose. What you reclaim gets laid back into the yard: a wall you build yourself out of the wall you took down. Every wall you finish is **sealed** with a maker's mark.

**Play unit:** one run — bounded by **Swing**, an in-run charge, and by the **wall itself**. There is no clock.

| | Bin Runner (sample 1) | Brick Break (sample 2) | Why it differs |
|---|---|---|---|
| Skilled input | **classification** — sort item → chute | **spatial** — angle the ram off the cart | different skill, not the same skill re-skinned |
| Run bound | 90-second wall clock + 20 Charge | **Swing** (in-run charge) + the wall's finite brick count | no clock at all; the bound is the board's own contents |
| Transformation | item → materials, one decision per item | ram strike → brick breaks → its contents enter the cart | output depends on *placement*, not labelling |
| Faucet shape | per action (+6 CS / +3 RS per correct sort) | **per brick type** (+2 RK / +3 RB / +1 DZ), ceiling = the wall | conservation is bounded by the board, not by a charge count |
| Meta faucet | **per craft** (print a Jack → +5 ST) | **per structural milestone** (clear a row → +1 Seal; seal a wall → +3) | there is no crafting step at all |
| Meta currency | **ST — Stamp** | **SE — Seal**, earned by finishing masonry | different earn condition, different fiction |
| In-run reinvestment | recycler (10 CS → 5 CH), assembler offcut (+12 CS) | **dust patches the cart** (+width), **cleared row pays back +4 Swing** | the run's own waste repairs the run's own tool |
| Material sink | bench tiers (finite), plus upkeep | **reclaim-wall courses** (unbounded, player-paced) + cart frames | the sink is *building a thing*, not *buying a tier* |
| Crafting | yes (assembler recipe) | **none** | deliberately removed to prove the form isn't one mechanic |

Both games are one route file, browser-playable, localStorage-only, no backend, no accounts.

---

## PART A — LOOP SUMMARY

```
THE GAMING LAYER — INCORPORATION FORM                    Form version: v0.1
==========================================================================
GAME  Brick Break                     BUILD/DATE  design only / 2026-10-01
STUDIO  (sample) two-person indie      SIZE  2      CONTACT  (sample)
GENRE  8-bit arcade, paddle + wall     PLAY UNIT  one run (SW-bound, no clock)
```

### A1 — Units (name each, with symbol)

| Symbol | Name | Lives where | Faucet | Sink |
|---|---|---|---|---|
| **RK** | **Reclaimed Brick** | persistent stock | +2 per WHOLE brick, +1 per LIME brick broken | 25 per reclaim-wall course; 120 / 300 per cart frame |
| **RB** | **Rubble** | persistent stock | +3 per CRUMBLE brick, +1 per LIME brick | 16 per run upkeep; 10 per course; 60 / 180 per frame |
| **DZ** | **Dust** | **run cart → persistent pile** | +1 per WHOLE/LIME brick, +2 per CRUMBLE brick | 5 per cart patch (max 3/run); 8 per run upkeep; 8 per course; 40 / 120 per frame |
| **SW** | **Swing** | **run only, never persists** | 30 at run start; +4 per row cleared | 1 per cart return; 5 per lost ram; **all remaining SW forfeited at run end** |
| **SE** | **Seal** | persistent meta | +1 per row cleared; +3 for sealing a whole wall | 9 / 24 / 54 for bays 2 / 3 / 4; 3 to re-lay a bay with its next layout |

Not currencies and deliberately not units: **bricks on the board** (a finite per-run supply), **cart tier 1–3** (a capacity, bought with materials, never money), **badges** (cosmetic records, earned only, not a currency and not spendable).

### A2 — Inputs

- **Time** — one run. No clock; the run ends when Swing runs out or the wall is down.
- **Skill** — where you return the ram. Cart-offset determines the rebound angle; a player who returns the ram onto the far end of the cart sends it into a different column. The competent line is about three returns in four finding a brick (24 bricks over 32 returns). See the A4 table's last column for the harder number a *full clear* needs: bricks per granted Swing.
- **Contribution** — a player may submit a **wall pattern** (a 5×6 / 6×8 grid of brick types) as free content; credited in-game by name on the pattern. Rewarded with the same units as play (Seals), never a separate currency.
- **Seed capital** (granted once, identical for everyone, never purchasable) — **bay 1 unlocked, cart tier 1, 0 RK / 0 RB / 0 DZ / 0 SE**, and 30 Swing at the start of every run. Enough to reach the first Seal without spending anything.

### A3 — Transformation

Published, deterministic, bounded, skill-weighted, legible.

- The ram strikes a brick → the brick breaks → **its contents enter the cart**, and are credited to the persistent stock **immediately** (not at run end):
  - **WHOLE brick (amber):** +2 RK, +1 DZ
  - **CRUMBLE brick (grey):** +3 RB, +2 DZ
  - **LIME brick (soft, pale):** +1 RK, +1 RB, +1 DZ
- **Every cart return costs 1 SW**, whether it hits a brick or not. **A lost ram costs 5 SW** and respawns on the cart. There is no lives counter and no time penalty.
- **Clearing a full row of the wall: +1 SE and +4 SW, paid immediately.**
- **Sealing a wall (every brick gone): +3 SE; the run ends at once**, forfeiting remaining Swing.
- No randomness anywhere in the transform: the same layout and the same inputs give the same numbers (spec §2.2 "deterministic or honestly random"). No procedural generation, no drop rolls.

### A4 — Faucets (per run, with rate and cost)

**Ceilings are set by the wall, not by a clock or a charge — the strongest form of "bounded" available to this genre.** A run can never pay more than the wall contains.

Per-brick rate: WHOLE +2 RK / +1 DZ; CRUMBLE +3 RB / +2 DZ; LIME +1 RK / +1 RB / +1 DZ.
Per-milestone rate: +1 SE and +4 SW per row cleared; +3 SE per wall sealed.

| Bay (layout) | Bricks | Full-clear RK | RB | DZ | SE | Swing available | bricks ÷ granted Swing (a full clear needs ≥ this) |
|---|---|---|---|---|---|---|---|
| **BAY 1 — YARD WALL** 5×6 `W W C W C L` | 30 | 35 | 35 | 40 | 5+3 = **8** | 30 + 20 = 50 | 60% |
| **BAY 2 — LIME KILN** 6×6 two half-patterns | 36 | 36 | 48 | 48 | 6+3 = **9** | 30 + 24 = 54 | 67% |
| **BAY 3 — DRY STORE** 5×7 `C C W C W C C` | 35 | 20 | 75 | 60 | 5+3 = **8** | 50 | 70% |
| **BAY 4 — BOTTLE OVEN** 6×8 `W C W L W C W C` | 48 | 54 | 60 | 66 | 6+3 = **9** | 54 | 89% (mastery goal, not a gate) |

Working (bay 1, full clear, 15 WHOLE / 10 CRUMBLE / 5 LIME): RK = 15×2 + 5×1 = 35 · RB = 10×3 + 5×1 = 35 · DZ = 15×1 + 10×2 + 5×1 = 40 · SE = 5 rows + 3.
Working (bay 3, full clear, **10 WHOLE / 25 CRUMBLE / 0 LIME** — 5 rows × 7, `C C W C W C C`): RK = 10×2 = 20 · RB = 25×3 = 75 · DZ = 10×1 + 25×2 = 60 · SE = 5+3 = 8.
**The bays differ in mix, not in rates, and no bay dominates:** bay 1 is the RK wall (35 RK), bay 3 is the RB wall (75 RB) and pays the least RK, bay 4 is the biggest and the hardest. A player short of Reclaimed Bricks for a cart frame returns to an earlier, RK-heavier wall; a player short of Rubble goes to bay 3. That choice is a real decision, and it is free.
**Cost to the player of every faucet:** one ram strike (free) and the returns it takes to get it, i.e. **Swing** — 1 per return, 5 per lost ram — plus the time of the run. Nothing else is spent. No faucet is purchasable and no faucet is time-gated: runs are unlimited and can be started the instant one ends.

### A5 — Sinks (per run, with what they return)

| Sink | Rate | What it returns to the player |
|---|---|---|
| **Swing spend** | 1 per cart return + 5 per lost ram; **all remaining Swing forfeited at run end** | the run itself |
| **Cart upkeep** (automatic, at run start) | **16 RB + 8 DZ** | a working cart. Floors at zero — if stock is short it is still applied and play is never blocked (L1/L2) |
| **Cart patching** (automatic) | **5 DZ per patch, max 3 per run** | **+6 px of cart width each** — the dust your own bricks made widens the cart that catches them |
| **Reclaim-wall courses** (player-chosen, **unbounded**) | **25 RK + 10 RB + 8 DZ** per course | one visible course added to the yard wall on the start screen, and a chalk badge every 10 courses (cosmetic, earned, not sellable) |
| **Cart frames** (earned-only, one-off) | **T2: 120 RK + 60 RB + 40 DZ** · **T3: 300 RK + 180 RB + 120 DZ** | cart base width 56 → 68 → 80 px. No step of the loop is removed and no gate is opened (see Part C, L6) |
| **Bay unlocks** | **9 / 24 / 54 SE** for bays 2 / 3 / 4 | a new wall layout and brick mix — content, never money |
| **Re-lay a bay** | **3 SE** | the bay's next published layout, cycling through the list. An unbounded SE sink so Seals cannot pile up |

Every faucet has at least one sink able to absorb it, and every sink except Swing is one the player can repeat without limit (C2).

### A6 — Reinvestment, in-loop (mechanical)

1. **Dust → cart patch.** 5 DZ from the cart is auto-spent to widen the cart one step, up to 3 times a run. The run's own waste re-enters as an input to the run. Waste-as-a-resource in its shortest possible form.
2. **Row clear → Swing payback.** A cleared row returns +4 SW. The transformation's own output (a finished row) re-enters as the fuel that pays for more attempts. Bounded because rows are finite (max +20 SW on bay 1).
3. **Upkeep → a working cart.** The 16 RB + 8 DZ taken at run start returns a cart that still rolls; it is a sink that returns something rather than only destroying (C4).

### A7 — Reinvestment, meta (studio-level)

Free patch content adds new bays and wall layouts — **content, never numbers, never power** — each with its own published ceiling. Quarterly reinvestment report (L11). Monetisation change log and pre-release consultation (L12). Submitted wall patterns are published with credit and become free content for everyone. Seals are never sold and never convert to anything outside the game.

### C-conditions: **C1 [x] C2 [x] C3 [x] C4 [x] C5 [x]**

**Balance arithmetic (published, per run on BAY 1).** Competent line = 24 bricks broken (12 WHOLE / 8 CRUMBLE / 4 LIME — exactly three cleared rows plus one row's worth of mix above them), 3 rows cleared, 2 lost rams.

- Faucets: RK = 12×2 + 4×1 = **28** · RB = 8×3 + 4×1 = **28** · DZ = 12×1 + 8×2 + 4×1 = **32** · SE = **3** · SW granted = 30 + 3×4 = **42**
- Sinks: RB upkeep **16** · DZ upkeep **8** + patches 3×5 = **23** · SW spent = 32 returns + 2 lost rams × 5 = **42** · SE spent **0** (banked)
- Net held before courses: RK **+28** · RB **+12** · DZ **+9**
- **One reclaim-wall course laid (−25 RK, −10 RB, −8 DZ):** RK **+3** · RB **+2** · DZ **+1** → **+6 units held per run**

**Full-clear line (all 30 bricks, the wall sealed, one course laid):** faucets RK 35 / RB 35 / DZ 40; sinks RB upkeep 16, DZ upkeep 8 + patches 15; net before courses RK +35 / RB +19 / DZ +17; minus one course → RK +10 / RB +9 / DZ +9 = **+28 units held per run**.

**Swing closes exactly, by construction, every run:** granted = 30 + 4 × rows cleared; sunk = returns × 1 + lost rams × 5 + forfeited remainder. Faucet always equals sink within a run because whatever is not spent is forfeited when the run ends. **Nothing carries over.**

**Published band:** net held stock per run on BAY 1 between **+6 units** (competent run, one course laid) and **+71 units** (full clear, no course laid). The four computed reference points, all shown in the panel: competent + course **+6**; competent, no course **+49** (28 RK + 12 RB + 9 DZ); full clear + course **+28**; full clear, no course **+71** (35 + 19 + 17). Absorption proof: cart frames take **820 units** in total (T2 220 + T3 600) — about **17 runs** of the competent surplus with no courses laid — and the **reclaim wall takes 43 units per course with no cap**, so any surplus, however large, has a sink that can consume it. **No unit is created that no sink can consume.** The only ceiling-scaling in the economy is that a larger bay contains more bricks (54 RK / 60 RB / 66 DZ per run on bay 4 versus 35 / 35 / 40 on bay 1): per-brick yields are **identical on every bay**, so later bays are more surface, not better rates, and nothing about them can be bought.

**Posted at** `/brick-break` (the in-game LOOP panel, same place Bin Runner posts its arithmetic) **and** `/layer`.

---

## PART B — EXIT PATH

**B1 — Save and offline play.** `localStorage["brickbreak.save.v1"]`, a single JSON object: materials, Seals, cart tier, bays unlocked, layouts played, courses laid, badges, run statistics, `saveVersion`. **Fully playable offline, yes** — the demo makes no network request of any kind (no leaderboard, no telemetry, no fonts fetched at runtime).

**B2 — Export.** An **"EXPORT SAVE"** button on the start screen and in the intermission. It downloads `brickbreak-save.json`, documented schema: `{ saveVersion, rk, rb, dz, se, seEarned, cartTier, bays: [1,2,…], layoutIndex: {bay: n}, coursesLaid, bricksLaid, badges: [], stats: {runs, bricks, rows, wallsSealed, ramsLost, perfectRuns} }`. No account, no email, no server round-trip. *(Build note: Bin Runner's form claims the same button and the shipped demo does not have one yet — this one must actually be wired; it is a ~15-line Blob download.)*

**B3 — If the studio closes something.** Bays, badges and courses are counters inside the save; retiring or renaming one changes nothing about what the player holds, and the export keeps them. There is no live service, no login and no key, so nothing a player earned can expire because a studio stopped shipping.

**B4 — Deletion.** The demo holds no account, no server record, no analytics identifier and no personal data beyond the optional pattern-credit name. **"RESET SAVE" (double-confirm, as in Bin Runner) therefore deletes everything, immediately and completely.** If a leaderboard or pattern credits are ever added, deletion removes the display name, the submission list and the telemetry id, and completes inside **30 days** — stated here so the promise exists before the feature does.

**B5 — Offline decay.** **None.** Nothing decays, expires, resets or is forfeited while the player is away; there is no streak, no daily, no notification, no mail of any kind. Swing is granted fresh at the start of every run and is not stored, so there is nothing to lose between sessions — "absence cannot punish" is satisfied by having no offline process at all.

---

## PART C — PER-RULE PASS/FAIL

```
L1  Free entrance ............. PASS  Free build, no store, no account, no
   ad view. Fresh save = bay 1 + cart tier 1 + 30 SW per run; first Seal
   arrives in ~3 rows, first bay unlock (9 SE) in ~3 runs, ~5-7 min
   (designed, not playtested).
L2  Free exit ................. PASS  No clock, no fee, no cancel step, no
   offline decay, no notification; quitting is the END RUN button or
   closing the tab. Credits from broken bricks bank the instant the brick
   breaks, so an abandoned run loses nothing earned. Unspent Swing is
   per-run fuel granted free each run, never purchased and never stored
   (see tension 3, below).
L3  No locked value ........... PASS  Everything earned is in one local
   JSON object: RK/RB/DZ, SE, cart tier, bays, layouts, courses, badges.
   Readable and playable with no network; exports to a file (B2).
L4  Data portability + delete . PASS  Export button + documented schema
   above; deletion = one button, complete and immediate; 30-day window
   stated for any future account feature.
L5  No pay-to-win ............. PASS  Nothing is for sale; there is no
   store surface in the build. Cart frames and bays are earned-only. Per-
   brick yields are identical on every bay and no number in the economy
   can be moved by money.
L6  No pay-to-skip ............ PASS  No purchase exists. The only
   accelerators are earned: cart frames widen the cart and re-lay cycles
   layouts — neither removes a step of the loop, opens a gate, or skips
   play, and both are reachable by any player with time.
L7  No injected ads ........... PASS  No ad SDK, no sponsor placement, no
   pre-roll, no "watch to continue". Nothing auto-plays. If a sponsor ever
   appears it sits on the credits screen, labelled, carrying no reward.
L8  No scarcity/FOMO/gambling . PASS  No clock in or out of the run, no
   rotation, no "ends in", no randomised reward of any kind — bricks are a
   fixed, published layout, so even the drop is deterministic. No streaks,
   no dailies, no expiring bonus.
L9  Cosmetics only ............ PASS  Cosmetics in the build are **earned**
   only: chalk badges at every 10 courses laid. No paid cosmetic exists,
   so no earned/bought confusion is possible.
L10 Earned-only progression ... PASS  Unlock table published below; every
   row is opened by Seals, which only play produces. Designed times: bay 2
   at 9 SE ≈ 3 competent runs (2 runs if one wall is sealed); bay 3 at 24
   SE ≈ 8 runs; bay 4 at 54 SE ≈ 18 runs. A slower player should expect
   roughly double. All times are designed, not measured.
L11 Reinvestment report ....... PASS  Quarterly, one page, revenue by
   source, spend by category, and the excluded list. First report due six
   months after the first revenue; **no revenue has been taken, so no
   report exists yet** — this is a commitment, not a published artefact.
L12 Player voice .............. PASS  Mechanism = in-game poll + open
   thread before any paid release, outcome published including
   disagreement. **Last consultation: none — no paid release exists yet.**
   The monetisation log opens with the first entry rather than
   back-dating one. (The dated votes in the spec's §5 samples are
   illustrative placeholders; this form does not invent a real one.)
L13 Conflict isolated ......... PASS (N/A, with a note)  There is no
   combat, no opponent, no PvP, and no being anywhere in the game. The
   only thing destroyed is **abandoned, inanimate masonry**, and its
   destruction *is* the reclamation: the wall's own contents become the
   player's materials and are laid back into a wall the player builds.
   The conflict economy is empty — there is one currency set and it is
   the loop's. See tension 1 for the rule clarification this genre wants.
L14 Data & API boundary ....... PASS  Nothing leaves the device: no
   analytics, no identifiers, no third party, no network call. The only
   personal datum that could ever exist is an optional credit name on a
   submitted wall pattern, chosen by the player, deletable with the save.
L15 Honest claims ............. PASS  Claims list in Part E, each
   in-game verifiable today. No money, health, or real-environment claim
   is made anywhere — see the guardrail note under Part E, which matters
   more for this game than for Bin Runner because its fiction is
   demolition-and-reuse.
```

### Published unlock table (L10)

| Row | Cost | What opens | Designed time (competent) | Advertised? |
|---|---|---|---|---|
| Bay 2 — LIME KILN | 9 SE | layout + LIME-heavy mix | 3 runs (~6 min); 2 runs if a wall is sealed | free content |
| Bay 3 — DRY STORE | 24 SE | layout + CRUMBLE-heavy mix | ~8 runs | free content |
| Bay 4 — BOTTLE OVEN | 54 SE | layout, 48 bricks, by far the hardest full clear | ~18 runs | free content |
| Re-lay any bay | 3 SE | the bay's next published layout | immediate | free content |
| Cart frame T2 | 120 RK + 60 RB + 40 DZ | cart base 56 → 68 px | ~5-7 runs if no courses are laid | earned only |
| Cart frame T3 | 300 RK + 180 RB + 120 DZ | cart base 68 → 80 px | ~20 runs if no courses are laid | earned only |
| Reclaim-wall course | 25 RK + 10 RB + 8 DZ | one course of visible wall, badge every 10 | ~1 course per competent run | earned cosmetic |

### Cheapest honest way to verify any of this (for a sceptical stranger)

Play one run of bay 1 and watch the run ledger: `BRICKS 24 · RK +28 · RB +28 · DZ +32 · SW 12/42 · SE 3`. Clear one row and watch the SW counter jump by 4 and the Seal counter by 1. Count the brick types against the published layout and the published per-brick yields. Lay one course and watch 25 RK + 10 RB + 8 DZ disappear. Then open the devtools Application tab and read the save — every number in the HUD is in it.

---

## PART D — REVENUE AND VOICE

**D1 — Revenue models in use (only §3.4).**
- Base game: **free**, loop complete, nothing sold inside it (§3.4 model 1's precondition; the free branch is chosen deliberately — see the owner's open Q4 in the spec's §7, which is unresolved, so this form takes the branch that cannot FAIL).
- **Optional paid expansion "BOTTLE OVEN SET"** — new bays, new wall layouts, submitted player patterns chosen for publication. Content and decisions, no power, no number, no shortcut.
- **Voluntary patron tier** — the same game everyone has, plus development notes, credits, and badge cosmetics that pass L9; cancelling costs nothing and the tier holds no game value.
- **Funded pilots with studios, educators, or public bodies** — a paid adaptation of the loop for a teaching context, disclosed in the L11 report.
- **Optional, separately sold educational material** — "Brickwork notes: how a reclaim loop balances", a one-page teaching sheet on closed-loop arithmetic. Content, not power.

**D2 — Excluded on purpose.** Advertisements and any rewarded ad. Loot boxes, gacha, spin wheels, or any purchase of a chance. Power of any kind, including faster Swing, more Swing, wider carts, better brick yields, extra lives, higher caps. Shortcuts and instant unlocks. Paid exclusivity or paid entrance to the loop. Sale, sharing or trade of player data. **Any conversion of RK, RB, DZ or SE into money or into anything outside the game** — there is no wallet, no token, no NFT, no chain, no exchange, and no unit in this game is a financial asset. Seals buy walls.

**D3 — Monetisation change log.** `/layer/monetisation-log`.

**D4 — Consultation mechanism and last consultation.** Mechanism: in-game poll plus an open thread, run before any paid release or price change; both the players' answer and the studio's decision are published side by side, including a "we went against the majority" entry if that happens. **Last consultation: none yet** — no paid release exists and no price has been set, so there is nothing to have consulted on. The log's first entry will be dated, not back-dated.

**D5 — Reporting cadence and last report.** **Quarterly** (well inside L11's six-month limit). Latest report: **none yet** — no revenue has been taken through this game. The first report is due within three months of the first euro, and it will state a real number, even a tiny one.

---

## PART E — CLAIMS AND SIGN-OFF

**E1 — Public claims (each must be checkable in the game this week).**

1. "Thirty bricks, five rows, one wall — and the wall is every gram of material a run can pay you." **[in-game verifiable]** — count the bricks, count the ledger.
2. "Every row you clear pays a Seal; nine Seals opens the next wall." **[in-game verifiable]** — clear a row, watch SE rise by 1; the bay 2 button reads 9.
3. "There is no clock, and nothing you earn decays while you are away." **[in-game verifiable]** — play, close the game, set the clock forward a month, reopen: every number is where you left it.
4. "The dust your own bricks make widens the cart that catches them." **[in-game verifiable]** — break ten bricks, watch the cart grow and DZ fall, three times a run at most.
5. "Your save is a file you can export and read." **[in-game verifiable]** — press EXPORT SAVE; a text editor opens it.

**E2 — Claims intentionally NOT made.** No real-world income, no universal basic income, no health or wellbeing outcome, no environmental outcome arising from play, no crypto or financial-asset ownership: **confirmed yes.**

> **Guardrail note for this game specifically.** Brick Break's fiction is demolition and reuse, which is the exact place where the forbidden claim is most tempting. Claims such as "play diverts real waste", "every reclaimed brick keeps a real brick out of landfill", "playing contributes to circular construction", "regenerative by design" are **not made and must not be added**. A broken brick is a variable in a save file. The saved-material counters in this game measure the save file and nothing else. The words "regenerative" and "circular" are also held back pending the owner's open question 5 in the spec's §7 (what the owner's other businesses already claim) — the page copy should not use them until that is answered.

**E3 — Signed (sample)** .................... Date 2026-10-01

---

## BUILD NOTES FOR THE ENGINEER

One route file `src/routes/brick-break.tsx`, same shape as `bin-runner.tsx`: `createFileRoute`, `Meta` in localStorage, phases `start | run | intermission`, keyboard + pointer input, no backend, no accounts, no network. Canvas for the play field is recommended (a 320×240 logical canvas scaled with `image-rendering: pixelated`); the panels around it can be plain DOM like Bin Runner's.

### Constants to wire (copy these, do not re-derive)

```
SAVE_KEY            "brickbreak.save.v1"
SW_START            30           // granted at every run start, never stored
SW_PER_ROW          4            // payback on each row cleared
SW_PER_RETURN       1
SW_LOST_RAM         5
ROW_SE              1
SEAL_WALL_BONUS     3            // sealing the whole wall; run ends immediately
PATCH_DUST          5
PATCH_MAX           3            // +6 px cart width each
UPKEEP_RB           16           // automatic at run start, floors at 0
UPKEEP_DZ           8            // automatic at run start, floors at 0
COURSE   { rk: 25, rb: 10, dz: 8 }        // reclaim-wall course, unlimited
FRAME2   { rk: 120, rb: 60, dz: 40 }      // one-off, earned only
FRAME3   { rk: 300, rb: 180, dz: 120 }    // one-off, earned only
BAY_COST  { 1: 0, 2: 9, 3: 24, 4: 54 }    // in SE
RELAY_COST 3                              // SE, cycles the bay's layout list
SEED      { rk: 0, rb: 0, dz: 0, se: 0, cartTier: 1, bays: [1], layoutIndex: {1:0} }

BRICK_YIELD = {
  W: { rk: 2, rb: 0, dz: 1 },   // WHOLE   amber
  C: { rk: 0, rb: 3, dz: 2 },   // CRUMBLE grey
  L: { rk: 1, rb: 1, dz: 1 },   // LIME    pale
}

BAY 1 — YARD WALL      5 rows × 6   rows identical:  W W C W C L
BAY 2 — LIME KILN      6 rows × 6   rows 1-3: W L C C L W   rows 4-6: C L W L C W
BAY 3 — DRY STORE      5 rows × 7   rows identical:  C C W C W C C
BAY 4 — BOTTLE OVEN    6 rows × 8   rows identical:  W C W L W C W C
```

Layout totals, which the LOOP panel must display so a player can check the code is telling the truth: bay 1 = 15 W / 10 C / 5 L; bay 2 = 12 / 12 / 12; bay 3 = **10 W / 25 C / 0 L**; bay 4 = 24 W / 18 C / 6 L. Full-clear ceilings per bay are in A4's table — print the current bay's ceiling in the panel. **These totals were summed by machine from the row strings above; if you change a row string, re-sum and update A4** (`W`: RK 2, RB 0, DZ 1 · `C`: RK 0, RB 3, DZ 2 · `L`: RK 1, RB 1, DZ 1).

Geometry: cart base width **56 / 68 / 80 px** for tiers 1 / 2 / 3; each patch **+6 px** (in-run max 74 / 86 / 98). Brick 40×10 px on a 320×240 field — bay 1 and bay 2 are 6 wide (240 px, roomy), bay 3 is 7 (280 px), **bay 4 is 8 wide = 320 px, edge to edge, so give bay 4 a 36 px brick or widen the field to 336 for every bay; the ceilings do not depend on brick size.** Ram 3 px radius, constant speed ~110 px/s, constant unless you decide to ramp it *(I did not ramp it — a speed ramp changes the arithmetic per run for no economic gain and would need the ceilings re-checked)*. Cart-hit offset sets the rebound angle (classic breakout). A lost ram respawns on the cart and costs 5 SW.

### MUST be implemented end to end (the headline loop)

**Break bricks → credits bank immediately → Seals for cleared rows → 9 SE unlocks BAY 2.** This mirrors Bin Runner's 40-ST unlock: a competent player should reach bay 2 in **2–3 runs, ~5–7 minutes**, and can get there in 2 runs with one sealed wall.

1. Play field, cart, ram, brick grid, brick destruction, rebound angles. The run ends on **SW = 0**, on **all bricks broken** (pay +3 SE, end at once), or on **END RUN**.
2. Per-brick credits applied to `meta` **at the moment the brick breaks** — never batched to run end, so quitting mid-run loses nothing earned.
3. Swing economy: 30 at start, −1 per return, −5 per lost ram, +4 per row cleared, remainder forfeited at run end.
4. Row-clear detection → +1 SE immediately, with a flash: `ROW CLEARED  +1 SE  +4 SW`.
5. Dust patching: when the run cart holds ≥5 DZ and patches < 3, auto-spend 5 DZ, widen 6 px, flash `CART PATCHED 2/3  −5 DZ`.
6. Cart upkeep at run start: −16 RB −8 DZ (floored at 0), flashed on the start screen so it is never a surprise.
7. Intermission economy panel: buy cart frames T2/T3; unlock bays 2/3/4; lay courses; re-lay. Every button shows the price and the shortfall, exactly as Bin Runner's does.
8. localStorage persistence of everything in the export schema; reset with double-confirm.
9. **EXPORT SAVE** → `brickbreak-save.json` (Blob download). Wire this for real; Bin Runner's form advertises an export button its build does not yet have.
10. Run ledger + LOOP panel publishing this document's arithmetic: the per-run faucet/sink lines, the published band (+6 to +71, reference points +6 / +28 / +49 / +71), the current bay's ceilings, and the line "nothing here converts to money; no purchases exist in this game".
11. Start screen must state the loop in five lines the way Bin Runner's does, including `SWING 30 PER RUN · ROW CLEARED +1 SE +4 SW · 9 SE OPENS BAY 2`.

### MAY be display-only

- **Re-lay (3 SE):** acceptable as a wired button that increments `layoutIndex` and swaps to the bay's second published pattern; if patterns are not built, keep the button, spend the SE, and show `LAYOUT <n> QUEUED` — the sink still balances, which is what conservation needs.
- **Reclaim wall visuals:** a counter (`COURSES LAID: 7 · BRICKS LAID: 175`) is enough; a drawn wall is a nicety. The **spend** must be real, because it is the unbounded material sink that makes C2 provable.
- **Chalk badges** at every 10 courses: a text badge list is enough.
- **Contribution path** (player-submitted wall patterns) is out of scope for this demo; the input is named in A2 so the form is honest about it, and the credit name is the only personal datum the design can ever hold.

### Arithmetic and mechanics I simplified, and why

1. **No clock at all.** Bin Runner's bound is a 90-second timer; this genre's natural bound is the wall's finite content, so the run ends on Swing or on the wall. It also makes C2 exact: per-run faucet ≤ published wall content. If the run ever feels too long, cut `SW_START` (30) — do **not** add a timer, which would reintroduce absence-adjacent pressure and change the band's meaning.
2. **Patching is automatic, not a button.** Reinvestment is meant to be mechanical, not a decision; it also removes a HUD control. Consequence: the player cannot bank dust instead of patching.
3. **One dust pool.** Run cart and persistent pile are one number in the HUD; far less bookkeeping, and the published arithmetic stays readable.
4. **Seals are per row, not per brick.** A milestone faucet instead of a per-action faucet, which is what makes this loop structurally different from Bin Runner's per-craft Stamp.
5. **Fixed layouts, no procedural generation.** Reproducible ceilings, meaningful published unlock times, and a deterministic transform — no RNG to disclose at all.
6. **Upkeep floors at zero and never blocks play.** L1/L2 outrank the fiction of a worn cart.
7. **No crafting step.** Deliberately removed so this sample shows the form without Bin Runner's assembler recipe.
8. **The competent line (24 bricks) is a design estimate**, built to be self-consistent (three cleared rows + one row's mix; 32 returns + 2 lost rams = 42 SW granted). It is not a measurement. Expect the real hit rate to differ; the ceilings do not depend on it.

### Rule and condition tensions I want the lead to see

1. **L13 in a game about knocking a wall down.** There is no opponent and no being in the game; the target is inanimate, abandoned masonry, and the destruction *is* the reclamation. I have marked L13 **PASS (N/A)** and stated the fiction. But the spec's §7 question 5 is still open — if the owner wants non-violence as part of the layer's identity, "destruction of scenery" needs an explicit ruling, because a stranger auditing this form will reasonably ask whether a demolition game is a conflict game. **Proposed one-line clarification for spec v0.2:** *in L13, "conflict" means a being as target; destruction of inanimate scenery with no opponent is not conflict, and the fiction must be stated in the form.* This is the single hardest rule fit in the whole design.
2. **C4's second half is thinner here than in the sim sample.** "At least one sink returns something to the player" is satisfied by the dust patch and by upkeep returning a working cart — but this genre has essentially one class of output (material), so there is no compost-style cycle to point at. It passes; it is worth adding this case as a second C4 example in v0.2 so studios in thin-output genres are not left guessing.
3. **L2 versus "unused Swing is lost at run end."** A per-run fuel that is destroyed at the run end looks like decay if you only read the sink line. It is not: Swing is granted free, fresh, in full at every run start, is never stored and can never be bought. I have written that into A5 and B5 rather than leaving it implicit — and I bank every credit the instant a brick breaks precisely so that quitting mid-run forfeits nothing earned.
4. **Earned cart frames are the closest thing in the design to a shortcut (L6).** A wider cart makes a run easier. My reading: it removes no step of the loop, opens no gate, and is earned by play and available to everyone, so it is not a skip — this is exactly the "if a fast-forward exists it must be bought with loop units" case in L6's compliance line. If the lead reads L6 more strictly, the fix is to cut the frames and keep only the unbounded course sink, which leaves conservation intact.
5. **Seals are skill-gated, which cuts both ways.** A player who never clears an entire row earns 0 SE and stalls. I did **not** add a consolation faucet (that would weaken the skill-weighting that C3 and L5 rest on). Mitigation is that rows are wide but low, the cart patch makes clearing easier within a run, and bay 1 is the easiest wall. Worth watching on the first playtest: if a weak player cannot reach 9 SE in ~6 runs, add a *published, earned* floor such as 1 SE per wall started rather than lowering the row goal.
6. **The positive feedback (patch → wider cart → more breaks) is bounded, not absent.** Patches cap at 3 per run and the wall is finite, so the ceiling holds — but the per-run achieved yield does shift with skill, which is why the band is published as a range (+6 to +71) rather than one number. This is the assumption most likely to need retuning after playtest; it is the same risk the spec flags at §6.2 assumption 3 for Bin Runner.
7. **Every time in this document is designed, not measured.** L10's compliance line asks for estimated time in the unlock table and the spec's violation test asks for a real player who reached the last row. No such player exists yet, and this form must not pretend otherwise: bay 4's ~18-run estimate is an estimate.

---

*End of design. If any number here changes, change it here first and re-publish the balance arithmetic and the unlock table — the point of the form is that the published numbers and the built numbers are the same numbers.*
