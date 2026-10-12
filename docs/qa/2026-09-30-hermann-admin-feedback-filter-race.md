# Hermann administrator feedback stale-filter response race — 2026-09-30

## Session

- Target: isolated current-source service, fresh disposable SQLite DB; live 8788 untouched.
- Browser: headed Microsoft Edge 154 via cached Playwright Core, disposable profile, 1280×900.
- Preflight: exact six-asset parity; app.js SHA-256 `3e47741844e6329e6a089b553ccafa8a5144c7b8cda1c1ee6970757ba6367450`; CSS `a8b4940018d81333226db42bf7507c57af51b6cdc1e120ced4fb660a36e06423`.
- Fixture: synthetic administrator and one synthetic Issue plus one Feature request.

## Results

PASS. After clearing filters, the status-only Submitted request was held after an HTTP 200 response. The admin then applied Type=Feature; the newer request returned the one expected Feature card while both filters remained selected. Releasing the older status-only response did not replace the newer one-result list or alter the selected filters. No page errors. Isolated service, DB, and profile removed.

The related `FEEDBACK-FILTER-FOCUS-01` focus issue remains open; this race check verifies only stale-response handling.

## Artifacts

- Runner: `../output/playwright/admin-feedback-filter-race-current-3e477-20260930/run.mjs`
- Results: `../output/playwright/admin-feedback-filter-race-current-3e477-20260930/results.json`
- Screenshot: `../output/playwright/admin-feedback-filter-race-current-3e477-20260930/stale-filter-response-ignored.png`
