# Hermann pending-member mobile gate and form validation — ad3

Date: 2026-09-30 local

## Runtime and browser readiness

- Isolated synthetic service at `http://127.0.0.1:8793`: health and root both returned HTTP 200.
- The test used the verified synthetic pending-member credential and disposable fixture at the scoped temp directory (`synthetic.sqlite`). No live service or real account was touched; port 8788 remained untouched.
- Headed Microsoft Edge 154.0.4258.37 at 320×800. Before login, all eight served UI assets (`index.html`, app.js, styles.css, navigation.js, feedback-drafts.js, feedback-triage.js, viewport.js, report-presentation.js) were byte-identical to workspace source. app.js SHA-256 `ad3cea5921901a7a17550455200f293df7c61b07663c8c5d1ed979c69579ef1f`; styles.css SHA-256 `61e43beb97e57899738c65e6662bd05107dc4e7d05899c2720fb915a841a06e0`.

## Browser acceptance

Pending-member login returned 200. Switching to Chinese showed the `账户` view, pending approval status, and the member feedback form. At 320 CSS px, document client and scroll widths matched (305 px while Account had a vertical scrollbar); there was no horizontal overflow.

Attempting to submit a deliberately short title and description retained native HTML validation: both fields remained invalid and focus moved to the title. The test observed no POST/PATCH/DELETE other than the expected synthetic `/api/auth/login` request; the invalid feedback draft was not submitted.

Opening Reports showed the Chinese pending-approval gate and zero report cards. Document client and scroll widths both measured 320 px in this no-vertical-scroll state. Screenshot visually inspected; no page errors or failed requests occurred.

## Artifacts and outcome

- [Machine results](../../output/playwright/live-feedback-user-story-suite-20260930/edge-pending-member-320-ad3-retry-results.json)
- [Screenshot](../../output/playwright/live-feedback-user-story-suite-20260930/edge-pending-member-320-ad3-retry.png)
- The first harness draft counted the expected login POST as a test-data write and therefore misreported a failure after all UI checks had passed. Corrected instrumentation separated login from application writes; final result is PASS with zero non-auth writes. This was a harness accounting issue, not an app.js or product failure.
- No new product defect found. Broader QA-01 role-story and native accessibility coverage remains in progress.
