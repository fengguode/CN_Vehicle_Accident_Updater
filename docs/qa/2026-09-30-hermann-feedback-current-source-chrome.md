# Hermann current-source feedback lifecycle in Chrome — 2026-09-30

## Runtime and safety

- Target: ephemeral `apps/api/server.js` at `http://127.0.0.1:55990`, fresh synthetic SQLite database and test-only accounts. Health returned 200; HTML, app, and CSS matched workspace source.
- Browser: Google Chrome 153.0.8010.54, headed Playwright Core, 390×844 CSS px.
- No authenticated request or mutation was sent to live 8788. The isolated service stopped and its database and browser profile were removed.

## Result

PASS. Admin reviewed and triaged a 105-request synthetic queue. A member submitted a Feature (HTTP 201), saw it in their own history, and the admin saw it with submitter attribution. The check covered English/Chinese success confirmation, retryable 503 with draft retained, public-update visibility, private-note exclusion, cross-tab admin draft clearing, and responsive overflow. No page errors or horizontal overflow occurred.

Machine results, harness, and screenshots: [`output/playwright/feedback-submission-chrome-current-source-20260930/`](../../output/playwright/feedback-submission-chrome-current-source-20260930/). This confirms current-source Chrome behavior only; the active 8788 runtime continues to return 404 for both feedback modules, and its database identity remains unknown. `LIVE-FEEDBACK-01` remains In progress.
