# LIVE-FEEDBACK-01 — current-source isolated Feedback queue E2E

**Date:** 2026-09-29 (Asia/Shanghai)  
**Target:** `updater-vnext`, app `817225c79d99…`, CSS `69f09a8d660b…`; isolated Edge E2E plus read-only 8793 reachability check.  
**Disposition:** Isolated Feedback lifecycle passes on current source. LIVE-FEEDBACK-01 remains open because active 8793 is unavailable and the 8788 database/process identity is unresolved.

## Runtime preflight and safety

- Fresh isolated `apps/api/server.js` process on `http://127.0.0.1:63675`, `ADAS_DB_PATH` pointed to a newly created synthetic SQLite database. `/health` returned 200; initial `/api/auth/me` was user-null. Browser used this same origin for UI and API.
- Headed Microsoft Edge `154.0.4258.37`, direct Playwright Node API with cached `playwright-core`, unique disposable profile, viewport 390×844.
- The six served assets exactly matched workspace source: `index.html` `09379f2df2553c5de80ce22c90d8953906c7781f6e5f953b4bef65dd2bea2459`; `app.js` `817225c79d99dfb4f0f4881485dce38b8c0270502d0be9a481412a66a49713db`; `styles.css` `69f09a8d660b83e808715a2045e313a30e94eccfdbd3dddc76553a4e535454fc`; `navigation.js` `7a1114587842f11bace2b1b4d69f9d15d5e35ae946abf7efd0f5564461dcea56`; `report-presentation.js` `d0a081dc918f6c848d15a865d890eb8695d6554d1f626a8db4f26edcf1d07d6f`; `viewport.js` `fef9e10e9114de24f83a0ca909b841c1b93f1a6aa84fe8dabb023235893922da`.
- Only synthetic users and synthetic request text were used. No authentication or writes were made to 8788. No real/private incident details were entered.

## Acceptance results

| Scenario | Result |
|---|---|
| Approved regular member creates request | Pass: `POST /api/feedback` returned 201; member Account immediately rendered the synthetic Issue with `Submitted`. Regular member had no admin or Feedback queue navigation. |
| Admin sees request and queue load completes | Pass: after synthetic admin sign-in, both admin navigation entries were visible. Admin Feedback view resolved its loading state and rendered both member and admin submissions (queue count 2), with each submitter attributed in the card. |
| Admin's own submission | Pass: synthetic admin submitted an Issue; own Account showed `Submitted`, and the item appeared in the admin queue. |
| Review/public-private behavior | Pass: admin triage PATCH returned success and status message `Request status updated.` Member re-login showed `Under review` and the synthetic public update. The private note appeared only in admin view and not in member Account. |
| Browser/runtime | Pass: all assets matched current source, zero page errors; only expected synthetic auth, feedback POST, admin feedback PATCH and read-only GET calls occurred. |
| Cleanup | Pass: service stopped, `/health` unreachable afterward, ephemeral DB and Edge profile removed, port 63675 closed, 8788 untouched. |

Separately, the symptom port was probed read-only: `Test-NetConnection 127.0.0.1 -Port 8793` returned `False`; `GET /health` failed with “actively refused.” This establishes the reported 8793 listener is unavailable from this test host. The successful isolated run demonstrates the same-source UI/API queue loading and role lifecycle work on a healthy service, so the 8793 symptom is consistent with service availability rather than a reproduced application queue failure. It does not establish which database or process serves 8788.

Artifacts: [machine-readable results](../../output/playwright/feedback-role-current-817225-20260929/results.json), [runner](../../output/playwright/feedback-role-current-817225-20260929/run.mjs), [member submission screenshot](../../output/playwright/feedback-role-current-817225-20260929/member-submission-own-list.png), [admin own submission screenshot](../../output/playwright/feedback-role-current-817225-20260929/admin-submission-own-list.png), [admin queue/triage screenshot](../../output/playwright/feedback-role-current-817225-20260929/admin-triage-public-private.png), and [member public/private visibility screenshot](../../output/playwright/feedback-role-current-817225-20260929/member-public-private-visibility.png).

**Limitations:** This is a disposable current-source app acceptance, not a test of the service reported on port 8793 or an authenticated path to 8788. LIVE-FEEDBACK-01 remains open until deployed runtime/database identity is safely established and the intended live authenticated path can be verified under the required isolation.

**Git:** QA note, backlog supplement and synthetic artifacts are uncommitted among existing shared changes. No application source edits, commit, or push.
