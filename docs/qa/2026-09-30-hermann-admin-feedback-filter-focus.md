# Hermann administrator feedback filter focus — 2026-09-30

## Session

- Target: fresh isolated current-source `updater-vnext` service and disposable SQLite database; live 8788 untouched.
- Browser: headed Microsoft Edge 154.0.4258.37 via cached Playwright Core, disposable profile, 1280×900.
- Preflight: isolated health 200; exact parity for all six served UI assets, including current app.js `3e47741844e6329e6a089b553ccafa8a5144c7b8cda1c1ee6970757ba6367450` and CSS `a8b4940018d81333226db42bf7507c57af51b6cdc1e120ced4fb660a36e06423`.
- Fixture: synthetic admin submitted one Issue and one Feature request.

## Results

Both queue filters returned correct results: Submitted showed both requests; Feature showed only the Feature request. After changing either filter and waiting for the fetch to finish, `document.activeElement` was `#feedback-admin-status`, an empty `<p role="status" aria-live="polite" tabindex="-1">`. The initiating select no longer had focus and the screenshot showed no visible focus cue. Pressing Shift+Tab returned focus to the type filter, confirming users can recover but need an extra reverse-navigation step for subsequent filtering.

Finding: `FEEDBACK-FILTER-FOCUS-01` (P2). Preserve a visible focus target after filtering and announce completion/results without leaving focus on an empty status element. No page errors. Disposable service, DB, and browser profile removed.

## Artifacts

- Runner: `../output/playwright/admin-feedback-filter-focus-current-3e477-20260930/run.mjs`
- Results: `../output/playwright/admin-feedback-filter-focus-current-3e477-20260930/results.json`
- Screenshots: `../output/playwright/admin-feedback-filter-focus-current-3e477-20260930/status-filter-focus.png` and `type-filter-focus.png`
