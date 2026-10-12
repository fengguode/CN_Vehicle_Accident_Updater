# User management failure recovery and stale-list QA

**Date:** 2026-09-29 (Asia/Shanghai)  
**Target:** `updater-vnext`, fresh isolated `apps/api/server.js` instance at `http://127.0.0.1:57292/` (ephemeral, stopped after run).  
**Source:** `apps/web/app.js` SHA-256 `aae23b6a90dd7df84354990cf6f9eb4b7d1476c10a019fdc7987e325ad5fb7e2`. The same-origin `/health` returned 200 and served `index.html`, `app.js`, `styles.css`, and `navigation.js` matched workspace files before and after testing.  
**Browser:** headed Microsoft Edge 154.0.4258.37, direct Playwright Node API, disposable persistent profile. User management viewport 390×844; Reports regression viewport 320×800.  
**Isolation:** synthetic SQLite DB and test identities only; port 8788 was not contacted. Isolated service, DB, and browser profile were removed at completion.

## Acceptance checks

| Check | Expected | Actual | Status |
|---|---|---|---|
| Failed Save response held during locale change | Save stays disabled while pending; after an in-place English→Chinese rerender and a synthetic 503, the live row re-enables and shows the current Chinese error | Held one PATCH (not forwarded to the API), changed role selection to `member`, toggled locale, then released 503. Current row Save re-enabled; feedback read `无法保存此账户更改。 synthetic_failure`; no English error remained | Pass |
| Draft/server integrity on failed Save | Failed synthetic request does not change persisted role or discard the unsaved selection | Live select remained `member`; isolated API still reported saved role `admin`; exactly one PATCH request | Pass |
| Delayed stale user-list failure | A later successful list generation remains visible and its status is not overwritten when an older held request fails | Held first GET, navigated away and back to produce a newer successful generation (`账户已加载。`, 4 rows), then released old 503. Status and row count remained unchanged; no stale error was shown | Pass |
| Prior post-fix UI regression | Reports reset focus behavior and User management locale/state regression remain intact | The same fresh run repeated the earlier accepted focus, translation, unsaved-value, successful Save, responsive overflow, and no-page-error checks; all assertions passed | Pass |
| Runtime and cleanup | Isolated instance only; expected assets served; disposable state removed | All four UI assets matched source; zero page errors; service stopped and DB/profile removed; port 8788 untouched | Pass |

The first harness attempt stopped at its locale synchronization assertion: it expected “Accounts loaded.” even though the product correctly translated and retained the prior “Changes saved.” status. I changed only the harness wait condition to wait for the localized control rerender, then reran the isolated test. The final run passed the product assertions above; previous PASS artifacts were preserved.

## Evidence

Command: `node output/playwright/focus-i18n-fix-20260929/run-failure-recovery.mjs`  
Final JSON: [`results.json`](../../output/playwright/focus-i18n-fix-20260929/failure-recovery/results.json), SHA-256 `36e96dc9eef19dab0c543d6a2192ba9b95d5aea1b1c2aa6b14ead69da86efd8c`.  
Follow-up screenshots: [`Save failure after locale rerender`](../../output/playwright/focus-i18n-fix-20260929/failure-recovery/failure-recovery/save-failed-after-locale-rerender-390x844.png), [`stale list failure`](../../output/playwright/focus-i18n-fix-20260929/failure-recovery/failure-recovery/stale-list-failure-does-not-overwrite-status-390x844.png).  
Full harness and prior successful UI evidence remain in [`focus-i18n-fix-20260929`](../../output/playwright/focus-i18n-fix-20260929/); earlier PASS evidence was not overwritten.

## Findings and limits

No new defect was reproduced. The latest follow-up confirms the reviewed detached-row failure recovery and stale request-generation guards in a controlled browser run. The test held synthetic responses through Playwright routing and used no live account or runtime. This does not establish readiness of any separately running service or test other browsers. No full application suite was run.
