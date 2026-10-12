# Hermann live signed-out continuation — 2026-09-29

## Runtime readiness

- Target: live `updater-vnext` at `http://127.0.0.1:8788`; `/health` returned 200 (`adas-vnext`). Port 8793 refused connections.
- Browser bridge reported `Unable to load browser request-header policy`; the Playwright CLI wrapper could not run in this PowerShell environment. Bounded fallback: headed Microsoft Edge via cached Playwright Core, isolated disposable profile, 390×844 viewport.
- The six served UI assets (HTML, app.js, styles.css, navigation.js, report-presentation.js, viewport.js) byte-matched `apps/web` in the current workspace. `/api/auth/me` returned user-null; `/api/feedback/mine` returned 401. No authentication or write requests were made.

## Results

PASS: the Reports access gate and Account entry rendered; signed-out user-management, Feedback-admin navigation, and feedback submission form were hidden. Registration view showed username, password, required invitation code, and one-use invitation guidance. At 390px, document width equaled viewport width. No page errors. Disposable browser profile was removed.

No new defect was found in this pass. Authenticated live journeys remain out of scope while port 8788's DB/process identity is unknown. The live Feedback loading report remains open under `LIVE-FEEDBACK-01` because port 8793 is unavailable and no authenticated live runtime can be safely verified.

## Artifacts

- Runner: `../output/playwright/live-signedout-continuation-20260929/run.mjs`
- Result: `../output/playwright/live-signedout-continuation-20260929/result.json`
- Screenshots: `../output/playwright/live-signedout-continuation-20260929/signed-out-shell.png` and `../output/playwright/live-signedout-continuation-20260929/signed-out-registration.png`
