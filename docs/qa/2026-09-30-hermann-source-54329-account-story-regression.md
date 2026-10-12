# Hermann source-matched password and account regression (2026-09-30 12:26 local)

## Target and preflight

- Isolated synthetic service: `http://127.0.0.1:8793`; `/health` returned `{ok:true,service:"adas-vnext"}` and `/` returned HTTP 200.
- Browser: Microsoft Edge 154.0.4258.37, headed Playwright, fresh context, viewport 390×844 for password checks and 1280×900 for account read-count check.
- Served `apps/web/app.js` SHA-256 exactly matched requested source `54329f8ce5883bc2e86caab93cc6fb197aef72fd195771005efc48d1229a4d5e`.
- Only synthetic account `qa_story_munkrahk` was used on the disposable SQLite fixture. Port 8788 was not visited, authenticated, mutated, or restarted.

## UX-AUTH-I18N-01 password-change rejection regression

Logged into the synthetic approved member account (HTTP 200) and submitted four invalid password-change combinations. Each `/api/auth/password` response was HTTP 400 and each message matched the selected language:

| Language | Case | Rendered status |
| --- | --- | --- |
| English | Wrong current password | `Current password is incorrect.` |
| Chinese | Wrong current password | `当前密码不正确。` |
| English | New password equals current | `Choose a password different from the current one.` |
| Chinese | New password equals current | `新密码不能与当前密码相同。` |

All four errors used `role="status"` and `aria-live="polite"`; both fields retained their submitted values; Submit became enabled and regained focus. No page errors or failed requests occurred. Afterward, logging out and signing in with the original password succeeded (HTTP 200), confirming it was unchanged. Result: PASS for browser regression on the requested source hash. See [`edge-password-error-localization-results.json`](../../output/playwright/live-feedback-user-story-suite-20260930/edge-password-error-localization-results.json), [`edge-password-error-localization.mjs`](../../output/playwright/live-feedback-user-story-suite-20260930/edge-password-error-localization.mjs), and screenshot in the same directory. Dennis independently reviewed the exact source SHA-256 `54329f8ce5883bc2e86caab93cc6fb197aef72fd195771005efc48d1229a4d5e`, confirmed that both API validation strings map to the current locale, unknown errors preserve the existing fallback, and form/status/focus behavior is unchanged; no actionable blocker was found. The worker's full `npm test` passed 82/82, with focused feedback API test 1/1 and `node --check` passing. **UX-AUTH-I18N-01 is Complete** with source, independent review, automated checks, and headed Edge acceptance recorded.

## FEEDBACK-MY-LIST-DUPLICATE-GET-01 current-source recheck

A fresh Edge context signed in to Account as the same synthetic approved user and recorded two successful `GET /api/feedback/mine` responses (both HTTP 200) during login render. The previously reported redundant read remains reproducible on source hash `54329f8c…`; the backlog item stays In progress. No page errors occurred. See [`edge-current-member-list-read-count-results.json`](../../output/playwright/live-feedback-user-story-suite-20260930/edge-current-member-list-read-count-results.json), runner and screenshot alongside the result.

## Disposition

These are focused account/feedback-list acceptance checks, not whole-system completion. Existing role-story matrix, native assistive-technology/device scope, live service gate, and other backlog items remain governed by the canonical backlog. No service was restarted or production data changed.

