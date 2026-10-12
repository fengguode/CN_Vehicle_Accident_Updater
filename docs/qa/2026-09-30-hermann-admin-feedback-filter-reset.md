# Hermann administrator feedback empty-filter recovery — 2026-09-30

## Session

- Target: isolated current-source service and disposable SQLite database; live 8788 received no authenticated traffic or writes.
- Browser: headed Microsoft Edge 154, cached Playwright Core, disposable profile, 1280×900.
- Preflight: all six UI assets matched source; app.js SHA-256 `3e47741844e6329e6a089b553ccafa8a5144c7b8cda1c1ee6970757ba6367450`; CSS `a8b4940018d81333226db42bf7507c57af51b6cdc1e120ced4fb660a36e06423`.
- Data: two synthetic admin-submitted feedback requests, one Issue and one Feature.

## Results

PASS. The initial queue showed two requests. Status=Submitted retained both; Type=Feature narrowed to one. Status=Complete returned zero cards and the “There are no requests to review.” announcement; Load older was hidden. Clearing status while keeping Feature restored one card, then clearing both filters restored both cards. No page errors; isolated service, database, and profile removed. This verifies filter result/reset behavior; the separate `FEEDBACK-FILTER-FOCUS-01` finding about focus moving to an empty status element remains open.

## Artifacts

- Runner: `../output/playwright/admin-feedback-filter-reset-current-3e477-20260930/run.mjs`
- Results: `../output/playwright/admin-feedback-filter-reset-current-3e477-20260930/results.json`
- Screenshots: `../output/playwright/admin-feedback-filter-reset-current-3e477-20260930/no-matches.png` and `filters-cleared.png`
