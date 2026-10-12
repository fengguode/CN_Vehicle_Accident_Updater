# Current-source revalidation: Reports reset focus and admin locale

**Date:** 2026-09-29 (Asia/Shanghai)  
**Variant/commit:** `updater-vnext`, branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`; shared working-tree edits were present. No source or backlog changes were made by this test.  
**Target:** isolated same-origin service `http://127.0.0.1:53713/`, entrypoint `apps/api/server.js`, ephemeral port. `/health` returned HTTP 200. Browser-served `index.html`, `app.js`, `styles.css`, and `navigation.js` exactly matched workspace files.  
**Build evidence:** served `app.js` SHA-256 `dfbfbe7f9dcbe564f90f05b826f08bb4fb43845d71ed315d01d50f5addeaa508`; `styles.css` SHA-256 `b6071808af773a20c03ace8f5dbe34c00a564cce32705a28da9f112d3e0ec8d`; `index.html` SHA-256 `09379f2df2553c5de80ce22c90d8953906c7781f6e5f953b4bef65dd2bea2459`; `navigation.js` SHA-256 `7a1114587842f11bace2b1b4d69f9d15d5e35ae946abf7efd0f5564461dcea56`.  
**Browser:** headed Microsoft Edge 154.0.4258.37 through the direct Playwright Node API with a new persistent profile. Reports viewport 320×800; User management viewport 390×844.

## Acceptance and actual results

| Finding | Expected | Actual | Status |
|---|---|---|---|
| UI-REPORTS-FOCUS-01 (P3) | Keyboard activate inline Reset filters from the no-results state; once the button removes itself, focus lands on a stable, meaningful control or heading | At 320×800, the inline button was reached in 4 Tabs from the focused search field with visible focus outline. Enter reset the query, restored all four synthetic reports and updated the live result count to `1 / 1 · 4 reports`, but focus fell to `BODY` | **Confirmed, still open** |
| UI-ADMIN-I18N-01 (P2) | Changing English→Chinese in-place while User management is open updates already-rendered status, row labels/options, and controls without losing the view | Navigation and heading changed to Chinese. Existing admin rows remained English: `Accounts loaded.`, `Member`/`Administrator`, `Approved`/`Pending approval`, `Active`/`Disabled`, `Save`, and `Anonymize disabled account`. Navigating to Reports and reopening User management in Chinese caused those values to render in Chinese | **Confirmed, still open** |

## Reproduction details

### Reports reset focus

1. Sign in as the synthetic approved member `qa-focus-i18n-member` on the isolated service at 320×800.
2. In Reports, enter `NO_SYNTHETIC_REPORT_WILL_MATCH_20260929` in Search and wait for the inline no-results state.
3. Tab from the focused search field until the inline `Reset filters` button is focused (4 Tabs in this run); verify `:focus-visible` and the 3px outline.
4. Press Enter. Four reports return and the live count updates, but `document.activeElement` is `BODY` with no visible focus target.

### User management locale

1. Sign in as synthetic admin `qa-focus-i18n-admin` at 390×844 and open User management. The synthetic member row renders in English.
2. Click the language toggle while staying in User management. Wait for `<html lang="zh-CN">` and the translated heading.
3. The status, row control labels/options, Save and Anonymize text remain English. Navigate to Reports and reopen User management; the same row then displays Chinese (`账户已加载。`, `成员`/`管理员`, `已批准`/`待批准`, `启用`/`停用`, `保存`, `匿名化已停用账户`).

## Environment, artifacts, and disposition

The disposable SQLite database held four synthetic reports, one synthetic admin, and one synthetic approved member. No live users/data were used. No page errors occurred. The service stopped, and the synthetic DB and Edge profile were removed; port 8788 was not contacted. Command: `node output/playwright/focus-i18n-current-source-20260929/run.mjs`.

Machine-readable results, the harness, and screenshots are in [`output/playwright/focus-i18n-current-source-20260929`](../../output/playwright/focus-i18n-current-source-20260929/). Results JSON SHA-256: `193980c669e9e86a02aab7c9d42237f9c675d3530aa3adf419944bdcdbf0e231`.

Both current-source regressions remain reproducible. No application tests beyond this focused headed-browser revalidation were run. No automated delayed-network race, other browsers, desktop locale viewport, or live runtime was tested. This is pre-fix evidence; rerun both cases against the integrated fixes before changing either backlog finding to verified.
