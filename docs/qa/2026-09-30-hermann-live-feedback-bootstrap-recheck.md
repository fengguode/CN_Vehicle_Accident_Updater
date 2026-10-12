# Hermann live feedback bootstrap recheck — 2026-09-30

## Target and safety

- Target: `http://127.0.0.1:8788/`; `/health` returned `200`, service `adas-vnext`.
- Browsers: fresh headless Chrome and Edge instances launched with Playwright Core, viewport 1280×900. Browser results and screenshots are in [`output/playwright/live-bootstrap-recheck-20260930/`](../../output/playwright/live-bootstrap-recheck-20260930/).
- No sign-in, account, feedback form, or API mutation was attempted. The only UI action was clicking the visible Account navigation link. The link did not navigate; Reports stayed visible and Account stayed hidden.

## Evidence

- Both browser engines returned HTTP 200 for `/`, rendered the static Reports shell with “Loading reports…”, and logged resource 404 errors.
- Read-only route checks: `/app.js`, `/navigation.js`, `/report-presentation.js`, `/viewport.js`, and `/styles.css` returned 200; `/feedback-drafts.js` and `/feedback-triage.js` returned 404. `/app.js` imports both missing modules.
- The live `/app.js` SHA-256 (`8ACC3E9B194F4DD225CFF16960B4B660B285E3FB1B78EE760AE67FB5A10C74DD`) matches workspace source. The current `apps/api/server.js` asset map includes both missing module routes. This means the active listener's route behavior differs from current server source; a stale in-memory server process is a likely explanation, not directly verified here.
- No user or database identity was established. No service restart, authentication, or write was attempted.

## Result

Signed-out browser journeys still cannot proceed on the active listener, and member/admin journeys remain untested there. The source-level module-route fix exists, but the active runtime does not serve those routes. Keep `LIVE-FEEDBACK-01` In progress pending safe runtime/database identification and an authorized way to validate or activate the current build. The separate source finding `UX-APP-BOOTSTRAP-MODULE-404-01` remains Complete for current-source behavior; this is an active-runtime mismatch under `LIVE-FEEDBACK-01`.
