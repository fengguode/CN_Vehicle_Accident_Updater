# FEEDBACK-I18N-NETWORK-01 implementation QA — 2026-09-30

## Acceptance

When a feedback submission fails before receiving an HTTP response, show an English or Chinese message that explains the request status is unknown and the draft remains in the current tab. Keep the submit control enabled and focused. A retry must succeed without losing the draft or creating an extra request. Preserve server-provided messages for HTTP responses that include a status.

## Implementation

`apps/web/app.js` adds `feedbackNetworkError` copy to both locales. The member submission catch uses that localized fallback only when `error.status == null`; errors with HTTP status continue to show the API message or the existing localized generic error. Draft snapshot and idempotency handling are unchanged.

## Verification

- `node --check apps/web/app.js`: passed.
- Headed Microsoft Edge 154.0.4258.37 via Playwright Core; isolated current-source service and synthetic SQLite database; disposable profile; viewport 1280×900.
- All eight served assets (`index.html`, `app.js`, CSS, navigation, report presentation, viewport, `feedback-drafts.js`, `feedback-triage.js`) matched source.
- English: aborted POST showed the localized unknown-status message, retained exact title/description, left submit enabled/focused, and created no card. Retry returned 201, cleared the form, and created one request.
- zh-CN: aborted POST showed the localized unknown-status message, retained exact title/description, left submit enabled/focused, and created no additional card beyond the earlier English success. Retry returned 201 and created exactly one additional request. Two requests existed after the two successful retries.
- No page errors. Both failed submissions were deliberate browser-route aborts; both retries succeeded. Isolated service stopped, database/profile removed, temporary port closed, and live 8788 untouched.
- The first harness run failed only because its Chinese assertion expected zero cards after the English retry had correctly created one. The corrected run asserts the unchanged count of one on Chinese failure and exactly two after the Chinese retry; final result passed.

Artifacts: [runner](../../output/playwright/feedback-network-localization-fix-20260930/run.mjs), [results and screenshots](../../output/playwright/feedback-network-localization-fix-20260930/).

## Review state

Primary implementation and isolated bilingual browser checks pass. Dennis completed a read-only review with no actionable issue; he confirmed HTTP error messages remain intact and the same-payload retry reuses its idempotency key. Independent Hermann User Tester confirmation is pending; keep the backlog item In progress until that gate completes.

## Git state

`updater-vnext`, branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`, ahead 18. Source, QA, runner/results/screenshots, and backlog remain uncommitted in the already-dirty shared tree; no commit/push.
