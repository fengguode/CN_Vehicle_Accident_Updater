# Feedback success message color fix — 2026-09-29

## Finding and scope

Hermann found that successful feedback submission text used the same red color as validation/server errors because `#feedback-message` shared `.account-message`. In [the canonical backlog](../PROJECT_BACKLOG.md), this is tracked as `UX-FEEDBACK-SUCCESS-01`. Acceptance requires a distinct success color while retaining error red, polite status messaging, request ID, own-list update, member/admin visibility, and responsive layout.

## Change

The feedback submit handler now clears the success state when a new submission begins and on failure, and sets `.success` only after a successful 201 response. `.account-message.success` uses the existing `--green` token; error styling remains `#9b342b`.

## QA session

- Target: isolated current-source `apps/api/server.js`, ephemeral port 61917, synthetic SQLite database and accounts; port 8788 was not contacted.
- Browser: headed Microsoft Edge 154.0.4258.37, direct Playwright Node API, 390×844 CSS px.
- Current app.js SHA-256: `9f56a4081a8d3f6369b52d1805d8960ef6d86bbab2b9a21cd94e697654adfc1f`.
- Current styles.css SHA-256: `cde5d66726ddfa3f7c8ec20fcb195abe80589c8ea580d70ef2a7f8764d8c9583`.
- Results: member Feature POST returned 201 in both Chinese and English; own list displayed the submitted requests and IDs; separately authenticated admin queue displayed the request with submitter attribution. Success confirmation computed color `rgb(23, 107, 80)` in both locales. A synthetic 503 retained the second draft, re-enabled Submit, and retained error color `rgb(155, 52, 43)` with no success class. No browser errors or horizontal overflow; isolated service/database/profile cleanup passed.
- Automated checks: `node --check apps/web/app.js` passed; `npm test` passed 67/67. Headed UI session command: `node output/playwright/feedback-submission-current-source-20260929/run.mjs`; result `PASS`.

Machine-readable results: [`results.json`](../../output/playwright/feedback-submission-current-source-20260929/results.json), SHA-256 `3B5142AE441E5E4ACE00E623383B405B5D3FF9616380C2014DD7711836803EED`; screenshots include [successful member submission](../../output/playwright/feedback-submission-current-source-20260929/member-submission-own-list-390x844.png), [red error state](../../output/playwright/feedback-submission-current-source-20260929/member-submission-error-remains-red-390x844.png), and [admin queue](../../output/playwright/feedback-submission-current-source-20260929/admin-queue-member-submission-390x844.png). Earlier harness setup failures and their disposition are documented in [submission QA](2026-09-29-feedback-submission-current-source.md).

## Review and Git state

Hermann's post-fix visual recheck confirmed the successful screenshot uses green while the synthetic 503 screenshot remains red; assertions and cleanup are consistent. Dennis independently reviewed the current code and final artifacts and found no code issue. Yuzhou confirmed that localized success copy plus green and red states are clearly distinct and consistent with the existing inline style. `UX-FEEDBACK-SUCCESS-01` is Complete for the stated 390×844 scope. `updater-vnext` HEAD remains `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`; source, QA note, backlog, harness, and output artifacts are uncommitted among existing shared changes; no commit/push. `node --check apps/web/app.js`, `git diff --check`, and evidence/cleanup checks passed.
