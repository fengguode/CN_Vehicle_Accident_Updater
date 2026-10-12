# Hermann pending-member Account heading current-bundle regression — 2026-09-30

## Runtime and browser

- Target: fresh isolated current-source `updater-vnext` service with a disposable SQLite database; live 8788 received no authenticated requests or mutations.
- Browser: headed Microsoft Edge 154.0.4258.37 via cached Playwright Core, disposable profile, 844px height.
- Preflight: isolated health 200 and exact six-asset parity. `app.js` SHA-256 `3e47741844e6329e6a089b553ccafa8a5144c7b8cda1c1ee6970757ba6367450`; `styles.css` SHA-256 `a8b4940018d81333226db42bf7507c57af51b6cdc1e120ced4fb660a36e06423`.
- User: synthetic active, pending member; signed in with a synthetic password. Reports stayed gated.

## Measurements

- At 390×844, Chinese Account heading `账户` measured 48.9×72.3 CSS px and produced two text line rectangles (each glyph on its own line) beside the pending status. No overlap; status text remained fully rendered; document width was 375px.
- At 320×844, heading measured 61.1×36.2px with one line. Status wrapped below it and remained visible. Document width was 305px.
- No page errors. Isolated service stopped; disposable database/profile removed.

Outcome: `PASS_WITH_FINDING`; `UI-ACCOUNT-ZH-390-01` remains reproducible on current app/CSS hashes. This is a narrow responsive presentation issue; the pending status is not clipped.

## Artifacts

- Runner: `../output/playwright/pending-account-title-regression-3e477-20260929/run.mjs`
- Results: `../output/playwright/pending-account-title-regression-3e477-20260929/results.json`
- Screenshots: `../output/playwright/pending-account-title-regression-3e477-20260929/pending-account-390px.png` and `pending-account-320px.png`
