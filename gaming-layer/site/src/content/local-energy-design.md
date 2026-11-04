# LOCAL ENERGY (working title: **KETTLE LANE**) — closed-loop design v0.1

**Slug / route:** `/local-energy`
**Genre:** sim — a single-screen **street power sim** (community-owned, fictional)
**One-line loop:** charge the street's battery → answer the call sheet → cut tallies into the shed door → buy shed parts that let you answer bigger sheets.
**Written by:** game-systems designer, team The Gaming Layer. **Date:** 2026-10-10.
**Status:** design document. **No build exists yet.** No studio is attached. Every rate, price and time estimate below is **designed, not playtested**.
**Conforms to:** `/home/team/shared/layer-spec-v0.1.md` — five closed-loop conditions (C1–C5, §2.3), fifteen rules (L1–L15, §3.1–3.3), five permitted revenue models (§3.4), incorporation form (§4).
**Machine-checked:** every number below is derived and asserted by `./checks.py` (`python3 checks.py`, 12 asserts, ends green). If a number here changes, that script must be re-run and this document re-published — the form's last line is the whole point.
**What it is not:** not ratified by the owner; not a product announcement; not a claim that any studio has adopted anything; **not a claim about real electricity, real bills, real carbon or real anything** (Part E's guardrail).

---

## 0. The game, in one screen

A back street — **Kettle Lane** — of six terraced houses. They share one shed with a **battery**, a **dynamo** on a crank, and a **call sheet** pinned to the door. The houses do not ask for power on a clock; they post a sheet, and the sheet waits. You crank the dynamo to put charge in the battery, and you answer the sheet's two calls — **the kettles** (the small call) and **the heaters** (the big call). Every answered call is a **tally** cut into the shed door, and the tallies buy shed parts.

**The one decision, and it is on the first screen:**

> **A call answered while the battery is FULL pays double.**

So the whole game is a small, honest question: *do I spend actions cranking the battery to full before I answer, or do I answer now and take half?* Charging to full for the small call is often not worth the cranks. Charging to full for the big call usually is. **That is the skill, and it is one line of rules.**

**Play unit:** one **SHEET** — answer both calls. The sheet is posted when you finish the last one, and it waits for ever. Nothing in this game moves while you are not pressing a key.

### 0.1 Why this is not a re-skin of the games already built

| | Bin Runner | Brick Break | Windward | Hot Heap | **Kettle Lane** | Why it differs |
|---|---|---|---|---|---|---|
| Skilled input | classification (item → chute) | spatial (angle the ram) | fold choice + release timing | the heap's green/brown **composition** | **the order and depth of the draw** — when to spend actions charging versus when to answer | the first sample whose skill is **timing a purchase of certainty**, not sorting, aiming or mixing |
| Run bound | 90-second wall clock + Charge | Swing + the wall's bricks | the landing | the bin's capacity + a ripeness ladder | **the sheet itself: two calls, then a new sheet** | the only bound that is **a list of jobs**, not a capacity, a clock or a threshold |
| Transformation | item → materials | ram → brick → cart | sheet → fold → landing grade | loads → heat → ripeness → soil | **charge → a call answered → tallies** — a *two-sided* conversion where the state that pays is the battery's fullness at the instant of the answer | the first transform whose payout depends on **a state you can see before you commit** |
| Faucet shape | per action | per brick type | per landing grade | per empty (1 per load) | **per call: `call` tallies if full, `call//2` if not** | the first faucet that pays **double for a decision**, and the only one whose ceiling is a battery |
| Meta | Stamp | Seal | Medallion | Mark | **TL — Tally** (cut into the shed door) | different fiction, different earn condition |
| In-run reinvestment | recycler / offcut | dust patches the cart | the mill's waste heat | the heap's coarse fraction | **every answered call hands 1 charge back** — the line's own loss returns to the battery | reinvestment is **the same unit flowing both ways**: charge is the input and part of the output |
| Sink that returns | bench tiers | reclaim wall | baling order | the beds | **the calls themselves** (charge → tallies) | the paying sink and the returning sink are the same action |
| Randomness | none | none | one disclosed gust | none | **none — zero random variables** | a published integer map end to end |
| Offline | nothing stored | fresh per run | nothing stored | sealed bin | **the sheet waits: no clock, no cooldown, no decay** | the owner's turn-only cadence |

### 0.2 Why this is not Ledger Vale, and not Hot Heap

- **Ledger Vale** (the spec's §5.2 sim) is **allocation across parallel tasks over a calendar of weeks**, with a 0–100 soil-health stock and bounded offline decay. Kettle Lane has **no calendar, no parallel tasks and no stock to manage against a target**: there is one battery, one sheet of two jobs, and a yes/no question at each answer.
- **Hot Heap** (the fourth sample) is **composition**: how you build a heap decides how many turns it needs. Kettle Lane is **timing**: the heap's ratio is a *preparation* rule; Kettle Lane's rule is a *commitment* rule — you decide, at each call, whether to buy certainty with actions. Hot Heap's payout is a lookup on the loads; Kettle Lane's payout is a lookup on **the state of the battery at the moment you press ANSWER**, which is the thing the player controls.
- Shared with both, deliberately: **no clock, no randomness, no money in the transform**, and a faucet ceiling that no power can move.

---

## 1. The loop

- **Inputs:** player actions (the only non-renewable input the layer recognises) and the battery's charge, which the player makes with those actions.
- **Transformation:** **CRANK** turns one action into +1 charge (more with F1). **ANSWER** spends a call's charge and pays tallies — `call` tallies if the battery was full at that instant, `call//2` if not — then hands 1 charge back to the battery.
- **Outputs:** **tallies**, cut into the shed door; and **1 charge back per answered call**, which is the next call's input.
- **Reinvestment:** tallies buy **shed parts** (a bigger battery, a faster crank, a cheaper draw, a meter), which make bigger sheets answerable and each sheet cheaper in actions. Then the next sheet is posted and the loop goes round.
- **What is closed:** **CH (charge)** and **TL (tally)** never convert to money, to each other, or to anything outside the save. There is no wallet, no token, no exchange, no chain. Charge is destroyed only by answering a call; tallies are destroyed only by the shed's price list. Charge refused by a full battery is **never created**, so nothing the player made is thrown away.

```
        actions ──CRANK──▶ CHARGE ──ANSWER──▶ TALLIES ──SHED──▶ bigger battery
                             ▲                  │                 │
                             └──── +1 per call ─┘                 │
                             └──── bigger calls ◀─────────────────┘
```

---

## 2. Currencies

| Code | Name | Earned by | Spent on | Faucet ceiling |
| --- | --- | --- | --- | --- |
| **CH** | **Charge** — what the battery holds | **CRANK** +1 per action (F1: +2, +3), free and unlimited; **+1 per answered call** (the line returns its loss) | answering a call: **SMALL** 2 charge (cap 6) / 4 (cap 12) / 6 (cap 18); **BIG** 4 / 8 / 12; F2 makes each 1 cheaper, never below 1. Also **LEND TO THE LANE**, 8 charge, unbounded | the battery's capacity: **6 / 12 / 18** — refused above it, and refusal creates nothing |
| **TL** | **Tally** — cut into the shed door | answering a call: **`call` tallies if the battery was FULL, `call//2` if not** | the shed's price list (158 TL finite), **SHED PLATE** 3 TL (unbounded), **F3 THE FAST CRANK** 2 TL a use | **the battery's size per sheet: 6 / 12 / 18** — SMALL + BIG = capacity, and no power can add a tally |

Not currencies, and deliberately not units: **the battery** (a capacity, bought with tallies), **the sheet** (which of the two calls are still open), **FULL** (a state, re-checked at every answer and never banked), **badges** (cosmetic records, earned only), **the crank, the meter and the call sheet itself** (fixtures, not stock).

---

## 3. Rules against the layer spec (L1–L15)

| Rule | How this game complies | Violation test (a stranger can run it) |
| --- | --- | --- |
| **L1 free entrance** | Free build, no store, no account, no ad view. A fresh save is **STREET 1 (battery 6), 0 charge, 0 tallies, crank +1, no powers**. CRANK costs nothing, is never gated and is unlimited, so from absolutely nothing **3 actions** (2 cranks + 1 answer) pay the first tally — machine-derived in `checks.py` §[7]. | Start a fresh save with no account and no purchase. Play to your first tally: **3 actions**, no paywall, no trial screen, no locked action. |
| **L2 free exit** | Close the tab at any moment — mid-crank, with a sheet half answered, with the battery full and unanswered. Every unit banks at the press that earned it; the sheet waits for ever at the same price. **No clock, no cooldown, no decay, no absence mail, no streak, no daily.** Charge refused by a full battery is not a loss: it was never created. | Note charge, tallies and which calls are open; close for 30 days (or set the clock forward); return. Every number is where you left it and nothing costs anything to recover. Check the mailbox: nothing was sent. |
| **L3 no locked value** | Everything earned is in one local JSON object: `ch`, `tl`, `tlEarned`, `street`, `sheet` (which calls are open), `crankRank`, `draw` (F2), `meter` (F4), `plates`, `lends`, `badges`, `stats`, `saveVersion`. Playable with no network; exports to a file. | Aeroplane mode: open the export and the game. Everything you hold is there and usable, including the sheet you were in the middle of. |
| **L4 data portability + deletion** | **EXPORT SAVE** on the start screen and in the shed downloads `kettlelane-save.json` with a documented schema (Build notes). **RESET SAVE** is one button with a double confirm and deletes everything immediately. Any future account feature would complete deletion inside **30 days** — stated before the feature exists. | Click export: a text editor opens the file and every HUD number is in it. Click reset: the save is gone, with no email and no request. |
| **L5 no pay-to-win** | Nothing is for sale and there is no store surface in the build. The battery, all four powers and every part are **tally-only**, tallies come only from answered calls, and the transform has **no money term**. Tallies per sheet are **identical in every power state** (6 / 12 / 18 — asserted, A2). | Two fresh saves, same play time; one buys everything on sale. There is nothing to buy. Compare tallies per sheet: identical. |
| **L6 no pay-to-skip** | No purchase exists, and **no power removes a step**: every sheet still needs its cranks and its two answers. F1 makes cranking faster (it does not crank for you), F2 makes a call 1 charge cheaper (it does not answer it), F3 sells one double crank, F4 only prints numbers this document already publishes. | Play from zero to your first sheet with no purchases; then check whether any item claims to shorten that path. The store does not exist; the shed's list is priced in tallies earned by play. |
| **L7 no injected ads** | No ad SDK, no sponsor placement, no pre-roll, no "watch to continue", nothing auto-plays. If a sponsor ever appears it sits on a credits screen, labelled, carrying no reward. | Play 30 minutes and screenshot every 60 s. No ad, no placeholder, no unlabelled branding inside the play surface. |
| **L8 no scarcity / FOMO / gambling** | **Zero random variables**: `full` is a comparison, `call//2` is integer division, the ceiling is a sum. No rotation, no "ends in", no streak, no daily, no expiring bonus. Every limit is a published capacity (the battery's size) or a count of player actions. Nothing is for sale, so nothing can be attached to chance. | Look for a clock anywhere: none. Look for a random reward: there is no draw in the code — a stranger can re-run `checks.py` and read `A12`. |
| **L9 cosmetics only** | Cosmetics are **earned** only: a badge every 10 shed plates, and a tally-count on the door. No paid cosmetic exists, so no earned/bought confusion is possible. | Sort the visible items into earned and bought without seeing prices: every item is earned, and none is priced in money. |
| **L10 earned-only progression** | The unlock table is published below; every row is opened by tallies, which only answered calls produce. Designed times (not measured): F4 at 8 TL = **sheet 2, 17 actions**; F1 rank 1 at 12 TL = sheet 2; STREET 2 at 18 TL = **sheet 3, 23 actions**; F2 24 TL = sheet 4; F1 rank 2 36 TL = sheet 6; STREET 3 60 TL = sheet 10, 65 actions. | Pick the last row (STREET 3, 60 TL) and find a path to it without purchases: 10 sheets, 65 actions, machine-derived in `checks.py` §[9]. |
| **L11 reinvestment report** | Quarterly, one page, revenue by source, spend by category, and the excluded list. First report due six months after the first revenue; **no revenue has been taken, so no report exists yet** — a commitment, not a published artefact. | Find the newest report: none exists because there is no revenue. The commitment and the cadence are published here. |
| **L12 player voice** | Mechanism: in-game poll plus an open thread before any paid release or price change, both answers published side by side including disagreement. **Last consultation: none — no paid release exists.** The monetisation log opens with its first real entry rather than a back-dated one. | Ask when players last voted on monetisation and what happened. There is no paid release to have consulted on, and no log entry is invented. |
| **L13 conflict isolated** | **N/A — there is no combat, no opponent, no PvP and no being.** The only thing that is "drained" is a battery, and the drain *is* the product. Nothing is destroyed, not even scenery. No clarification is being asked for. | Look for a conflict mode: there is none. No unit in the game comes from harm. |
| **L14 data & API boundary** | Nothing leaves the device: no analytics, no identifiers, no third party, no network call. The only personal datum that could exist is an optional display name on a submitted call sheet, chosen by the player and deletable with the save. | Read the privacy block: no advertising identifier, no analytics SDK, no "partners". Turn every consent off: the game is fully playable. |
| **L15 honest claims** | Claims list in Part E, each in-game verifiable. **No claim about real electricity, real bills, real carbon or real energy security is made anywhere** — see the guardrail under E2. The loop is fictional and deliberately simplified. | Take each marketing sentence and ask "could a stranger verify this in the game this week?" Anything about real power, bills, carbon or the grid is a fail, and this design makes none. |

### The five closed-loop conditions

- **C1 legibility — [x].** One sentence: *crank the battery, answer the sheet, a full battery pays double.* The sheet ledger prints every action (`CRANK +1 → CHARGE 4/6`, `ANSWER BIG · FULL → +4 TL · DREW 4 · LINE +1`).
- **C2 conservation — [x].** Per closed sheet, **charge created by cranks = charge drawn by calls − charge returned (2)**, exactly, on every street and every power state (`checks.py` §[6], A4). Tallies are capped structurally at the battery's size (A1) and every tally has a sink (the price list, the plate, F3).
- **C3 no money in the transform — [x].** There is no payment path, no store and no money term. The only way to change any number is an action.
- **C4 recyclability — [x].** Every answered call returns **1 charge**, which is the input to the next call; the paying sink (a call) is also the returning sink. Point at it on screen: `LINE +1` beside every answer.
- **C5 exit integrity — [x].** Local save, export button, immediate delete, no offline process. A half-answered sheet survives closing the tab unchanged.

---

## 4. Earned powers

Four powers, all bought with **tallies**, which only answered calls produce. The design's rule is one sentence:

> **Powers in this game move actions, never payouts.** The tallies a sheet pays are a lookup on the calls and on the battery's fullness at the answer — **no power, rank or multiplier can add one tally to any sheet on any street** (machine-checked: A2, A1).

| Power | Cost / condition | What it lets the player DO | Why it is not a payout |
| --- | --- | --- | --- |
| **F1 THE THROTTLE** | **12 TL** (rank 1), **36 TL** (rank 2); 2 ranks, ever | Each CRANK adds **+2** (rank 1) or **+3** (rank 2) charge instead of +1 | Charge is an input, not a payout: it still has to be spent on a call, and a call still pays `call//2` or `call`. Tallies per sheet are unchanged (A2). At tier 1 it takes a sheet from 6 actions to 5 (rank 1) and 4 (rank 2) — **the tallies are 6 either way** |
| **F2 THE SHED'S DRAW** | **24 TL**, 1 rank, ever | The shed's own standby draw is removed: **every call costs 1 charge less** (never below 1) | A discount on a *cost*, not on a *payment*. The call still pays `call//2` or `call`; the battery still has to be cranked. At tier 1 a sheet goes from 6 actions to 4, and still pays 6 tallies |
| **F3 THE FAST CRANK** | **2 TL per use**, charged only when the use is pressed, repeatable | One action cranks **twice** (+2 charge instead of +1) — it saves exactly **1 action** | Zero units. It buys an action *with tallies*, so it makes the rate **worse**, not better: it is a sink for a player who has finished the price list, not an accelerator |
| **F4 THE METER** | **8 TL**, 1 rank, ever | The shed's meter prints `CHARGE 4/6 · CRANKS TO FULL 2 · SMALL NEEDS 2 · BIG NEEDS 4 · ANSWERING FULL PAYS 4 + 2` before you commit | Zero units. Every value it prints is already published in this document. It changes what a player can **see**, never what a sheet pays |

**The with/without arithmetic** (machine-derived, `checks.py` §[4]; `a` = actions, `t` = tallies, both per sheet in steady state):

| Power state | STREET 1 (6) | STREET 2 (12) | STREET 3 (18) |
| --- | --- | --- | --- |
| **no powers** | **6a / 6t · 1.00** | **12a / 12t · 1.00** | **18a / 18t · 1.00** |
| F1 rank 1 | 5a / 6t · 0.83 | 8a / 12t · 0.67 | 11a / 18t · 0.61 |
| F1 rank 2 | 4a / 6t · 0.67 | 6a / 12t · 0.50 | 8a / 18t · 0.44 |
| F2 THE SHED'S DRAW | 4a / 6t · 0.67 | 10a / 12t · 0.83 | 16a / 18t · 0.89 |
| F1 rank 2 + F2 | **3a / 6t · 0.50** | **5a / 12t · 0.42** | **8a / 18t · 0.44** |

Read the `t` column: **identical in every row.** With every cranking power on, a sheet costs 3 actions instead of 6 on STREET 1 and **still pays exactly 6 tallies**, against a published ceiling of 6 (and 12, 18 on the bigger streets). That is the owner's powers reading — *powers raise what a player can do, never what the game can pay* — made checkable rather than promised.

**Why this cannot become pay-to-win, in the layer's terms.** Tallies are produced only by answered calls, are never sold, and the build has no store, no account and no payment path. C3's violation test cannot be run against a build with no spending side, and the transform contains no money term.

---

## 5. Balance band

### 5.1 The published lines

A **sheet** is the game's natural period: answer the SMALL call and the BIG call, in whichever order you choose. Two named strategies are published; both are machine-simulated to a fixed point (the battery returns to the same charge each sheet).

| Street | Battery | SMALL / BIG | TAUGHT line (crank to FULL before each answer, BIG first) | FLAT line (answer as soon as affordable) |
| --- | --- | --- | --- | --- |
| **1** | 6 | 2 / 4 | **6 actions · 6 tallies · 1.00 act/TL** | 6 actions · 3 tallies · **2.00 act/TL** |
| **2** | 12 | 4 / 8 | **12 actions · 12 tallies · 1.00** | 12 actions · 6 tallies · **2.00** |
| **3** | 18 | 6 / 12 | **18 actions · 18 tallies · 1.00** | 18 actions · 9 tallies · **2.00** |

- **The taught line is exactly one action per tally, at every street size.** That is an accident of nothing: a sheet draws `SMALL + BIG = cap` charge, the line returns 2 of it, so it takes `cap − 2` cranks and 2 answers — **`cap` actions for `cap` tallies**, on every tier (A5).
- **The flat line is exactly two actions per tally** at every size: answering both calls as soon as they are affordable always loses both doublings.
- **Published band: 0.42 to 2.00 player actions per tally**, over 18 machine-checked lines (3 streets × 5 power states, plus the 3 flat lines). The floor, 0.42, is STREET 2 with F1 rank 2 + F2 (5 actions / 12 tallies = 5/12). In tallies per action that is **0.50 to 2.40**.

### 5.2 The arithmetic, spelled out (STREET 1)

```
CAP           6        SMALL 2 (2 TL, 4 if full)     BIG 4 (2 TL, 4 if full)
CRANK         +1 charge per action (F1 r1 +2, r2 +3); a FULL battery refuses the rest
ANSWER        needs charge >= cost; pays `call` if charge == CAP, else `call//2`;
              charge -= cost; charge += 1 (the line returns its loss)
CEILING       SMALL + BIG = CAP tallies per sheet, with every power on

TAUGHT sheet from charge 5 (steady):  1 crank -> 6 · ANSWER BIG  FULL +4 TL, 6-4+1=3
                                      3 cranks -> 6 · ANSWER SMALL FULL +2 TL, 6-2+1=5
                                      = 6 actions, 6 tallies, back at 5         1.00 act/TL
FLAT sheet from charge 1 (steady):    crank -> 2 · ANSWER SMALL (not full) +1 TL, 2-2+1=1
                                      3 cranks -> 4 · ANSWER BIG (not full) +2 TL, 4-4+1=1
                                      = 6 actions, 3 tallies, back at 1         2.00 act/TL
FIRST sheet from empty:               6 cranks -> 6 · BIG FULL +4 · 3 cranks · SMALL FULL +2
                                      = 11 actions, 6 tallies, ends at 5
```

### 5.3 The worst-case grind

The finite price list is **158 tallies** (F4 8 + F1 r1 12 + STREET 2 18 + F2 24 + F1 r2 36 + STREET 3 60).

- From the **taught line** (6 tallies a sheet, 6 actions): **26.3 sheets ≈ 158 actions** to own everything.
- From the **flat line** (3 tallies a sheet, 6 actions): **52.7 sheets ≈ 316 actions** — twice the work for the same list, and nothing is lost by playing badly except actions.
- After the list is exhausted, **SHED PLATE (3 TL, unbounded)** and **F3 (2 TL a use, unbounded)** take everything a player cares to spend. **No unit is created that no sink can consume.**

### 5.4 The lockout test (L1 in one line of arithmetic)

| Starting state | What it costs | What it pays |
| --- | --- | --- |
| **0 charge, 0 tallies** (an empty save) | 2 cranks + 1 answer = **3 actions** | **1 tally**, battery 1 |

- **CRANK costs no units and has no gate, no cap and no cooldown** — a player at zero charge can always make charge.
- **The SMALL call is 2 charge on the smallest battery**, so the first tally is always three actions away.
- **Therefore no sequence of play can make the loop unplayable.** That is a wiring requirement in the build notes, not a hope.

### 5.5 Is the taught line the best line? (searched, not asserted by hand)

`checks.py` §[10] searches **every closed cycle of sheets** in the state graph (a parametric shortest-path search for the minimum actions-per-tally cycle). On all three streets, with no powers and with every power on, **the best possible cycle is exactly the taught line's rate** — 1.00 with no powers, 0.42–0.50 with F1 rank 2 + F2. A player who finds a better line is welcome to it; the ceiling does not move either way.

---

## 6. Sinks

| Sink | Price | Cap | What it returns to the player |
| --- | --- | --- | --- |
| **ANSWER SMALL** | 2 / 4 / 6 charge | once per sheet | `call` tallies if full, `call//2` if not, **+1 charge back** — the loop's own input |
| **ANSWER BIG** | 4 / 8 / 12 charge | once per sheet | the same, doubled in size |
| **LEND TO THE LANE** | **8 charge** | **unbounded** | charge to the lane's lamp posts; a badge every 10. The unbounded **charge** sink |
| **SHED PLATE** | **3 TL** | **unbounded** | one more brass plate on the shed door; a badge every 10. The unbounded **tally** sink |
| **F3 THE FAST CRANK** | **2 TL per use** | **unbounded** | one doubled crank (1 action saved). A tally sink that buys time, never a payout |
| **The shed's price list** | 8 / 12 / 18 / 24 / 36 / 60 TL | one-off | STREET 2, STREET 3, F1 r1, F1 r2, F2, F4 — **158 TL finite** |

Every faucet has a sink able to absorb it and **every unit has an unbounded one**: charge → the calls and LEND; tallies → the price list, the plate and F3. None expires, and none is a countdown.

### The price list (L10)

| Row | Cost (tallies only) | What opens | Designed time (competent) | Advertised as |
| --- | --- | --- | --- | --- |
| **F4 THE METER** | **8 TL** | prints charge, cranks to full and both call sizes before you commit | **sheet 2, 17 actions** | earned tool (zero units) |
| **F1 THE THROTTLE rank 1** | **12 TL** | crank +2 charge an action: a STREET 1 sheet goes from 6 actions to 5 | sheet 2 | earned tool |
| **STREET 2 — THE TWO SHEDS** | **18 TL** | battery 6 → 12: calls 4 and 8, ceiling 12 tallies a sheet | **sheet 3, 23 actions** | free content |
| **F2 THE SHED'S DRAW** | **24 TL** | every call costs 1 charge less | sheet 4 | earned tool |
| **F1 THE THROTTLE rank 2** | **36 TL** | crank +3 charge an action (**MAX rank**) | sheet 6 | earned tool |
| **STREET 3 — THE LANE** | **60 TL** | battery 18: calls 6 and 12, ceiling 18 tallies a sheet | sheet 10, 65 actions | free content |
| SHED PLATE | 3 TL each | a brass plate, badge every 10 | immediate | earned cosmetic (unbounded) |
| F3 THE FAST CRANK | 2 TL a use | one doubled crank | immediate | earned sink |
| LEND TO THE LANE | 8 charge each | a lamp post lit, badge every 10 | immediate | earned cosmetic (unbounded) |

**Finite total: 158 tallies.** No row is a trap: the taught line pays **1.00 action per tally on every street**, so buying a bigger battery never makes a sheet slower per tally — the ladder is about *size and decision space*, not rate. All times are **designed, not measured**.

---

## 7. Adoption form

```
THE GAMING LAYER — INCORPORATION FORM                    Form version: v0.1
==========================================================================
GAME  Local Energy ("Kettle Lane")   BUILD/DATE  design only / 2026-10-10
STUDIO  (sample) two-person indie     SIZE  2      CONTACT  (sample)
GENRE  street power sim, fictional    PLAY UNIT  one sheet (two calls)
```

### PART A — LOOP SUMMARY

**A1 — Units**

| Symbol | Name | Lives where | Faucet | Sink |
| --- | --- | --- | --- | --- |
| **CH** | Charge | persistent stock (the battery) | **CRANK +1 an action**, free and unlimited (F1: +2 / +3); **+1 per answered call** | a call's cost (2/4/6 or 4/8/12, −1 with F2); **LEND 8** (unbounded); capacity refusal creates nothing |
| **TL** | Tally | persistent meta | a call: **`call` if FULL, `call//2` if not** | the price list (158 finite); **SHED PLATE 3** (unbounded); **F3 2 a use** |
| **the sheet** | which calls are still open | the save, mid-sheet | — | — |
| **FULL** | a state of the battery | re-checked at every answer, never banked | — | — |

**A2 — Inputs.** Player actions (the only non-renewable input); the decision at each answer (charge to full or answer now); **seed capital** = STREET 1 (battery 6), 0 charge, 0 tallies, crank +1, no powers — enough to reach the first tally in 3 actions.

**A3 — Transformation.** Published, deterministic, bounded, legible; **no random number anywhere.**

```
CRANK   charge = min(charge + gain, CAP)        gain 1 (F1 r1: 2, r2: 3); refused above CAP
ANSWER  enabled iff charge >= cost              cost = call (F2: call-1, min 1)
        tallies += call if charge == CAP else call//2
        charge  = charge - cost + 1             (the line returns 1)
SHEET   when both calls are answered, a new sheet is posted with the same two calls
CEILING SMALL + BIG = CAP tallies a sheet      6 / 12 / 18, with every power on
```

**A4 — Faucets.** CRANK: charge, +1 an action, free, unlimited, no gate. ANSWER: tallies, `call` if full / `call//2` if not, once per call per sheet, ceiling `cap` a sheet. No clock, no cooldown, no daily, no purchasable acceleration.

**A5 — Sinks.** See §6. Every faucet runs into a sink and every unit has an unbounded one.

**A6 — Reinvestment, in-loop.** **Every answered call returns 1 charge.** Per closed sheet: `created = drawn − 2`, exactly, on every street and power state (A4). The loop's output is its own input, and the sink that pays the player (a call) is also the sink that returns.

**A7 — Reinvestment, meta.** Tallies buy shed parts (a bigger battery, a faster crank, a cheaper draw, a meter). New streets add **decisions**, not rates: the taught line is 1.00 act/TL on all three. Free call-sheet submissions are published with credit and become free content; tallies are never sold.

**C-conditions: C1 [x] C2 [x] C3 [x] C4 [x] C5 [x]**

**Balance arithmetic.** Taught 1.00 act/TL, flat 2.00, band **0.42–2.00** over 18 machine-checked lines; charge conserved exactly per sheet; tallies capped at the battery's size. **Posted at** `/local-energy` (the in-game LOOP panel) **and** `/layer`.

### PART B — EXIT PATH

- **B1 — Save and offline play.** `localStorage["kettlelane.save.v1"]`, one JSON object: `ch`, `tl`, `tlEarned`, `street`, `sheet` (`{small: bool, big: bool}`), `crankRank`, `draw`, `meter`, `plates`, `lends`, `badges`, `stats`, `saveVersion`. **Fully playable offline, yes** — no network request of any kind.
- **B2 — Export.** **EXPORT SAVE** downloads `kettlelane-save.json`:

  ```
  { saveVersion, ch, tl, tlEarned, street, sheet:{small,big}, crankRank, draw, meter,
    plates, lends, badges:[], stats:{sheets, calls, fullCalls, cranks, lended, f3Uses} }
  ```
- **B3 — If the studio closes something.** Streets, powers and counters are numbers in the save; retiring one changes nothing about what the player holds, and the export keeps them. No live service, no login, no key.
- **B4 — Deletion.** No account, no server record, no analytics identifier, no personal data beyond an optional display name on a submitted call sheet. **RESET SAVE** (double confirm) deletes everything immediately; any future account feature completes deletion inside **30 days**.
- **B5 — Offline decay: none, and no offline process at all. THE SHEET WAITS.** *The fiction and the compliance sentence are the same text:*

  > The street posts a sheet and waits. **Close the tab and nothing changes — not one number** — until you come back and pick up the crank. A call waits for ever at its full published price: no freshness penalty, no "the houses got cold", no absence mail, no streak, no daily, no cooldown anywhere in the game.

  Mechanically the build has **no `setInterval`, no state-changing `setTimeout`, no `Date.now()` comparison and no catch-up calculation**; `ch`, `sheet` and `tl` are written when a key is pressed. Scarcity comes only from published **capacities** (the battery's size; one answer per call per sheet).

### PART C — PER-RULE PASS/FAIL

```
L1  Free entrance ............. PASS  Fresh save = STREET 1 + 0 charge + 0 tallies; CRANK is
   free, ungated and unlimited, so 3 actions from nothing pay the first tally.
L2  Free exit ................. PASS  Nothing decays and nothing is lost on exit; the sheet
   waits for ever; no mail, no streak, no daily; a half-answered sheet survives.
L3  No locked value ........... PASS  One local JSON object; export button; offline playable.
L4  Data portability + delete . PASS  Documented export schema; one-button delete; 30 days.
L5  No pay-to-win ............. PASS  No store, no payment path; tallies are the only price and
   come only from answered calls; tallies per sheet identical in every power state (A2).
L6  No pay-to-skip ............ PASS  No purchase exists; no power answers, cranks or charges
   for the player; F1/F2 move cost, F3 sells one action, F4 only prints published numbers.
L7  No injected ads ........... PASS  No ad SDK, no sponsor inside play, nothing auto-plays.
L8  No scarcity/FOMO/gambling . PASS  Zero random variables; no clock anywhere; every limit is a
   capacity or a count of actions; nothing is for sale.
L9  Cosmetics only ............ PASS  Badges and brass plates are earned only; no paid cosmetic.
L10 Earned-only progression ... PASS  Price list published above with designed times; every row
   is tally-only; STREET 3 at 60 TL = sheet 10, 65 actions.
L11 Reinvestment report ....... PASS  Quarterly commitment; no revenue yet, so no report exists.
L12 Player voice .............. PASS  Poll + open thread before any paid release; none yet.
L13 Conflict isolated ......... PASS (N/A)  No combat, no opponent, no being; nothing destroyed.
L14 Data & API boundary ....... PASS  Nothing leaves the device; no analytics, no third party.
L15 Honest claims ............. PASS  Claims list in Part E; no real-energy claim anywhere.
```

### PART D — REVENUE AND VOICE

- **D1 — Revenue models in use (only §3.4).** Base game **free**, loop complete, nothing sold inside it (the free branch is chosen deliberately: the owner's open Q4 in the spec's §7 is unresolved, so this form takes the branch that cannot fail). **Optional paid expansion "THE LONG LANE"** — new streets, new call sheets, new shed art; **geometry and decisions, no power, no number, no shortcut** (every street keeps the 1.00 act/TL taught line). **Voluntary patron tier** — the same game everyone has, plus development notes, credits and L9-safe cosmetics; cancelling costs nothing. **Funded pilots** with studios, educators or public bodies — a classroom adaptation about capacities and ceilings, disclosed under L11. **Optional educational material** — "Why a ceiling you can see beats a number you cannot", a one-page sheet. Content, not power.
- **D2 — Excluded on purpose.** Advertisements and any rewarded ad. Loot boxes, gacha, spin wheels, any purchase of a chance. **Power of any kind — and this game's list is specific: a bigger battery, an extra tally per call, a free answer, a purchased crank, extra charge, a head start on any street, or a purchased tally.** Shortcuts and instant unlocks. Paid exclusivity or paid entrance. Sale, sharing or trade of player data. **Any conversion of CH or TL into money or into anything outside the game** — no wallet, no token, no NFT, no chain, no exchange.
- **D3 — Monetisation change log.** `/layer/monetisation-log`.
- **D4 — Consultation.** In-game poll plus an open thread before any paid release or price change; both the players' answer and the studio's decision published side by side, including "we went against the majority". **Last consultation: none yet** — nothing has been sold and no price has been set.
- **D5 — Reporting cadence.** **Quarterly** (inside L11's six months). Latest report: **none yet** — no revenue has been taken. The first is due within three months of the first euro and will state a real number, even a tiny one.

### PART E — CLAIMS AND SIGN-OFF

**E1 — Public claims (each checkable in the game this week).**

1. "A call answered while the battery is full pays double — the whole game is that one decision." **[in-game verifiable]** — answer at 6/6 and read `+4`; answer at 5/6 and read `+2`.
2. "A sheet pays at most the battery's size in tallies, and no shed part can make it pay more." **[in-game verifiable]** — buy every part and answer the same sheet for the same 6 tallies.
3. "Cranking costs nothing and is never gated, so no player can be locked out: the first tally is three actions away." **[in-game verifiable]** — start from an empty save, press CRANK twice, answer the small call.
4. "The sheet waits. Nothing in this game happens while you are not pressing a key." **[in-game verifiable]** — export the save, close the tab mid-sheet, reopen, compare `ch`, `sheet` and `tl`: not one number moved.
5. "Your save is a file you can export, and every number in the HUD is in it." **[in-game verifiable]** — press EXPORT SAVE; a text editor opens it.

**E2 — Claims intentionally NOT made.** No real-world income, no universal basic income, no health outcome, no environmental outcome from play, no real energy or financial-asset ownership: **confirmed yes.**

> **Guardrail note for this game specifically.** The fiction is a street battery, a dynamo and a call sheet — the closest this layer has come to a real utility. The following sentences **must not be written anywhere**, in-game, in store copy, in a pitch or on the site: "powers your home", "cuts your real bill", "each sheet saves real energy", "playing reduces emissions / carbon / demand on the grid", "community energy transition", "energy independence", "renewable by design", "the loop models a real microgrid", "teaches energy literacy" or "teaches grid engineering" (educational **intent** may be described only with "may" or "intend"), and anything implying a tally, a plate or a lamp post is a real-world object or a measured quantity. **The counters measure the save file and nothing else** — a sheet of 6 tallies is six numbers in a JSON object, and the start screen says so. The words **"regenerative"** and **"circular"** stay held back pending the owner's open question 5 (what the owner's other businesses already claim). Real power systems involve frequency, voltage, protection, forecasting, weather and failure modes; **this game models an action count**, and says so.

**E3 — Signed (sample)** .................... Date 2026-10-10

---

## 8. Open questions for the owner

1. **Name.** The public name in the owner's order is "Local Energy"; the working title in the game is **"KETTLE LANE"** (the street). Which one goes on the page? My recommendation: "Kettle Lane" as the game, "Local Energy" as the folder/route.
2. **Is the sheet simple enough?** The owner's bar is that the loop reads from the first screen. It currently reads in one line — *crank the battery, answer the two calls, a full battery pays double* — but it has **two calls and one state (FULL)**. The simpler alternative is **one call a sheet**, which is easier to read and loses the ordering lesson entirely (and, with the spare return, becomes a single dominant line). I have kept two calls; I would like the owner's ruling before a studio copies it.
3. **Powers reading (spec §7 Q6).** This sample is the cleanest evidence for it so far: with every power on, a sheet still pays exactly 6 / 12 / 18 tallies and the ceiling is the battery's size. **Explicit confirmation wanted** before studios copy the pattern.
4. **F3 THE FAST CRANK is a repeatable sink that buys an action with tallies** (2 TL for one doubled crank). Its ceiling contribution is exactly zero and it makes the rate worse on purpose. It wants the proposed v0.2 rule: *a repeatable in-game sink may sell a second attempt at a required action, never the completion of one, and never a change to a published payout.*
5. **Arc length.** The whole price list is 158 tallies and about **27 sheets / 160 actions** — a short demo arc (designed: 5–8 minutes). Should prices rise ~1.5× for a longer first session, or is a short, complete arc the right shape for a sample?
6. **The headline claim.** "A sheet pays at most the battery's size, and no shed part can make it pay more" is the strongest checkable claim in the layer so far. Is it worth putting on the page as the game's own sentence?
7. **A third call?** A "night call" (bigger, only answerable from a full battery) is the obvious next piece of content. It is deliberately **not** in v0.1: it adds a second variable and would make the published band a range of strategies rather than named lines.
8. **L13 needs no ruling** — there is no conflict of any kind in this game.

---

## BUILD NOTES FOR THE ENGINEER

One route file `src/routes/local-energy.tsx`, same shape as `bin-runner.tsx`, `brick-break.tsx`, `paper-airplane.tsx` and `compost-to-soil.tsx`: `createFileRoute`, meta in localStorage, phases `start | shed | lane`, keyboard + pointer input, no backend, no accounts, no network. A 320×240 logical canvas scaled with `image-rendering: pixelated`; panels around it plain DOM.

### Constants to wire (copy these, do not re-derive)

```ts
const SAVE_KEY = "kettlelane.save.v1";

const STREET = {                                  // the battery, by tier
  1: { name: "STREET 1 — THE SHED",     cap: 6,  cost: 0  },
  2: { name: "STREET 2 — THE TWO SHEDS", cap: 12, cost: 18 },
  3: { name: "STREET 3 — THE LANE",      cap: 18, cost: 60 },
};
const SMALL_OF = (cap: number) => cap / 3;         // 2 / 4 / 6
const BIG_OF   = (cap: number) => (2 * cap) / 3;   // 4 / 8 / 12
const SPARE        = 1;      // charge handed back after EVERY answered call
const CRANK_GAIN   = [1, 2, 3];   // by F1 rank; NEVER make rank 0 anything but 1
const CALL_COST    = (call: number, draw: boolean) => Math.max(1, call - (draw ? 1 : 0));
const CALL_TL      = (call: number, full: boolean) => (full ? call : Math.floor(call / 2));
const F1_COST      = [0, 12, 36];  // by rank; 2 ranks MAX
const F2_COST      = 24;           // F2 THE SHED'S DRAW, 1 rank MAX
const F4_COST      = 8;            // F4 THE METER, 1 rank MAX
const F3_COST      = 2;            // TL per use, repeatable
const PLATE_COST   = 3;            // unbounded TL sink
const LEND_CH      = 8;            // unbounded charge sink
const BADGE_EVERY  = 10;

const SEED = { ch: 0, tl: 0, tlEarned: 0, street: 1, sheet: { small: false, big: false },
               crankRank: 0, draw: false, meter: false, plates: 0, lends: 0, badges: [],
               stats: { sheets: 0, calls: 0, fullCalls: 0, cranks: 0, lended: 0, f3Uses: 0 },
               saveVersion: 1 };
```

Derived rules, verbatim:

```ts
const cap = STREET[street].cap;
// CRANK   : ch = Math.min(ch + CRANK_GAIN[crankRank], cap)   <-- refused charge is NOT created
// ANSWER  : enabled iff ch >= CALL_COST(call, draw)
//           const full = ch === cap;                        <-- read BEFORE spending
//           tl += CALL_TL(call, full); tlEarned += same;
//           ch = ch - CALL_COST(call, draw) + SPARE;
//           sheet[which] = true; if (sheet.small && sheet.big) { sheet = {small:false,big:false}; stats.sheets++ }
// F3      : charge 2 TL when pressed; that one CRANK adds CRANK_GAIN[crankRank] * 2 (still clamped at cap)
// LEND    : enabled iff ch >= LEND_CH; ch -= LEND_CH; lends++
// SHED    : every row shows price, shortfall, effect and ceiling; F1 stops at rank 2 with "MAX"
```

**There is no other state and no other function.** If a value in the build is not derivable from these lines, it is a bug against this document.

### MUST be implemented end to end

1. **The sheet ledger line after every action** (this is C1): `CRANK +1 → CHARGE 4/6`; `ANSWER BIG · FULL → +4 TL · DREW 4 · LINE +1 → CHARGE 3`; on the last answer `SHEET CLOSED · 6 ACTIONS · 6 TALLIES · NEW SHEET POSTED`.
2. **The FULL doubling, read before the spend.** `full` is `ch === cap` at the instant ANSWER is pressed, and the button face says which it will be: `ANSWER BIG · FULL +4` or `ANSWER BIG · +2`.
3. **CRANK free, unlimited, ungated, visible from the first frame**, and a dev assertion that its cost is zero.
4. **The ceiling printed in the HUD**: `CEILING 6 TALLIES A SHEET` and, beside it, `NO SHED PART RAISES IT`.
5. **Charge is never destroyed by a refusal.** Cranking into a full battery adds only what fits and prints `BATTERY FULL — 6/6`.
6. **The sheet waits**: no tick, no timer, no catch-up. The built file must contain **no `setInterval`, no state-changing `setTimeout`, no `Date.now()` comparison**; a dev check greps its own source for all three and fails if any state change depends on them.
7. **The four powers**: F1 rank 1 → 2 with `MAX`; F2 and F4 as buys; F3 as a 2-TL per-use charge taken only when pressed.
8. **The two unbounded sinks are real spends**: SHED PLATE 3 TL, LEND 8 charge, badge every 10.
9. **The shed panel** lists the six rows in price order with effect and ceiling lines, and the note **`NO ROW IS A TRAP — EVERY STREET PAYS 1.00 ACTION PER TALLY`**.
10. **EXPORT SAVE** → `kettlelane-save.json` including the open `sheet`; **RESET** with double confirm.
11. **The LOOP panel** publishing this document's arithmetic: the street table (calls, cost, tallies, ceiling), the two published lines (1.00 and 2.00 act/TL), the powers table with cost/effect/ceiling, the conservation line (`CREATED = DRAWN − 2`), the price list, and the two sentences **"the sheet waits — no number here changes while this tab is closed"** and **"nothing here converts to money; no purchases exist in this game"**.
12. **Start screen in five lines**: `CRANK IS FREE AND UNLIMITED · ANSWER THE SMALL CALL AND THE BIG CALL · A CALL ANSWERED FROM A FULL BATTERY PAYS DOUBLE · THE SHEET WAITS FOR EVER — NOT ONE NUMBER MOVES WHILE YOU ARE AWAY · 18 TALLIES OPENS STREET 2`. Plus the honest line: `A SHEET IS SIX NUMBERS IN A SAVE FILE. NOTHING HERE IS REAL POWER.`
13. **Offline: no network call of any kind anywhere in the file.**

### Geometry (320×240 logical field)

- Five colours: shed `#2b1d12`, copper `#b06a2b`, lamp `#e0c040`, slate `#33404a`, cream `#e8e0c8`.
- **HUD**, two 8-px lines: `y 0–10` = `STREET 1 · BATTERY 4/6 · FULL? NO · CEILING 6`; `y 11–20` = `CHARGE 4 · TALLIES 18 · PLATES 2`.
- **The battery**, x 6–152, y 22–150: a cell bank drawn as `cap` 10×14 px slots in rows of six, filled copper as charge rises, with a **FULL banner** across the top when `ch === cap` (the state must be readable without a number). Beside it the crank wheel and `[C] CRANK +1`.
- **The sheet**, x 160–312, y 22–110: the call sheet as a paper panel with two ruled lines — `SMALL · 2 CHARGE · PAYS 1 (2 IF FULL)` and `BIG · 4 CHARGE · PAYS 2 (4 IF FULL)` — each struck through as it is answered, with its `[1]` / `[2]` button showing the live price and whether it is FULL.
- **The street**, x 160–312, y 114–176: six small houses, one lamp post; LEND and the plate counter live here.
- **The action bar**, y 180–204: `[C] CRANK`, `[1] ANSWER SMALL`, `[2] ANSWER BIG`, `[F3] FAST CRANK 2 TL`, `[S] SHED`, `[L] LOOP`, `[X] EXPORT`.
- data-testids: `crank-btn`, `answer-small`, `answer-big`, `charge-value`, `battery-full`, `tallies-value`, `sheet-small-state`, `sheet-big-state`, `sheet-ledger`, `use-fast-crank`, `buy-f1`, `buy-f1-2`, `buy-f2`, `buy-f4`, `buy-street-2`, `buy-street-3`, `lend-charge`, `shed-plate`, `go-shed`, `go-lane`, `export-save-start`, `reset-save`, `loop-panel`, `shed-panel`.

### MAY be display-only

House art, lamp-post art, plate engraving, badge lists, and the meter's panel line (the HUD already prints charge and the buttons already print FULL) — but the **spends** must be real and the **FULL state** must be readable.

### Arithmetic and mechanics I simplified, and why

1. **Two calls a sheet, always the same two sizes.** A published sheet is legible at a glance and makes the ceiling a sum (`SMALL + BIG = cap`) rather than a tuning knob.
2. **The spare is a flat 1 charge per answer**, not a fraction of the call. A fraction made the loop efficient enough that the taught line fell below one action per tally; a flat 1 keeps the headline **1.00** exact at every street size (A5) and is a single published integer.
3. **Charge is created only by CRANK**, never by a call — so conservation is exact and checkable to the unit (A4), and no faucet is hidden inside an answer.
4. **F1 and F2 move actions; nothing moves tallies** (A2). This is the owner's powers reading, machine-checked.
5. **F3 deliberately makes the rate worse** (2 tallies for 1 action): it is a sink for finished players, not an accelerator, and its ceiling contribution is zero.
6. **No weather, no seasons, no demand curve, no price of power, no storage degradation.** Each would be a second variable, and a second variable would make the published band unfalsifiable. This game has **one** state (FULL) and **one** decision (charge to it or not).
7. **The first sheet is longer than the rest** (11 actions from an empty battery, then 6). That is the tutorial: it teaches that charging costs actions, and it costs nothing but actions.
8. **No unlock is a trap.** Because the taught line is 1.00 act/TL on every street, a bigger battery never lowers the rate — unlike a second bed bought before a second bin in Hot Heap. The price list therefore needs no warning banner.

### Tensions I want the lead to see

1. **Two calls is one rule more than the simplest possible loop.** The owner's bar is "readable from the first screen", and one call a sheet would be simpler — but with the spare return it collapses to a single dominant line (always crank to full), which removes the only decision. **I have kept two calls and flagged it as open question 2** rather than deciding for the owner.
2. **"Earned power is real power" reads more strongly here than anywhere else in the layer**: with every power on, a sheet still pays exactly its ceiling. That is the cleanest evidence for the spec's open Q6 and wants the owner's explicit confirmation before studios copy the pattern.
3. **F3 buys an action with tallies** and is therefore a *negative* efficiency purchase. It is honest and it is a sink, but a sceptic will ask why anyone buys it — the answer is "a finished player with 300 tallies and nothing left to buy", which is exactly the role the SHED PLATE also plays. If the lead prefers, F3 can be dropped entirely; the band's low end does not depend on it.
4. **The arc is short** (158 tallies, ~27 sheets, ~160 actions, designed 5–8 minutes). That is honest for a demo and flagged as open question 5.
5. **The headline claim is structural, not a promise**: "the ceiling is the battery's size" is a sum of two published numbers and a comparison, checkable in the game and in `checks.py` (A1).
6. **Every time in this document is designed, not measured.** L10's violation test asks for a real player who reached the last row; no such player exists yet.
7. **L15 is dangerous here for a new reason**: an energy sim *looks like* a real utility, and "community energy" copy writes itself. The guardrail under E2 should be carried into the site page verbatim, not summarised.

---

## APPENDIX — the machine-checked sums (transcript excerpt)

`python3 checks.py` prints 128 lines and ends with every assert green (12 checks).

```
[3] THE PUBLISHED LINES — one SHEET, steady state, no powers
TAUGHT  tier 1 (FULL before every answer)     6    6    1.00
FLAT    tier 1 (answer as soon as able)       6    3    2.00
TAUGHT  tier 2                               12   12    1.00
FLAT    tier 2                               12    6    2.00
TAUGHT  tier 3                               18   18    1.00
FLAT    tier 3                               18    9    2.00

[4] WITH / WITHOUT THE POWERS — the taught line, one SHEET in steady state
no powers                              6a/6t 1.00    12a/12t 1.00    18a/18t 1.00
F1 THE THROTTLE rank 1                 5a/6t 0.83     8a/12t 0.67    11a/18t 0.61
F1 THE THROTTLE rank 2                 4a/6t 0.67     6a/12t 0.50     8a/18t 0.44
F2 THE SHED'S DRAW                     4a/6t 0.67    10a/12t 0.83    16a/18t 0.89
F1 rank 2 + F2                         3a/6t 0.50     5a/12t 0.42     8a/18t 0.44

[5] BAND: 0.42 to 2.00 actions per tally (0.50 to 2.40 tallies per action), 18 lines

[6] CONSERVATION — created = drawn - 2, on every closed sheet, every street, every power state
tier 1 taught 4 = 6 - 2 · tier 2 taught 10 = 12 - 2 · tier 3 taught 16 = 18 - 2
tier 1 F1r2+F2 2 = 4 - 2 · tier 2 F1r2+F2 8 = 10 - 2 · tier 3 F1r2+F2 14 = 16 - 2

[7] LOCKOUT: 2 cranks + 1 answer = 3 actions -> first tally, from an empty save

[9] FIRST-TIME PATH: sheet 1 = 11 actions, then 6 a sheet; F4 (8 TL) at sheet 2 (17 actions),
    STREET 2 (18 TL) at sheet 3 (23 actions)

[10] BEST POSSIBLE CYCLE == TAUGHT LINE on all three streets, with and without powers
     1.00 (no powers) · 0.50 / 0.42 / 0.44 (F1 r2 + F2)

[ASSERTS]  ok A1 ceiling = battery size · A2 tallies identical in every power state ·
A3 no power costs more than none · A4 charge conserved to the unit · A5 taught 1.00 / flat 2.00 ·
A6 band 0.42..2.00 · A7 no lockout (3 actions) · A8 every answer is paid for ·
A9 F3 adds zero units · A10 finite table 158 TL · A11 the spare is the loop's own input ·
A12 zero random variables — 12 checks, every published number in design.md.
```

---

*End of design. If any number here changes, change it here first, re-run `python3 checks.py`, and re-publish the balance arithmetic, the powers table and the price list — the point of the form is that the published numbers and the built numbers are the same numbers.*
