# REPAIR CAFE / LIBRARY OF THINGS (working title: **LEND & MEND**) — closed-loop design v0.1

**Slug / route:** `/repair-cafe`
**Genre:** sim — a single-screen **knowledge & skills sim** (a repair cafe and a tool library, fictional)
**One-line loop:** carry parts from the crate onto the bench → fix the two jobs on the card → cut credits into the cafe's book → buy bench parts and courses that let you carry more per action.
**Written by:** game-systems designer, team The Gaming Layer. **Date:** 2026-10-10.
**Status:** design document. **No build exists yet.** No studio is attached. Every rate, price and time estimate below is **designed, not playtested**.
**Conforms to:** `/home/team/shared/layer-spec-v0.1.md` — five closed-loop conditions (C1–C5, §2.3), fifteen rules (L1–L15, §3.1–3.3), five permitted revenue models (§3.4), incorporation form (§4).
**Machine-checked:** every number below is derived and asserted by `./checks.py` (`python3 checks.py`, 12 asserts, ends green). If a number here changes, that script must be re-run and this document re-published — the form's last line is the whole point.
**What it is not:** not ratified by the owner; not a product announcement; not a claim that any studio has adopted anything; **not a claim about real repairs, real skills, real savings, real waste or real anything** (Part E's guardrail).

---

## 0. The game, in one screen

A repair cafe on a wet Saturday: a **crate** of dead appliances by the door, a **bench** with a vice, and a **card** pinned to the wall with two jobs on it — a **SMALL** job and a **BIG** job, each with the number of parts it needs. The Library of Things' **return tray** sits at the end of the bench: the part you take out of a machine goes there, and it goes back on the bench.

**The one decision, and it is on the first screen:**

> **A job that leaves the bench EMPTY pays its full parts count in credits. Leave a part over and it pays half.**

So the whole game is a small, honest question: *how many parts do I carry to the bench for this job?* Carry exactly what the job needs and the bench clears — full pay. Carry the cart to the brim "to save trips" and the bench never clears — half pay, every time. **That is the skill: sizing the batch before you fetch.**

**Play unit:** one **CARD** — the cafe posts a SMALL job and a BIG job, and you fix both. The card is posted when you finish the last one, and it waits for ever. Nothing in this game moves while you are not pressing a key.

### 0.1 Why this is not a re-skin of the games already built

| | Bin Runner | Brick Break | Windward | Soil Stack | Kettle Lane | **Lend & Mend** | Why it differs |
|---|---|---|---|---|---|---|---|
| Skilled input | classification (item → chute) | spatial (angle the ram) | fold choice + release timing | the heap's green/brown composition | when to spend actions charging vs answering | **sizing a batch**: how many parts to carry for the job | the first sample whose mistake is **over-preparation**, not under-preparation |
| Run bound | 90-second wall clock | Swing + the wall | the landing | the bin + ripeness | two calls a sheet | **the card: two jobs, then a new card** | a list of jobs, and the bound is the list (as Kettle Lane's is) |
| Transformation | item → materials | ram → brick → cart | sheet → fold → landing grade | loads → heat → ripeness → soil | charge → a call answered → tallies | **carry → fix → credits**, where the payout is a lookup on **whether the bench was left empty** | the threshold is a stock you must **not exceed**, not a stock you must fill |
| Faucet shape | per action | per brick type | per landing grade | per empty | per call, doubled if FULL | **per fix: `cost` if the bench cleared, `cost//2` if not** | pays full only for a *clean finish* |
| Meta | Stamp | Seal | Medallion | Mark | Tally | **CR — Credit** (into the cafe's book) | different fiction, different earn condition |
| In-run reinvestment | recycler / offcut | dust patches the cart | mill waste heat | coarse fraction | +1 charge per answer | **+1 part per fix on the return tray** | the same as Kettle Lane in role, different unit and different trigger |
| Sink that returns | bench tiers | reclaim wall | baling order | the beds | the calls themselves | **the FIX itself** (parts → credits, and parts back) | the paying sink is also the returning sink |
| Randomness | none | none | one disclosed gust | none | none | **none — zero random variables** | a published integer map end to end |
| Offline | nothing stored | fresh per run | nothing stored | sealed bin | the sheet waits | **the card waits: no clock, no cooldown, no decay** | the owner's turn-only cadence |

### 0.2 Why this is not Kettle Lane, and not Soil Stack

- **Kettle Lane** (the second sim) is **buying certainty with actions**: charge a battery, and a *full* battery doubles the payout. Its failure is under-preparation — the player who answers too early loses half. **Lend & Mend inverts the threshold**: the bench must be **exactly emptied**, so the payout doubles on a stock that reaches **zero**, and the failure is *over*-preparation — the player who fills the bench to capacity loses half. The two games share one shape (a state-checked doubling) and disagree on which side of the target the mistake is on.
- **Soil Stack** (the first sim) is **composition**: how you build a heap decides how many turns it needs, and the payout is a lookup on the loads. Lend & Mend's payout is a lookup on **the bench level at the instant of the fix**, which the player sets by how much they carry — a *batch size*, not a mix.
- Shared with both, deliberately: **no clock, no randomness, no money in the transform**, and a faucet ceiling that no power can move.

### 0.3 Where the knowledge and the skills are

A repair cafe is a place where things are mended **and** where someone shows you how. Three honest, checkable places carry that here — none of them touches a payout:

1. **The rule is the knowledge.** The published card arithmetic (`cost` full / `cost//2` half, and *the bench must clear*) is a small table a player learns once and then plays from. The LOOP panel prints it; the card prints the cost of each job; the button prints what the fix will pay **before** you press it.
2. **F4 THE FAULT BOOK is information, and information only.** It prints the parts needed, the carries to reach them, and the credits each fix will pay — the same numbers this document publishes. It changes what a player can **see**, never what a job pays.
3. **Trade tags are a record, not a rule.** Each job carries a trade tag (ELECTRICAL / TEXTILE / WOOD); the save counts fixes per trade and the badges read off those counts. **No rule in the game reads the tag** — it is a cosmetic record, and it is stated as one so nobody mistakes flavour for a mechanic.

---

## 1. The loop

- **Inputs:** player actions (the only non-renewable input the layer recognises) and the parts on the bench, which the player carries with those actions.
- **Transformation:** **STOCK** turns one action into up to `gain` parts carried from the crate to the bench (never past the bench's capacity; the player chooses how many). **FIX** spends a job's cost in parts and pays credits — `cost` if the bench was **exactly emptied** by that spend, `cost//2` if not — then the replaced part goes on the **return tray**: +1 part back on the bench.
- **Outputs:** **credits**, cut into the cafe's book; and **+1 part per fix**, which is the next job's input.
- **Reinvestment:** credits buy the cafe's **price list** (a bigger bench, a bigger cart, a faster return tray, a fault book), which makes bigger cards payable and each card cheaper in actions. Then the next card is posted and the loop goes round.
- **What is closed:** **PT (part)** and **CR (credit)** never convert to money, to each other, or to anything outside the save. There is no wallet, no token, no exchange, no chain. Parts are destroyed only by a FIX; credits are destroyed only by the price list, the noticeboard and the clamp. Parts refused by a full bench are **never created**, so nothing the player made is thrown away.

```
        actions ──STOCK──▶ PARTS on the bench ──FIX──▶ CREDITS ──PRICE LIST──▶ bigger bench
                                  ▲                    │                     │
                                  └─── +1 per fix ─────┘                     │
                                  └──── bigger cards ◀───────────────────────┘
```

---

## 2. Currencies

| Code | Name | Earned by | Spent on | Faucet ceiling |
| --- | --- | --- | --- | --- |
| **PT** | **Part** — what the bench holds | **STOCK**: free and unlimited, up to `gain` parts an action (F1: 2, 3), never past the bench's capacity; the player may carry fewer. **+1 per fix** on the return tray (F2: +2) | a job's cost: **SMALL** 2 / 3 / 4 parts; **BIG** 6 / 9 / 12 parts. Also **LEND A KIT**, 8 parts, unbounded | the bench's capacity: **8 / 12 / 16** — refused above it, and refusal creates nothing |
| **CR** | **Credit** — into the cafe's book | a fix: **`cost` credits if the bench was exactly emptied, `cost//2` if not** | the cafe's price list (146 CR finite), **THE NOTICEBOARD** 3 CR (unbounded), **F3 THE CLAMP** 2 CR a use | **the bench's size per card: 8 / 12 / 16** — SMALL + BIG = capacity, and no power can add a credit |

Not currencies, and deliberately not units: **the bench** (a capacity, bought with credits), **the crate** (an unlimited supply, not stock), **the return tray** (a rule, not a pile), **the card** (which jobs are still open), **CLEAR** (a state, re-checked at every fix and never banked), **badges and trade counts** (cosmetic records, earned only), **the vice and the card itself** (fixtures, not stock).

---

## 3. Rules against the layer spec (L1–L15)

| Rule | How this game complies | Violation test (a stranger can run it) |
| --- | --- | --- |
| **L1 free entrance** | Free build, no store, no account, no ad view. A fresh save is **THE FRONT TABLE (bench 8), 0 parts, 0 credits, cart +1, no powers**. STOCK costs nothing, is never gated and is unlimited, so from absolutely nothing **3 actions** (2 carries + 1 fix) pay the first 2 credits — machine-derived in `checks.py` §[7]. | Start a fresh save with no account and no purchase. Play to your first credits: **3 actions**, no paywall, no trial screen, no locked action. |
| **L2 free exit** | Close the tab at any moment — mid-carry, with a card half fixed, with the bench loaded and unfixed. Every unit banks at the press that earned it; the card waits for ever at the same price. **No clock, no cooldown, no decay, no absence mail, no streak, no daily.** Parts refused by a full bench are not a loss: they were never created. | Note parts, credits and which jobs are open; close for 30 days (or set the clock forward); return. Every number is where you left it and nothing costs anything to recover. Check the mailbox: nothing was sent. |
| **L3 no locked value** | Everything earned is in one local JSON object: `pt`, `cr`, `crEarned`, `room`, `card` (which jobs are open), `cart` (F1), `tray` (F2), `book` (F4), `boards`, `kits`, `badges`, `trades`, `stats`, `saveVersion`. Playable with no network; exports to a file. | Aeroplane mode: open the export and the game. Everything you hold is there and usable, including the card you were in the middle of. |
| **L4 data portability + deletion** | **EXPORT SAVE** on the start screen and in the cafe downloads `lendmend-save.json` with a documented schema (Build notes). **RESET SAVE** is one button with a double confirm and deletes everything immediately. Any future account feature would complete deletion inside **30 days** — stated before the feature exists. | Click export: a text editor opens the file and every HUD number is in it. Click reset: the save is gone, with no email and no request. |
| **L5 no pay-to-win** | Nothing is for sale and there is no store surface in the build. The bench, all four powers and every course are **credit-only**, credits come only from fixes, and the transform has **no money term**. Credits per card are **identical in every power state** (8 / 12 / 16 — asserted, A2). | Two fresh saves, same play time; one buys everything on sale. There is nothing to buy. Compare credits per card: identical. |
| **L6 no pay-to-skip** | No purchase exists, and **no power removes a job**: every card still needs its carries and its two fixes. F1 carries more per action (it does not fix), F2 returns an extra part (it does not fix), F3 sells one free fix-action, F4 only prints numbers this document already publishes. | Play from zero to your first card with no purchases; then check whether any item claims to shorten that path. The store does not exist; the cafe's list is priced in credits earned by play. |
| **L7 no injected ads** | No ad SDK, no sponsor placement, no pre-roll, no "watch to continue", nothing auto-plays. If a sponsor ever appears it sits on a credits screen, labelled, carrying no reward. | Play 30 minutes and screenshot every 60 s. No ad, no placeholder, no unlabelled branding inside the play surface. |
| **L8 no scarcity / FOMO / gambling** | **Zero random variables**: `clear` is a comparison, `cost//2` is integer division, the ceiling is a sum. No rotation, no "ends in", no streak, no daily, no expiring bonus. Every limit is a published capacity (the bench's size) or a count of player actions. Nothing is for sale, so nothing can be attached to chance. | Look for a clock anywhere: none. Look for a random reward: there is no draw in the code — a stranger can re-run `checks.py` and read `A12`. |
| **L9 cosmetics only** | Cosmetics are **earned** only: a badge every 10 noticeboard cards, and a credit-count in the book. No paid cosmetic exists, so no earned/bought confusion is possible. | Sort the visible items into earned and bought without seeing prices: every item is earned, and none is priced in money. |
| **L10 earned-only progression** | The price list is published below; every row is opened by credits, which only fixes produce. Designed times (not measured): F4 at 6 CR = **card 1, 9 actions**; F1 rank 1 at 12 CR and BENCH 2 at 16 CR = **card 2, 17 actions**; F2 at 22 CR = card 3, 25 actions; F1 rank 2 at 34 CR = card 5, 41 actions; BENCH 3 at 56 CR = card 7, 57 actions. | Pick the last row (BENCH 3, 56 CR) and find a path to it without purchases: 7 cards, 57 actions, machine-derived in `checks.py` §[9]. |
| **L11 reinvestment report** | Quarterly, one page, revenue by source, spend by category, and the excluded list. First report due six months after the first revenue; **no revenue has been taken, so no report exists yet** — a commitment, not a published artefact. | Find the newest report: none exists because there is no revenue. The commitment and the cadence are published here. |
| **L12 player voice** | Mechanism: in-game poll plus an open thread before any paid release or price change, both answers published side by side including disagreement. **Last consultation: none — no paid release exists.** The monetisation log opens with its first real entry rather than a back-dated one. | Ask when players last voted on monetisation and what happened. There is no paid release to have consulted on, and no log entry is invented. |
| **L13 conflict isolated** | **N/A — there is no combat, no opponent, no PvP and no being.** The only thing "broken" is an appliance, and mending it *is* the product. Nothing is destroyed, not even scenery. No clarification is being asked for. | Look for a conflict mode: there is none. No unit in the game comes from harm. |
| **L14 data & API boundary** | Nothing leaves the device: no analytics, no identifiers, no third party, no network call. The only personal datum that could exist is an optional display name on a submitted card, chosen by the player and deletable with the save. | Read the privacy block: no advertising identifier, no analytics SDK, no "partners". Turn every consent off: the game is fully playable. |
| **L15 honest claims** | Claims list in Part E, each in-game verifiable. **No claim about real repairs, real skills, real money saved, real waste diverted or real community outcomes is made anywhere** — see the guardrail under E2. The loop is fictional and deliberately simplified. | Take each marketing sentence and ask "could a stranger verify this in the game this week?" Anything about real repairs, real savings, real waste or real skills is a fail, and this design makes none. |

### The five closed-loop conditions

- **C1 legibility — [x].** One sentence: *carry only what the job needs; a fix that leaves the bench empty pays full.* The card ledger prints every action (`STOCK +1 → BENCH 4/8`, `FIX BIG · CLEAR → +6 CR · BENCH 0 · TRAY +1`).
- **C2 conservation — [x].** Per closed card, **parts created by carries = parts spent by fixes − tray returns (2)**, exactly, on every room and every power state (`checks.py` §[6], A4). Credits are capped structurally at the bench's size (A1) and every credit has a sink (the price list, the noticeboard, the clamp).
- **C3 no money in the transform — [x].** There is no payment path, no store and no money term. The only way to change any number is an action.
- **C4 recyclability — [x].** Every fix returns **1 part** to the return tray, which is the next fix's input; the paying sink (a fix) is also the returning sink. Point at it on screen: `TRAY +1` beside every fix.
- **C5 exit integrity — [x].** Local save, export button, immediate delete, no offline process. A half-fixed card survives closing the tab unchanged.

---

## 4. Earned powers

Four powers, all bought with **credits**, which only fixes produce. The design's rule is one sentence:

> **Powers in this game move actions, never payouts.** The credits a card pays are a lookup on the jobs' costs and on whether the bench was left empty — **no power, rank or course can add one credit to any card in any room** (machine-checked: A1, A2).

| Power | Cost / condition | What it lets the player DO | Why it is not a payout |
| --- | --- | --- | --- |
| **F1 THE SPARES CART** | **12 CR** (rank 1), **34 CR** (rank 2); 2 ranks, ever | One STOCK action carries **up to 2** (rank 1) or **up to 3** (rank 2) parts instead of 1 — the player still chooses the count, so a bigger cart never forces an overshoot | Parts are an input, not a payout: they still have to be spent on a fix, and a fix still pays `cost//2` or `cost`. Credits per card are unchanged (A2). At rank 2 a card costs 5 actions instead of 8 and **pays the same 8 credits** |
| **F2 THE RETURN TRAY** | **22 CR**, 1 rank, ever | Every fix hands back **2 parts** instead of 1, so the bench restocks faster | A bigger return is fewer *carries*, not more *credits*: the fix still pays `cost//2` or `cost`, and the ceiling is still the bench's size. A card goes from 8 actions to 6 and still pays 8 credits |
| **F3 THE CLAMP** | **2 CR per use**, charged only when the use is pressed, repeatable | One FIX this card costs **no action** — it saves exactly **1 action** | Zero units. It buys an action *with credits*, against a taught rate of 1.00 credit an action, so it makes the rate **worse**: it is a sink for a player who has finished the price list, not an accelerator |
| **F4 THE FAULT BOOK** | **6 CR**, 1 rank, ever | The book prints `BENCH 4/8 · BIG NEEDS 6 · CARRY 2 · FIX PAYS 6 IF THE BENCH CLEARS, 3 IF NOT` before you commit | Zero units. Every value it prints is already published in this document. It changes what a player can **see**, never what a card pays |

**The with/without arithmetic** (machine-derived, `checks.py` §[4]; `a` = actions, `c` = credits, both per card in steady state):

| Power state | THE FRONT TABLE (8) | THE BACK BENCH (12) | THE WHOLE ROOM (16) |
| --- | --- | --- | --- |
| **no powers** | **8a / 8c · 1.00** | **12a / 12c · 1.00** | **16a / 16c · 1.00** |
| F1 THE SPARES CART rank 1 | 6a / 8c · 0.75 | 7a / 12c · 0.58 | 10a / 16c · 0.62 |
| F1 THE SPARES CART rank 2 | 5a / 8c · 0.62 | 6a / 12c · 0.50 | 7a / 16c · 0.44 |
| F2 THE RETURN TRAY | 6a / 8c · 0.75 | 10a / 12c · 0.83 | 14a / 16c · 0.88 |
| F1 rank 2 + F2 | **4a / 8c · 0.50** | **6a / 12c · 0.50** | **7a / 16c · 0.44** |

Read the `c` column: **identical in every row.** With every carry power on, a card costs 4 actions instead of 8 on the front table and **still pays exactly 8 credits**, against a published ceiling of 8 (and 12, 16 on the bigger benches). That is the owner's powers reading — *powers raise what a player can do, never what the game can pay* — made checkable rather than promised.

**Why this cannot become pay-to-win, in the layer's terms.** Credits are produced only by fixes, are never sold, and the build has no store, no account and no payment path. C3's violation test cannot be run against a build with no spending side, and the transform contains no money term.

---

## 5. Balance band

### 5.1 The published lines

A **card** is the game's natural period: fix the SMALL job and the BIG job, in whichever order you choose. Two named strategies are published; both are machine-simulated to a fixed point (the bench returns to the same level each card).

| Room | Bench | SMALL / BIG | TAUGHT line (carry only what the job needs) | FLAT line (fill the bench before every fix) |
| --- | --- | --- | --- | --- |
| **THE FRONT TABLE** | 8 | 2 / 6 | **8 actions · 8 credits · 1.00 act/CR** | 8 actions · 4 credits · **2.00 act/CR** |
| **THE BACK BENCH** | 12 | 3 / 9 | **12 actions · 12 credits · 1.00** | 12 actions · 5 credits · **2.40** |
| **THE WHOLE ROOM** | 16 | 4 / 12 | **16 actions · 16 credits · 1.00** | 16 actions · 8 credits · **2.00** |

- **The taught line is exactly one action per credit, at every bench size.** That is an accident of nothing: a card spends `SMALL + BIG = cap` parts, the tray returns 2 of them, so it takes `cap − 2` carries and 2 fixes — **`cap` actions for `cap` credits**, on every tier (A5).
- **The flat line is twice the work per credit wherever both costs are even** (2.00 on the 8 and 16 benches) **and 2.40 on the odd bench** (12), because half of an odd cost rounds down — 9//2 = 4 and 3//2 = 1, so 5 credits for 12 actions.
- **Published band: 0.43 to 2.40 player actions per credit**, over 24 machine-checked lines (3 benches × 5 power states, 3 flat lines, and 6 exhaustive best-cycle searches). The floor, 0.43, is a **deliberate** line: on the 16 bench with both carry powers, skipping one doubling costs 2 credits and saves a whole action (6 actions / 14 credits). In credits per action that is **0.42 to 2.33**.

### 5.2 The arithmetic, spelled out (THE FRONT TABLE)

```
BENCH         8        SMALL 2 (1 CR, 2 if the bench clears)     BIG 6 (3 CR, 6 if it clears)
STOCK         +1 part an action (F1 r1 up to 2, r2 up to 3); a full bench refuses the rest
FIX           needs bench >= cost; pays `cost` if bench == cost, else `cost//2`;
              bench -= cost; then the return tray: bench += 1
CEILING       SMALL + BIG = BENCH credits a card, with every power on

TAUGHT card from bench 1 (steady):  carry 1 -> 2 · FIX SMALL  CLEAR +2 CR, 2-2+1 = 1
                                    carry 5 -> 6 · FIX BIG    CLEAR +6 CR, 6-6+1 = 1
                                    = 8 actions, 8 credits, back at 1          1.00 act/CR
FLAT card from bench 7 (steady):    carry 1 -> 8 · FIX BIG    bench 2, NOT clear +3 CR, 2+1 = 3
                                    carry 5 -> 8 · FIX SMALL  bench 6, NOT clear +1 CR, 6+1 = 7
                                    = 8 actions, 4 credits, back at 7          2.00 act/CR
FIRST card from empty:              carry 2 -> 2 · FIX SMALL CLEAR +2 · carry 5 -> 6 · FIX BIG CLEAR +6
                                    = 9 actions, 8 credits, ends at 1
```

### 5.3 The worst-case grind

The finite price list is **146 credits** (F4 6 + F1 r1 12 + BENCH 2 16 + F2 22 + F1 r2 34 + BENCH 3 56).

- From the **taught line** (8 credits a card, 8 actions): **18.2 cards ≈ 146 actions** to own everything.
- From the **flat line** (4 credits a card, 8 actions): **36.5 cards ≈ 292 actions** — twice the work for the same list, and nothing is lost by playing badly except actions.
- After the list is exhausted, **THE NOTICEBOARD (3 CR, unbounded)** and **F3 THE CLAMP (2 CR a use, unbounded)** take everything a player cares to spend. **No unit is created that no sink can consume.**

### 5.4 The lockout test (L1 in one line of arithmetic)

| Starting state | What it costs | What it pays |
| --- | --- | --- |
| **0 parts, 0 credits** (an empty save) | 2 carries + 1 fix = **3 actions** | **2 credits**, bench 1 |

- **STOCK costs no units and has no gate, no cap and no cooldown** — a player at zero parts can always carry parts.
- **The SMALL job is 2 parts on the smallest bench**, so the first credits are always three actions away.
- **Therefore no sequence of play can make the loop unplayable.** That is a wiring requirement in the build notes, not a hope.

### 5.5 Is the taught line the best line? (searched, not asserted by hand)

`checks.py` §[10] searches **every closed cycle of cards** in the state graph (a parametric shortest-path search for the minimum actions-per-credit cycle). With **no powers**, the best possible cycle is exactly the taught line's rate on all three benches — 1.00. With every carry power on it is 0.50 / 0.50 / **0.43**, and the taught line is 0.50 / 0.50 / 0.44: on the 16 bench a player who deliberately carries 3 onto a bench that needs 4 forfeits the SMALL doubling, saves an action and comes out **0.01 ahead**. That is published rather than hidden — it pays 14 of the 16 credits, and **the ceiling does not move either way**.

---

## 6. Sinks

| Sink | Price | Cap | What it returns to the player |
| --- | --- | --- | --- |
| **FIX SMALL** | 2 / 3 / 4 parts | once per card | `cost` credits if the bench clears, `cost//2` if not, **+1 part back on the tray** — the loop's own input |
| **FIX BIG** | 6 / 9 / 12 parts | once per card | the same, three times the size |
| **LEND A KIT** | **8 parts** | **unbounded** | a lendable kit goes out with a borrower; a badge every 10. The unbounded **part** sink |
| **THE NOTICEBOARD** | **3 CR** | **unbounded** | one more card pinned up in the cafe; a badge every 10. The unbounded **credit** sink |
| **F3 THE CLAMP** | **2 CR per use** | **unbounded** | one fix that costs no action (1 action saved). A credit sink that buys time, never a payout |
| **The cafe's price list** | 6 / 12 / 16 / 22 / 34 / 56 CR | one-off | THE BACK BENCH, THE WHOLE ROOM, F1 r1, F1 r2, F2, F4 — **146 CR finite** |

Every faucet has a sink able to absorb it and **every unit has an unbounded one**: parts → the fixes and LEND A KIT; credits → the price list, the noticeboard and the clamp. None expires, and none is a countdown.

### The price list (L10)

| Row | Cost (credits only) | What opens | Designed time (competent) | Advertised as |
| --- | --- | --- | --- | --- |
| **F4 THE FAULT BOOK** | **6 CR** | prints the bench, the carries to reach a cost, and what each fix will pay before you commit | **card 1, 9 actions** | earned tool (zero units) |
| **F1 THE SPARES CART rank 1** | **12 CR** | one carry moves 2 parts: a front-table card goes from 8 actions to 6 | card 2, 17 actions | earned tool |
| **THE BACK BENCH** | **16 CR** | bench 8 → 12: jobs 3 and 9, ceiling 12 credits a card | card 2, 17 actions | free content |
| **F2 THE RETURN TRAY** | **22 CR** | every fix returns 2 parts instead of 1 | card 3, 25 actions | earned tool |
| **F1 THE SPARES CART rank 2** | **34 CR** | one carry moves 3 parts (**MAX rank**) | card 5, 41 actions | earned tool |
| **THE WHOLE ROOM** | **56 CR** | bench 16: jobs 4 and 12, ceiling 16 credits a card | card 7, 57 actions | free content |
| THE NOTICEBOARD | 3 CR each | a card pinned up, badge every 10 | immediate | earned cosmetic (unbounded) |
| F3 THE CLAMP | 2 CR a use | one fix that costs no action | immediate | earned sink |
| LEND A KIT | 8 parts each | a kit out on loan, badge every 10 | immediate | earned cosmetic (unbounded) |

**Finite total: 146 credits.** No row is a trap: the taught line pays **1.00 action per credit on every bench**, so a bigger bench never makes a card slower per credit — the ladder is about *size and decision space*, not rate. All times are **designed, not measured**.

---

## 7. Adoption form

```
THE GAMING LAYER — INCORPORATION FORM                    Form version: v0.1
==========================================================================
GAME  Repair Cafe / Library of Things ("Lend & Mend")   BUILD/DATE  design only / 2026-10-10
STUDIO  (sample) two-person indie     SIZE  2      CONTACT  (sample)
GENRE  repair cafe + tool library sim, fictional      PLAY UNIT  one card (two jobs)
```

### PART A — LOOP SUMMARY

**A1 — Units**

| Symbol | Name | Lives where | Faucet | Sink |
| --- | --- | --- | --- | --- |
| **PT** | Part | persistent stock (the bench) | **STOCK**: up to `gain` an action, free and unlimited (F1: 2 / 3), never past capacity; **+1 per fix** on the tray (F2: +2) | a job's cost (2/3/4 or 6/9/12); **LEND A KIT 8** (unbounded); capacity refusal creates nothing |
| **CR** | Credit | persistent meta | a fix: **`cost` if the bench cleared, `cost//2` if not** | the price list (146 finite); **THE NOTICEBOARD 3** (unbounded); **F3 2 a use** |
| **the card** | which jobs are still open | the save, mid-card | — | — |
| **CLEAR** | a state of the bench | re-checked at every fix, never banked | — | — |

**A2 — Inputs.** Player actions (the only non-renewable input); the decision at each fix (how many parts to carry); **seed capital** = THE FRONT TABLE (bench 8), 0 parts, 0 credits, cart +1, no powers — enough to reach the first credits in 3 actions.

**A3 — Transformation.** Published, deterministic, bounded, legible; **no random number anywhere.**

```
STOCK   bench = bench + k        k <= gain (1 / 2 / 3) and k <= BENCH - bench; the player picks k
FIX     enabled iff bench >= cost        cost = SMALL 2/3/4, BIG 6/9/12
        credits += cost if bench == cost else cost // 2      (CLEAR is read BEFORE the spend)
        bench    = bench - cost + 1                          (F2: + 2)
CARD    when both jobs are fixed, a new card is posted with the same two jobs
CEILING SMALL + BIG = BENCH credits a card     8 / 12 / 16, with every power on
```

**A4 — Faucets.** STOCK: parts, up to `gain` an action, free, unlimited, no gate. FIX: credits, `cost` if the bench cleared / `cost//2` if not, once per job per card, ceiling `cap` a card. No clock, no cooldown, no daily, no purchasable acceleration.

**A5 — Sinks.** See §6. Every faucet runs into a sink and every unit has an unbounded one.

**A6 — Reinvestment, in-loop.** **Every fix returns 1 part.** Per closed card: `created = spent − 2`, exactly, on every bench and power state (A4). The loop's output is its own input, and the sink that pays the player (a fix) is also the sink that restocks.

**A7 — Reinvestment, meta.** Credits buy the cafe's kit (a bigger bench, a bigger cart, a faster tray, a fault book). New rooms add **decisions**, not rates: the taught line is 1.00 act/CR on all three. Free card submissions are published with credit and become free content; credits are never sold.

**C-conditions: C1 [x] C2 [x] C3 [x] C4 [x] C5 [x]**

**Balance arithmetic.** Taught 1.00 act/CR, flat 2.00 (2.40 on the odd bench), band **0.43–2.40** over 24 machine-checked lines; parts conserved exactly per card; credits capped at the bench's size. **Posted at** `/repair-cafe` (the in-game LOOP panel) **and** `/layer`.

### PART B — EXIT PATH

- **B1 — Save and offline play.** `localStorage["lendmend.save.v1"]`, one JSON object: `pt`, `cr`, `crEarned`, `room`, `card` (`{small: bool, big: bool}`), `cart`, `tray`, `book`, `boards`, `kits`, `badges`, `trades`, `stats`, `saveVersion`. **Fully playable offline, yes** — no network request of any kind.
- **B2 — Export.** **EXPORT SAVE** downloads `lendmend-save.json`:

  ```
  { saveVersion, pt, cr, crEarned, room, card:{small,big}, cart, tray, book,
    boards, kits, badges:[], trades:{electrical,textile,wood},
    stats:{cards, jobs, clears, carries, carried, kitsLent, clampUses} }
  ```

- **B3 — If the studio closes something.** Rooms, powers and counters are numbers in the save; retiring one changes nothing about what the player holds, and the export keeps them. No live service, no login, no key.
- **B4 — Deletion.** No account, no server record, no analytics identifier, no personal data beyond an optional display name on a submitted card. **RESET SAVE** (double confirm) deletes everything immediately; any future account feature completes deletion inside **30 days**.
- **B5 — Offline decay: none, and no offline process at all. THE CARD WAITS.** *The fiction and the compliance sentence are the same text:*

  > The cafe posts a card and waits. **Close the tab and nothing changes — not one number** — until you come back and pick up the cart. A job waits for ever at its full published price: no freshness penalty, no "the borrower never came back", no absence mail, no streak, no daily, no cooldown anywhere in the game.

  Mechanically the build has **no `setInterval`, no state-changing `setTimeout`, no `Date.now()` comparison and no catch-up calculation**; `pt`, `card` and `cr` are written when a key is pressed. Scarcity comes only from published **capacities** (the bench's size; one fix per job per card).

### PART C — PER-RULE PASS/FAIL

```
L1  Free entrance ............. PASS  Fresh save = THE FRONT TABLE + 0 parts + 0 credits; STOCK is
   free, ungated and unlimited, so 3 actions from nothing pay the first 2 credits.
L2  Free exit ................. PASS  Nothing decays and nothing is lost on exit; the card waits for
   ever; no mail, no streak, no daily; a half-fixed card survives.
L3  No locked value ........... PASS  One local JSON object; export button; offline playable.
L4  Data portability + delete . PASS  Documented export schema; one-button delete; 30 days.
L5  No pay-to-win ............. PASS  No store, no payment path; credits are the only price and come
   only from fixes; credits per card identical in every power state (A2).
L6  No pay-to-skip ............ PASS  No purchase exists; no power carries, fixes or pays for the
   player; F1/F2 move the carry cost, F3 sells one action, F4 only prints published numbers.
L7  No injected ads ........... PASS  No ad SDK, no sponsor inside play, nothing auto-plays.
L8  No scarcity/FOMO/gambling . PASS  Zero random variables; no clock anywhere; every limit is a
   capacity or a count of actions; nothing is for sale.
L9  Cosmetics only ............ PASS  Badges, noticeboard cards and trade counts are earned only.
L10 Earned-only progression ... PASS  Price list published above with designed times; every row is
   credit-only; THE WHOLE ROOM at 56 CR = card 7, 57 actions.
L11 Reinvestment report ....... PASS  Quarterly commitment; no revenue yet, so no report exists.
L12 Player voice .............. PASS  Poll + open thread before any paid release; none yet.
L13 Conflict isolated ......... PASS (N/A)  No combat, no opponent, no being; nothing destroyed.
L14 Data & API boundary ....... PASS  Nothing leaves the device; no analytics, no third party.
L15 Honest claims ............. PASS  Claims list in Part E; no real-repair or real-skills claim.
```

### PART D — REVENUE AND VOICE

- **D1 — Revenue models in use (only §3.4).** Base game **free**, loop complete, nothing sold inside it (the free branch is chosen deliberately: the owner's open Q3 in the spec's §7 is unresolved, so this form takes the branch that cannot fail). **Optional paid expansion "THE BACK ROOM"** — new rooms, new job types, new bench art; **geometry and decisions, no power, no number, no shortcut** (every room keeps the 1.00 act/CR taught line). **Voluntary patron tier** — the same game everyone has, plus development notes, credits and L9-safe cosmetics; cancelling costs nothing. **Funded pilots** with studios, educators or public bodies — a classroom adaptation about batch sizes and ceilings, disclosed under L11. **Optional educational material** — "Why a ceiling you can see beats a number you cannot", a one-page sheet. Content, not power.
- **D2 — Excluded on purpose.** Advertisements and any rewarded ad. Loot boxes, gacha, spin wheels, any purchase of a chance. **Power of any kind — and this game's list is specific: a bigger bench, an extra credit per fix, a free fix, a purchased carry, extra parts, a head start in any room, or a purchased credit.** Shortcuts and instant unlocks. Paid exclusivity or paid entrance. Sale, sharing or trade of player data. **Any conversion of PT or CR into money or into anything outside the game** — no wallet, no token, no NFT, no chain, no exchange.
- **D3 — Monetisation change log.** `/layer/monetisation-log`.
- **D4 — Consultation.** In-game poll plus an open thread before any paid release or price change; both the players' answer and the studio's decision published side by side, including "we went against the majority". **Last consultation: none yet** — nothing has been sold and no price has been set.
- **D5 — Reporting cadence.** **Quarterly** (inside L11's six months). Latest report: **none yet** — no revenue has been taken. The first is due within three months of the first euro and will state a real number, even a tiny one.

### PART E — CLAIMS AND SIGN-OFF

**E1 — Public claims (each checkable in the game this week).**

1. "A fix that leaves the bench empty pays its full parts count in credits; leave a part over and it pays half — the whole game is that one decision." **[in-game verifiable]** — fix the big job at bench 6/8 and read `+6`; fix it at 7/8 and read `+3`.
2. "A card pays at most the bench's size in credits, and no course can make it pay more." **[in-game verifiable]** — buy every row and fix the same card for the same 8 credits.
3. "Carrying costs nothing and is never gated, so no player can be locked out: the first credits are three actions away." **[in-game verifiable]** — start from an empty save, carry twice, fix the small job.
4. "The card waits. Nothing in this game happens while you are not pressing a key." **[in-game verifiable]** — export the save, close the tab mid-card, reopen, compare `pt`, `card` and `cr`: not one number moved.
5. "Your save is a file you can export, and every number in the HUD is in it." **[in-game verifiable]** — press EXPORT SAVE; a text editor opens it.

**E2 — Claims intentionally NOT made.** No real-world income, no universal basic income, no health outcome, no environmental outcome from play, no real repair service, no real tool lending, no accredited skill or qualification: **confirmed yes.**

> **Guardrail note for this game specifically.** A repair cafe and a library of things are real, familiar things, so the copy writes itself and every sentence of it would be a claim this game cannot keep. The following sentences **must not be written anywhere**, in-game, in store copy, in a pitch or on the site: "learn to repair", "teaches real repair skills", "a repair course", "cuts your repair bills", "saves you money on replacements", "keeps e-waste out of landfill", "reduces waste / emissions / carbon", "extends the life of real products", "builds community", "supports the right to repair", "trains volunteers", "circular economy", "regenerative", "the loop models a real repair cafe", and anything implying a part, a credit or a badge is a real object, a real hour or a measured quantity. Educational **intent** may be described only with "may" or "intend". **The counters measure the save file and nothing else** — a card of 8 credits is eight numbers in a JSON object, and the start screen says so. The words **"regenerative"** and **"circular"** stay held back pending the owner's open question 5 (what the owner's other businesses already claim). Real repair involves diagnosis, parts sourcing, safety, testing and liability; **this game models an action count**, and says so.

**E3 — Signed (sample)** .................... Date 2026-10-10

---

## 8. Open questions for the owner

1. **Name.** The public name in the owner's order is "Repair Cafe / Library of Things"; the working title in the game is **"LEND & MEND"**. Which goes on the page? My recommendation: "Lend & Mend" as the game, "Repair Cafe / Library of Things" as the folder and the route.
2. **Is the card simple enough?** The owner's bar is that the loop reads from the first screen. It reads in one line — *carry only what the job needs; a fix that leaves the bench empty pays full* — with **two jobs and one state (CLEAR)**. The simpler alternative is **one job a card**, which is easier to read and loses the "carry once for both jobs" temptation entirely (and, with the tray return, collapses to one dominant line). I have kept two jobs; I would like the owner's ruling before a studio copies it.
3. **Powers reading (spec §7 Q6).** With every carry power on, a card still pays exactly 8 / 12 / 16 credits and the ceiling is the bench's size. **Explicit confirmation wanted** before studios copy the pattern.
4. **F3 THE CLAMP is a repeatable sink that buys an action with credits** (2 CR for one free fix-action). Its ceiling contribution is exactly zero and it makes the rate worse on purpose. It wants the proposed v0.2 rule: *a repeatable in-game sink may sell a second attempt at a required action, never the completion of one, and never a change to a published payout.*
5. **Arc length.** The whole price list is 146 credits and about **18 cards / 146 actions** — a short demo arc (designed: 5–8 minutes). Should prices rise ~1.5× for a longer first session, or is a short, complete arc the right shape for a sample?
6. **The 0.01 gap.** With both carry powers on the 16 bench, a player who deliberately forfeits one doubling is 0.01 actions-per-credit ahead of the taught line (6 actions / 14 credits vs 7 / 16). It is published, it pays 2 credits less, and the ceiling does not move — but it is the first sample where the taught line is **not** provably the best cycle. Is that acceptable, or should the design be tightened (e.g. costs that are always multiples of the biggest cart) so the taught line is exactly optimal?
7. **The headline claim.** "A card pays at most the bench's size, and no course can make it pay more" is the strongest checkable claim in the layer so far. Is it worth putting on the page as the game's own sentence?
8. **A third job?** A "rush job" (smaller, only fixable on a bench that will not clear) is the obvious next piece of content. It is deliberately **not** in v0.1: it adds a second state and would make the published band a range of strategies rather than named lines.
9. **L13 needs no ruling** — there is no conflict of any kind in this game.

---

## BUILD NOTES FOR THE ENGINEER

One route file `src/routes/repair-cafe.tsx`, same shape as `bin-runner.tsx`, `brick-break.tsx`, `paper-airplane.tsx`, `compost-to-soil.tsx` and `local-energy.tsx`: `createFileRoute`, meta in localStorage, phases `start | cafe | book`, keyboard + pointer input, no backend, no accounts, no network. A 320×240 logical canvas scaled with `image-rendering: pixelated`; panels around it plain DOM.

### Constants to wire (copy these, do not re-derive)

```ts
const SAVE_KEY = "lendmend.save.v1";

const ROOM = {                                    // the bench, by tier
  1: { name: "THE FRONT TABLE", bench: 8,  cost: 0  },
  2: { name: "THE BACK BENCH",  bench: 12, cost: 16 },
  3: { name: "THE WHOLE ROOM",  bench: 16, cost: 56 },
};
const SMALL_OF = (bench: number) => bench / 4;        // 2 / 3 / 4
const BIG_OF   = (bench: number) => (3 * bench) / 4;  // 6 / 9 / 12
const TRAY_RETURN = [1, 2];        // parts back per fix, by F2
const CART_GAIN   = [1, 2, 3];     // parts one STOCK action may carry, by F1 rank
const FIX_CR      = (cost: number, clear: boolean) => (clear ? cost : Math.floor(cost / 2));
const F1_COST     = [0, 12, 34];   // by rank; 2 ranks MAX
const F2_COST     = 22;            // F2 THE RETURN TRAY, 1 rank MAX
const F4_COST     = 6;             // F4 THE FAULT BOOK, 1 rank MAX
const F3_COST     = 2;             // CR per use, repeatable
const BOARD_COST  = 3;             // unbounded CR sink
const KIT_PT      = 8;             // unbounded part sink
const BADGE_EVERY = 10;

const SEED = { pt: 0, cr: 0, crEarned: 0, room: 1, card: { small: false, big: false },
               cart: 0, tray: false, book: false, boards: 0, kits: 0, badges: [],
               trades: { electrical: 0, textile: 0, wood: 0 },
               stats: { cards: 0, jobs: 0, clears: 0, carries: 0, carried: 0,
                        kitsLent: 0, clampUses: 0 },
               saveVersion: 1 };
```

Derived rules, verbatim:

```ts
const bench = ROOM[room].bench;
// STOCK   : the player chooses k in 1..CART_GAIN[cart], k <= bench - pt;  pt += k
//           (a full bench refuses the rest — refused parts are NOT created)
// FIX     : enabled iff pt >= cost
//           const clear = pt === cost;                 <-- read BEFORE the spend
//           cr += FIX_CR(cost, clear); crEarned += same; stats.clears += clear ? 1 : 0;
//           pt = pt - cost + TRAY_RETURN[tray ? 1 : 0];
//           card[which] = true; if (card.small && card.big) { card = {small:false,big:false}; stats.cards++ }
// F3      : charge 2 CR when pressed; the next FIX this card does not count as an action
// LEND    : enabled iff pt >= KIT_PT; pt -= KIT_PT; kits++
// BOOK    : every row shows price, shortfall, effect and ceiling; F1 stops at rank 2 with "MAX"
```

**There is no other state and no other function.** If a value in the build is not derivable from these lines, it is a bug against this document.

### MUST be implemented end to end

1. **The card ledger line after every action** (this is C1): `STOCK +1 → BENCH 4/8`; `FIX BIG · CLEAR → +6 CR · BENCH 0 · TRAY +1`; on the last fix `CARD CLOSED · 8 ACTIONS · 8 CREDITS · NEW CARD POSTED`.
2. **The CLEAR doubling, read before the spend.** `clear` is `pt === cost` at the instant FIX is pressed, and the button face says which it will be: `FIX BIG · CLEAR +6` or `FIX BIG · +3`.
3. **STOCK free, unlimited, ungated, visible from the first frame**, and a dev assertion that its cost is zero.
4. **The ceiling printed in the HUD**: `CEILING 8 CREDITS A CARD` and, beside it, `NO COURSE RAISES IT`.
5. **Parts are never destroyed by a refusal.** Carrying into a full bench adds only what fits and prints `BENCH FULL — 8/8`.
6. **The card waits**: no tick, no timer, no catch-up. The built file must contain **no `setInterval`, no state-changing `setTimeout`, no `Date.now()` comparison**; a dev check greps its own source for all three and fails if any state change depends on them.
7. **The four powers**: F1 rank 1 → 2 with `MAX`; F2 and F4 as buys; F3 as a 2-CR per-use charge taken only when pressed.
8. **The two unbounded sinks are real spends**: THE NOTICEBOARD 3 CR, LEND A KIT 8 parts, badge every 10.
9. **The book panel** lists the six rows in price order with effect and ceiling lines, and the note **`NO ROW IS A TRAP — EVERY BENCH PAYS 1.00 ACTION PER CREDIT`**.
10. **EXPORT SAVE** → `lendmend-save.json` including the open `card`; **RESET** with double confirm.
11. **The LOOP panel** publishing this document's arithmetic: the bench table (jobs, cost, credits, ceiling), the two published lines (1.00 and 2.00/2.40 act/CR), the powers table with cost/effect/ceiling, the conservation line (`CREATED = SPENT − 2`), the price list, and the two sentences **"the card waits — no number here changes while this tab is closed"** and **"nothing here converts to money; no purchases exist in this game"**.
12. **Start screen in five lines**: `CARRYING IS FREE AND UNLIMITED · FIX THE SMALL JOB AND THE BIG JOB · A FIX THAT LEAVES THE BENCH EMPTY PAYS FULL · THE CARD WAITS FOR EVER — NOT ONE NUMBER MOVES WHILE YOU ARE AWAY · 16 CREDITS OPENS THE BACK BENCH`. Plus the honest line: `A CARD IS EIGHT NUMBERS IN A SAVE FILE. NOTHING HERE IS A REAL REPAIR.`
13. **Offline: no network call of any kind anywhere in the file.**

### Geometry (320×240 logical field)

- Five colours: bench oak `#6b4a2a`, crate grey `#3a4048`, tray tin `#9aa4ae`, card cream `#efe6d2`, badge brass `#c8a040`.
- **HUD**, two 8-px lines: `y 0–10` = `FRONT TABLE · BENCH 4/8 · CLEAR? NO · CEILING 8`; `y 11–20` = `PARTS 4 · CREDITS 18 · BOARDS 2`.
- **The bench**, x 6–152, y 22–150: `bench` 10×14 px slots in rows of six, filled oak-brown as parts are carried, with a **CLEAR banner** across the top when `pt === the next job's cost` (the state must be readable without a number). Beside it the crate and `[C] CARRY`.
- **The card**, x 160–312, y 22–110: the card as a paper panel with two ruled lines — `SMALL · 2 PARTS · PAYS 1 (2 IF CLEAR)` and `BIG · 6 PARTS · PAYS 3 (6 IF CLEAR)` — each struck through as it is fixed, with its `[1]` / `[2]` button showing the live price and whether it is CLEAR.
- **The cafe**, x 160–312, y 114–176: the noticeboard and the kit shelf; the two unbounded sinks live here.
- **The action bar**, y 180–204: `[C] CARRY`, `[1] FIX SMALL`, `[2] FIX BIG`, `[F3] CLAMP 2 CR`, `[S] BOOK`, `[L] LOOP`, `[X] EXPORT`.
- data-testids: `carry-btn`, `fix-small`, `fix-big`, `bench-value`, `bench-clear`, `credits-value`, `card-small-state`, `card-big-state`, `card-ledger`, `use-clamp`, `buy-f1`, `buy-f1-2`, `buy-f2`, `buy-f4`, `buy-room-2`, `buy-room-3`, `lend-kit`, `noticeboard`, `go-book`, `go-loop`, `export-save-start`, `reset-save`, `loop-panel`, `book-panel`.

### MAY be display-only

Cafe art, noticeboard art, badge lists, the trade counters, and the fault book's panel line (the HUD already prints the bench and the buttons already print CLEAR) — but the **spends** must be real and the **CLEAR state** must be readable.

### Arithmetic and mechanics I simplified, and why

1. **Two jobs a card, always the same two sizes.** A published card is legible at a glance and makes the ceiling a sum (`SMALL + BIG = bench`) rather than a tuning knob.
2. **The tray return is a flat 1 part per fix**, not a fraction of the job. A fraction made the loop efficient enough that the taught line fell below one action per credit; a flat 1 keeps the headline **1.00** exact at every bench size (A5) and is a single published integer.
3. **Parts are created only by STOCK**, never by a fix — so conservation is exact and checkable to the unit (A4), and no faucet is hidden inside a fix.
4. **The cart carries "up to" its gain and the player picks the count.** Without that, a 3-part cart could not land on a 2-part job and the power would *reduce* the player's credits — which would break the owner's powers reading. With it, F1 is monotone (A3).
5. **F1 and F2 move actions; nothing moves credits** (A2). This is the owner's powers reading, machine-checked.
6. **F3 deliberately makes the rate worse** (2 credits for 1 action): it is a sink for finished players, not an accelerator, and its ceiling contribution is zero.
7. **No wear, no faults to diagnose, no random breakage, no queue of customers.** Each would be a second variable, and a second variable would make the published band unfalsifiable. This game has **one** state (CLEAR) and **one** decision (how much to carry).
8. **The first card is longer than the rest** (9 actions from an empty bench, then 8). That is the tutorial: it teaches that carrying costs actions, and it costs nothing but actions.
9. **No unlock is a trap.** Because the taught line is 1.00 act/CR on every bench, a bigger bench never lowers the rate. The price list therefore needs no warning banner.

### Tensions I want the lead to see

1. **Two jobs is one rule more than the simplest possible loop.** The owner's bar is "readable from the first screen", and one job a card would be simpler — but with the tray return it collapses to a single dominant line, which removes the only decision. **I have kept two jobs and flagged it as open question 2** rather than deciding for the owner.
2. **The taught line is not provably optimal in one corner** (open question 6): with both carry powers on the 16 bench, forfeiting one doubling is 0.01 ahead. It is published, it pays 2 credits less, and the ceiling does not move — but it is the first sample where a reader can find a better line than the one we teach.
3. **L15 is dangerous here for a new reason**: a repair cafe is a real institution, and "learn to repair", "cut your bills" and "keep e-waste out of landfill" write themselves. The guardrail under E2 should be carried into the site page verbatim, not summarised.
4. **The arc is short** (146 credits, ~18 cards, ~146 actions, designed 5–8 minutes). That is honest for a demo and flagged as open question 5.
5. **"Knowledge & skills" is carried by the rule and the fault book, not by a skill tree.** That is deliberate — a skill tree would be progression that changes what the game pays, which the layer forbids — but a reader expecting a tech tree should be told plainly, in §0.3, where the knowledge actually is.
6. **Every time in this document is designed, not measured.** L10's violation test asks for a real player who reached the last row; no such player exists yet.

---

## APPENDIX — the machine-checked sums (transcript excerpt)

`python3 checks.py` ends with every assert green (12 checks).

```
[3] THE PUBLISHED LINES — one CARD, steady state, no powers
TAUGHT  tier 1 (carry only what the job needs)     8    8    1.00          1
FLAT    tier 1 (fill the bench every time)         8    4    2.00          3
TAUGHT  tier 2                                    12   12    1.00          1
FLAT    tier 2                                    12    5    2.40          4
TAUGHT  tier 3                                    16   16    1.00          1
FLAT    tier 3                                    16    8    2.00          5

[4] WITH / WITHOUT THE POWERS — the taught line, one CARD in steady state
no powers                                           8a/8c 1.00    12a/12c 1.00    16a/16c 1.00
F1 THE SPARES CART rank 1                           6a/8c 0.75     7a/12c 0.58    10a/16c 0.62
F1 THE SPARES CART rank 2                           5a/8c 0.62     6a/12c 0.50     7a/16c 0.44
F2 THE RETURN TRAY                                  6a/8c 0.75    10a/12c 0.83    14a/16c 0.88
F1 rank 2 + F2                                      4a/8c 0.50     6a/12c 0.50     7a/16c 0.44

[5] BAND: 0.43 to 2.40 actions per credit (0.42 to 2.33 credits per action), 24 lines

[6] CONSERVATION — created = spent - 2 (F2: - 4), every closed card, every bench, every power state
tier 1 taught 6 = 8 - 2 · tier 2 taught 10 = 12 - 2 · tier 3 taught 14 = 16 - 2
tier 1 F1r2+F2 4 = 8 - 4 · tier 2 F1r2+F2 8 = 12 - 4 · tier 3 F1r2+F2 12 = 16 - 4

[7] LOCKOUT: 2 carries + 1 fix = 3 actions -> first 2 credits, from an empty save

[8] FINITE TABLE 146 CR; taught 18.2 cards / 146 actions; flat 36.5 cards / 292 actions

[9] FIRST-TIME PATH: card 1 = 9 actions, then 8 a card; F4 (6 CR) at card 1 (9 actions),
    F1 r1 (12 CR) and BENCH 2 (16 CR) at card 2 (17 actions), F2 (22 CR) at card 3 (25 actions),
    F1 r2 (34 CR) at card 5 (41 actions), BENCH 3 (56 CR) at card 7 (57 actions)

[10] BEST POSSIBLE CYCLE: == taught line (1.00) on all three benches with no powers;
     0.50 / 0.50 / 0.43 with both carry powers, against a taught 0.50 / 0.50 / 0.44

[ASSERTS]  ok A1 ceiling = bench size · A2 credits identical in every power state ·
A3 no power costs more than none · A4 parts conserved to the unit · A5 taught 1.00, flat 2.00/2.40 ·
A6 band 0.43..2.40 · A7 no lockout (3 actions) · A8 every fix is paid for ·
A9 F3 adds zero units · A10 finite table 146 CR · A11 the tray is the loop's own input ·
A12 zero random variables — 12 checks, every published number in design.md.
```

---

*End of design. If any number here changes, change it here first, re-run `python3 checks.py`, and re-publish the balance arithmetic, the powers table and the price list — the point of the form is that the published numbers and the built numbers are the same numbers.*
