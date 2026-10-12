# Hermann delayed feedback response across account switch — 2026-09-30

## Runtime and browser

- Target: isolated current-source `updater-vnext` service with disposable SQLite DB; live 8788 untouched.
- Browser: headed Microsoft Edge 154.0.4258.37 via cached Playwright Core, disposable profile, 1280×900.
- Preflight: all six served UI assets exactly matched source; app.js SHA-256 `3e47741844e6329e6a089b553ccafa8a5144c7b8cda1c1ee6970757ba6367450`; CSS `a8b4940018d81333226db42bf7507c57af51b6cdc1e120ced4fb660a36e06423`.
- Accounts and request content were synthetic only.

## Scenario and result

PASS. A synthetic member submitted a feedback Issue. The isolated API accepted it (201), and Playwright held the response before the page received it. The member logged out; a synthetic admin logged in, saw the request attributed to the member, and triaged it to Under review with a public update and private admin note. After releasing the delayed 201 response, the admin Account showed no member success notice and no member request in the admin's own feedback list. The admin queue retained the correct Under review status, attribution, public update, and private note. No page errors.

The isolated service stopped and disposable database/profile were removed.

## Artifacts

- Runner: `../output/playwright/feedback-delayed-response-identity-current-3e477-20260930/run.mjs`
- Results: `../output/playwright/feedback-delayed-response-identity-current-3e477-20260930/results.json`
- Screenshots: `../output/playwright/feedback-delayed-response-identity-current-3e477-20260930/member-response-held.png` and `failure.png` if a failed run was captured
