# PREVENTATIVE HEALTH (working title: **TEND**) — closed-loop design v0.1

**Slug / route:** `/preventative-health`
**Genre:** sim — a single-screen **herb bed sim** (a bed, a bunch, a stall; fictional)
**One-line loop:** plant seedlings in the bed → cut a bunch and sell it → credits buy a bigger bed and better tools → the bed refills and the loop goes round.
**Written by:** game-systems designer, team The Gaming Layer. **Date:** 2026-11-02.
**Status:** design document. **No build exists yet.** No studio is attached. Every rate, price and time estimate below is **designed, not playtested**.
**Conforms to:** `/home/team/shared/layer-spec-v0.1.md` — five closed-loop conditions (C1–C5, §2.3), fifteen rules (L1–L15, §3.1–3.3), five permitted revenue models (§3.4), incorporation form (§4).
**Machine-checked:** every number below is derived and asserted by `./checks.py` (`python3 checks.py`, 13 asserts, ends green). If a number here changes, that script must be re-run and this document re-published — the form's last line is the whole point.
**What it is not:** not ratified by the owner; not a product announcement; not a claim that any studio has adopted anything; and — most of all — **not a claim about real health, real plants, real nutrition, real medicine or real anything** (Part E's guardrail, which is the longest paragraph in this document on purpose).

---

## 0. The game, in one screen

A bed of herbs on a windowsill. The **seed tray** beside it is bottomless and free. The **stall** at the end of the bench takes **bunches**.

**The one decision, and it is on the first screen:**

> **A bunch pays one credit for every plant standing in the bed when you cut it. A bunch takes two plants. So cut from a full bed — and plant before you cut, even though planting pays nothing at all.**

So the whole game is one honest question: *do I spend this action planting, or do I spend it cutting?* Cutting pays immediately and empties the bed. Planting pays nothing and fills it. **A player who cuts the moment two plants stand earns 2 credits for 3 actions; a player who waits for the bed to be full earns 4 credits for the same 3 actions.** Same keys, same bed, twice the rate — and the difference is nothing but patience.

**Play unit:** one **CYCLE** — cut a bunch from the bed, then plant it back up to where it was. The bed waits for ever between actions. Nothing in this game moves while you are not pressing a key.

### 0.1 Why this is not a re-skin of the games already built

| | Bin Runner | Brick Break | Windward | Soil Stack | Kettle Lane | Lend & Mend | **Tend** | Why it differs |
|---|---|---|---|---|---|---|---|---|
| Skilled input | classification (item → chute) | spatial (angle the ram) | fold choice + release timing | the heap's green/brown composition | when to spend actions charging vs answering | sizing a batch of parts | **patience: spending an action that pays nothing now** | the first sample whose mistake is **impatience** — every other one's mistake is mis-sizing |
| Run bound | 90-second wall clock | swing + the wall | the landing | the bin + ripeness | two calls a sheet | the card: two jobs | **the bed cycle** — cut, refill, cut | the bound is a rhythm, not a list or a clock |
| Transformation | item → materials | ram → brick → cart | sheet → fold → landing grade | loads → heat → ripeness → soil | charge → a call answered → tallies | carry → fix → credits | **plants → a bunch → credits**, where the payout is a lookup on the bed **at the instant of the cut** | the paying state is a stock you must **not** let fall, and it falls by *you* acting |
| Faucet shape | per action | per brick type | per landing grade | per empty | per call, doubled if FULL | per fix: `cost` if the bench cleared | **per cut: one credit per plant standing, capped by the bed's size** | the payout is linear in the bed's state — no doubling, no lookup table |
| Meta | Stamp | Seal | Medallion | Mark | Tally | Credit | **CR — Credit** | different fiction, different earn condition |
| In-run reinvestment | recycler / offcut | dust patches the cart | mill waste heat | coarse fraction | +1 charge per answer | +1 part per fix | **PLANT restocks the bed, free, for an action** | the restocking faucet and the paying sink are the two halves of one verb-pair |
| Sink that returns | bench tiers | reclaim wall | baling order | the beds | the calls themselves | the FIX itself | **the CUT itself** (plants → credits) | the paying sink is also the one that empties the bed |
| Randomness | none | none | one disclosed gust | none | none | none | **none — zero random variables** | a published integer map end to end |
| Offline | nothing stored | fresh per run | nothing stored | sealed bin | the sheet waits | the card waits | **the bed waits: no clock, no cooldown, no decay** | the owner's turn-only cadence |

### 0.2 Why this is not Kettle Lane, and not Lend & Mend

- **Kettle Lane** (the second sim) is **buying certainty with actions**: charge a battery and a *full* battery doubles the call's payout. Its failure is under-preparation — answer too early and lose half. **Tend has no doubling and no lookup table**: a cut pays one credit per plant standing, so the payout is a straight line, and the failure is not "too early" but **too soon after the last cut** — the player who cannot wait for the bed to fill.
- **Lend & Mend** (the third sim) is **sizing a batch**: the bench must be *exactly* emptied for full pay, so its mistake is over-preparation. Tend's stock must be *full*, not empty, and its mistake costs **rate**, not pay: a thin-bed cut still pays every credit it promises. Nothing in Tend is halved, doubled or refused — the bed simply pays what is standing.
- Shared with both, deliberately: **no clock, no randomness, no money in the transform**, and a faucet ceiling that no power can move.

### 0.3 Where the "preventative" idea lives — and where it deliberately does not

The owner's item is *Preventative Health: herbs & plants sim*. This design takes the **shape** of prevention and leaves the **health claim** outside the door, because L15 forbids the second and this game cannot keep it (Part E2).

Where the idea actually lives, in the mechanics and nowhere else:

1. **Care is an action that pays nothing.** PLANT costs an action and adds zero credits. It is the only action in the game that pays nothing, and it is the one that keeps the payout up. That is the whole of prevention here: *spend before you can see the return*.
2. **The bill for skipping care is a rate, not a fine.** A player who never plants earns 1.00 action per credit on the window box instead of 0.75 — a third more work for the same list, and nothing is taken away. No decay, no blight, no punishment.
3. **The bed's size is the ceiling, and it is published.** A full bed is worth exactly its own size in credits and a cut can never be worth more. The player can read the ceiling off the bed at any moment.

**What is deliberately absent:** no illness, no disease, no cure, no dosage, no patient, no body, no clinic, no nutrition, no named real species (the herbs are **pennyleaf, sunthread and glassmint**, invented for this game), and no word in the game's own copy that describes a health outcome. The word "preventative" belongs to the owner's item label and to this folder; **the game itself is called TEND and is about a bed of plants** (open question 1).

---

## 1. The loop

- **Inputs:** player actions (the only non-renewable input the layer recognises) and the plants standing in the bed, which the player puts there with those actions.
- **Transformation:** **PLANT** turns one action into up to `gain` plants in the bed (never past the bed's size; the player chooses how many). **CUT** takes a **bunch** of 2 plants and pays **1 credit for every plant standing at the instant of the cut** — the payment is read **before** the bunch leaves.
- **Outputs:** **credits**, and a bed that is two plants lighter and therefore worth less next time — which is exactly why the player plants.
- **Reinvestment:** credits buy the bed's **price list** (a bigger bed, a watering can, sharp shears, a plant label, a compost bin), which makes each cut worth more and each refill cheaper in actions. Then the cycle goes round.
- **What is closed:** **PL (plant)** and **CR (credit)** never convert to money, to each other, or to anything outside the save. There is no wallet, no token, no exchange, no chain. Plants are destroyed only by a CUT; credits are destroyed only by the price list, the market stall and the compost bin. Plants refused by a full bed are **never created**, so nothing the player made is thrown away.

```
        actions ──PLANT──▶ PLANTS standing ──CUT──▶ CREDITS ──PRICE LIST──▶ bigger bed
                                  ▲                    │                     │
                                  └── PLANT (free) ────┘                     │
                                  └──── worth more per cut ◀─────────────────┘
```

---

## 2. Currencies

| Code | Name | Earned by | Spent on | Faucet ceiling |
| --- | --- | --- | --- | --- |
| **PL** | **Plant** — what the bed holds | **PLANT**: free and unlimited, up to `gain` plants an action (P1: 2), never past the bed's size; the player may plant fewer | a **CUT**: the bunch is **2 plants** (P2: 1). Also **A BUNDLE FOR THE STALL**, 4 plants, unbounded | the bed's size: **4 / 6 / 8** — refused above it, and refusal creates nothing |
| **CR** | **Credit** — into the stall's takings | a cut: **1 credit per plant standing at the cut** | the bed's price list (113 CR finite), **THE MARKET STALL** 3 CR (unbounded), **P4 THE COMPOST BIN** 5 CR a use | **the bed's size per cut: 4 / 6 / 8** — and no power can add a credit |

**The π scale (a shared Pierce Collabs convention, display only).** Every credit figure the player sees is also shown on the layer's π scale, `floor(units × 10π)` — 1 → 31, 4 → 125, 10 → 314, 100 → 3141, 1000 → 31415. The loop's unit stays a **whole integer**: earn rates, prices and conservation are all integers and do not move by π. This is the only place the layer touches π and it never converts a loop unit into money (`checks.py` §[11], A13).

Not currencies, and deliberately not units: **the bed** (a capacity, bought with credits), **the seed tray** (an unlimited supply, not stock), **the bunch** (a rule — two plants — not a pile), **the stall** (a sink, not a wallet), **badges** (cosmetic records, earned only), **the label** (a print-out, not stock).

---

## 3. Rules against the layer spec (L1–L15)

| Rule | How this game complies | Violation test (a stranger can run it) |
| --- | --- | --- |
| **L1 free entrance** | Free build, no store, no account, no ad view. A fresh save is **THE WINDOW BOX (bed 4), 0 plants, 0 credits, no tools**. PLANT costs nothing, is never gated and is unlimited, so from absolutely nothing **3 actions** (2 plants + 1 cut) pay the first **2 credits** — machine-derived in `checks.py` §[7]. | Start a fresh save with no account and no purchase. Play to your first credits: **3 actions**, no paywall, no trial screen, no locked action. |
| **L2 free exit** | Close the tab at any moment — mid-refill, with a bed half planted, with credits unspent. Every unit banks at the press that earned it; the bed waits for ever at the same state. **No clock, no cooldown, no decay, no absence mail, no streak, no daily.** Plants refused by a full bed are not a loss: they were never created. | Note plants, credits and the bed's state; close for 30 days (or set the clock forward); return. Every number is where you left it and nothing costs anything to recover. Check the mailbox: nothing was sent. |
| **L3 no locked value** | Everything earned is in one local JSON object: `pl`, `cr`, `crEarned`, `room`, `can`, `shears`, `label`, `stall`, `bundles`, `badges`, `stats`, `saveVersion`. Playable with no network; exports to a file. | Aeroplane mode: open the export and the game. Everything you hold is there and usable, including a half-planted bed. |
| **L4 data portability + deletion** | **EXPORT SAVE** on the start screen and in the bed view downloads `tend-save.json` with a documented schema (Build notes). **RESET SAVE** is one button with a double confirm and deletes everything immediately. Any future account feature would complete deletion inside **30 days** — stated before the feature exists. | Click export: a text editor opens the file and every HUD number is in it. Click reset: the save is gone, with no email and no request. |
| **L5 no pay-to-win** | Nothing is for sale and there is no store surface in the build. The bed, all four tools and every room are **credit-only**, credits come only from cuts, and the transform has **no money term**. Credits per cycle are **identical in every power state** (4 / 6 / 8 — asserted, A2). | Two fresh saves, same play time; one buys everything on sale. There is nothing to buy. Compare credits per cycle: identical. |
| **L6 no pay-to-skip** | No purchase exists, and **no tool removes a cut or a plant**: every cycle still needs its plants and its bunch. P1 plants 2 at a time (it does not cut), P2 makes the bunch 1 plant (it does not pay more), P3 only prints numbers this document already publishes, and P4 sells one plant for 5 credits — **more than a plant can ever be worth** (A9). | Play from zero to your first cycle with no purchases; then check whether any item claims to shorten that path. The store does not exist; the bed's list is priced in credits earned by play. |
| **L7 no injected ads** | No ad SDK, no sponsor placement, no pre-roll, no "watch to continue", nothing auto-plays. If a sponsor ever appears it sits on a credits screen, labelled, carrying no reward. | Play 30 minutes and screenshot every 60 s. No ad, no placeholder, no unlabelled branding inside the play surface. |
| **L8 no scarcity / FOMO / gambling** | **Zero random variables**: a cut pays a count, the bunch is a constant, the ceiling is the bed's size. No rotation, no "ends in", no streak, no daily, no expiring bonus. Every limit is a published capacity (the bed's size, the bunch of 2) or a count of player actions. Nothing is for sale, so nothing can be attached to chance. | Look for a clock anywhere: none. Look for a random reward: there is no draw in the code — a stranger can re-run `checks.py` and read `A12`. |
| **L9 cosmetics only** | Cosmetics are **earned** only: a badge every 10 stall listings and every 10 bundles sent, and the credit count in the takings book. No paid cosmetic exists, so no earned/bought confusion is possible. | Sort the visible items into earned and bought without seeing prices: every item is earned, and none is priced in money. |
| **L10 earned-only progression** | The price list is published below; every row is opened by credits, which only cuts produce. Designed times (not measured): P4 at 5 CR and P3 at 6 CR = **cycle 2, 8 actions**; P1 at 12 CR = cycle 3, 11 actions; BED 2 at 16 CR = cycle 4, 14 actions; P2 at 22 CR = cycle 6, 20 actions; BED 3 at 52 CR = **cycle 13, 41 actions**. | Pick the last row (BED 3, 52 CR) and find a path to it without purchases: 13 cycles, 41 actions, machine-derived in `checks.py` §[9]. |
| **L11 reinvestment report** | Quarterly, one page, revenue by source, spend by category, and the excluded list. First report due six months after the first revenue; **no revenue has been taken, so no report exists yet** — a commitment, not a published artefact. | Find the newest report: none exists because there is no revenue. The commitment and the cadence are published here. |
| **L12 player voice** | Mechanism: in-game poll plus an open thread before any paid release or price change, both answers published side by side including disagreement. **Last consultation: none — no paid release exists.** The monetisation log opens with its first real entry rather than a back-dated one. | Ask when players last voted on monetisation and what happened. There is no paid release to have consulted on, and no log entry is invented. |
| **L13 conflict isolated** | **N/A — there is no combat, no opponent, no PvP and no being harmed.** A cut is a harvest, not a fight: the plants leave the bed and the seed tray is unlimited, so nothing is destroyed and nothing is lost. There is no target, no damage and no defeat state. No clarification is being asked for. | Look for a conflict mode: there is none. No unit in the game comes from harm, and a cut cannot fail. |
| **L14 data & API boundary** | Nothing leaves the device: no analytics, no identifiers, no third party, no network call. The only personal datum that could exist is an optional display name on a submitted bed layout, chosen by the player and deletable with the save. | Read the privacy block: no advertising identifier, no analytics SDK, no "partners". Turn every consent off: the game is fully playable. |
| **L15 honest claims** | Claims list in Part E, each in-game verifiable. **No claim about real health, real plants, real nutrition, real medicine, real wellbeing or real outcomes of any kind is made anywhere** — see the guardrail under E2, which is the longest paragraph in this document. The loop is fictional and deliberately simplified: the bed is 4 to 8 integer slots. | Take each marketing sentence and ask "could a stranger verify this in the game this week?" Anything about health, plants, diet, medicine, stress or wellbeing is a fail, and this design makes none. |

### The five closed-loop conditions

- **C1 legibility — [x].** One sentence: *a bunch pays one credit per plant standing, so cut from a full bed.* The bed ledger prints every action (`PLANT +1 → BED 3/4`, `CUT · 4 STANDING · BUNCH 2 → +4 CR · BED 2`).
- **C2 conservation — [x].** Per closed cycle, **plants planted = plants cut + (end bed − start bed)**, exactly, on every room and every power state (`checks.py` §[6], A4). Credits are capped structurally at the bed's size per cut (A1) and every credit has a sink (the price list, the stall, the compost bin).
- **C3 no money in the transform — [x].** There is no payment path, no store and no money term. The only way to change any number is an action.
- **C4 recyclability — [x].** The output of a cut (an emptier bed) is the input of the next plant, and PLANT costs no credits at all: the loop restocks itself out of the seed tray. Point at it on screen: `PLANT` beside every cut, free.
- **C5 exit integrity — [x].** Local save, export button, immediate delete, no offline process. A half-planted bed survives closing the tab unchanged.

---

## 4. Earned powers

Four tools, all bought with **credits**, which only cuts produce. The design's rule is one sentence:

> **Powers in this game move actions, never payouts.** A cut pays one credit per plant standing, capped by the bed's size — **no tool, rank or room can add one credit to any cut** (machine-checked: A1, A2).

| Power | Cost / condition | What it lets the player DO | Why it is not a payout |
| --- | --- | --- | --- |
| **P1 THE WATERING CAN** | **12 CR**, 1 rank, ever | One PLANT action puts **up to 2** plants in the bed instead of 1 — the player still chooses the count, so a bigger can never force an overshoot past the bed's size | Plants are an input, not a payout: they still have to be cut, and a cut still pays one credit per plant standing. A taught cycle goes from 3 actions to 2 and **pays the same 4 / 6 / 8 credits** (A2) |
| **P2 THE SHARP SHEARS** | **22 CR**, 1 rank, ever | A bunch takes **1 plant** instead of 2, so the bed empties half as fast and needs half as many plants | The cut still pays the plants standing, capped by the bed. A taught cycle goes from 3 actions to 2 and **pays the same credits** |
| **P3 THE PLANT LABEL** | **6 CR**, 1 rank, ever | The label prints `BED 3/4 · BUNCH 2 · THIS CUT PAYS 3 · A FULL BED WOULD PAY 4` before you commit | Zero units. Every value it prints is already published in this document. It changes what a player can **see**, never what a cut pays |
| **P4 THE COMPOST BIN** | **5 CR per use**, charged only when the use is pressed, repeatable | One plant, immediately, for no action — capped by the bed's size like any other plant | Zero credits. It buys **an input with credits** at 5 CR a plant, and a plant can never be worth more than 4 credits (the best taught rate on the biggest bed), so it makes the rate **worse on purpose** (A9) |

**The with/without arithmetic** (machine-derived, `checks.py` §[4]; `a` = actions, `c` = credits, per taught cycle in steady state):

| Power state | THE WINDOW BOX (4) | THE HERB BED (6) | THE GREENHOUSE (8) |
| --- | --- | --- | --- |
| **no powers** | **3a / 4c · 0.75** | **3a / 6c · 0.50** | **3a / 8c · 0.38** |
| P1 THE WATERING CAN | 2a / 4c · 0.50 | 2a / 6c · 0.33 | 2a / 8c · 0.25 |
| P2 THE SHARP SHEARS | 2a / 4c · 0.50 | 2a / 6c · 0.33 | 2a / 8c · 0.25 |
| P1 + P2 (both) | 2a / 4c · 0.50 | 2a / 6c · 0.33 | 2a / 8c · 0.25 |
| P1 + P2, **two bunches a refill** | 3a / 7c · 0.43 | 3a / 11c · 0.27 | **3a / 15c · 0.20** |

Read the `c` column of the first four rows: **identical in every power state.** With both tools on, a taught cycle costs 2 actions instead of 3 and **still pays exactly 4 / 6 / 8 credits**, against a published ceiling of the bed's size. That is the owner's powers reading — *powers raise what a player can do, never what the game can pay* — made checkable rather than promised.

**The one honest surprise, published rather than hidden (row five).** With **both** tools owned, a player who takes **two bunches before refilling** does better than the taught one-bunch rhythm: 3 actions for 7 credits on the window box (0.43), 3 for 11 (0.27) and 3 for 15 on the greenhouse (0.20), against 0.50 / 0.33 / 0.25 for the taught rhythm. It is the same mechanism as the two cuts, not a bigger payout: each cut still pays the plants standing, capped by the bed's size. `checks.py` §[10] enumerates **every simple cycle in the state graph** and confirms that this two-bunch rhythm is the best one available — and that with no tools, or with either tool alone, the taught rhythm is exactly optimal. It is open question 4.

**Why this cannot become pay-to-win, in the layer's terms.** Credits are produced only by cuts, are never sold, and the build has no store, no account and no payment path. C3's violation test cannot be run against a build with no spending side, and the transform contains no money term.

---

## 5. Balance band

### 5.1 The published lines

A **cycle** is the game's natural period: cut a bunch, plant the bed back to where it was. Three named strategies are published; all of them are machine-simulated to a fixed point (the bed returns to the same level each cycle).

| Room | Bed | TAUGHT line (cut only from a full bed) | THIN line (cut the moment 2 stand) | EMPTY line (cut the bed down, then replant) |
| --- | --- | --- | --- | --- |
| **THE WINDOW BOX** | 4 | **3 actions · 4 credits · 0.75 act/CR** | 3 actions · 2 credits · **1.50** | 6 actions · 6 credits · 1.00 |
| **THE HERB BED** | 6 | **3 actions · 6 credits · 0.50** | 3 actions · 2 credits · **1.50** | 9 actions · 12 credits · 0.75 |
| **THE GREENHOUSE** | 8 | **3 actions · 8 credits · 0.38** | 3 actions · 2 credits · **1.50** | 12 actions · 20 credits · 0.60 |

- **The taught line is always exactly 3 actions for the bed's size in credits.** That is an accident of nothing: a cut takes 2 plants and planting them back takes 2 actions, so a cycle is `2 plants + 1 cut = 3 actions` for `cap` credits — **`cap/3` credits an action on every tier** (A5).
- **The thin line costs the same 3 actions on every room and pays 2 credits**, because the player is cutting a bed of 2 whatever the bed's size — the whole price of impatience, in one row. It is the game's teaching: the mistake costs **rate**, and nothing else.
- **The empty line** drains the bed first and replants from nothing; it pays more than the thin line and less than the taught line, and it is the line a player falls into by never planting until they must.
- **Published band: 0.20 to 1.50 player actions per credit**, over **39 machine-checked lines** (3 rooms × every cut level, 15 lines including the 3 thin-bed ones; 3 empty-bed lines; 9 taught-with-tools lines; 12 exhaustive best-cycle searches). In credits per action that is **0.67 to 5.00**.

### 5.2 The arithmetic, spelled out (THE WINDOW BOX)

```
BED            4        THE WINDOW BOX (6 = THE HERB BED, 8 = THE GREENHOUSE)
BUNCH          2        plants a CUT takes (P2: 1)
PAY            one credit per plant STANDING at the instant of the cut (read before the bunch leaves)
               -> a cut is worth at most the bed's size: 4 / 6 / 8 CR, with every tool on
PLANT          +1 plant an action (P1: up to 2, the player chooses); free, unlimited, ungated;
               a full bed refuses the rest and refused plants are NEVER created
CEILING        the bed's size, per cut: 4 / 6 / 8 credits, and no tool adds one

TAUGHT cycle from a full bed:   CUT (4 standing) -> +4 CR, bed 2
                                PLANT -> 3 · PLANT -> 4
                                = 3 actions, 4 credits, back at 4              0.75 act/CR
THIN cycle (impatience):        PLANT -> 1 · PLANT -> 2 · CUT (2 standing) -> +2 CR, bed 0
                                = 3 actions, 2 credits                         1.50 act/CR
EMPTY cycle:                    CUT 4 -> +4, bed 2 · CUT 2 -> +2, bed 0 · PLANT x4
                                = 6 actions, 6 credits, back at 4              1.00 act/CR
FIRST cycle from an empty bed:  PLANT x4 -> 4 · CUT -> +4 CR, bed 2
                                = 5 actions, 4 credits (the tutorial: the ramp costs 2 extra actions)
```

### 5.3 The worst-case grind

The finite price list is **113 credits** (P4 5 + P3 6 + P1 12 + BED 2 16 + P2 22 + BED 3 52).

- From the **taught line** on the window box (4 credits a cycle, 3 actions): **28.2 cycles ≈ 85 actions** to own everything.
- From the **empty line** (6 credits a cycle, 6 actions): 18.8 cycles ≈ **113 actions**.
- From the **thin line** (2 credits a cycle, 3 actions): 56.5 cycles ≈ **170 actions** — the worst published line, and nothing is lost by playing it except actions.
- After the list is exhausted, **THE MARKET STALL (3 CR, unbounded)**, **A BUNDLE FOR THE STALL (4 plants, unbounded)** and **P4 THE COMPOST BIN (5 CR a use, unbounded)** take everything a player cares to spend. **No unit is created that no sink can consume.**

### 5.4 The lockout test (L1 in one line of arithmetic)

| Starting state | What it costs | What it pays |
| --- | --- | --- |
| **0 plants, 0 credits** (an empty save) | 2 plants + 1 cut = **3 actions** | **2 credits**, bed 0 |

- **PLANT costs no units and has no gate, no cap and no cooldown** — a player at zero plants can always plant.
- **A bunch is 2 plants on the smallest bed**, so the first credits are always three actions away.
- **Therefore no sequence of play can make the loop unplayable.** That is a wiring requirement in the build notes, not a hope.

### 5.5 How many bunches a refill? (enumerated, not asserted by hand)

`checks.py` §[10] enumerates **every simple cycle in the state graph** and measures each one exactly. The result is a table of the best rhythm, `n` = bunches taken before the bed is replanted:

| State | n=1 | n=2 | n=3 | best |
| --- | --- | --- | --- | --- |
| no powers, greenhouse (8) | **0.38** | 0.43 | 0.50 | **n=1** |
| P1 watering can, greenhouse | **0.25** | 0.29 | 0.33 | **n=1** |
| P2 sharp shears, greenhouse | **0.25** | 0.27 | 0.29 | **n=1** |
| P1 + P2, greenhouse | 0.25 | **0.20** | 0.24 | **n=2** |

With no tools, or with either tool alone, **one bunch a refill is exactly optimal** — the search confirms the taught line rather than merely asserting it. With **both** tools the best rhythm is two bunches a refill, and that is published in §4 and here rather than hidden. The ceiling does not move in either direction: a cut still pays the plants standing, capped by the bed's size (A1).

---

## 6. Sinks

| Sink | Price | Cap | What it returns to the player |
| --- | --- | --- | --- |
| **CUT** | 2 plants (P2: 1) | unbounded | credits, one per plant standing — **and the bed's emptiness, which is the next plant's job**. The loop's own sink |
| **A BUNDLE FOR THE STALL** | **4 plants** | **unbounded** | a bundle goes out with the market; a badge every 10. The unbounded **plant** sink |
| **THE MARKET STALL** | **3 CR** | **unbounded** | one more bunch listed on the stall board; a badge every 10. The unbounded **credit** sink |
| **P4 THE COMPOST BIN** | **5 CR per use** | **unbounded** | one plant, immediately, for no action. A credit sink that buys an *input*, never a payout |
| **The bed's price list** | 5 / 6 / 12 / 16 / 22 / 52 CR | one-off | THE COMPOST BIN, THE PLANT LABEL, THE WATERING CAN, THE HERB BED, THE SHARP SHEARS, THE GREENHOUSE — **113 CR finite** |

Every faucet has a sink able to absorb it and **every unit has an unbounded one**: plants → the cuts and A BUNDLE FOR THE STALL; credits → the price list, the market stall and the compost bin. None expires, and none is a countdown.

### The price list (L10)

| Row | Cost (credits only) | What opens | Designed time (competent) | Advertised as |
| --- | --- | --- | --- | --- |
| **P4 THE COMPOST BIN** | **5 CR a use** | one plant for no action (repeatable) | cycle 2, 8 actions | earned sink |
| **P3 THE PLANT LABEL** | **6 CR** | prints the bed, the bunch and what the cut will pay before you commit | **cycle 2, 8 actions** | earned tool (zero units) |
| **P1 THE WATERING CAN** | **12 CR** | one PLANT action puts 2 plants in: a cycle goes from 3 actions to 2 | cycle 3, 11 actions | earned tool |
| **THE HERB BED** | **16 CR** | bed 4 → 6: a cut is worth 6, a taught cycle pays 6 | cycle 4, 14 actions | free content |
| **P2 THE SHARP SHEARS** | **22 CR** | a bunch takes 1 plant: a cycle goes from 3 actions to 2 | cycle 6, 20 actions | earned tool |
| **THE GREENHOUSE** | **52 CR** | bed 6 → 8: a cut is worth 8, a taught cycle pays 8 | cycle 13, 41 actions | free content |
| THE MARKET STALL | 3 CR each | a bunch listed, badge every 10 | immediate | earned cosmetic (unbounded) |
| A BUNDLE FOR THE STALL | 4 plants each | a bundle out, badge every 10 | immediate | earned cosmetic (unbounded) |

**Finite total: 113 credits.** No row is a trap: the taught line is **`cap/3` credits an action on every bed**, so a bigger bed is strictly better and a tool never makes the rate worse. All times are **designed, not measured**.

---

## 7. Adoption form

```
THE GAMING LAYER — INCORPORATION FORM                    Form version: v0.1
==========================================================================
GAME  Preventative Health ("Tend")                      BUILD/DATE  design only / 2026-11-02
STUDIO  (sample) two-person indie     SIZE  2      CONTACT  (sample)
GENRE  herb bed sim, fictional                        PLAY UNIT  one cycle (cut, refill)
```

### PART A — LOOP SUMMARY

**A1 — Units**

| Symbol | Name | Lives where | Faucet | Sink |
| --- | --- | --- | --- | --- |
| **PL** | Plant | persistent stock (the bed) | **PLANT**: up to `gain` an action, free and unlimited (P1: 2), never past the bed's size | a **CUT**: the bunch is 2 (P2: 1); **A BUNDLE FOR THE STALL 4** (unbounded); capacity refusal creates nothing |
| **CR** | Credit | persistent meta | a cut: **1 credit per plant standing at the cut** | the price list (113 finite); **THE MARKET STALL 3** (unbounded); **P4 5 a use** |
| **the bed** | a capacity | bought with credits | — | — |
| **the seed tray** | an unlimited supply | not stock | — | — |

**A2 — Inputs.** Player actions (the only non-renewable input); the decision at each action (plant, or cut now); **seed capital** = THE WINDOW BOX (bed 4), 0 plants, 0 credits, no tools — enough to reach the first credits in 3 actions.

**A3 — Transformation.** Published, deterministic, bounded, legible; **no random number anywhere.**

```
PLANT   bed = bed + k      k <= gain (1 / 2) and k <= BED - bed; the player picks k
CUT     enabled iff bed >= 2        (P2: bed >= 1)
        credits += bed              <-- read BEFORE the bunch leaves
        bed     = bed - 2           (P2: - 1)
CYCLE   a cut plus the plants that put the bed back where it was
CEILING a cut pays at most BED credits      4 / 6 / 8, with every power on
```

**A4 — Faucets.** PLANT: plants, up to `gain` an action, free, unlimited, no gate. CUT: credits, one per plant standing, unbounded cuts but each capped by the bed's size. No clock, no cooldown, no daily, no purchasable acceleration.

**A5 — Sinks.** See §6. Every faucet runs into a sink and every unit has an unbounded one.

**A6 — Reinvestment, in-loop.** **Every cut is paid for by planting, and planting is free.** Per closed cycle: `planted = cut + (end bed − start bed)`, exactly, on every bed and power state (A4). The loop's output is its own input, and the sink that pays the player (a cut) is the sink that empties the bed the next plant fills.

**A7 — Reinvestment, meta.** Credits buy the bed's kit (a bigger bed, a bigger can, sharper shears, a label, a compost bin). New rooms add **size and decisions**, not payouts: a cut's ceiling is the bed's own size in every state. Free bed layouts are published with credit and become free content; credits are never sold.

**C-conditions: C1 [x] C2 [x] C3 [x] C4 [x] C5 [x]**

**Balance arithmetic.** Taught `cap/3` credits an action (0.75 / 0.50 / 0.38 act/CR), thin 1.50, empty 1.00 / 0.75 / 0.60, band **0.20–1.50** over 39 machine-checked lines; plants conserved exactly per cycle; credits capped at the bed's size per cut. **Posted at** `/preventative-health` (the in-game LOOP panel) **and** `/layer`.

### PART B — EXIT PATH

- **B1 — Save and offline play.** `localStorage["tend.save.v1"]`, one JSON object: `pl`, `cr`, `crEarned`, `room`, `can`, `shears`, `label`, `stall`, `bundles`, `badges`, `stats`, `saveVersion`. **Fully playable offline, yes** — no network request of any kind.
- **B2 — Export.** **EXPORT SAVE** downloads `tend-save.json`:

  ```
  { saveVersion, pl, cr, crEarned, room, can, shears, label,
    stall, bundles, badges:[], stats:{cuts, planted, cycles, crFromCuts, stallListings, bundlesSent} }
  ```

- **B3 — If the studio closes something.** Rooms, tools and counters are numbers in the save; retiring one changes nothing about what the player holds, and the export keeps them. No live service, no login, no key.
- **B4 — Deletion.** No account, no server record, no analytics identifier, no personal data beyond an optional display name on a submitted bed layout. **RESET SAVE** (double confirm) deletes everything immediately; any future account feature completes deletion inside **30 days**.
- **B5 — Offline decay: none, and no offline process at all. THE BED WAITS.** *The fiction and the compliance sentence are the same text:*

  > The bed holds whatever you last left in it and waits. **Close the tab and nothing changes — not one number** — until you come back and put your hands in it. Nothing wilts, nothing dries out, nothing is owed. There is no clock in this game: no cooldown, no daily, no streak, no "your plants missed you", no mail while you are away.

  Mechanically the build has **no `setInterval`, no state-changing `setTimeout`, no `Date.now()` comparison and no catch-up calculation**; `pl` and `cr` are written when a key is pressed. Scarcity comes only from published **capacities** (the bed's size; the bunch of 2).

### PART C — PER-RULE PASS/FAIL

```
L1  Free entrance ............. PASS  Fresh save = THE WINDOW BOX + 0 plants + 0 credits; PLANT is
   free, ungated and unlimited, so 3 actions from nothing pay the first 2 credits.
L2  Free exit ................. PASS  Nothing wilts, dries or decays; the bed waits for ever; no
   mail, no streak, no daily; a half-planted bed survives.
L3  No locked value ........... PASS  One local JSON object; export button; offline playable.
L4  Data portability + delete . PASS  Documented export schema; one-button delete; 30 days.
L5  No pay-to-win ............. PASS  No store, no payment path; credits are the only price and come
   only from cuts; credits per cycle identical in every power state (A2).
L6  No pay-to-skip ............ PASS  No purchase exists; no tool plants, cuts or pays for the
   player; P1/P2 move the refill cost, P3 only prints, P4 sells an input at a loss.
L7  No injected ads ........... PASS  No ad SDK, no sponsor inside play, nothing auto-plays.
L8  No scarcity/FOMO/gambling . PASS  Zero random variables; no clock anywhere; every limit is a
   capacity or a count of actions; nothing is for sale.
L9  Cosmetics only ............ PASS  Badges and stall listings are earned only.
L10 Earned-only progression ... PASS  Price list published above with designed times; every row is
   credit-only; THE GREENHOUSE at 52 CR = cycle 13, 41 actions.
L11 Reinvestment report ....... PASS  Quarterly commitment; no revenue yet, so no report exists.
L12 Player voice .............. PASS  Poll + open thread before any paid release; none yet.
L13 Conflict isolated ......... PASS (N/A)  No combat, no opponent, no being harmed; a cut cannot fail.
L14 Data & API boundary ....... PASS  Nothing leaves the device; no analytics, no third party.
L15 Honest claims ............. PASS  Claims list in Part E; no health, plant, nutrition or medical
   claim of any kind — the guardrail is the longest paragraph in this form.
```

### PART D — REVENUE AND VOICE

- **D1 — Revenue models in use (only §3.4).** Base game **free**, loop complete, nothing sold inside it (the free branch is chosen deliberately: the owner's open Q3 in the spec's §7 is unresolved, so this form takes the branch that cannot fail). **Optional paid expansion "THE LONG BED"** — new rooms, new bunch sizes, new bed art; **geometry and decisions, no power, no number, no shortcut**. **Voluntary patron tier** — the same game everyone has, plus development notes, credits and L9-safe cosmetics; cancelling costs nothing. **Funded pilots** with studios, educators or public bodies — a classroom adaptation about rates and ceilings, disclosed under L11. **Optional educational material** — "Why a ceiling you can see beats a number you cannot", a one-page sheet. Content, not power.
- **D2 — Excluded on purpose.** Advertisements and any rewarded ad. Loot boxes, gacha, spin wheels, any purchase of a chance. **Power of any kind — and this game's list is specific: a bigger bed sold as a tool, an extra credit per cut, a free cut, a purchased plant at a profit, a head start in any room, or a purchased credit.** Shortcuts and instant unlocks. Paid exclusivity or paid entrance. Sale, sharing or trade of player data. **Any conversion of PL or CR into money or into anything outside the game** — no wallet, no token, no NFT, no chain, no exchange.
- **D3 — Monetisation change log.** `/layer/monetisation-log`.
- **D4 — Consultation.** In-game poll plus an open thread before any paid release or price change; both the players' answer and the studio's decision published side by side, including "we went against the majority". **Last consultation: none yet** — nothing has been sold and no price has been set.
- **D5 — Reporting cadence.** **Quarterly** (inside L11's six months). Latest report: **none yet** — no revenue has been taken. The first is due within three months of the first euro and will state a real number, even a tiny one.

### PART E — CLAIMS AND SIGN-OFF

**E1 — Public claims (each checkable in the game this week).**

1. "A bunch pays one credit for every plant standing when you cut it, so a full bed pays the most." **[in-game verifiable]** — cut at bed 4/4 and read `+4`; cut at 2/4 and read `+2`.
2. "A cut pays at most the bed's size, and no tool can make it pay more." **[in-game verifiable]** — buy every row and cut the same full bed for the same 4 / 6 / 8 credits.
3. "Planting costs nothing and is never gated, so no player can be locked out: the first credits are three actions away." **[in-game verifiable]** — start from an empty save, plant twice, cut once.
4. "Cutting as soon as two plants stand costs you half your rate; waiting for a full bed does not cost you a credit." **[in-game verifiable]** — 3 actions for 2 credits, then 3 actions for 4 credits.
5. "The bed waits. Nothing in this game happens while you are not pressing a key." **[in-game verifiable]** — export the save, close the tab mid-refill, reopen, compare `pl`, `cr` and the bed: not one number moved.
6. "Your save is a file you can export, and every number in the HUD is in it." **[in-game verifiable]** — press EXPORT SAVE; a text editor opens it.

**E2 — Claims intentionally NOT made.** No health outcome, no wellbeing outcome, no nutrition or dietary claim, no medical or therapeutic claim, no real plant-care or gardening skill, no real harvest, no real income, no environmental outcome: **confirmed yes.**

> **Guardrail note for this game specifically — the most important paragraph in this design.** The owner's item is called *Preventative Health*, and a herbs-and-plants sim is the single easiest place in the whole layer to write a sentence the game cannot keep. **The following sentences must not be written anywhere**, in-game, in store copy, in a pitch, in a route title or on the site: "improves your health", "good for you", "wellness", "wellbeing", "self-care", "look after yourself", "prevents illness", "boosts immunity", "supports your immune system", "reduces stress", "calming", "therapeutic", "medicinal", "healing", "herbal remedy", "natural medicine", "detox", "nutritional", "vitamins", "teaches you to grow your own medicine", "learn real plant care", "teaches gardening", "a healthy habit", "a health sim", "models preventative healthcare", "wellbeing through play", and anything implying a plant, a bunch, a credit or a badge is a real object, a real herb, a real serving or a measured quantity. Educational **intent** may be described only with "may" or "intend". **The counters measure the save file and nothing else** — a cycle of 4 credits is four numbers in a JSON object, and the start screen says so. **No real species is named**: the herbs are pennyleaf, sunthread and glassmint, invented for this game, so that no reader can attach a medicinal property to a named plant. Real plants involve soil, light, water, pests, seasons and liability; **this game models an integer count in a bed of 4 to 8 slots**, and says so. The word "preventative" in the owner's item is a **description of the loop's shape** — care before the cut — and not a health claim; the game's own public name should not carry it (open question 1). The words **"regenerative"** and **"circular"** stay held back pending the owner's open question 5.

**E3 — Signed (sample)** .................... Date 2026-11-02

---

## 8. Open questions for the owner

1. **Name — and this one is an L15 question, not a taste question.** The owner's item is "Preventative Health"; the working title in the game is **TEND**. My recommendation: **"Tend"** as the game, "Preventative Health" as the folder, the route and the owner's item label — because a game called "Preventative Health" makes a health claim in its own title, and this one cannot keep it. A studio copying the pattern needs the same ruling.
2. **Is one decision enough?** The owner's bar is that the loop reads from the first screen. It reads in one line — *a bunch pays one credit per plant standing, so cut from a full bed* — with **two verbs and one state** (how many plants stand). It is the simplest loop in the layer so far, and deliberately: every added state (thirst, pests, ripeness, seasons) would make the published band a range of strategies instead of three named lines. I would like the owner's ruling before a studio copies it.
3. **Powers reading (spec §7 Q6).** With every tool on, a cut still pays exactly the plants standing, capped by the bed's size, and a taught cycle still pays 4 / 6 / 8. **Explicit confirmation wanted** before studios copy the pattern.
4. **The two-bunch rhythm (the one place the taught line is not optimal).** With both tools owned, two bunches a refill beats one (0.20 against 0.25 on the greenhouse). It is published, it moves actions only, and the ceiling does not move — but it is the first sample where the best rhythm is **not** the taught one. Should the design be tightened (for instance by pricing P2 so that a bunch of 1 is never worth a second cut, or by making the bunch scale with the bed), or is publishing it the honest answer?
5. **P4 THE COMPOST BIN is a repeatable sink that buys an input with credits** (5 CR for one plant). Its ceiling contribution is exactly zero and it is priced above what a plant can ever be worth, so it always makes the rate worse. It wants the proposed v0.2 rule: *a repeatable in-game sink may sell an input or a second attempt, never an outcome, and never at a price below the best published rate.*
6. **Arc length.** The whole price list is 113 credits and about **28 cycles / 85 actions** on the taught line — a short demo arc (designed: 4–6 minutes). Should prices rise ~1.5× for a longer first session, or is a short, complete arc the right shape for a sample?
7. **A second sink for plants?** A BUNDLE FOR THE STALL (4 plants, unbounded) is the plant's unbounded sink, but a player at the top of the bed may want a second use for plants that is not a cut. A "seed swap" (plants → a badge and a cosmetic row) is the obvious next piece of content; it is **not** in v0.1 because it adds a second counter and the band's lines are named, not searched.
8. **Does the bunch scale with the bed?** A bunch of 2 on every bed is the simplest published rule and it is why `cap/3` is exact. A bunch of `cap/2` would make the numbers bigger and the band wider, and would make every number in this document wrong. **Not in v0.1.**
9. **L13 needs no ruling** — there is no conflict of any kind in this game. A cut is a harvest, it cannot fail, and the seed tray is unlimited.

---

## BUILD NOTES FOR THE ENGINEER

One route file `src/routes/preventative-health.tsx`, same shape as `repair-cafe.tsx`, `local-energy.tsx`, `compost-to-soil.tsx`, `bin-runner.tsx`, `brick-break.tsx` and `paper-airplane.tsx`: `createFileRoute`, meta in localStorage, phases `start | bed | book`, keyboard + pointer input, no backend, no accounts, no network. A 320×240 logical canvas scaled with `image-rendering: pixelated`; panels around it plain DOM. Design page at `src/routes/preventative-health-design.tsx`, same shape as `repair-cafe-design.tsx`.

### Constants to wire (copy these, do not re-derive)

```ts
const SAVE_KEY = "tend.save.v1";

const ROOM = {                                    // the bed, by tier
  1: { name: "THE WINDOW BOX", bed: 4, cost: 0  },
  2: { name: "THE HERB BED",   bed: 6, cost: 16 },
  3: { name: "THE GREENHOUSE", bed: 8, cost: 52 },
};
const BUNCH       = 2;              // plants a cut takes (P2 THE SHARP SHEARS: 1)
const PLANT_GAIN  = [1, 2];         // plants one PLANT action may put in, by P1
const CUT_PAY     = (standing: number) => standing;   // read BEFORE the bunch leaves
const P1_COST     = 12;             // THE WATERING CAN
const P2_COST     = 22;             // THE SHARP SHEARS
const P3_COST     = 6;              // THE PLANT LABEL
const P4_COST     = 5;              // CR per use, repeatable
const STALL_COST  = 3;              // unbounded CR sink
const BUNDLE_PL   = 4;              // unbounded plant sink
const BADGE_EVERY = 10;

const SEED = { pl: 0, cr: 0, crEarned: 0, room: 1, can: false, shears: false,
               label: false, stall: 0, bundles: 0, badges: [],
               stats: { cuts: 0, planted: 0, cycles: 0, crFromCuts: 0,
                        stallListings: 0, bundlesSent: 0 },
               saveVersion: 1 };
```

Derived rules, verbatim:

```ts
const bed = ROOM[room].bed;
const bunch = shears ? 1 : BUNCH;
// PLANT : the player chooses k in 1..PLANT_GAIN[can ? 1 : 0], k <= bed - pl;  pl += k
//         (a full bed refuses the rest — refused plants are NOT created)
// CUT   : enabled iff pl >= bunch
//         const standing = pl;                  <-- read BEFORE the bunch leaves
//         cr += CUT_PAY(standing); crEarned += same; pl -= bunch;
//         stats.cuts++; stats.crFromCuts += same;
// P4    : charge 5 CR when pressed, then pl = min(bed, pl + 1)
// STALL : charge 3 CR when pressed; stall++; badge every 10
// BUNDLE: enabled iff pl >= 4; pl -= 4; bundles++; badge every 10
// BOOK  : every row shows price, shortfall, effect and ceiling
```

**There is no other state and no other function.** If a value in the build is not derivable from these lines, it is a bug against this document.

### The π scale on the HUD

Use the shared module already in the site (`src/lib/pi-scale.ts`, `piValue(units)` = `Math.floor(units * 10 * Math.PI)`). The HUD prints the credit count **twice**: the loop's integer and its π display — `CREDITS 4 · π 125`. **The π value is never added, spent, compared or conserved**; every price, payout and check in this game uses the integer. `checks.py` §[11] is the proof that the display cannot move the loop.

### MUST be implemented end to end

1. **The bed ledger line after every action** (this is C1): `PLANT +1 → BED 3/4`; `CUT · 4 STANDING · BUNCH 2 → +4 CR · BED 2`; `CYCLE CLOSED · 3 ACTIONS · 4 CREDITS · 0.75 ACTIONS PER CREDIT`.
2. **The payout read before the bunch leaves.** `standing` is `pl` at the instant CUT is pressed, and the button face says what it will pay: `CUT · PAYS 4` or `CUT · PAYS 2 · A FULL BED PAYS 4`.
3. **PLANT free, unlimited, ungated, visible from the first frame**, and a dev assertion that its credit cost is zero.
4. **The ceiling printed in the HUD**: `CEILING 4 CREDITS A CUT` and, beside it, `NO TOOL RAISES IT`.
5. **Plants are never destroyed by a refusal.** Planting into a full bed adds only what fits and prints `BED FULL — 4/4`.
6. **The bed waits**: no tick, no timer, no catch-up. The built file must contain **no `setInterval`, no state-changing `setTimeout`, no `Date.now()` comparison**; a dev check greps its own source for all three and fails if any state change depends on them. **No wilt, no thirst, no decay of any kind** — L15's guardrail and B5's sentence are the same sentence, so a "plants get thirsty while you are away" mechanic is a compliance bug, not a feature.
7. **The four tools**: P1 and P2 as buys (one rank each, `MAX`), P3 as a buy, P4 as a 5-CR per-use charge taken only when pressed.
8. **The two unbounded sinks are real spends**: THE MARKET STALL 3 CR, A BUNDLE FOR THE STALL 4 plants, badge every 10.
9. **The book panel** lists the six rows in price order with effect and ceiling lines, and the note **`NO ROW IS A TRAP — EVERY BED PAYS cap/3 CREDITS AN ACTION`**.
10. **EXPORT SAVE** → `tend-save.json` including the bed's plants; **RESET** with double confirm.
11. **The LOOP panel** publishing this document's arithmetic: the bed table (size, bunch, credits a cut, ceiling), the three published lines (0.75 / 1.50 / 1.00 on the window box), the powers table with cost/effect/ceiling, the conservation line (`PLANTED = CUT`), the price list, and the two sentences **"the bed waits — no number here changes while this tab is closed"** and **"nothing here converts to money; no purchases exist in this game"**.
12. **Start screen in five lines**: `PLANTING IS FREE AND UNLIMITED · A BUNCH PAYS ONE CREDIT FOR EVERY PLANT STANDING · CUT FROM A FULL BED · THE BED WAITS FOR EVER — NOT ONE NUMBER MOVES WHILE YOU ARE AWAY · 16 CREDITS OPENS THE HERB BED`. Plus the honest line: `A CYCLE IS FOUR NUMBERS IN A SAVE FILE. NOTHING HERE IS A REAL PLANT, A REAL HERB OR HEALTH ADVICE.`
13. **Offline: no network call of any kind anywhere in the file.**

### Geometry (320×240 logical field)

- Five colours: bed timber `#6b4a2a`, soil dark `#3a2a1c`, leaf green `#4f8f3a`, seed tray tin `#9aa4ae`, credit brass `#c8a040`.
- **HUD**, two 8-px lines: `y 0–10` = `WINDOW BOX · BED 3/4 · A CUT PAYS 3 · CEILING 4`; `y 11–20` = `PLANTS 3 · CREDITS 18 · π 565`.
- **The bed**, x 6–152, y 22–150: `bed` 12×16 px slots in rows of four, filled leaf-green as plants go in, with a **FULL banner** across the top when `pl === bed` (the paying state must be readable without a number). Beside it the seed tray and `[P] PLANT`.
- **The stall**, x 160–312, y 22–110: the stall board with the takings, `[C] CUT` showing the live payout, and the two unbounded sinks below.
- **The tools**, x 160–312, y 114–176: the four rows with price, shortfall and ceiling.
- **The action bar**, y 180–204: `[P] PLANT`, `[C] CUT`, `[B] BUNDLE 4`, `[T] STALL 3 CR`, `[K] BOOK`, `[L] LOOP`, `[X] EXPORT`.
- data-testids: `plant-btn`, `cut-btn`, `bed-value`, `bed-full`, `credits-value`, `pi-value`, `cut-pays`, `bed-ledger`, `bundle-btn`, `stall-btn`, `buy-p1`, `buy-p2`, `buy-p3`, `use-p4`, `buy-room-2`, `buy-room-3`, `go-book`, `go-loop`, `export-save-start`, `reset-save`, `loop-panel`, `book-panel`.

### MAY be display-only

Bed art, stall art, badge lists, the plant label's panel line (the HUD already prints the bed and the button already prints the payout) — but the **spends** must be real and the **FULL state** must be readable.

### Arithmetic and mechanics I simplified, and why

1. **One bed, one bunch, one decision.** The simplest loop the layer has built, on purpose: the owner's bar is that a newcomer reads it from the first screen, and every extra state would turn three named lines into a searched band.
2. **A cut pays a straight count, not a lookup table.** No doubling, no halving, no threshold — so the payout is legible on the bed itself and the ceiling is the bed's own size. It is also what keeps this game from being Kettle Lane with a different noun.
3. **The bunch is 2 on every bed.** It is why the taught line is exactly `cap/3` credits an action on all three rooms, and why the refill is exactly 2 actions.
4. **PLANT is free and unlimited.** It is the L1 faucet and the C4 recycler at once: a player at zero can always plant, so no sequence of play can lock anyone out (A7).
5. **Plants are created only by PLANT**, never by a cut — so conservation is exact and checkable to the unit (A4), and no faucet hides inside a cut.
6. **The can plants "up to" its gain and the player picks the count.** Without that, a 2-plant can could not land on an odd bed and the tool would *reduce* the player's options — which would break the owner's powers reading.
7. **P1 and P2 move actions; nothing moves credits** (A2). This is the owner's powers reading, machine-checked — and the one place the two together open a cheaper *rhythm* is published rather than hidden (§5.5).
8. **P4 deliberately makes the rate worse** (5 credits for a plant that can never be worth more than 4): it is a sink for finished players, not an accelerator, and its ceiling contribution is zero.
9. **No wilt, no thirst, no pests, no seasons, no decay of any kind.** Each would be a second state, and a second state would make the published band unfalsifiable — and a decay would also break L2 and L15 at once.
10. **The first cycle is longer than the rest** (5 actions from an empty bed, then 3). That is the tutorial: it teaches that planting costs actions, and it costs nothing but actions.

### Tensions I want the lead to see

1. **L15 is the whole risk on this one, and it is a naming risk before it is a copy risk.** The owner's item is called "Preventative Health". A game of that name makes a health claim in its title, and no amount of careful body copy fixes a title. **Recommendation: TEND on the page, "Preventative Health" as folder/route/item label only** — open question 1, and it needs the owner.
2. **The two-bunch rhythm is the first place in the layer where the best play is not the taught play** (0.20 against 0.25 with both tools). It is published, the ceiling does not move, and `checks.py` proves the taught line optimal in every other state — but a studio copying this pattern should be told plainly (open question 4).
3. **One decision is thin for a game, right for a sample.** The design's depth is in the rate (0.20 to 1.50, a 7.5× spread) rather than in branching. If the owner wants a richer sim, the second state should be chosen for legibility, not realism (open question 2).
4. **The arc is short** (113 credits, ~28 cycles, ~85 actions, designed 4–6 minutes). Honest for a demo, flagged as open question 6.
5. **Every time in this document is designed, not measured.** L10's violation test asks for a real player who reached the last row; no such player exists yet.

---

## APPENDIX — the machine-checked sums (transcript excerpt)

`python3 checks.py` ends with every assert green (13 checks).

```
[1] ONE CYCLE — THE WINDOW BOX (bed 4), no powers
CUT (4 standing, bunch of 2)           2       4   pays 4 CR, 2 plants leave the bed
PLANT                                  3       4   +1 plant (seed tray -> bed)
PLANT                                  4       4   +1 plant (seed tray -> bed)
  CYCLE CLOSED: 3 actions, 4 credits, bed back at 4 — 0.75 actions per credit

[3] THE PUBLISHED LINES
THIN    tier 1 (cut the moment 2 stand)                  3    2    1.50
TAUGHT  tier 1 (cut only from a full bed)                3    4    0.75
EMPTY bed tier 1 (cut it down, then replant)             6    6    1.00
THIN    tier 2                                           3    2    1.50
TAUGHT  tier 2                                           3    6    0.50
EMPTY bed tier 2                                         9   12    0.75
THIN    tier 3                                           3    2    1.50
TAUGHT  tier 3                                           3    8    0.38
EMPTY bed tier 3                                        12   20    0.60

[4] WITH / WITHOUT THE POWERS — the taught line, one cycle
no powers                              3a/4c 0.75    3a/6c 0.50    3a/8c 0.38
P1 THE WATERING CAN                    2a/4c 0.50    2a/6c 0.33    2a/8c 0.25
P2 THE SHARP SHEARS                    2a/4c 0.50    2a/6c 0.33    2a/8c 0.25
P1 + P2 (both)                         2a/4c 0.50    2a/6c 0.33    2a/8c 0.25
P1 + P2, two bunches a refill          3a/7c 0.43   3a/11c 0.27   3a/15c 0.20

[5] BAND: 0.20 to 1.50 actions per credit (0.67 to 5.00 credits per action), 39 lines

[6] CONSERVATION — planted = cut + (end - start), every closed cycle
tier 1 taught, no powers    created 2  cut 2  4 -> 4  closed True  equal True
tier 1 taught, P1 + P2      created 1  cut 1  4 -> 4  closed True  equal True
tier 3 empty bed            created 8  cut 8  8 -> 8  closed True  equal True
planting into a full bed: 4 -> 4 (refused), plants created 0

[7] LOCKOUT: 2 plants + 1 cut = 3 actions -> the first 2 credits, from an empty save

[8] FINITE TABLE 113 CR; taught 28.2 cycles / 85 actions; empty 18.8 / 113; thin 56.5 / 170

[9] FIRST-TIME PATH: P4 (5 CR) and P3 (6 CR) at cycle 2 (8 actions); P1 (12 CR) at cycle 3
    (11 actions); BED 2 (16 CR) at cycle 4 (14); P2 (22 CR) at cycle 6 (20);
    BED 3 (52 CR) at cycle 13 (41 actions)

[10] HOW MANY BUNCHES A REFILL — every simple cycle enumerated
no powers tier 3   0.38 0.43 0.50 0.60 ...  best n=1
P1 tier 3          0.25 0.29 0.33 0.40 ...  best n=1
P2 tier 3          0.25 0.27 0.29 0.31 ...  best n=1
P1 + P2 tier 3     0.25 0.20 0.24 0.23 ...  best n=2

[11] THE PI DISPLAY SCALE
units  1 -> 31 · 10 -> 314 · 100 -> 3141 · 1000 -> 31415   (display only)

[ASSERTS]  ok A1 ceiling = the bed's size, every power state · A2 credits identical in every
power state · A3 no power costs more than none · A4 plants conserved to the unit · A5 taught
cap/3, optimal everywhere except the two-bunch rhythm · A6 band 0.20..1.50 · A7 no lockout
(3 actions) · A8 every cut is paid for · A9 P4 adds zero units and is always worse than playing ·
A10 finite table 113 CR · A11 planting is the loop's own input · A12 zero random variables ·
A13 the pi scale is display only — 13 checks, every published number in design.md.
```

---

*End of design. If any number here changes, change it here first, re-run `python3 checks.py`, and re-publish the balance arithmetic, the powers table and the price list — the point of the form is that the published numbers and the built numbers are the same numbers.*
