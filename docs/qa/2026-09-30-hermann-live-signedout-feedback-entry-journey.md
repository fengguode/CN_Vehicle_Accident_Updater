# Hermann live signed-out feedback entry journey — 2026-09-30

## Runtime and scope

- Target: live `updater-vnext` at `http://127.0.0.1:8788`; `/health` returned 200 with service `adas-vnext` before and during the browser run.
- Browser: headed Microsoft Edge 154.0.4258.37, viewport 390×844, Playwright Core, disposable profile.
- The six served UI assets returned 200 and byte-matched the current `apps/web` workspace files.
- Scope was read-only: browser network contained only GET requests. Authenticated writes were not attempted because live account/database binding remains unknown.

## Results

PASS. Signed-out Reports showed the sign-in gate and one Open account control. Activating it opened Account and focused Username. Returning to Reports and using the header Log in shortcut also opened Account with Username focused. Feedback form and admin navigation remained hidden. GET `/api/feedback/mine` and `/api/admin/feedback` returned 401 `authentication_required`. Registration with a one-character username showed native validation, focused Username, and sent no registration request. Switching to Chinese translated the registration action; protected feedback navigation remained hidden. No page errors; the two expected console 401s correspond to the intentional protected-route checks. Profile removed.

No defect found. This pass verifies the live signed-out journey only; member/admin lifecycle remains covered by isolated synthetic sessions.

## Evidence

- Runner: `../../output/playwright/live-signedout-entry-journey-20260930/run.mjs`
- Results: `../../output/playwright/live-signedout-entry-journey-20260930/results.json`
- Screenshots: `../../output/playwright/live-signedout-entry-journey-20260930/signedout-invalid-registration.png`, `../../output/playwright/live-signedout-entry-journey-20260930/signedout-registration-zh.png`
