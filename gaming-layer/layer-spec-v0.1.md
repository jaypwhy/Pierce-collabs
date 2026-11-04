# The Gaming Layer — Form & Structure v0.1

**Status:** working draft, written by the game-systems designer at the team lead's request. It is the team's hypothesis, not an owner-ratified decision. Nothing here has been adopted by a real studio, and no money has been taken through it.
**Audience:** a small studio (1–3 people) that wants to publish a game which honestly calls itself a *Gaming Layer game*, and any player who wants to check that claim.
**Normative words:** **must** = required to conform. **should** = expected, deviation must be written down in the incorporation form. **must not** = a violation.
**Versioning:** rules are numbered (L1…L15) so that a later version can change one rule without renumbering the rest. Numbers must never be reused for a different meaning.

---

## 1. Scope

### 1.1 What the layer is

The Gaming Layer is a **software-only** way of building a game's internal economy so that it stays honest. It is two things, and only two things:

- **The form** — a description of what a closed loop is inside a game: inputs, transformation, outputs, and reinvestment (§2).
- **The structure** — a published set of numbered policies (L1–L15, §3) that keep that loop from being squeezed, plus a standard form (§4) by which a game declares that it conforms.

A game **opts in**. The layer does not attach itself to a game, and no game is a Gaming Layer game by accident. A studio fills in the incorporation form in §4; that filled form is the claim.

The layer is **non-physical**: there is no hardware, no second device, no companion toy, no token that pretends to be money.
The layer is **non-encroaching**: it never overlays, injects into, advertises inside, or takes a cut of somebody else's game — and it never squeezes the players of its own.

### 1.2 What the layer is not

1. **Not a hardware product.** No device, dock, headset, card reader, recyclable bin, or physical good is part of the layer.
2. **Not an overlay.** It is not a HUD, an extension, a launcher, a wallet pop-over, or anything that draws on top of another company's game.
3. **Not a mod loader, mod platform, or injection tool.** It does not hook another game's process, memory, or assets. A Gaming Layer game is complete and playable on its own.
4. **Not a crypto, token, NFT, or blockchain scheme.** The layer is explicitly non-physical. Where the original conversation raised tokens, smart contracts or NFTs, this document marks them **out of scope** in one line and moves on. Nothing in the layer requires a ledger, a wallet, a mint, or a chain.
5. **Not a walled garden.** It does not require exclusivity, an account you cannot leave, a store you must use, or a marketplace that traps value inside it.
6. **Not a real-money earner for players.** No unit in a conforming game converts to money, and no player income of any kind is promised. See §6.
7. **Not a launcher, engine, middleware, SDK, analytics product, or certification body.** v0.1 is a document plus a form. A studio needs no dependency on us to conform.
8. **Not a moral authority on genre.** It does not require a game to be peaceful, educational, or cosy. It requires that *if* a game rewards violence, that reward never reaches the loop (L13).
9. **Not a guarantee of popularity, funding, or virtue.** Conforming means the economy is honest by these rules and checkable. It does not mean the game is good.

### 1.3 Who this is written for

Small studios and independent designers. Every compliance step in §3 is written so that it can be done by one to three people in an afternoon and maintained inside a normal patch cycle. If a rule cannot be complied with by a 1–3 person studio, the rule is wrong and should be amended — not quietly ignored.

---

## 2. The form — the loop model

### 2.1 Canonical diagram

```
                          ┌──────────────────────────── THE LOOP ────────────────────────────┐
                          │                                                                   │
   ┌──────────┐      ┌─────────────────┐      ┌───────────────┐      ┌─────────────────────┐   │
   │  INPUTS  │ ───▶ │ TRANSFORMATION  │ ───▶ │    OUTPUTS    │ ───▶ │    REINVESTMENT     │   │
   └──────────┘      └─────────────────┘      └───────────────┘      └─────────────────────┘   │
        ▲                     │                      │    │                   │               │
        │              published rules          faucets │    │ sinks        │               │
        │              deterministic             create │    │ consume      │               │
        │              skill-weighted            units  │    │ units        │               │
        │                                             ▼    ▼                │               │
        │            in-loop reinvestment: recycled units re-enter as inputs │               │
        │                                                                   │               │
        └────────────────── reinvestment re-enters the loop as new inputs ──┘───────────────┘

   IN-GAME ONLY. Nothing crosses the dashed line to real money — there is no such line in v0.1.
```

The loop is **closed in materials** — units are created by named faucets and destroyed by named sinks — and **open in people, ideas, and data**: anyone can enter free, players may contribute content and feedback, and a leaving player takes their data with them.

### 2.2 Stage definitions

**Inputs — what the loop accepts.**
Three kinds, and no others:

| Input | In-game form | Notes |
|---|---|---|
| **Time** | turns, runs, minutes played, sessions | the only non-renewable thing a player spends; a conforming game never charges extra to convert time into results |
| **Attention / skill** | decision quality, timing, planning, sorting, allocation | better play must give a better result; the game must be able to say *why* |
| **Contribution** | peer help, moderating, bug reports, user-created levels/scenarios, translations, documented strategies | if a game rewards contribution, it uses the same loop units as play, not a separate currency |

Optional and also an input: **seed capital** — the starting stock a new player receives (starter materials, starter dwelling, tutorial tools). Seed capital is granted once per player, is identical or near-identical for everyone, is never purchasable, and is large enough to reach the first output without spending money (see L1).

Inputs that are **forbidden**: money paid for advantage, watching an advertisement, selling personal data, buying a second account to trade with yourself, and referral bonuses paid for other people's spending.

**Transformation — what the game does to inputs.**
The transformation is the game's rules of play applied to player input. To conform it must be:

- **Published** — the player can find out, in-game or in a patch-notes page, what a given action yields. A recipe book, a help table, or a build screen showing yields all count.
- **Deterministic or honestly random** — the same input under the same state gives the same output, or the randomness is disclosed (see L8 for what randomness is *not* allowed to be attached to).
- **Bounded** — no unbounded faucet exists: every process that creates units has a stated rate limit (per run, per turn, per day), and the limit is visible to the player.
- **Skill-weighted** — when two players spend the same time, differences in output come from decisions, not from purchase history.
- **Legible** — after a run or a turn, the player can name where the units came from. Confusing the player about their own economy is a conformance problem, not a design flourish.

**Outputs — what the loop produces, and the flows around it.**
Outputs are **in-game units only**: currencies, materials, crafted goods, progress levels, unlocks, recipes, cosmetic items earned by play, records of what happened (stats, maps, logs, blueprints).

Outputs move through two kinds of flow, and every conforming loop must show both:

- **Faucets (create).** Named sources of new units: a harvest, a run payout, a quest reward, a salvage yield, starting seed capital. Every faucet must state **how many units per what period**, and **what it costs the player** (time, charge, materials, risk).
- **Sinks (consume).** Named destructions of units: upkeep, consumption, decay, wear, build costs, upgrade costs, mistakes, landfill. Every faucet must have at least one sink capable of absorbing it, or stock grows without limit and the loop is not closed (this is condition C2).

**Reinvestment — what the loop gives back.**
Reinvestment is the part most often missing, and it is the part that makes the loop a loop rather than a line. It comes in two forms, and a conforming game must have at least one of each:

- **In-loop reinvestment (mechanical).** Spent or discarded outputs re-enter as inputs. Examples: offcut material returned when a build is completed; compost made from waste raising soil yield; salvaged parts feeding the next crafting step; a completed structure raising the rate of a faucet. This is "waste as a resource" made concrete inside the game.
- **Meta reinvestment (studio-level).** What the studio puts back into the loop and its players: patch work on the core loop, new levels/regions/scenarios that extend play without adding power, published reinvestment reporting (L11), player consultation on monetisation (L12), and support for player-made content. Only revenue from the permitted models in §3.2 may be reported here. Meta reinvestment is reported, not promised — see §6.

Reinvestment must not be a euphemism for a reward for spending. Paying money is never an input (§1.1, L5, L6).

### 2.3 Minimum conditions — when a loop may be called closed

A loop may be called a **closed loop** under this layer only if all five conditions hold. These are tests, not vibes.

| # | Condition | Plain statement | Test |
|---|---|---|---|
| **C1** | **Legibility** | A player can say in one sentence where a unit came from and where it goes. | Ask a player who has played 30 minutes: "where does this number come from?" A correct answer, or a screen that shows it, passes. |
| **C2** | **Conservation** | Over a long run, faucets ≈ sinks + stock change, within a published band. No unit is created that no sink can consume. | Do the arithmetic for a fixed period (see §5 samples). Faucets and sinks must balance within the stated band, or growth must be shown to be capped. |
| **C3** | **No money in the transform** | No output depends on payment, and difference in outcome between two equally-time-rich players is explained by decisions. | Play two accounts with the same time and different spending. The paid account must not be ahead in any number that affects outcome. |
| **C4** | **Recyclability** | At least one output is usable as an input to another process, and at least one sink returns something to the player rather than only destroying. | Point to it in the build screen or compost/offcut rule. If the only sinks in the game are pure deletions, this fails. |
| **C5** | **Exit integrity** | A player can stop at any moment, and everything they earned is still theirs: usable offline or exportable or visibly recorded, with no punitive loss. | Export the save, play offline, and come back later. Nothing earned should have been deleted, locked, or charged for. |

A loop that fails any of C1–C5 is not a closed loop under this layer, whatever the store page says. It may still be a game — it just cannot make this claim.

---

## 3. The structure — the policy set

Fifteen rules. Each has four lines: **the rule**, **why it exists**, **how a studio complies**, and **a violation test** — something a stranger can run without access to the studio's code or accounts. "Conforming" means all fifteen pass. There is no partial conformance and no paid tier of conformance.

### 3.1 Entrance, exit, and ownership

#### L1 — Free entrance
- **Rule.** The full core loop must be reachable at zero cost. No purchase, subscription, ad view, invitation, paid beta, or payment method is required to start playing and to complete at least one full loop.
- **Why it exists.** Money at the door is what turns a loop into a funnel. Free entrance is the point at which the player owes the game nothing and stays because it is good.
- **How a studio complies.** Make the whole core loop part of the free build; grant a fixed, non-purchasable seed (see §2.2) that is enough to reach the first output; gate nothing inside the loop behind a store page; if the game is a paid *expansion* product, that is a separate release, not a key to the loop.
- **Violation test.** On a device that has never paid, with no account linked to a purchase, start a fresh save and play to the first output. If you meet a paywall, a "start your free trial" screen, or a locked core action before that output, L1 fails.

#### L2 — Free exit
- **Rule.** A player must be able to stop playing at any time, for any length of time, with **no fee, no penalty, no loss of earned progress, and no notification designed to prevent it**. Absence must not be punished.
- **Why it exists.** A loop you cannot leave is not voluntary. Punishing absence converts play into an obligation and the game into a toll.
- **How a studio complies.** No cancel step that demands a call or a survey; no "your settlement will be destroyed in 24 h" mails; no bonus that silently expires because you were away; offline decay, if any, must be bounded and recoverable within one session (state the cap in the form, e.g. "decay stops after 7 offline turns"); re-entry restores state and, if anything was lost while away, offers a one-click restore or a fresh start with seed capital.
- **Violation test.** Note every number you hold, close the game for 30 days (or set the system clock forward 30 days), return. Nothing earned should be gone beyond the documented decay cap, and nothing should cost anything to recover. Then check the mailbox/notifications sent during absence: any message threatening loss is a fail.

#### L3 — No locked value
- **Rule.** Nothing a player earns may be locked to their continued play, their continued payment, or their account's survival. Earned state must persist offline, export, or be visibly recorded.
- **Why it exists.** Locked value is leverage used to keep people playing against their interest. Free exit is meaningless if leaving costs you what you built.
- **How a studio complies.** Save in a local file the game can read with no network; publish an export that contains everything earned (see L4); if a live service closes a feature, migrate or preserve player state in the export rather than deleting it; never condition access to earned items on a subscription or on login streaks.
- **Violation test.** Put the device in aeroplane mode and open the exported save. Everything earned should be present and, where the game is single-player, usable. Anything that reads "requires connection to view" or "restore with a purchase" is a fail.

#### L4 — Data portability and the right to be forgotten
- **Rule.** Players must be able to export their gameplay data in a documented, machine-readable form; and must be able to have their personal data deleted on request, with deletion completed inside a stated window.
- **Why it exists.** Exit includes leaving with your record, and leaving without leaving your identity behind. Both halves are needed or "exit" is just a door with a sign on it.
- **How a studio complies.** Publish the export format (a JSON schema or a CSV with a header row is enough); provide the export button in the game or on the site, not by email request; document what deletion removes (account, saves, telemetry identifiers) and what cannot be removed and why (records already required by law, anonymised aggregates with no identifiers); state the window (a 1–3 person studio should commit to 30 days and actually meet it).
- **Violation test.** Click export: you should get a file, without asking anyone, that a text editor can open and a reader can understand. Then send a deletion request and time it. If export takes an email exchange or deletion has no stated deadline, L4 fails.

### 3.2 Money, advantage, and pressure

#### L5 — No pay-to-win
- **Rule.** No payment may change any quantity that affects the outcome of play. Not faster generation, not stronger units, not extra turns, not better odds, not exclusive abilities, not higher caps.
- **Why it exists.** The loop is supposed to measure decisions. Purchased advantage replaces the measurement with a price.
- **How a studio complies.** Keep a written list of every number a player can change and mark each one "earned only"; if a paid item exists, it must not appear anywhere on that list; if the game has paid expansions, they must add content (new regions, scenarios, factions with new *decisions*, not new *numbers*) and must be disclosed as such on the page.
- **Violation test.** Two fresh saves, same play time, one account buys everything on sale. Compare any outcome number, e.g. units per run, output per turn, win rate on the same seed. Any gap explained by spending is a fail.

#### L6 — No pay-to-skip
- **Rule.** No purchase may remove a required step of the loop. Play time may be shortened only by in-game, earned means, and the shortcut must itself be earnable by play.
- **Why it exists.** The loop *is* the product. Selling a way around it says the loop is the obstacle, and prices the game's own content as a wall.
- **How a studio complies.** List every step of the loop in order (see §4 Part B); every step must be completable by any player with time; if a "fast forward" exists it must be bought with loop units and be available to everyone; never sell queue skips, build instant-finish, or "start at level 10".
- **Violation test.** Play from zero to the first output with no purchases, timing it. Then check whether any paid item claims to shorten that path. If the store's copy implies a faster route, L6 fails even if the mechanics are technically equal.

#### L7 — No injected advertising
- **Rule.** No third-party advertisement may be injected into any surface of the layer or the game: no pre-roll, no interstitial, no banner inside the loop, no rewarded ad attached to a loop unit, no ads in menus, launcher, or death screens.
- **Why it exists.** Injected ads are another party's claim on the player's attention, and they arrive with a monetisation agenda the studio does not control. They are the most common form of encroachment.
- **How a studio complies.** Simply do not integrate an ad SDK; if the game has a sponsor, the sponsorship must be on the store page, in a patch note, or on a clearly separated credits/branding screen outside play, labelled "sponsor", carrying no reward and no gameplay link; nothing auto-plays.
- **Violation test.** Play for 30 minutes on a clean install and screenshot the screen every 60 s. Any ad, ad placeholder, "watch to continue" prompt, or unlabelled branding inside the play surface is a fail. (`integrated ad SDK` in the store's privacy/permission list is a fail on sight.)

#### L8 — No artificial scarcity, FOMO, or gambling-adjacent mechanics
- **Rule.** No countable-time-only offers, no items that "never come back", no countdown timers on purchases, no loot boxes, gacha, randomised paid rewards, spin wheels, or any mechanic where money buys a chance. No mechanic that punishes absence (streaks that reset to zero, decaying login rewards, expiring dailies with unique rewards).
- **Why it exists.** These convert patience and compulsion into revenue rather than skill into progress, and the last of them — money for a chance — is gambling in a game's clothes.
- **How a studio complies.** Write a rotation policy: everything purchasable stays purchasable or returns on a published rotation with a stated interval; full item contents and odds must be visible before any purchase (if a paid item has randomised contents at all, that alone is a fail — so don't); daily/weekly rewards, if they exist, accumulate and cannot be permanently missed; no real-time countdown on any store surface.
- **Violation test.** Open the store and look for a clock: any "ends in", "last chance", "only N left", or "season exclusive" is a fail. Buy the cheapest randomised item if one exists — you should have been able to see its exact contents first.

#### L9 — No purchasable advantage; cosmetics under ethical limits
- **Rule.** Paid items must be cosmetic only. Cosmetics must not signal competitive or cooperative power, must not be restricted to buyers in a way that excludes non-buyers from a shared experience, and must not be designed to make a free player feel inferior. Status may be earned, not bought.
- **Why it exists.** A cosmetic store is the least harmful revenue model, but it is not harmless: bought status is still a ladder, and a ladder is still pressure.
- **How a studio complies.** Keep paid cosmetics visually separable from earned ones, e.g. buyers get palettes and décor, earners get badges and titles that appear in leaderboards/records; never put a paid cosmetic on a functional object in a way that changes its read (no paid "looks like a max-tier building" pieces); no free-vs-paid split in a shared visible ranking.
- **Violation test.** Ask a non-buying player to sort visible items into "earned" and "bought" without seeing prices. If they cannot, or if any bought item looks like a mark of achievement, L9 fails.

#### L10 — Earned-only progression
- **Rule.** Every gate in the progression must be opened by a condition anyone can reach by playing. The unlock table must be published. No level, region, tool, recipe, or ability may be reachable only through payment.
- **Why it exists.** Progression is the shape of the loop over time. If payment can shape it, the loop is for sale.
- **How a studio complies.** Publish an unlock table (level/turn/units → unlock) in-game or in the patch notes; include in it the estimated time to reach each unlock by play; ensure every row is reachable without spending; if the table is long, publish it as a CSV alongside the game (it is also the export in L4's spirit).
- **Violation test.** Pick the last row of the unlock table and find a player who reached it legitimately without purchases (a public save, a stream, a leaderboard entry). If no such path is documented, L10 fails.

### 3.3 Transparency, voice, and boundaries

#### L11 — Transparent reinvestment reporting
- **Rule.** The studio must publish a plain-language report, at least every six months, stating what revenue came in by source (only the permitted models in §3.4), what share went back into the game (patches, content, support, moderation) and to any other destination, and what it is not claiming. The report must be findable from the game's own store page or site.
- **Why it exists.** "Nothing is squeezed out of you" is a claim; a report is evidence. It also makes the first dishonest quarter visible.
- **How a studio complies.** One page, no accounting degree needed: revenue by source as a percentage, spend by category as a percentage, player count, and one line stating what is excluded (e.g. "we do not sell player data"). If total revenue is tiny, say the number — a small honest number is better evidence than a rounded one. State the reporting cadence in the form and keep it.
- **Violation test.** Find the newest report on the site. Is it dated within the last six months? Does revenue come only from the permitted models? If revenue sources are unlisted, or the last report is older than six months, L11 fails.

#### L12 — Player voice in monetisation decisions
- **Rule.** Before adding a new revenue model, changing the price of anything, or changing what may be bought, the studio must consult players through a real mechanism and publish the outcome, including where it disagreed with players.
- **Why it exists.** Predatory monetisation arrives as a small, reasonable-sounding patch. A standing consultation habit is what catches it while it is still small.
- **How a studio complies.** Publish the list of permitted revenue models and the list of things the studio has ruled out (ads, loot boxes, power sales); keep a public "monetisation changes" log with dates; consult via a poll, an open thread, or a small player panel — anything where the players' answer is recorded — and write the answer and the decision side by side, including a "we went against the majority and here is why" entry.
- **Violation test.** Ask: when did players last vote or comment on monetisation, and what happened? If there is no visible log, or the log contains a change with no consultation entry before it, L12 fails.

#### L13 — Violence and conflict rewards isolated from the loop
- **Rule.** If the game contains combat, PvP, or destructive conflict, it must be opt-in, must not be required for any loop progress, and must not produce anything that can enter the loop. Conflict rewards must use a separate currency that cannot be converted into loop units, and must not alter loop standing, reputation, or access. Age-gate conflict content and label it.
- **Why it exists.** Grinding violence for progress is how a pleasant loop becomes a reward loop for harm. The cleanest fix is a boundary, not a promise.
- **How a studio complies.** If conflict exists, put it in separate maps/servers/modes behind an explicit opt-in with an age confirmation; give it its own currency that has no exchange; show in the export and in the UI that conflict units are marked "non-transferable"; keep loop units out of conflict as well, so the two economies never meet in either direction.
- **Violation test.** Play a conflict mode to its maximum reward, then return to the loop. Nothing from the conflict side may change a loop number — and nothing earned in the loop may be consumed by conflict. If the conversion exists in even one direction, L13 fails.

#### L14 — Data and API boundary
- **Rule.** No personal data may be sold, shared for advertising, or traded. Aggregated, anonymised data may leave the game only with the player's informed consent, and only in a form from which no individual can be reconstructed. External integrations may exchange non-personal data only, under a published allow-list.
- **Why it exists.** The same boundary that keeps ads out has to keep the data channel honest: encroachment arrives through APIs when it cannot get through the store page.
- **How a studio complies.** Write an allow-list of what leaves the game (e.g. "aggregate unit totals per region, weekly") and what never leaves (identity, chat, location, purchase history, saves); put consent in front of participation in any aggregate feature, default off; name every third party in the store's privacy text; if a leaderboard needs a name, let the player pick the display name.
- **Violation test.** Read the store's privacy block and look for an advertising identifier, an analytics SDK whose data is used for ads, or a "partners" clause with no names. Then turn consent off: the game must remain fully playable. If it degrades, L14 fails.

#### L15 — Honest claims
- **Rule.** Every public claim about the game and the layer must be checkable and true. A conforming game **must not** claim real-world income, universal basic income, health outcomes, environmental outcomes, ownership of crypto assets, or financial returns arising from play. Educational or inspirational intent may be described as intent, never as outcome, and must be phrased with the word "intend" or "may".
- **Why it exists.** The most damaging dishonesty in this design space is not a loot box — it is promising that play fixes the player's body, wallet, or planet. That promise is not ours to make and no game can keep it.
- **How a studio complies.** Read the store page and remove or reframe any claim that is not directly observable in play ("players restore 40 000 virtual hectares" is fine if true in-game; "playing funds forest restoration" is not allowed — no real-money conversion exists, §3.4); keep a claims list in the form, one line per public claim, each marked in-game-verifiable; if the studio donates to a cause independently, describe it as a studio donation, never as something play produced.
- **Violation test.** Take each marketing sentence and ask "could a sceptical stranger verify this in the game, this week?" Anything answered with "in principle" is a fail. Any sentence about money, health, or the real environment, in a document that is not labelled as intent, is a fail.

### 3.4 Permitted revenue models (the only ones)

A conforming game's revenue may come only from:

1. **Optional paid expansions** — large content additions (new regions, scenarios, factions with new decisions) that add no power and no shortcut.
2. **Voluntary patron tiers** — supporters pay for the same game everyone has, plus development notes, credits, and cosmetics that pass L9. Cancelling must cost nothing (L2).
3. **Funded pilots with studios, educators, or public bodies** — paid development or adaptation work, disclosed in the report under L11.
4. **A one-time price for the base game, if the studio chooses** — permitted, but only for a build where the whole loop is included, and only if the game is never additionally monetised inside the loop. Choose this *or* a free-to-play loop; not both. (See §7 Q4 — the owner has not ruled on this.)
5. **Optional, separately sold educational material** — curriculum packs, teaching notes. Content, not power.

**Excluded outright:** advertisements, loot boxes and any purchase of a chance, power or shortcut sales, paid exclusivity, data sales, paid entrance to the loop, and any conversion of in-game units into real money. **Blockchain, tokens, NFTs and smart-contract rails are out of scope for v0.1** — the layer is non-physical, and no unit in this document is a financial asset.

---

## 4. The incorporation form

One page. A designer fills this in and the filled form *is* the claim. All fifteen rules must pass. Post the filled form with the game (a patch-notes page or a `/layer` page on the site is enough), date it, and re-publish it whenever the economy changes.

```
THE GAMING LAYER — INCORPORATION FORM                    Form version: v0.1
==========================================================================
GAME ................................................  BUILD/DATE ........
STUDIO ..............................  SIZE (people) ......  CONTACT ......
GENRE ...............................  PLAY UNIT (run|turn|session) ......

PART A — LOOP SUMMARY (one line each)
  A1 Units (name each, with symbol) ......................................
  A2 Inputs  (time / skill / contribution / seed capital) ...............
  A3 Transformation (what the rules do to inputs) .......................
  A4 Faucets (unit, amount, per period, cost to player) .................
  A5 Sinks   (unit, amount, per period, what they return) ...............
  A6 Reinvestment — in-loop (mechanical) ................................
  A7 Reinvestment — meta (studio-level) .................................
  C-CONDITIONS: C1 legibility [ ]  C2 conservation [ ]  C3 no money in
  the transform [ ]  C4 recyclability [ ]  C5 exit integrity [ ]
  Balance arithmetic (faucets vs sinks vs stock change, band) ...........
  ......................... posted at (URL) .............................

PART B — EXIT PATH
  B1 Save location and offline play (yes/no) ............................
  B2 Export: format, where the button is, what it contains ..............
  B3 What happens to earned state if the studio closes a feature ........
  B4 Deletion: what is removed, what stays and why, window (days) .......
  B5 Bounded offline decay, if any (cap and recovery) ...................

PART C — PER-RULE PASS/FAIL (each line needs evidence, not intent)
  L1  Free entrance ................ PASS / FAIL  evidence: .............
  L2  Free exit .................... PASS / FAIL  evidence: .............
  L3  No locked value .............. PASS / FAIL  evidence: .............
  L4  Data portability + deletion .. PASS / FAIL  evidence: .............
  L5  No pay-to-win ................ PASS / FAIL  evidence: .............
  L6  No pay-to-skip ............... PASS / FAIL  evidence: .............
  L7  No injected ads .............. PASS / FAIL  evidence: .............
  L8  No scarcity/FOMO/gambling .... PASS / FAIL  evidence: .............
  L9  Cosmetics-only, ethical ...... PASS / FAIL  evidence: .............
  L10 Earned-only progression ...... PASS / FAIL  evidence: .............
  L11 Reinvestment report .......... PASS / FAIL  evidence: .............
  L12 Player voice ................. PASS / FAIL  evidence: .............
  L13 Conflict rewards isolated .... PASS / FAIL  evidence: .............
  L14 Data & API boundary .......... PASS / FAIL  evidence: .............
  L15 Honest claims ............... PASS / FAIL  evidence: .............
  Any FAIL means the game does not conform. Fix it or drop the claim.

PART D — REVENUE AND VOICE
  D1 Revenue models in use (only §3.4) ..................................
  D2 Excluded on purpose (ads / loot boxes / power / data / entrance) ...
  D3 Monetisation change log URL ........................................
  D4 Consultation mechanism and last consultation (date, question, result)
  D5 Reporting cadence (must be <= 6 months) and last report URL ........

PART E — CLAIMS AND SIGN-OFF
  E1 Public claims, one per line, each marked [in-game verifiable] ......
  E2 Claims intentionally NOT made: no real-world income, no UBI, no
     health outcome, no environmental outcome from play, no crypto
     ownership.  [confirmed: yes / no]
  E3 Signed (studio, name, role) ..............  Date ....................
==========================================================================
```

**How to fill it honestly.** Write the numbers you would defend to a stranger, not the numbers you would put on a store page. If a rule cannot be made to pass this week, write FAIL and say what would fix it — a published FAIL with a plan is a stronger claim than a confident PASS with no evidence. The free-text balance arithmetic in A4/A5 is the part that exposes most dishonest loops: write the faucet and sink totals for the same period and the resulting stock change.

---

## 5. Two worked samples

Both samples below use the §4 form, filled in. They are **illustrative incorporations, not announced products**: no studio has committed to either. They exist to show what a conforming answer looks like and where genre changes the answer.

### 5.1 Sample A — "Bin Runner", an 8-bit arcade game

*A 4-colour, 256×240 single-screen arcade game. You run a neighbourhood salvage bin: e-waste drops in, you sort it into chutes, strip the cable, and feed an assembler that prints a repaired audio jack. A run is 90 seconds. Made by two people.*

```
THE GAMING LAYER — INCORPORATION FORM                    Form version: v0.1
GAME  Bin Runner                       BUILD/DATE  demo 0.3 / 2026-09-28
STUDIO  (sample) Two-person indie       SIZE  2       CONTACT  (sample)
GENRE  8-bit arcade, single screen      PLAY UNIT  one 90-second run

PART A — LOOP SUMMARY
A1 Units: CS = Copper Strand (material); RS = Reclaim Shell (material);
   GF = Gold Flake (rare); CH = Charge (per-run energy); ST = Stamp
   (persistent meta currency); Landfill = mistake counter (not a currency);
   Wear = bench wears +1 per run.
A2 Inputs: time (one 90 s run); skill (sorting accuracy and reaction);
   contribution (players may submit a board layout, credited in-game);
   seed capital = board 1 unlocked, bench tier 1, 20 CH, 0 units.
A3 Transformation: each item that enters the bin may be sorted into the
   correct chute: +6 CS and +3 RS, costs 1 CH. Wrong chute: item goes to
   Landfill, -2 CH, no material. Finishing a run with 0 in Landfill pays
   +1 GF. The assembler prints 1 Repaired Jack from 40 CS + 25 RS, pays
   5 ST, and returns 12 CS of offcut.
A4 Faucets (per run, competent player ~30 items sorted, ~3 prints):
   CS: 180 (sorting) + 36 (assembler offcut) = 216
   RS: 90 (sorting)
   GF: 1 (perfect-sort bonus)
   ST: 15 (3 prints x 5)
   CH: 20 at run start, hard ceiling 20 (no faucet inside a run).
   Every faucet is rate-limited by the 90-second run and by CH.
A5 Sinks (per run):
   CS: 120 (3 prints x 40) + 30 (3 recycler uses x 10) = 150
   RS: 75 (3 prints x 25); 20 more every 5th run (bench repair)
   GF: bench tier 2 costs 8 GF; tier 3 costs 20 GF
   CH: 30 (one per sort action), refilled only by the recycler:
       10 CS -> 5 CH, maximum 3 uses per run (=15 CH per run).
   ST: board unlocks at 40 / 120 / 200 ST.
   CS meta sinks: bench tiers 300 CS / 800 CS. Unused CH is lost at run end.
A6 Reinvestment, in-loop: the recycler turns your own scrap into Charge
   (run fuel) and the assembler returns 12 CS offcut per print. Waste
   re-enters as input in both cases, inside the same run.
A7 Reinvestment, meta: ST unlocks 12 more boards and is never sold; every
   release adds boards or item types, never power; quarterly reinvestment
   report (L11); monetisation change log (L12).
C-CONDITIONS: C1 [x] C2 [x] C3 [x] C4 [x] C5 [x]
   Balance arithmetic: per run CS faucet 216 vs sinks 150 -> held stock
   +66 CS; minus 12 CS/run amortised bench repair = +54 CS per run
   (published band +40 to +70). RS: 90 in vs 75+4 out -> +11 per run.
   CS/RS stock is working capital, absorbed by the 300/800 CS bench
   tiers, so it does not grow without limit. Posted at /layer

PART B — EXIT PATH
B1 Save: local file (Saves/binrunner.sav), fully playable offline, yes.
B2 Export: in-game "Export" button -> binrunner-save.json (documented
   schema: units, bench tier, ST, board unlocks, ledgers, seed list) plus
   a PNG of your best board. No email, no account needed.
B3 If the studio retires the online leaderboard: saves and ST are
   untouched; leaderboard entries are archived to the export file.
B4 Deletion: removes account, cloud save, display name, telemetry id;
   keeps nothing but the anonymous aggregate of board scores with no
   identifiers. Window: 30 days.
B5 Offline decay: none. Nothing decays while you are away. No mail is
   sent for absence.

PART C — PER-RULE PASS/FAIL
L1  Free entrance ............ PASS  Free build, no store inside the game;
   fresh save reaches its first Repaired Jack in about 3 runs (~5 min).
L2  Free exit ................ PASS  No fee, no cancel step, no offline
   decay; quit at any moment from the pause menu (one button).
L3  No locked value .......... PASS  Everything earned is in the local
   save; export contains ST, boards, bench tier; playable offline.
L4  Data portability + delete  PASS  Button export (schema above); delete
   stated above, 30 days.
L5  No pay-to-win ........... PASS  There is nothing for sale inside the
   game and no paid item that changes CH ceiling, yields, or ST.
L6  No pay-to-skip .......... PASS  No purchase at all in the loop; the
   only accelerator is ST, earned by printing.
L7  No injected ads ......... PASS  No ad SDK in the build; sponsor, if
   any, appears only on the credits screen, labelled, no reward.
L8  No scarcity/FOMO/gambling PASS  No timer, no rotation, no randomised
   paid item; nothing is limited-time.
L9  Cosmetics only .......... PASS  Earned badges are the only cosmetics
   and are not for sale; the paid expansion adds boards, not looks.
L10 Earned-only progression . PASS  Unlock table published: 40/120/200 ST
   -> boards 2/3/4; measured time 12/35/60 runs on a published seed.
L11 Reinvestment report ..... PASS  Quarterly, 1 page, revenue by source,
   spend by category, and the excluded list.
L12 Player voice ........... PASS  Monetisation log with dates; players
   voted (41-6) on expansion pricing before it was set.
L13 Conflict isolated ...... PASS (N/A) No combat, no PvP, no destructive
   conflict exists in this game; nothing to isolate.
L14 Data & API boundary .... PASS  Leaves: anonymous board scores,
   opt-in. Never leaves: saves, display name, device id.
L15 Honest claims .......... PASS  Claims list: "sort 30 items in 90
   seconds", "restore a virtual bench to tier 3" - all in-game
   verifiable. No money, health, or real-environment claims made.

PART D — REVENUE AND VOICE
D1 Base game free. Optional paid expansion "Workshop" (12 boards, 6 item
   types, no power, no shortcut) and a voluntary patron tier (dev notes,
   credits, badge cosmetics).
D2 Excluded on purpose: ads, loot boxes, power, shortcuts, data, paid
   entrance, any unit->money conversion.
D3 /layer/monetisation-log   D4 Poll + open thread; last 2026-08-14
   ("price of Workshop"): 41 for EUR 5 / 6 against any price -> priced 5.
D5 Cadence quarterly; latest report /layer/report-2026Q3

PART E — CLAIMS AND SIGN-OFF
E1 "A 90-second sorting loop with no purchases in it" [in-game
   verifiable]; "12 boards" [verifiable]; "your save is a file you own"
   [verifiable].
E2 No real-world income, no UBI, no health outcome, no environmental
   outcome, no crypto ownership: confirmed yes.
E3 Signed (sample) ............................  Date 2026-09-28
```

**What genre changes here.** Because the play unit is a **bounded run**, conservation (C2) is easy to demonstrate: faucet and sink totals are counted per 90 seconds and the run cannot overshoot. Reinvestment can be **mechanical and immediate** — the recycler and the offcut mean waste re-enters inside the same run, which is the shortest possible loop. Exit is cheap because the whole save is one small file. And there is no need for decay rules: nothing is at stake between runs, so L2's "absence must not punish" is satisfied by doing nothing at all. The risk unique to this genre is the opposite of a sim's: too *little* stock, so the loop must be tested for whether the recycler economy can be gamed (see §6, assumption 3).

### 5.2 Sample B — "Ledger Vale", a non-overlaid settlement simulation

*A standalone settlement simulation: its own application, its own save, no tie to any existing title, nothing overlaid on anyone else's game. You run a 12-household valley across seasons. One turn = one in-game week. Made by three people.*

```
THE GAMING LAYER — INCORPORATION FORM                    Form version: v0.1
GAME  Ledger Vale                      BUILD/DATE  alpha 0.2 / 2026-09-28
STUDIO  (sample) Three-person studio    SIZE  3       CONTACT  (sample)
GENRE  Settlement / household sim       PLAY UNIT  one turn = one week

PART A — LOOP SUMMARY
A1 Units: G = Grain; T = Timber; F = Fibre; LH = Labour-hours;
   S = Soil Health (a stock 0-100, never spendable directly);
   LP = Ledger Points (meta progression); households = 12 (a capacity,
   not a currency).
A2 Inputs: time (one turn of decisions); skill (allocation of LH between
   tillage, woodlot, flax, compost, workshop); contribution (players may
   publish a scenario file, credited); seed capital = 12 households,
   1 tilled field x4, woodlot, flax patch, granary, 20 G / 15 T / 10 F.
A3 Transformation: yield = 3 G per tilled field x (S/100); 4 fields.
   Woodlot 6 T/week; flax 4 F/week; LH = households x 14 (12 -> 168).
   Compost: 3 G of waste + 12 LH -> +5 S (max 100). Tillage costs 20 LH
   per field per week and costs -1 S per field per week.
   Workshop: 8 T + 6 F + 16 LH -> 1 Dwelling (capacity +2 households,
   and +28 LH/week), returns 2 T offcut.
A4 Faucets (per turn, at S=70):
   G: 4 fields x 3 x 0.70 = 8.4 G (12.0 G at S=100)
   T: 6 T | F: 4 F | LH: 168 | S: +5 (compost) | LP: +3 per public work
A5 Sinks (per turn):
   G: household consumption 1 G x 12 = 12 G (a designed deficit at
      S=70: -3.6 G/week, closed by raising S, not by paying)
   G surplus: granary cap 60 G; above cap 5%/week rots (a sink that
   stops runaway accumulation)
   T: building wear 3 T/week; dwellings cost 8 T each
   F: household wear 2 F/week; dwellings cost 6 F each
   S: tillage -1 per field per week = -4/week (net +1/week while
   composting, which is the whole point of the loop)
   LH: field work 4 x 20 = 80, woodlot 40, flax 30, compost 12 = 162 of
   168 available; a workshop build costs 16 more, so building means
   diverting LH from a task that week. Unused LH is idle - no fee, and no
   stored value is lost.
   LP: tech tree 3 LP "fallow rotation" (-0.5 tillage S loss per field),
   9 LP "rain catchment" (+1 G per field in wet weeks), 20 LP "school"
   (+2 LH per household).
A6 Reinvestment, in-loop: waste -> compost -> Soil Health -> higher grain
   yield next turn; workshop offcuts return 2 T and 1 F; a finished
   Dwelling adds households, which add LH - and also mouths to feed, so
   growth raises both sides of the balance.
A7 Reinvestment, meta: free content patches add scenarios (drought, flood,
   market week) that add decisions and no power; quarterly reinvestment
   report; monetisation change log; no paid speed-ups at any time.
C-CONDITIONS: C1 [x] C2 [x] C3 [x] C4 [x] C5 [x]
   Balance arithmetic (S=70, turn 1): G in 8.4 vs out 12.0 -> -3.6 G/turn;
   stabilises at +-0.5 G/turn around S=98-100 (G in 11.8-12.0 vs out
   12.0). T in 6 vs out 3 = +3/turn, absorbed by 8 T Dwellings. F in 4 vs
   out 2 = +2/turn, absorbed by 6 F Dwellings. S +1/week (compost minus
   tillage) until the 100 cap, then compost rate is cut by the player -
   published band: S within +-2 of target, G stock within +-10% of 60
   cap. Posted at /layer

PART B — EXIT PATH
B1 Save: local JSON save + CSV turn log, offline-first, playable with no
   network; cloud save optional, off by default.
B2 Export: "Export ledger" in the pause menu -> ledgervale-save-v3.json
   (documented schema: units, households, S, LP, tech unlocks, all
   buildings, turn history) + ledgervale-log.csv (one row per turn:
   faucets, sinks, ending stock). No email needed.
B3 If the studio stops hosting, the export file is complete: the game is
   not a live service and the save is not a key. Scenarios shipped with
   the base build keep working.
B4 Deletion: removes account, cloud saves, published scenario credits,
   display name, telemetry id; keeps aggregate anonymised turn statistics
   (no identifiers, not reconstructable). Window: 30 days.
B5 Offline decay, bounded: after 12 offline turns, decay freezes - no
   further losses no matter how long you are away. On return you choose
   "resume" or "start fresh with seed capital" (20 G / 15 T / 10 F).

PART C — PER-RULE PASS/FAIL
L1  Free entrance ............ PASS  Free build; fresh save reaches its
   first Dwelling in 12 turns (~40 min); no store inside the sim.
L2  Free exit ................ PASS  Stop at any turn; decay freezes at
   12 turns; no notifications, no mail, nothing to cancel.
L3  No locked value .......... PASS  LP, tech unlocks, buildings and S
   all live in the exported save; offline, no server needed.
L4  Data portability + delete  PASS  Export button + 30-day deletion.
L5  No pay-to-win ........... PASS  No purchase affects G/T/F/LH/S/LP;
   scenario packs add decisions, not numbers.
L6  No pay-to-skip .......... PASS  No purchase accelerates a turn, a
   build, or a season; nothing in the sim is for sale.
L7  No injected ads ......... PASS  No ad SDK; sponsors credited in the
   About screen only, labelled, no reward.
L8  No scarcity/FOMO/gambling PASS  No timers, no seasons on sale, no
   randomised purchases, no streak that can be missed.
L9  Cosmetics only .......... PASS  Earned: village banners, ledger
   covers. Paid: none yet. If added: décor only, sorted separately from
   earned banners by 3 testers.
L10 Earned-only progression . PASS  Tech tree published: 3/9/20 LP rows,
   all earned by public works, measured at 4/11/24 turns by play.
L11 Reinvestment report ..... PASS  Quarterly 1-page report.
L12 Player voice ........... PASS  Monetisation log; scenario pack pricing
   consulted 2026-07-02 before release; majority answer published.
L13 Conflict isolated ...... PASS (N/A) No combat, PvP or destructive
   conflict mechanic exists; disputes are in-fiction, resolved by vote.
L14 Data & API boundary .... PASS  Scenario files are text and shareable;
   no personal data leaves; aggregate turn stats opt-in, default off.
L15 Honest claims .......... PASS  Claims: "12 households", "soil health
   is a real input to yield", "your ledger exports as CSV". No claim about
   real farms, real soil, or real income: none is made.

PART D — REVENUE AND VOICE
D1 Base game free (demo + full loop). Optional paid scenario pack
   ("Market Week": new decisions, no power) and a voluntary patron tier.
D2 Excluded on purpose: ads, loot boxes, power, skips, data, paid
   entrance, unit->money conversion.
D3 /layer/monetisation-log  D4 Open thread + in-game poll before each
   paid release; last 2026-07-02 on scenario pricing.
D5 Cadence quarterly; latest report /layer/report-2026Q3

PART E — CLAIMS AND SIGN-OFF
E1 "One turn = one week, and every number is listed in the turn log"
   [in-game verifiable]; "compost raises soil health" [verifiable];
   "your ledger exports as CSV" [verifiable].
E2 No real-world income, no UBI, no health outcome, no environmental
   outcome, no crypto ownership: confirmed yes.
E3 Signed (sample) ............................  Date 2026-09-28
```

**What genre changes here.** Because the play unit is a **turn with persistent state**, three things differ. (1) Conservation has to be shown over a long horizon, not a bounded run, so the sim needs stock caps and a rot rule — the granary's 5%/week sink is the genre's answer to the arcade's bounded run. (2) Reinvestment is **slow and state-based**: compost this week pays off in yield weeks later, and a Dwelling grows both the labour faucet and the food sink, so growth is not automatically good. (3) Exit is heavier: ledgers accumulate, so portability means a documented schema plus a CSV turn log, and offline decay has to exist for the fiction but must stop (L2) rather than keep biting. This is also where the loop most easily becomes a treadmill — a sim can enforce absence-punishment through "your settlement starved while you were away", which L2 forbids, so the decay freeze in B5 is a required design decision, not a nicety.

### 5.3 What binds identically across genres

| Answer | Sample A — arcade | Sample B — sim | Binding? |
|---|---|---|---|
| Play unit | one 90 s run | one turn (1 week) | **genre-dependent** |
| Loop shape | bounded, resettable | persistent, cumulative | genre-dependent |
| Conservation (C2) method | per-run faucet/sink arithmetic | stock caps, rot, long-horizon band | genre-dependent |
| Reinvestment shape | immediate (recycler, offcut) | delayed (compost, soil, dwellings) | genre-dependent |
| Surplus handling | working capital for bench tiers | granary cap + rot | genre-dependent |
| Seed capital | 20 CH, bench 1, board 1 | 12 households, 4 fields, 20 G/15 T/10 F | genre-dependent in size, identical in rule |
| Offline decay | none needed; nothing at stake | mandatory cap + freeze | genre-dependent in form, identical in requirement |
| Meta currency | Stamp -> boards | Ledger Points -> tech tree | genre-dependent in name/sink only |
| Free entrance / exit / portability / deletion | as stated | as stated | **identical (L1–L4)** |
| No money in the transform | as stated | as stated | **identical (C3, L5, L6)** |
| No ads, scarcity, FOMO, gambling | as stated | as stated | **identical (L7, L8, L9)** |
| Earned-only progression | as stated | as stated | **identical (L10)** |
| Reporting, player voice | as stated | as stated | **identical (L11, L12)** |
| Conflict isolation | N/A, no conflict | N/A, no conflict | **identical (L13)** |
| Data boundary, honest claims | as stated | as stated | **identical (L14, L15)** |

Seven of the fifteen rows above bind identically. Genre changes *what a loop is counted over* and *how reinvestment is paid back*; it changes nothing about who may pay, what may be bought, or what a player may take with them.

---

## 6. Honesty section

### 6.1 What this layer does not do

- **It does not produce real-world income.** No unit in a conforming game converts to money, and no player earns a living from it. Free exit (L3) is about keeping what you made, not about cashing it out.
- **It does not fund a universal basic income, health care, or anything else.** The source conversation contains a "meta-loop" in which in-game economies feed real-world funds (§ source lines ~1344–1396). That is an **aspiration of the owner's wider vision, not a deliverable of a game**, and it is **out of scope for v0.1** — nothing in this document permits or promises it. If that thread is ever revisited, it belongs to a different business and needs a completely different document.
- **It does not claim health or wellbeing outcomes.** Playing a well-built loop may be enjoyable and may teach something about circular thinking. It does not make anyone healthier, and no conformance claim may say it does.
- **It does not produce environmental outcomes.** Virtual soil, virtual e-waste and virtual forests are in-game quantities. Restoring them changes a save file.
- **It does not confer crypto ownership or any financial asset.** No tokens, no NFTs, no chains, no wallet, no secondary market. Source material that suggested blockchain ownership of in-game assets or smart-contract revenue splits is **out of scope for v0.1** (one line, per constraint).
- **It does not make a game good, popular, or funded.** It makes an economy honest and checkable.
- **It does not audit anyone.** v0.1 is a document and a self-published form. Every claim is a claim until someone outside runs the §3 violation tests.

### 6.2 The five riskiest assumptions, and the cheapest test for each

| # | Assumption | Why it is risky | Smallest cheap test |
|---|---|---|---|
| 1 | **Studios want an adoptable standard at all.** | If it is not wanted, the layer is a blog post. Most indie teams already believe they are ethical; a standard asks them to prove it. | Send 20 honest, individually written notes to real indie devs with the form attached, asking one question: "would you fill this in and publish it?" Count replies and refusals in 14 days. Cost: two afternoons. |
| 2 | **A loop stays fun without paid shortcuts.** | Every free-to-play game that added pay-to-skip did it because players asked to skip. If the loop cannot carry its own weight, the ethics have to be defended against demand. | Build the smallest playable version of Sample A's loop (one screen, no art), 5 testers play 3 runs each with no store present, then ask: "would you have paid to skip any of that?" If most say yes, the loop is too slow. Cost: one week for one person. |
| 3 | **Sinks can keep up with faucets without feeling punishing.** | If sinks are too weak, numbers inflate and play becomes trivial; if too strong, it feels like a tax and players leave (a conformance question under L2 and L6). | A spreadsheet simulation of 100 turns from the §5.1 and §5.2 numbers, tracking stock growth and player-time cost per unit. Target: stock growth inside the published band, no turn where a legal decision is impossible. Cost: one afternoon. |
| 4 | **A 1–3 person studio can comply in a normal patch cycle.** | Fifteen rules with published evidence is real work. A standard nobody can afford to maintain dies at the first patch. | Take an existing free indie game with no monetisation and fill the §4 form for it, timed. If it takes more than 90 minutes with the numbers already to hand, the form is too heavy and must shrink. Cost: 90 minutes. |
| 5 | **Players will believe the reinvestment report (L11).** | Revenue reporting can read as marketing, in which case trust does not rise and the rule costs effort for nothing. | Write a one-page sample report for a fictional game, show it to 20 players in an open thread, and ask one question: "what do you think we are hiding?" If the top answer is "the actual numbers", rewrite the report format before asking a real studio to publish one. Cost: half a day. |

All five tests are doable before any code is written, and between them they cost about two person-weeks. None of them requires a studio relationship to start.

---

## 7. Open questions for the owner

1. **Spec or game?** (The fork the business plan leaves open.) Is the layer a written standard studios adopt, or something players play directly? v0.1 is written to work as an adoptable standard: it makes no gameplay promises and needs no software. If the answer is "something players play", the next artefact is a playable loop, not a longer document — say which, because the follow-up work diverges completely.
2. **Does value ever leave the game?** v0.1 answers "no" in the strongest terms (§3.4, §6.1): no unit converts to money, so no regulation, identity checks, exchanges, or financial claims are needed. If the owner wants any conversion path, this document must be rewritten as a different class of product and the honesty section changes with it.
3. **What is already claimed elsewhere?** The owner's other businesses already hold UBI, regenerative health, circular-economy hardware, and related ideas. I have kept this layer to the game economy only and excluded the UBI/"meta-loop" thread entirely. Please confirm that is the intended slice, and whether the words "regenerative" and "circular" are safe to use on the layer's public page or are reserved for the other businesses.
4. **May a conforming game charge for the base game?** "Free entrance" (L1) says the loop must be reachable at zero cost. §3.4 item 4 allows a one-time base price *if the studio chooses*, which is a real tension: a premium game with no in-loop monetisation is honest but not free at the door. The owner should rule: (a) free entrance means free, one-time-priced games may not claim conformance; or (b) a one-time price counts as free entrance provided nothing is sold inside the loop.
5. **May a conforming game contain violence at all?** L13 isolates conflict rather than banning it. If the owner wants the layer's games to be non-violent as a matter of identity, that becomes a rule change (a new L16) and should be stated before any studio is approached, not after.
6. **Who keeps the list of conforming games?** Self-published forms only, or does the layer maintain a public register of claims (and later, of withdrawals)? This decides what the landing page has to be able to store, and it is an engineer's dependency, so it needs an answer before the page is built.
7. **What is this document called publicly?** "The Gaming Layer" as the product name and "Form & Structure v0.1" as the spec's name, or a shorter spec name for citation? Everything downstream (form header, page copy, patch-note line for studios) uses it.
8. **What licence is the spec under?** Adoptability depends on it. Open (e.g. permissive/public-domain style) invites adoption and prevents gatekeeping; a closed licence contradicts a layer that claims not to be a walled garden. My recommendation: publish it openly, no fee, no certification charge.
9. **What happens when a conforming game stops conforming?** There is no withdrawal procedure in v0.1. Do we need a stated amendment/sunset rule at v0.2 (e.g. "the studio must publish FAIL and remove the claim within 30 days")? Without it, a claim made once stays up forever.
10. **Is a partial or "in progress" claim allowed?** §4 says any FAIL means no conformance. A studio with one rule in progress currently has nowhere to sit between "not claiming" and "claiming". Options: a two-tier claim with a mandatory list of open FAILs, or keep conformance binary. My preference is binary plus a public "working towards" note, but this is the owner's call because it shapes what the layer's badge means.

---

## Appendix — where this document comes from, and what it excludes

Read from the owner's uploaded source conversation (`Untitled 2.txt`), sections: circular economy → closed-loop open system (lines ~145–215); gaming as the interface and the in-game closed-loop economy (~217–270); anti-encroachment, no pay-to-win, no pay-to-skip, cosmetics limits, no FOMO, transparency reporting, alternative revenue (~280–327); free entrance / free exit, transferable earned value, no locked value, data portability, right to be forgotten, no punitive exit (~333–385); how a layer protects the integrity of the loop — rewards isolated from conflict, API and data controls (~555–592).

**Excluded by the constraints for v0.1**, one line each:
- In-game economies feeding real-world funds / UBI / universal basic health (~1344–1396) — out of scope; an aspiration, not a game feature, and reserved for another business.
- Blockchain, NFTs, "true digital ownership", smart contracts, tokens, exchanges (~251, ~306–307, ~367–372, ~1387–1393) — out of scope; the layer is non-physical and no unit is a financial asset.
- Data-as-a-resource sold to researchers for revenue (~231, ~1395) — out of scope; L14 permits only consent-based, non-personal aggregates that never leave as a product.
- Physical components (merchandise, retail recycling, hardware access points) (~303, ~355–356) — out of scope; the layer is software-only.
- Health, cognitive and educational outcome claims (~241–247) — not deliverable and not claimable (L15).

*End of v0.1. Amendments go in as new rule numbers or as a renumbering note; nothing is edited silently.*


