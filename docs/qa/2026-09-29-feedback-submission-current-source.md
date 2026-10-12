# Current-source member feedback submission and success-state acceptance — 2026-09-29

## Scope

Supplemental isolated UI/API acceptance for `LIVE-FEEDBACK-01`: submit a Feature from the signed-in member form, verify the requester sees it in their own list, and verify an administrator sees it in the admin queue. This was run against a separate local service with a disposable SQLite database; port 8788 and its unknown database were not touched.

## Environment and source

- Target: isolated `apps/api/server.js` on `http://127.0.0.1:61917/`; ephemeral port and disposable DB/profile. This final regression ran after the success-color fix; earlier ephemeral ports are historical harness attempts only.
- Browser: headed Microsoft Edge 154.0.4258.37, direct Playwright Node API with cached `playwright-core`; 390×844 CSS px.
- Final source hashes: app.js `9f56a4081a8d3f6369b52d1805d8960ef6d86bbab2b9a21cd94e697654adfc1f`; styles.css `cde5d66726ddfa3f7c8ec20fcb195abe80589c8ea580d70ef2a7f8764d8c9583`; server.js `7485771fc8a5c7b8ea9ecf9a1e5204b086abae694a2f6daa41cc17dd621b0949`. Served app assets and HTML matched workspace source; harness spawned `apps/api/server.js` with explicit isolated `ADAS_DB_PATH` and ephemeral `ADAS_VNEXT_PORT`.
- Fixture: 105 synthetic queue requests across three seeded accounts plus a clean synthetic member used for the submission limit (the seeded queue member already has 105 requests).

## Acceptance and disposition

The isolated Edge suite passed its 105-request admin pagination/filter/keyboard, cross-identity draft isolation, triage, public/private separation, and responsive checks. A clean synthetic member submitted a Feature in both Chinese and English through the rendered Account form; each `POST /api/feedback` returned 201 and yielded a request UUID. Both requests appeared in that member's own list, and the Chinese request appeared in a separately authenticated administrator queue with submitter attribution. Success confirmation computed to `rgb(23, 107, 80)` in both locales. A synthetic 503 remained `rgb(155, 52, 43)`, retained the retry title/description, re-enabled Submit, and did not retain the success class. No page errors or horizontal overflow were recorded. The isolated service, synthetic DB, and Edge profiles were cleaned up.

Final evidence: [`results.json`](../../output/playwright/feedback-submission-current-source-20260929/results.json), SHA-256 `3B5142AE441E5E4ACE00E623383B405B5D3FF9616380C2014DD7711836803EED`; [screenshots and harness](../../output/playwright/feedback-submission-current-source-20260929/). Command: `node output/playwright/feedback-submission-current-source-20260929/run.mjs`; result `PASS`. Earlier harness failures were preserved separately in the same folder and are explained below.

Initial harness attempts failed before acceptance due to test setup/assertions, not product behavior. First, the 105 seeded requests belonged to the same user under test, so the API correctly enforced its limit of 10 submissions per user per hour with HTTP 429; the corrected run used a separate synthetic member with no existing requests. Second, the form's status was localized to Chinese in the persistent browser profile; the corrected assertion accepts the localized Submitted label. Third, shared-cookie tabs complicated the admin re-login; the corrected run used an independent browser context for admin queue verification. Those initial failure results/screenshots remain in the artifact folder for traceability.

## Gate and limitations

The current-source feature submission and administrator visibility path and the success/error message distinction now pass, in addition to the isolated admin triage/privacy pass in [the companion runtime QA](2026-09-29-live-feedback-isolated-runtime-recheck.md). Dennis found no code issue; Hermann confirmed the fixed screenshots/assertions; Yuzhou accepted the visual distinction and localized reference copy. The owner explicitly chose to keep `LIVE-FEEDBACK-01` open; this pass does not identify the DB used by the already-running service on port 8788. A current read-only health check returns 200, but process command-line and Scheduled Task inspection are denied in this environment. No authenticated write was sent to port 8788.

## Git and QA record

`updater-vnext` HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`; `apps/web/app.js`, `apps/web/styles.css`, harness, screenshots, interim-failure evidence, this note, and backlog updates are uncommitted among existing shared changes; no commit or push. The source change is linked to `UX-FEEDBACK-SUCCESS-01`. `node --check apps/web/app.js`, `git diff --check`, and focused evidence/cleanup checks passed after the final run.
