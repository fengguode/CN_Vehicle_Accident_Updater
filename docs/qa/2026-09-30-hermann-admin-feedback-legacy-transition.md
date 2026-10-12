# Hermann administrator legacy feedback transition — 2026-09-30

## Session

- Target: isolated current-source service and disposable SQLite DB/Edge profile; live 8788 untouched.
- Browser: headed Microsoft Edge 154.0.4258.37, 1280×900.
- Preflight: isolated health 200, exact six-asset parity (`app.js` `3e47741844e6329e6a089b553ccafa8a5144c7b8cda1c1ee6970757ba6367450`, CSS `a8b4940018d81333226db42bf7507c57af51b6cdc1e120ced4fb660a36e06423`).
- Fixture: synthetic member request placed in retired `Needs information` state.

## Result

PASS. Admin triage rendered the legacy-status help and defaulted the selector to Under review. Attempting to save a priority change without a public update returned 400 with “Add a public update before moving this legacy request to Under review.” The status stayed unchanged; the form retained the draft and focused Save. Adding a public update then returned 200. The member saw Under review and the public request for details in history. Zero page errors; isolated service/DB/profile removed.

No legacy transition defect found.

## Evidence

- Runner: `../output/playwright/admin-feedback-legacy-public-update-20260930/run.mjs`
- Results: `../output/playwright/admin-feedback-legacy-public-update-20260930/result.json`
- Screenshots: `../output/playwright/admin-feedback-legacy-public-update-20260930/legacy-transition-no-public-update-admin.png`, `legacy-transition-submitters-no-update.png`
