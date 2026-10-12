# LIVE-FEEDBACK-01 onboarding continuation — target drift preflight

**Date:** 2026-09-29 (Asia/Shanghai)  
**Requested target:** app `817225c79d99…` / CSS `69f09a8d…`; isolated invitation → pending member Issue → approval → Reports acceptance.  
**Result:** Blocked before browser acceptance because app source advanced during setup.

## Preflight evidence

- A fresh isolated `apps/api/server.js` process started at `http://127.0.0.1:65092`; `/health` returned 200 and initial `/api/auth/me` was user-null. `ADAS_DB_PATH` pointed to a fresh synthetic SQLite database containing only a synthetic admin bootstrap account.
- Every served UI asset matched the workspace source at preflight, but current app.js SHA-256 was `51ffd3589c38e083d9a5ee8922405d7ea341939ab0fe55776d5c9f5d2b2a3e55`, which differs from the assigned target `817225c79d99dfb4f0f4881485dce38b8c0270502d0be9a481412a66a49713db`. The strict target guard aborted before launching Edge or performing UI authentication, invitation creation, registration, feedback submission, approval, or Reports access.
- Other preflight source hashes: `index.html` `09379f2df2553c5de80ce22c90d8953906c7781f6e5f953b4bef65dd2bea2459`; `styles.css` `69f09a8d660b83e808715a2045e313a30e94eccfdbd3dddc76553a4e535454fc`; `navigation.js` `7a1114587842f11bace2b1b4d69f9d15d5e35ae946abf7efd0f5564461dcea56`; `viewport.js` `fef9e10e9114de24f83a0ca909b841c1b93f1a6aa84fe8dabb023235893922da`; `report-presentation.js` `d0a081dc918f6c848d15a865d890eb8695d6554d1f626a8db4f26edcf1d07d6f`.
- Browser was not launched; no browser/version or viewport acceptance is claimed. No request was sent to live 8788. This bounded attempt did not access port 8793.

## Cleanup and disposition

The isolated service stopped; port 65092 returned no health response; temporary DB and browser profile directory were removed. DB remained at one synthetic admin and zero invitations/feedback requests. Preserve this as a blocked preflight only; the requested lifecycle remains unverified on this current source snapshot.

Artifacts: [preflight results](../../output/playwright/onboarding-pending-feedback-817225-20260929/results.json) and [guarded runner](../../output/playwright/onboarding-pending-feedback-817225-20260929/run.mjs). No screenshot exists because Edge was never launched.

**LIVE-FEEDBACK-01 remains open** pending safe deployed-runtime/database identity and an isolated authenticated runtime check. No source edits, commit, or push.
