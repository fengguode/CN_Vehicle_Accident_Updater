# UX-REG-04 duplicate username — current bundle 817225

**Date:** 2026-09-29 (Asia/Shanghai)  
**Target:** `updater-vnext`; isolated `apps/api/server.js`, no live-service actions.  
**Disposition:** UX-REG-04 remains In progress; reproduced on current bundle.

## Acceptance and preflight

- Acceptance: duplicate registration in English and Chinese must not expose database details; preserve input and invitation; expose a recoverable accessible error; create no account/session and consume no invitation.
- Fresh synthetic SQLite DB seeded with synthetic admin `qa04admin`, approved member `qa04existing`, and two valid unused invitations (one per locale). Both browser attempts used the existing username. No successful account creation.
- Isolated same-origin service `http://127.0.0.1:53037`, `/health` 200 and initial `/api/auth/me` user-null. `apps/api/server.js` served UI and API.
- Headed Microsoft Edge `154.0.4258.37`, direct Playwright Node API using cached `playwright-core`, unique disposable persistent profile, 390×844 viewport.
- All six served assets matched workspace source byte-for-byte: `index.html` `09379f2df2553c5de80ce22c90d8953906c7781f6e5f953b4bef65dd2bea2459`; `app.js` `817225c79d99dfb4f0f4881485dce38b8c0270502d0be9a481412a66a49713db`; `styles.css` `69f09a8d660b83e808715a2045e313a30e94eccfdbd3dddc76553a4e535454fc`; `navigation.js` `7a1114587842f11bace2b1b4d69f9d15d5e35ae946abf7efd0f5564461dcea56`; `viewport.js` `fef9e10e9114de24f83a0ca909b841c1b93f1a6aa84fe8dabb023235893922da`; `report-presentation.js` `d0a081dc918f6c848d15a865d890eb8695d6554d1f626a8db4f26edcf1d07d6f`.

## Results

| Scenario | Result |
|---|---|
| English duplicate username, keyboard Enter | `POST /api/auth/register` returned 400. Visible text was raw `UNIQUE constraint failed: users.username`. Username, password, and invitation remained filled. `#account-message` had `role="status"`, `aria-live="polite"`; focus returned to Create account and `:focus-visible` was true with a 3px blue outline. Fail: database detail leaked and copy is not user-friendly. |
| Chinese duplicate username, keyboard Enter | 400 with the same untranslated SQLite text. All fields remained. Focus returned to localized Create account button with the same visible 3px outline. Fail: raw error also leaks in Chinese. |
| Database invariants | After both attempts, exactly the two original seeded users remained; the attempted username resolved to the original member row, session count was 0, and both invitations remained present with `used_at` null. Pass. |
| Runtime | Six served assets matched source; no page errors. Network contained expected GETs plus exactly two rejected registration POSTs, each 400. Pass. |

Screenshots: [English](../../output/playwright/registration-duplicate-username-817225-20260929/duplicate-registration-error-en.png), [Chinese](../../output/playwright/registration-duplicate-username-817225-20260929/duplicate-registration-error-zh-CN.png). Full network, DOM/focus, DB, hash and cleanup output: [results.json](../../output/playwright/registration-duplicate-username-817225-20260929/results.json). Harness: [run.mjs](../../output/playwright/registration-duplicate-username-817225-20260929/run.mjs).

Cleanup: service stopped; isolated port 53037 no longer served `/health`; temporary database and Edge profile removed; live 8788 was untouched. This current-source run strengthens the earlier 9F56/CAFE53 finding. No separate issue is needed; UX-REG-04 remains open pending implementation and regression.

**Untested:** unexpected non-duplicate registration errors and assistive-technology announcement beyond DOM live-region semantics.

**Git:** QA note, backlog evidence and synthetic artifacts are uncommitted with the shared workspace; no source edits, commit, or push.
