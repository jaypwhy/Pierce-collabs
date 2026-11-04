# Documents / Shared

The team's shared document area. Anything meant to be read by more than one member lives
here, in a folder that says what it is. Working documents only — nothing here is ratified
strategy until the owner confirms it and it lands in the business plan.

```
Documents/
  Shared/
    new-games/        every additional game: one folder per game
      _template/      copy this to start a new game
      <game-slug>/    design.md, checks.py, verification.md, shots/
    specs/            the layer spec and its revisions
    designs/          per-game design documents for games already built
    verification/     what was built, what was tested, what is still open
    screenshots/      browser evidence of playable builds
    reference/        the owner's uploaded library from their other projects
    drop/             the /drop page's landing folder (uploads arrive here, then get filed)
```

Rules of the folder:

- **One game, one folder.** Slug matches the site route (`local-energy/` → `/local-energy`).
- **Design before build.** No game gets built until its `design.md` exists, covers all 15
  rules, and its balance band is machine-checked.
- **Evidence next to the work.** Screenshots and the verification note belong with the
  game, not in a scratch file at the top level.
- **Name files plainly.** `<game-slug>-design.md`, `<game-slug>-checks.py`,
  `<game-slug>-verification.md`.
- Scratch output goes in `_scratch/`, never here.

The owner cannot browse this folder — anything they need to read also goes on the working
site as a page (e.g. `/layer`, `/brick-break-design`).
