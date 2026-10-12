# Hermann current-source signed-out, member, and admin journeys (2026-09-30 14:06 local)

## Preflight

- Isolated disposable `updater-vnext` service `http://127.0.0.1:8793`: `/health` reported `ok:true`; UI root returned HTTP 200.
- Browser: headed Chrome 153.0.8010.54 via Playwright; fresh browser context per role; viewport 1280×900.
- Workspace and served `apps/web/app.js` matched SHA-256 `67bf07b144453158a9b6c1f6ba229ba793f8575f462fb36d625597f4c0e4bce7`.
- Used synthetic signed-out, approved-member, and admin journeys on disposable SQLite fixture. No write operations were made. Port 8788 was not visited, authenticated, or modified.

## Role results

- **Signed out:** `/api/auth/me` returned 200 with anonymous state; protected `/api/reports`, `/api/feedback/mine`, and `/api/admin/feedback` returned 401. Account registration helper displayed the invitation-only instruction and invitation input.
- **Approved member:** UI login returned 200; Reports rendered three report cards with access notice hidden; Account rendered 13 own feedback cards. Admin Feedback and Media Review navigation remained hidden.
- **Administrator:** UI login returned 200; Feedback queue rendered 29 cards, Status=Under review narrowed it to three; User management and Media Review navigation were visible and User management content rendered.

All journeys passed. Chrome recorded zero page exceptions and zero failed requests. No new UX defect was confirmed in this read-only pass. Full machine evidence and screenshots: [`chrome-current-source-role-journeys-results.json`](../../output/playwright/live-feedback-user-story-suite-20260930/chrome-current-source-role-journeys-results.json) and adjacent `chrome-current-source-*-1280.png` files.

This adds a current-hash role recheck; it does not close the broader user-story matrix or separate open backlog findings.
