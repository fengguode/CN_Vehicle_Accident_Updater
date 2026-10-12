# Hermann admin feedback queue retry — 2026-09-29

## Session

- Target: disposable current-source `updater-vnext` service on an ephemeral localhost port; fresh synthetic SQLite database and Edge profile.
- Browser: Microsoft Edge 154.0.4258.37, headed Playwright, viewport 1280×900.
- Readiness: isolated `/health` passed; `index.html`, `app.js`, `styles.css`, `navigation.js`, `report-presentation.js`, and `viewport.js` exactly matched the workspace source before browser checks.
- Scope: synthetic member creates one Issue; synthetic administrator opens Feedback queue while first `/api/admin/feedback` request is deliberately returned HTTP 503; verify loading ends, visible error and retry control; retry succeeds and queue renders the request with submitter attribution.

## Result

PASS. The first failed queue request rendered `synthetic_queue_failure` with “Try again”; `aria-busy` returned to `false`. Clicking retry issued the second request, cleared the error, and rendered “Synthetic retry request” submitted by `qa-retry-member`. No browser page errors. Both screenshots and structured evidence are in `output/playwright/admin-feedback-queue-retry-current-20260929/`.

The ephemeral service, database, and browser profile were removed; the service stopped. The live 8788 health endpoint still returned `{"ok":true,"service":"adas-vnext"}` and received no authenticated requests or mutations. Port 8793 refused connection, so the reported live-runtime queue hang remains unverified and `LIVE-FEEDBACK-01` remains open. This test verifies current-source transient-failure recovery only.

## Artifacts

- Runner: `../output/playwright/admin-feedback-queue-retry-current-20260929/run.mjs`
- Result: `../output/playwright/admin-feedback-queue-retry-current-20260929/result.json`
- Screenshots: `../output/playwright/admin-feedback-queue-retry-current-20260929/queue-error-retry.png` and `../output/playwright/admin-feedback-queue-retry-current-20260929/queue-retry-recovered.png`
