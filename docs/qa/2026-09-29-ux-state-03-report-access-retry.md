# QA session: UX-STATE-03 report-access retry race

**Date:** 2026-09-29 (Asia/Shanghai)  
**Result:** Pass  
**Tester:** Hermann (User Tester)  
**Target:** Disposable isolated updater-vnext service at `http://127.0.0.1:50101`, synthetic report, and synthetic approved members A and B.  
**Browser:** Microsoft Edge 154.0.4258.37, headed, direct Playwright Node API, fresh persistent profile with two tabs sharing session cookies.  
**Viewport:** 1280×800.

## Acceptance scenario

1. Member A opened a report that required access and started the retry flow.
2. The harness held A's successful `/api/auth/me` response.
3. In the second tab, the shared session switched to approved member B.
4. The first tab retried; B's identity was accepted and B's seeded report loaded.
5. The held response for A was released as HTTP 503.

The coverage was repeated for the report-data continuation:

1. Member A entered the retry flow after a synthetic reports 403; A's retry fetched `/api/summary` successfully and the harness held the response.
2. The second tab switched the shared session to approved member B.
3. The first tab retried, accepted B's identity, and loaded B's seeded report.
4. The held summary response from A's operation was released as HTTP 503.

## Result

After releasing either stale failure, the first tab still showed B as signed in, B's report remained visible, and no access or account error notice appeared. No browser page errors occurred. Both scenarios passed. In the auth-snapshot run, the initial attempt's failure was a harness assertion reading the username from `body.innerText`; the username is exposed in `#auth-status`. A diagnostic confirmed the product state was already correct, and the corrected assertion passed.

## Evidence and cleanup

- [Sanitized regression results](../../output/playwright/retry-access-race-20260929/results.json)
- Screenshots `01-member-a-retry-required.png` through `04-after-old-a-failure-release.png` are in the same output directory.
- [Sanitized delayed summary results](../../output/playwright/retry-summary-race-20260929/results.json), with screenshots in that output directory.
- Disposable service, database, and Edge profile were cleaned up. Port 8788 was not touched.
- The two scenarios used disposable services at `http://127.0.0.1:50101` and `http://127.0.0.1:63318`, Microsoft Edge 154.0.4258.37, headed direct Playwright Node API, fresh persistent profiles with two shared-cookie tabs, and 1280×800 viewports.
- Product source was unchanged during these QA sessions. Dennis reviewed both scenarios and confirmed the second closes delayed `loadDatabaseData()` failure continuation coverage alongside the held `/api/auth/me` failure result. He found no code or evidence concern in the tested sequences.
