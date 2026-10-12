# Hermann admin feedback save/list recovery — 2026-09-30

## Runtime and scope

- Target: isolated current-source `updater-vnext` service with disposable synthetic admin/member accounts and feedback request. Live `127.0.0.1:8788` was not contacted by the browser runner.
- Browser: headed Microsoft Edge 154.0.4258.37, viewport 1280×900, Playwright Core.
- Source: runner verified exact parity for all six served UI assets.
- Purpose: verify an admin triage save remains understandable and recoverable if the subsequent queue refresh fails.

## Acceptance and results

PASS. Admin saved a synthetic request as Under review, priority High, with a public update. The triage PATCH returned HTTP 200. The next queue GET was deliberately failed with HTTP 503. The queue showed the error and Try again control, with `aria-busy=false`. Retrying loaded the saved Under review status and public update from the service. The run counted exactly one PATCH and three queue GETs (initial load, failed refresh, recovery); it did not repeat the save. Zero page errors.

The six-asset parity check passed. Disposable data/profile were removed and the isolated service stopped. Live 8788 was not touched. No defect found.

## Evidence

- Runner: `../../output/playwright/admin-feedback-post-save-refresh-retry-20260930/run.mjs`
- Results: `../../output/playwright/admin-feedback-post-save-refresh-retry-20260930/result.json`
- Screenshots: `../../output/playwright/admin-feedback-post-save-refresh-retry-20260930/post-save-refresh-error.png`, `../../output/playwright/admin-feedback-post-save-refresh-retry-20260930/post-save-recovered.png`
