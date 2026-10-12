# Hermann UX-I18N-02 localized validation Edge acceptance

**Date:** 2026-09-29 (Asia/Shanghai)  
**Variant:** `updater-vnext`  
**Target:** Fresh disposable service `http://127.0.0.1:63326`, isolated SQLite DB, synthetic admin/member only.  
**Browser:** Microsoft Edge `154.0.4258.37`, headed, direct Playwright Node API using cached `playwright-core`, fresh persistent profiles. Viewport `1280×800`. Browser context locales: `en-US` and `zh-CN`.  
**Source revision:** HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`, shared worktree dirty. Served `/app.js` SHA-256 `1351ab0a6bfe5d9fc67aea74d1a6d39faf635cde21669e5e4e897e5475f74f04` matched current workspace source exactly.

## Preflight and isolation

- The isolated service `/health` returned HTTP 200; Edge rendered the expected UI. Login and feedback API routes were exercised through same-origin browser forms on the isolated service.
- The harness compared fetched `/app.js` with the current workspace source and required an exact hash match before testing.
- Only synthetic accounts were used. Invalid input was verified to make zero login or feedback POST requests; the accepted feedback requests were confined to the disposable database.

## Acceptance matrix

The test exercised both browser context locales (`en-US`, `zh-CN`) and both selected UI languages (`en`, `zh-CN`). Across **38 checks**, all recorded acceptance assertions passed:

| Coverage | Result |
|---|---|
| Empty Login in English and Chinese UI | **Pass.** Localized inline text matched the UI language; Username received focus; each invalid field had `aria-invalid="true"`, `aria-describedby` pointing to a visible `role="alert"` error; no login POST was sent. |
| Login username/password minimum lengths | **Pass.** Username shorter than 3 and password shorter than 12 showed localized messages, first invalid field focus and ARIA association, with no login POST. |
| Empty Feedback | **Pass.** Title and Description errors were visible and associated; focus went to Title; no feedback POST. |
| Feedback title under 5 / description under 10 | **Pass.** Localized min-length messages and focus/ARIA behavior were correct; no feedback POST. |
| Whitespace-only Feedback title (5 spaces) / description (10 spaces) | **Pass.** Both were treated as empty after trimming, received localized required messages and focus/ARIA state, and produced no POST. |
| Switch UI language while errors remain visible | **Pass.** Existing Login and Feedback error text changed from English to Chinese when the UI language changed, without resubmitting. |
| Valid Feedback submission | **Pass.** One POST in each browser context created exactly one request, showed success announcement/reference, and appeared in the submitter's own list with `Submitted` status. |
| Browser errors | **Pass.** Zero page errors in either browser context. |

The first harness attempt sampled active focus before the app's `requestAnimationFrame` focus restoration completed. The final fresh run added an explicit wait for the first invalid control before recording focus; all 38 checks passed. This was a harness timing correction, not a product failure.

## Evidence and cleanup

- Full matrix and preflight hashes: [results.json](../../output/playwright/ux-i18n-02-acceptance-20260929/results.json).
- Screenshots: English Login validation and English Feedback validation in the same output directory.
- Direct Playwright harness: [run.mjs](../../output/playwright/ux-i18n-02-acceptance-20260929/run.mjs).
- Isolated service process, two Edge contexts/profiles, temporary DB, WAL and SHM files were stopped/removed. Port 8788 and production data were not touched.

This verifies the requested client validation paths in Edge under two browser context locales. It does not establish native assistive-technology behavior or other browser engines.

Git was read-only checked: branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`; existing shared dirty/untracked work preserved. This QA note and test artifacts are uncommitted.
