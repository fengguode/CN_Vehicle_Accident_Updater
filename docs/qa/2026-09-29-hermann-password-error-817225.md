# UX-AUTH-I18N-01 password error localization — current bundle 817225

**Date:** 2026-09-29 (Asia/Shanghai)  
**Target:** `updater-vnext`; isolated `apps/api/server.js`, no live-service actions.  
**Disposition:** UX-AUTH-I18N-01 remains In progress; both Chinese server errors are still untranslated.

## Acceptance and preflight

- Acceptance: wrong-current and same-as-current password failures under zh-CN should be localized, retain form values, announce errors accessibly, preserve keyboard focus, and leave the original credential usable.
- Disposable synthetic SQLite database seeded with one synthetic admin and one approved member (`qaauth817member`). Browser authenticated only to isolated service using that synthetic account.
- Isolated same-origin service `http://127.0.0.1:61920`; `/health` 200, initial `/api/auth/me` user-null. Browser UI/API served by `apps/api/server.js`.
- Headed Microsoft Edge `154.0.4258.37`, direct Playwright Node API using cached `playwright-core`, unique disposable persistent profile, viewport 390×844.
- All six assets matched source: `index.html` `09379f2df2553c5de80ce22c90d8953906c7781f6e5f953b4bef65dd2bea2459`; `app.js` `817225c79d99dfb4f0f4881485dce38b8c0270502d0be9a481412a66a49713db`; `styles.css` `69f09a8d660b83e808715a2045e313a30e94eccfdbd3dddc76553a4e535454fc`; `navigation.js` `7a1114587842f11bace2b1b4d69f9d15d5e35ae946abf7efd0f5564461dcea56`; `viewport.js` `fef9e10e9114de24f83a0ca909b841c1b93f1a6aa84fe8dabb023235893922da`; `report-presentation.js` `d0a081dc918f6c848d15a865d890eb8695d6554d1f626a8db4f26edcf1d07d6f`.

## Results

| Scenario | Actual | Result |
|---|---|---|
| Wrong current password in zh-CN, keyboard Enter | Password endpoint returned 400. Visible message remained English `Current password is incorrect.` Both entered values remained. Message had `role="status"` and `aria-live="polite"`; Change password retained focus with a visible 3px blue outline. | Fail — localization defect reproduced. |
| Same-as-current password in zh-CN, keyboard Enter | Password endpoint returned 400. Visible message remained English `Choose a password different from the current one.` Both fields remained. Polite status semantics and visible 3px submit focus ring remained. | Fail — same localization defect reproduced. |
| Original password after both failures | Browser logged out, then submitted the original synthetic password through the already-visible login form. Login returned 200 and `/api/auth/me` identified `qaauth817member`. | Pass — original credential remained valid. |
| No unintended password mutation | DB password salt/hash matched pre-run values; two users remained. Session count was zero after logout and one after the original-password re-login. | Pass. |
| Runtime and cleanup | Six source assets matched served bytes; no page errors. Network showed exactly two failed password-change POSTs (400), logout (200), and original-password login (200); remaining requests were expected read-only GETs. Service stopped; port 61920 unreachable; temp DB/profile removed; 8788 untouched. | Pass. |

Screenshots: [wrong current password](../../output/playwright/password-error-817225-69f09-20260929/wrong-current-zh-CN.png) and [same as current](../../output/playwright/password-error-817225-69f09-20260929/same-as-current-zh-CN.png). Full source/network/DOM/database/cleanup record: [results.json](../../output/playwright/password-error-817225-69f09-20260929/results.json). Harness: [run.mjs](../../output/playwright/password-error-817225-69f09-20260929/run.mjs).

**Harness note:** The initial run completed both requested rejected password attempts, then timed out trying to click `#account-entry`, which is hidden while the Account view remains open. That was a harness issue, not product behavior. The corrected single rerun submitted the original credential through the visible login form and completed the invariants above. The first run is preserved as [first-attempt-harness-timeout.json](../../output/playwright/password-error-817225-69f09-20260929/first-attempt-harness-timeout.json).

**Untested:** English baseline and other server-side password failures were not repeated in this focused current-bundle pass; prior evidence is linked from the backlog row.

**Git:** QA note, backlog supplement and synthetic artifacts are uncommitted with shared work; no source edits, commit, or push.
