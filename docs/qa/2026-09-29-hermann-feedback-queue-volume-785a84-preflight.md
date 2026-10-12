# FEEDBACK-TRIAGE current queue-volume recheck — requested target drift

**Date:** 2026-09-29 (Asia/Shanghai)  
**Requested target:** app `785a84eead31675f22f1cedc6df969b1cf22006258063bc56adcf533b713fe7b`, CSS `69f09a8d…`; isolated synthetic admin + 105 requests.  
**Result:** Blocked before Edge acceptance due exact app-hash drift.

## Preflight and cleanup

- Started one fresh isolated `apps/api/server.js` on `http://127.0.0.1:49277`, pointed at a disposable synthetic DB with one synthetic admin and 105 synthetic feedback rows spread across Issue/Feature and status categories. `/health` returned 200; `/api/auth/me` was user-null.
- All six served UI assets matched the current workspace files, but app.js SHA-256 was `6a4b6c125763569aae68cfbcaff4197e5ef335f2297c0372e5469ef3a0931fde`, not the assigned exact target `785a84eead31675f22f1cedc6df969b1cf22006258063bc56adcf533b713fe7b`. Other observed hashes: `index.html` `09379f2df2553c5de80ce22c90d8953906c7781f6e5f953b4bef65dd2bea2459`; `styles.css` `69f09a8d660b83e808715a2045e313a30e94eccfdbd3dddc76553a4e535454fc`; `navigation.js` `7a1114587842f11bace2b1b4d69f9d15d5e35ae946abf7efd0f5564461dcea56`; `viewport.js` `fef9e10e9114de24f83a0ca909b841c1b93f1a6aa84fe8dabb023235893922da`; `report-presentation.js` `d0a081dc918f6c848d15a865d890eb8695d6554d1f626a8db4f26edcf1d07d6f`.
- Exact-target guard aborted before Edge launch; browser/version and rendered viewport checks are unverified. No login/API mutation or UI action occurred. The local runner seeded only synthetic data before the guard; DB had one admin and 105 synthetic requests. Service stopped, `/health` unreachable, temp DB/profile removed, port 49277 closed, 8788 untouched.

Artifacts: [preflight results](../../output/playwright/feedback-queue-volume-785a84-20260929/results.json) and [guarded runner](../../output/playwright/feedback-queue-volume-785a84-20260929/run.mjs). No screenshot exists because Edge was not launched.

No product regression is inferred, and FEEDBACK-TRIAGE/QA-01 acceptance is not changed by this blocked preflight. The previous 105-row volume run is a separate older-source result; it does not substitute for current-bundle responsive/keyboard acceptance.
