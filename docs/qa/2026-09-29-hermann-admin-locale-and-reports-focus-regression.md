# Hermann latest-source admin localization and Reports focus regression

**Date:** 2026-09-29 (Asia/Shanghai)  
**Variant:** `updater-vnext`  
**Target:** isolated same-origin service at `127.0.0.1:58919` with synthetic admin, approved member, and four synthetic reports  
**Browser:** headed Microsoft Edge 154.0.4258.37 via cached Playwright Core  
**Tester:** Hermann User Tester

## Runtime and source parity

Isolated service `/health` returned 200. Served app and styles matched source before and after the test: `app.js` SHA-256 `dfbfbe7f9dcbe564f90f05b826f08bb4fb43845d71ed315d01d50f5addeaa508` and `styles.css` `b6071808af773a20c03ace8f5d5be34c00a564cce32705a28da9f112d3e0ec8d`. The test used only its disposable fixture. No authentication or writes were made to live port 8788.

## Reproductions

**UI-ADMIN-I18N-01 — stale admin row language:** At 390×844, open User management in English and switch to Chinese in place. The heading changes to “用户管理,” but the status remains “Accounts loaded.” and rendered role, approval, account state, and action labels remain English. This confirms the earlier in-place localization finding on the latest-source bundle.

**UI-REPORTS-FOCUS-01 — focus lost after resetting no-results search:** At 320×800, use keyboard navigation to focus the inline Reset filters button in the no-results view and press Enter. The four report cards return, but the removed button no longer exists and `activeElement` becomes `BODY`, despite the visible 3px `:focus-visible` ring immediately before activation.

No page errors occurred. The current regression screenshots are [admin English](../../output/playwright/current-regression-20260929/admin-user-management-en-390x844.png), [admin Chinese after in-place switch](../../output/playwright/current-regression-20260929/admin-user-management-zh-in-place-390x844.png), [member empty results before reset](../../output/playwright/current-regression-20260929/member-no-results-before-reset-320x800.png), and [member cards after reset](../../output/playwright/current-regression-20260929/member-cards-restored-after-reset-320x800.png). The preceding full member search/filter matrix and reset-focus measurements are in [the broader reports QA folder](../../output/playwright/reports-search-member-20260929/).

The isolated service, fixture, and profile were removed; port 58919 was verified closed. No application source was edited.

## Git state

`updater-vnext`, branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`. This QA note and backlog updates are uncommitted among existing shared work; no commit or push.
