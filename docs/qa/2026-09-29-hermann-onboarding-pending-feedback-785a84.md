# LIVE-FEEDBACK-01 onboarding lifecycle — current app 785a84ee

**Date:** 2026-09-29 (Asia/Shanghai)  
**Target:** isolated `updater-vnext` service/database; app `785a84eead31…`, CSS `69f09a8d…`.  
**Result:** PASS for the scoped isolated browser lifecycle. LIVE-FEEDBACK-01 remains open for deployed-runtime identity and live authenticated path.

## Preflight and environment

- Fresh `apps/api/server.js` process at `http://127.0.0.1:60562`, database `ADAS_DB_PATH` set to a fresh synthetic SQLite file. `/health` 200 and initial `/api/auth/me` user-null. Same-origin UI and API.
- Microsoft Edge `154.0.4258.37`, headed direct Playwright Node API via cached `playwright-core`, unique disposable profile, 390×844.
- Six served assets matched source: `index.html` `09379f2df2553c5de80ce22c90d8953906c7781f6e5f953b4bef65dd2bea2459`; `app.js` `785a84eead31675f22f1cedc6df969b1cf22006258063bc56adcf533b713fe7b`; `styles.css` `69f09a8d660b83e808715a2045e313a30e94eccfdbd3dddc76553a4e535454fc`; `navigation.js` `7a1114587842f11bace2b1b4d69f9d15d5e35ae946abf7efd0f5564461dcea56`; `viewport.js` `fef9e10e9114de24f83a0ca909b841c1b93f1a6aa84fe8dabb023235893922da`; `report-presentation.js` `d0a081dc918f6c848d15a865d890eb8695d6554d1f626a8db4f26edcf1d07d6f`.
- Synthetic admin and member account only; all submitted text fictional. No authenticated requests or writes to 8788.

## Journey results

| Step | Expected | Actual | Result |
|---|---|---|---|
| Admin creates invitation in Account | One valid invite and visible code/expiry | UI POST returned 201; code and expiry rendered. | Pass |
| Signed-out invite registration | New member pending and signed in; required fields accepted | Enter submitted registration; POST 201. `/api/auth/me` showed active member with `approved:false`; focus-visible on completion. | Pass |
| Pending Reports access | Reports gate, no report search/cards; no admin/Feedback navigation | Gate showed approval-required copy, search hidden, zero cards; admin and Feedback nav hidden. | Pass |
| Pending member submits issue | Account request form remains available and request appears as Submitted | Feedback POST 201; own list rendered the synthetic Issue and Submitted. | Pass |
| Admin reviews queue and approves | Queue loading completes and request is attributed; approval persists | Admin Feedback loading resolved (`aria-busy=false`); one card showed member attribution. Admin User management PATCH 200; `Changes saved.` appeared and row approval became true. | Pass |
| Member returns to Reports | Approved identity, gate gone, Reports workspace accessible | Re-login `/api/auth/login` 200; `/api/auth/me` showed approved true. Gate hidden, Reports view visible (zero synthetic report cards), admin/Feedback nav remained hidden for regular member. | Pass |
| Runtime/errors/cleanup | Correct source, no client exception or fixture residue | No page errors. Expected POST statuses: login 200, invitation 201, logout 200, registration 201, feedback 201, logout/login 200, approval PATCH 200, logout/login 200. Service stopped; port 60562 closed; temp DB/profile removed. | Pass |

Screenshots: [admin invitation](../../output/playwright/onboarding-pending-feedback-785a84-20260929/admin-created-invite.png), [pending Account](../../output/playwright/onboarding-pending-feedback-785a84-20260929/pending-member-account.png), [Reports gate](../../output/playwright/onboarding-pending-feedback-785a84-20260929/pending-reports-gate.png), [pending Issue list](../../output/playwright/onboarding-pending-feedback-785a84-20260929/pending-member-issue-submitted.png), [admin queue](../../output/playwright/onboarding-pending-feedback-785a84-20260929/admin-queue-pending-issue.png), [approval](../../output/playwright/onboarding-pending-feedback-785a84-20260929/admin-approved-member.png), [approved Reports](../../output/playwright/onboarding-pending-feedback-785a84-20260929/approved-member-reports.png). Full [results](../../output/playwright/onboarding-pending-feedback-785a84-20260929/results.json) and [runner](../../output/playwright/onboarding-pending-feedback-785a84-20260929/run.mjs).

## Earlier drift attempt and disposition

The preceding bounded attempt was guarded for app `817225c79d99…`; isolated preflight served and sourced app `51ffd358…`, so it stopped before Edge/browser interaction and cleaned up. The subsequent target from the primary was `785a84ee…`; this run verified six-asset parity and completed the journey. The earlier preflight evidence remains linked at [817225 drift record](2026-09-29-hermann-onboarding-pending-feedback-817225-preflight.md).

This proves the isolated current-source application lifecycle on a healthy process. It does not establish the active database/process behind 8788 or 8793 and does not satisfy the deployed authenticated-runtime gate. LIVE-FEEDBACK-01 remains open. Port 8788 was not accessed for authentication or writes.

**Git:** QA note, backlog entry and synthetic artifacts are uncommitted with shared work. No source edits, commit, or push.
