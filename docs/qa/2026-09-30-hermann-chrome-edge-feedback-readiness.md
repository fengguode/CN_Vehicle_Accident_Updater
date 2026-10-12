# Hermann Chrome and Edge isolated feedback readiness — 2026-09-30

## Runtime and safety

- Target: isolated current-source `updater-vnext` service at `http://127.0.0.1:49840`, using a fresh synthetic SQLite database and synthetic admin/member accounts. `8788` was not used for authenticated requests or writes.
- Browsers: Google Chrome 153.0.8010.54 and Microsoft Edge 154.0.4258.37, launched through the bundled Playwright Core API from their installed executables with distinct fresh temporary profiles; 1280×900 CSS px each.
- Health returned `{"ok":true,"service":"adas-vnext"}`. The six served UI assets (`index.html`, `app.js`, `styles.css`, `navigation.js`, `report-presentation.js`, `viewport.js`) matched workspace source byte-for-byte.
- Only GET requests were sent by the browser. No sign-in or feedback writes were attempted because the app bootstrap failed first.

## Reproduction and result

P1 product blocker reproduced in both Chrome and Edge. Current `apps/web/app.js` imports `./feedback-drafts.js`, and the source file exists, but `apps/api/server.js` does not expose that module in its static asset map. The isolated service returned HTTP 404 for `GET /feedback-drafts.js`. Both browsers logged the 404 and rendered the static page shell with a permanent “Loading reports…” message, visible database search controls, and the signed-out access notice hidden. Clicking Account did not navigate: `#reports-view` remained visible and `#account-view` stayed hidden. Browser page-error event count was zero, but the module-load 404 was reported in the browser console.

The live listener at 8788 returned health 200 and the same `app.js` bytes as workspace; `GET /feedback-drafts.js` also returned 404. This confirms the serving contract problem is present on the live bundle. No live sign-in, role journey, or write was attempted.

## Evidence and cleanup

- [Chrome screenshot](../../output/playwright/chrome-edge-isolated-feedback-lifecycle-20260930/chrome-isolated-render.png)
- [Edge screenshot](../../output/playwright/chrome-edge-isolated-feedback-lifecycle-20260930/edge-isolated-render.png)
- [Runner and machine-readable results](../../output/playwright/chrome-edge-isolated-feedback-lifecycle-20260930/)
- The isolated service was stopped; the fresh temporary database directory and both browser profiles were removed. Port 8788 remains healthy and untouched by role mutations.

## Finding and acceptance

`UX-APP-BOOTSTRAP-MODULE-404-01` remains In progress. Add a correct same-origin serving route for the imported module (or bundle the dependency), then verify Chrome and Edge on fresh profiles: no module 404 or console errors; signed-out access gate is visible and database controls are hidden; Account navigation/login works; approved member can submit and view feedback; admin can load and triage the queue; member sees public updates and never private notes. Run the full lifecycle on an isolated disposable database before any live authenticated recheck.
