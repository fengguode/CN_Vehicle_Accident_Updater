# Feedback rate-limit localization fix QA — 2026-09-30

## Change

`apps/web/app.js` now maps HTTP 429 from feedback submission to a dedicated localized label: English “Submission limit reached. Try again later.” and Chinese “提交次数已达上限，请稍后重试。” Other non-429 server errors continue to display their response message; network failures retain their existing localized message. Existing draft, idempotency, enabled-submit, and focus-recovery behavior remains in the form handler.

## Verification

- `node --check apps/web/app.js` passed.
- Full `npm test` passed: 82/82, 0 failures.
- Dennis independently reviewed the branch and found no blocker. The current feedback endpoint's 429 path is the submission limit; other statuses and network errors retain existing behavior. The same idempotency key remains available for a later retry.
- Hermann's headed Microsoft Edge 154 test at 390×844 used isolated current-source service `127.0.0.1:8793`. All eight served UI assets matched workspace source; app.js SHA-256 `e64e7aacb3b25b2951e51880a208c7817c7e2b308e9d8c7ceaeeb6a249e5cfb1`.
- Playwright intercepted all three feedback POSTs before network: English HTTP 429 displayed the English label; a same-tab language switch to zh-CN and retry displayed the Chinese label; HTTP 400 retained its non-429 server message. All errors appeared in `role=status`, `aria-live=polite`; title and description stayed in the form, Submit was enabled, focus returned to `#feedback-submit`, and own-list IDs remained unchanged. No feedback record was written; page exceptions were zero.
- Browser results, screenshots, and cleanup evidence: [`output/playwright/hermann-feedback-i18n-ratelimit-edge-acceptance-20260930/`](../../output/playwright/hermann-feedback-i18n-ratelimit-edge-acceptance-20260930/). The runner's initial summary hash literal had a casing typo; the result was corrected after confirming byte-identical served/source hashes and reviewing the captured assertions.

## Result and limits

**FEEDBACK-I18N-RATELIMIT-01 passes.** English/Chinese rendered recovery and non-429 behavior passed. Actual server-side rate limiting was separately verified in [fresh isolated 429 acceptance](../../output/playwright/hermann-feedback-rate-limit-fresh-isolated-20260930/), with ten successful submissions followed by two HTTP 429 responses and full draft/focus recovery. These isolated tests do not close the shared 8788 runtime mismatch or full QA-01/release acceptance.

## Git state

`updater-vnext`, branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`; app.js, this QA note, backlog updates, and browser artifacts are uncommitted with the existing shared work. No commit/push or 8788 action.
