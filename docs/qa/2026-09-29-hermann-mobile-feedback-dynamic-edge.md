# Hermann mobile feedback dynamic-state Edge regression

**Date:** 2026-09-29 (Asia/Shanghai)  
**Variant:** `updater-vnext`  
**Target:** Disposable same-origin service `http://127.0.0.1:57878`, temporary SQLite database, synthetic approved member/admin accounts.  
**Browser:** Microsoft Edge `154.0.4258.37`, headed persistent context, direct Playwright Node API with cached `playwright-core`, fresh disposable profile. Viewport `390×844` CSS pixels (`window.innerWidth` 390).  
**Tester:** Hermann (User Tester).  
**Source revision:** HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`; shared worktree dirty. This pass served the current `apps/web/app.js`, verified against the served asset by SHA-256 `232608b46e71a9dbd25dd47390d87e13f534f620cde2dca4b98056e586e8efbc`.

## Preflight and synthetic setup

- Isolated service `/health` returned HTTP 200. The browser rendered the expected UI from the same origin as the API; `/api/auth/me` was reachable. The test also fetched `/app.js` and confirmed its content hash matched the current workspace source.
- The temporary database contained only a synthetic administrator and approved member. No production account/data or port 8788 was used.
- Microsoft Edge rendered the member Account intake/list and admin Feedback queue at 390×844. Edge remained on the expected loopback target throughout the run.

## Acceptance results

| Scenario | Result and evidence |
|---|---|
| English and Chinese rendered labels/control names | **Pass.** Account heading, title field, submit control, and request type/description/context controls showed associated English and Chinese labels. |
| Empty-title client validation | **Pass in both locales.** Empty submission was prevented, native validation feedback was present, and focus moved to the invalid title field. |
| Synthetic API failure recovery | **Pass in both locales.** Intercepted the first `POST /api/feedback` as HTTP 503. The entered title and description remained; error text was visible; Submit was re-enabled and focused with a computed `3px solid` focus outline. This verifies the FEEDBACK-FOCUS-01 fix. |
| Successful member submission | **Pass in both locales.** Retry reached the real isolated API, displayed the localized success announcement and UUID reference, reset the form, and showed the new request in the submitter's own list with localized `Submitted` status. |
| Admin triage and public update | **Pass in both locales.** Administrator updated the English request to `Under review` with an English public update, and the Chinese request to `Needs information` with a Chinese public update. The member subsequently saw both statuses and public updates. |
| Page/nested overflow and form controls | **Pass in the measured states.** Account feedback form, submitter list, admin queue, and sampled cards had no measured horizontal overflow. Document `scrollWidth` was 375 and `clientWidth` 375 within the 390px viewport because of browser scrollbar/layout width. Sampled form controls rendered at least 44.39px high; labels/control names were present. |
| Browser page errors | **Pass.** Zero `pageerror` events in the completed path. |

Detailed per-scenario output is in [results.json](../../output/playwright/qa01-mobile-feedback-20260929/results.json). Screenshots include English/Chinese validation failures, retry errors, submitted lists, admin queue, and final member statuses in the same directory. The harness is [run.mjs](../../output/playwright/qa01-mobile-feedback-20260929/run.mjs).

## FEEDBACK-FOCUS-01 disposition

The original pre-fix pass reproduced `document.activeElement` on BODY after the temporary 503 ([pre-fix screenshot](../../output/playwright/qa01-mobile-feedback-20260929/pre-fix-lost-focus.png)). The primary then changed the submit handler to re-enable the control before focusing it, guarded by unchanged identity and Account view. This fresh run verified that same error path after the service served the changed app.js: Submit was enabled, focused, and had a 3px solid outline, while the draft/error remained visible. **Focused regression status: verified for the exercised unchanged-identity/Account-view path.**

The full member/admin flow did not race a pending response against an identity or view change; the focused guard follow-up below covered deliberate focus movement and leaving Account while a request was pending. Native screen-reader announcements, physical devices/virtual keyboards, 200% native zoom, physical forced-colors, and dynamic/non-text contrast were not assessed by these passes.

## Cleanup and Git traceability

The isolated service, Edge context/profile, temporary database, WAL, and SHM files were stopped/removed by the harness. Port 8788 and production accounts/data were untouched. No finding remained in the tested flows.

Git was read-only checked: branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`, existing shared dirty/untracked work preserved. This QA note and its output artifacts are uncommitted.

## FEEDBACK-FOCUS-01 focus-guard follow-up

After the submit handler added a captured `submissionFocusTarget`, Hermann ran a fresh focused Edge 154 regression against a new isolated service at `http://127.0.0.1:49804` (390×844, headed direct Playwright Node API). The service health check passed, and the served `/app.js` matched the then-current workspace file byte-for-byte by SHA-256 `3bb139cc694cace029c6e56120c76f1d086dc679b5a9de20091ab08ba92c8a40`.

| Focus scenario | Result |
|---|---|
| Keyboard Enter while title is focused; intercept POST as 503 | **Pass.** Draft/error stayed visible; Submit re-enabled, focused, and showed a 3px solid outline. |
| Hold POST; move focus to Refresh; release failure | **Pass.** Focus remained on Refresh; handler did not steal it. |
| Hold POST; leave Account for Reports; release failure | **Pass.** Account remained hidden, focus stayed on Reports, and Submit did not receive focus. |
| Browser page errors | **Pass.** None observed. |

Detailed evidence: [focus-guard results](../../output/playwright/feedback-focus-01-guard-20260929/results.json), [harness](../../output/playwright/feedback-focus-01-guard-20260929/run.mjs), and first-scenario screenshot `01-submit-focused-after-error.png` in that directory. The disposable service, profile, and SQLite database were cleaned up; 8788 and production data were untouched. These three focused races verify the identity/view-aware focus behavior for the tested current source; no native assistive-technology claim follows.

Dennis independently reviewed the final focus guard and found the captured-target plus BODY-displacement checks preserve deliberate focus movement while restoring keyboard submit focus after disablement; no cross-identity issue was found. Primary verification after the final source change: `node --check apps/web/app.js` passed, `npm test` passed 66/66, and `git diff --check` exited 0 (with existing LF-to-CRLF warnings). The Playwright CLI could not run offline because `@playwright/cli` is not cached (`npx --offline` returned `ENOTCACHED`); the User Tester used the cached Playwright Node API with headed Microsoft Edge, not Chrome.
