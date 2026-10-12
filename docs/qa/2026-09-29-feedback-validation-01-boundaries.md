# FEEDBACK-VALIDATION-01 boundary and normalization acceptance

**Date:** 2026-09-29 (Asia/Shanghai)  
**Variant:** `updater-vnext`, branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`; application changes remain uncommitted.  
**Tester:** Hermann / User Tester  
**Target:** isolated current-source service `http://127.0.0.1:64268/`, synthetic SQLite database and synthetic approved member. Live port 8788 was not touched.  
**Browser:** Microsoft Edge 154.0.4258.37, headed persistent Edge context via cached Playwright Node API; 1280×900. Same-origin UI/API. `/health` returned 200, and served `/app.js`, `/`, and `/styles.css` matched workspace hashes.

## Source hashes

| File | SHA-256 |
|---|---|
| `apps/api/server.js` | `2bd308fc81d6ea877dd83b079488deb35090cadd315e90d3802ad258f0335070` |
| `apps/api/auth.js` | `eebc14d0aa5e85420af365883ef8e120722a1605a7594430c94550db24105d1c` |
| `apps/api/feedback-repository.js` | `49a6af58c52d648a57b2b86d1fb36829fd798fecd89b0036f6ae435bdf81bb24` |
| `apps/web/app.js` | `36c12775238e6d71607c9bb74dc710443d3a30b5074d0c39b63f5d84eb4b7054b` |
| `apps/web/index.html` | `09379f2df2553c5de80ce22c90d8953906c7781f6e5f953b4bef65dd2bea2459` |
| `apps/web/styles.css` | `69f09a8d660b83e808715a2045e313a30e94eccfdbd3dddc76553a4e535454fc` |

## Results

| Scenario | Result | Evidence |
|---|---|---|
| Title `    x`; valid description; submit | **Partial / localized error fail.** After 150ms, title normalized to `x`, focus was on Title, and no POST occurred. No inline error node, `aria-invalid`, or `aria-describedby` existed. Switching language 100ms later changed the label to Chinese but did not restore an error; focus left Title. | [result JSON](../../output/playwright/feedback-validation-01-20260929/results.json), [immediate screenshot](../../output/playwright/feedback-validation-01-20260929/01-whitespace-title-native-validation.png), [post-locale screenshot](../../output/playwright/feedback-validation-01-20260929/02-title-error-after-locale-switch.png) |
| Description raw length 10 (`        x `); valid title; submit | **Partial / localized error fail.** After 150ms, normalized length was 1, focus was on Description, and no POST occurred. No inline error/ARIA relationship existed. Switching to English 100ms later changed the label but did not show an error; focus left Description. | [result JSON](../../output/playwright/feedback-validation-01-20260929/results.json), [screenshot](../../output/playwright/feedback-validation-01-20260929/03-whitespace-description-native-validation.png) |
| Valid padded title; raw description 4000; raw context 2000 | **Pass.** Trimmed values submitted with HTTP 201 and appeared in own list as title length 29, description length 3996, context length 1998. The form reset after success. | [normalized success screenshot](../../output/playwright/feedback-validation-01-20260929/04-max-boundary-submitted-normalized.png), results JSON |
| Oversized request-body handling | **Pass.** An authenticated synthetic JSON body of 17,084 bytes returned HTTP 413 `Request body too large.`; the own list stayed at one request and health remained 200. | Results JSON |
| Runtime/layout | **Pass for this viewport.** Document client and scroll widths both 1265 CSS px; no page errors. The only console error was the expected oversized-body 413. | Results JSON |

## Reproduction and disposition

- Run: `node output/playwright/feedback-validation-01-20260929/run.mjs`.
- Script: [run.mjs](../../output/playwright/feedback-validation-01-20260929/run.mjs).
- After submitting the under-minimum cases, inspect the field label subtree and ARIA attributes immediately (150ms); then switch locale and inspect again after 100ms. The focus/no-POST behavior works, but the requested user-visible localized error is absent at both observation points. This is a confirmed UI validation defect pending source review/fix and regression.
- One earlier run against the preceding client implementation confirmed that trimming followed by `reportValidity()` alone sent doomed POSTs (400 responses) instead of blocking locally. The final-source run has no POST for those fields but still lacks the inline error state; this QA session reports the final-source outcome and does not rely on the overwritten earlier artifacts.
- Isolation cleanup passed: service stopped; disposable database and Edge profile deleted. Current screenshots/results and test script are the only artifacts. No real account/data or live port was touched.
- No application or backlog changes were made by the tester; no commit or push. Remaining limits: this is a single desktop viewport; Unicode length semantics, other length boundaries, physical device and assistive-technology behavior were not tested.

The retest recorded immediately above used app.js `f147e299…` and found the localized message missing. The later diagnostic and full matrix below ran the requested newer source and supersede that behavior result. The primary owns the canonical backlog/status update.

## Final-source retest (2026-09-29 19:39 Asia/Shanghai)

The primary's latest client edit was retested separately; original evidence above was preserved. Run command: `node output/playwright/feedback-validation-01-retest-20260929-1938/run.mjs`.

| Item | Final-source result |
|---|---|
| Source/build | Edge-served assets matched workspace. `apps/web/app.js` SHA-256 `f147e299e2886eda0f253cfdf0fbf2139ae814b7a3d8cf47c35cc59269cc8580`; `apps/api/server.js` `2bd308fc81d6ea877dd83b079488deb35090cadd315e90d3802ad258f0335070`; HTML/CSS hashes unchanged from table above. |
| Four spaces + `x` title | At 150 ms after submit, normalized value `x`, focus on Title, zero feedback POSTs. **Fail:** no inline error node, `aria-invalid`, or `aria-describedby`. At 100 ms after locale switch, label became Chinese but error remained absent and focus had left the field. |
| Under-minimum description | Raw 10 chars normalized to length 1; focus on Description and zero feedback POSTs. **Fail:** no inline error node or ARIA relationship. At 100 ms after locale switch, label changed to English but error remained absent and focus had left the field. |
| Maximum request | Raw description 4000 and context 2000 passed; submitted 201 and own list contained trimmed description length 3996, context length 1998, and trimmed 29-character title. Form reset. |
| Oversized body and recovery | 17,084-byte authenticated payload returned 413 `Request body too large.`; own-list count remained 1 and health stayed 200. |
| Runtime and cleanup | Microsoft Edge 154.0.4258.37, headed, 1280×900, isolated origin `http://127.0.0.1:65181`; width 1265 CSS px with no horizontal overflow, no page errors, only the expected 413 console entry. Synthetic DB/profile and service removed; port 8788 untouched. |

Retest details and images: [results JSON](../../output/playwright/feedback-validation-01-retest-20260929-1938/results.json), [run script](../../output/playwright/feedback-validation-01-retest-20260929-1938/run.mjs), [title state](../../output/playwright/feedback-validation-01-retest-20260929-1938/01-whitespace-title-native-validation.png), [title after locale switch](../../output/playwright/feedback-validation-01-retest-20260929-1938/02-title-error-after-locale-switch.png), [description state](../../output/playwright/feedback-validation-01-retest-20260929-1938/03-whitespace-description-native-validation.png), [normalized max submission](../../output/playwright/feedback-validation-01-retest-20260929-1938/04-max-boundary-submitted-normalized.png). That run's `FAIL_LOCALIZED_VALIDATION` was against app.js `f147e299…`; its behavior result is superseded by the `817225c7…` full matrix below.

## Full final-source matrix (2026-09-29 19:52 Asia/Shanghai)

**Result: PASS** against the requested app.js `817225c79d99dfb4f0f4881485dce38b8c0270502d0be9a481412a66a49713db`. The API server hash was `2bd308fc81d6ea877dd83b079488deb35090cadd315e90d3802ad258f0335070`. The isolated server served UI and API from the same origin and its served `/app.js`, `/`, and `/styles.css` matched the tested workspace hashes. The earlier `f147...` screenshot/result remains preserved in its separate run directory.

| Scenario | Expected | Actual | Result |
|---|---|---|---|
| Login password of 11 spaces (raw value) | Required passes because not empty; `minlength=12` reports too short; no login request. Correcting the password clears error/ARIA state. | Raw length 11; `valueMissing=false`, `tooShort=true`; localized validation says “Enter at least 12 characters.” and focuses password. No `/api/auth/login` POST. Correct password (22 chars) validates and restores originally absent `aria-invalid` and `aria-describedby`. | **PASS** |
| Feedback Title four spaces plus `x` | Trim to one character, visible localized error, correct focus/ARIA, no POST. Locale EN→ZH updates message. Valid edit clears error and restores original attributes. | Normalized `x`; English “Enter at least 5 characters.” appears as `role=alert`, `aria-invalid=true`, and is referenced by `aria-describedby`; focus is Title; zero feedback POSTs. Chinese switch updates message to “请至少输入 5 个字符。” and preserves invalid/ARIA state. Editing to a valid title removes the error and restores injected baseline `aria-invalid=false`, `aria-describedby=qa-original-title-hint`. | **PASS** |
| Feedback Description raw length 10 (`        x `) | Trim to one character, show localized error, focus/ARIA, no POST. Locale ZH→EN updates message. Valid edit clears error and restores original attributes. | Normalized length 1; Chinese “请至少输入 10 个字符。” is visible and linked; focus is Description; zero feedback POSTs. English switch changes it to “Enter at least 10 characters.” and preserves ARIA state. Valid edit removes the error and restores baseline `aria-invalid=false`, `aria-describedby=qa-original-description-hint`. | **PASS** |
| Exact maximum boundary submission | Padded valid title, raw 4000-character description and raw 2000-character context are normalized before submit/list. | Raw lengths title 33, description 4000, context 2000; normalized lengths 29, 3996, 1998. POST 201; own-list GET 200 returns exactly one row with normalized values; form resets. | **PASS** |
| Oversized request and service recovery | Body over 16,384 bytes returns 413 without corrupting data; service stays healthy. | Authenticated 17,084-byte request returned 413 `Request body too large.`; own-list count remained 1; health returned 200. | **PASS** |
| Layout/errors/cleanup | No horizontal overflow or uncaught page failures; disposable environment removed. | Microsoft Edge 154.0.4258.37, headed persistent Playwright Node API context, 1280×900, isolated origin `http://127.0.0.1:65092`. Document client/scroll widths 1265/1265; no page errors or unexpected console errors (only expected 413). Isolated service, DB, and profile removed; live port 8788 untouched. | **PASS** |

**Attribute restoration method:** To test restoration of pre-existing ARIA values rather than only removal of newly added attributes, this run injected a hidden synthetic helper ID and `aria-invalid=false` on both feedback fields before validation. On correction, each field returned exactly to those initial values and its error node was removed. This test-only DOM state was not persisted.

Artifacts: [final results](../../output/playwright/feedback-validation-01-final-20260929-1948/results.json), [run script](../../output/playwright/feedback-validation-01-final-20260929-1948/run.mjs), [11-space auth password](../../output/playwright/feedback-validation-01-final-20260929-1948/00-auth-password-11-spaces-native-minlength.png), [invalid title EN](../../output/playwright/feedback-validation-01-final-20260929-1948/01-whitespace-title-native-validation.png), [title ZH](../../output/playwright/feedback-validation-01-final-20260929-1948/02-title-error-after-locale-switch.png), [corrected title/ARIA restoration](../../output/playwright/feedback-validation-01-final-20260929-1948/03-title-corrected-original-aria-restored.png), [invalid description ZH](../../output/playwright/feedback-validation-01-final-20260929-1948/04-whitespace-description-native-validation.png), [description EN](../../output/playwright/feedback-validation-01-final-20260929-1948/05-description-error-after-locale-switch.png), [corrected description/ARIA restoration](../../output/playwright/feedback-validation-01-final-20260929-1948/06-description-corrected-original-aria-restored.png), [max-boundary submit/list](../../output/playwright/feedback-validation-01-final-20260929-1948/07-max-boundary-submitted-normalized.png). The initial run's harness assertion error is retained as [results-harness-assertion-first-run.json](../../output/playwright/feedback-validation-01-final-20260929-1948/results-harness-assertion-first-run.json); it occurred after all browser actions and was fixed in the harness. The subsequent complete rerun is the `PASS` result above.

**Git evidence:** branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`; the QA note and test artifacts are uncommitted. Application/backlog files were not edited by the tester. No commit or push.
