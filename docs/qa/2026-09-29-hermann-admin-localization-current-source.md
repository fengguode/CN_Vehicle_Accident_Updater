# Hermann current-source admin localization QA

**Date:** 2026-09-29 (Asia/Shanghai)  
**Variant:** `updater-vnext`  
**Target:** isolated same-origin service at `127.0.0.1:58916` with synthetic admin/member fixture  
**Browser:** headed Microsoft Edge 154.0.4258.37 via cached Playwright Core  
**Tester:** Hermann User Tester

## Runtime and source parity

The isolated service health returned 200. Served assets matched source before and after the browser pass: `app.js` SHA-256 `7f1b269330c0fffe7e49340dbeadb9c8ba178a17cc42a1ad0e0d3b0619b8a5e0` and `styles.css` `b6071808af773a20c03ace8f5d5be34c00a564cce32705a28da9f112d3e0ec8d`. The live service on port 8788 received no authentication or writes.

## Reproduction and results

At 390×844, sign in as the synthetic administrator and open User management in English. Click the language toggle to switch to Chinese without navigating away. The navigation and heading translate, but the already-rendered account area does not: “Accounts loaded,” row roles (“Member”, “Administrator”), approval options (“Approved”, “Pending approval”), account-state options (“Active”, “Disabled”), and the Save and Anonymize buttons remain English. No page errors occurred; the page had no horizontal overflow (375px document client and scroll widths).

Navigating away and reopening User management in Chinese rendered the dynamic row content in Chinese. This isolates the defect to in-place language changes leaving existing admin rows/status/control labels stale. The repro is confirmed on the latest-tested current bundle.

The related `UI-ADMIN-320-01` responsive defect was also rechecked on this bundle: English “Administrator access” stacks below “User management” and fits at 320×800; document/body widths matched at 305px. No horizontal overflow.

Evidence: [in-place Chinese screenshot](../../output/playwright/admin-i18n-01-current-20260929/zh-in-place-390x844.png), [fresh Chinese view after re-entry](../../output/playwright/admin-i18n-01-current-20260929/zh-reentered-390x844.png), [English 320×800 screenshot](../../output/playwright/admin-i18n-01-current-20260929/english-320x800.png), [latest-run metrics and hashes](../../output/playwright/admin-i18n-01-current-20260929/latest-7F1B-recheck.json), [broader metrics](../../output/playwright/admin-i18n-01-current-20260929/metrics.json), and [English 320px metrics](../../output/playwright/admin-i18n-01-current-20260929/english-320-metrics.json).

Cleanup stopped the isolated service and removed its fixture and browser profiles; port 58916 was verified closed. Live port 8788 remained signed out and healthy.

## Git state

`updater-vnext`, branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`. This QA note and backlog changes are uncommitted among existing shared work. No application source edit, commit, or push was made by Hermann.
