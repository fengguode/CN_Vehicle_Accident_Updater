# Hermann source-matched member feedback-list read regression (2026-09-30 14:04 local)

## Preflight

- Isolated synthetic service `http://127.0.0.1:8793`: `/health` returned `ok:true`; `/` returned HTTP 200.
- Microsoft Edge 154.0.4258.37, headed Playwright, fresh context, viewport 390×844.
- `apps/web/app.js` source and served asset both matched SHA-256 `67bf07b144453158a9b6c1f6ba229ba793f8575f462fb36d625597f4c0e4bce7`.
- Used synthetic approved member from disposable SQLite fixture; read-only journey. Port 8788 was not visited or changed.

## FEEDBACK-MY-LIST-DUPLICATE-GET-01

After signing in from Account, exactly one successful HTTP 200 `GET /api/feedback/mine` occurred; the rendered own-request list contained 13 records. After navigating Reports → Account, exactly one additional HTTP 200 list read occurred. Clicking Refresh my requests issued exactly one additional HTTP 200 read, and the same 13 records remained visible.

No page errors or failed requests occurred. Result: PASS for the tested load paths. A first harness draft assumed the fixture contained ten requests; the current fixture had thirteen, so the assertion was corrected to verify its observed list count remained stable across refresh. No product behavior was changed by the harness.

Machine evidence and screenshot: [`edge-current-source-single-feedback-list-read-results.json`](../../output/playwright/live-feedback-user-story-suite-20260930/edge-current-source-single-feedback-list-read-results.json), [`edge-current-source-single-feedback-list-read.mjs`](../../output/playwright/live-feedback-user-story-suite-20260930/edge-current-source-single-feedback-list-read.mjs), and [`edge-current-source-single-feedback-list-read-390.png`](../../output/playwright/live-feedback-user-story-suite-20260930/edge-current-source-single-feedback-list-read-390.png).

The item has a reviewed fix, 5/5 focused source tests and 83/83 full suite recorded in the canonical backlog; this browser pass closes the remaining current-source load-path acceptance. Cross-account stale-response isolation was separately passed in prior isolated Edge QA. No account or request data was mutated.
