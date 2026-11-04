# New games — shared workspace

Working folder for every **additional game** The Gaming Layer builds. One folder per
game, everything about that game inside it. Nothing here is ratified strategy until the
owner says so and it lands in the business plan — these are the team's working documents.

## Layout

```
new-games/
  README.md            <- this file
  _template/           <- copy this to start a new game
  <game-slug>/
    design.md          <- the closed-loop design (designer writes this FIRST)
    checks.py          <- machine check of the balance band / conservation
    verification.md    <- what was built and what was actually tested
    shots/             <- browser screenshots of the playable build
```

`<game-slug>` is lowercase-with-hyphens and matches the site route, e.g. `local-energy`
lives at `/local-energy`.

## The pipeline for each game (do not skip step 1)

1. **Design first.** The game-systems designer writes `design.md` covering all 15 rules
   (L1 free entrance … L15 honest claims), the five closed-loop conditions, faucets,
   sinks, the meta currency, earned powers, the adoption form filled in for this game,
   and a balance band. Include the arithmetic.
2. **Machine-check the band.** `checks.py` recomputes the band and conservation. A design
   whose numbers only work on paper is not done.
3. **Build it playable.** The engineer builds the route, with powers baked in from the
   start, then verifies in a browser and drops screenshots in `shots/`.
4. **Write `verification.md`** — what was tested, how, and what is still open.
5. **Put it in front of the owner.** Add a design page route (e.g. `/local-energy-design`)
   so the owner can read it on the working site; the owner cannot see this folder.

## Standing constraints for every game

- Free entrance, free exit. No ads, no pay-to-win, no pay-to-skip, no forced timers.
- Powers raise what a player can **do**, never what the game can **pay** — the faucet
  ceiling stays fixed.
- No real-world health, energy or environmental claims (L15). Fictional loops only.
- Batch/turn-based cadence where possible: nothing advances on wall-clock time unless the
  design says so explicitly.
- Simplicity is the bar — a newcomer should understand the loop from the first screen.

## Games queued from the owner's order

| Game | Folder | Status |
| --- | --- | --- |
| Compost to Soil | *(done — lives at `../../compost-to-soil-design.md`)* | built & verified |
| Local Energy | `local-energy/` | design next |
| Repair Cafe / Library of Things | `repair-cafe/` | design done (checks.py green) — build next |
| Preventative Health | `preventative-health/` | queued |

Any further games the owner names get a folder here and a row in this table.
