# Hermann live signed-out bilingual registration check

**Date:** 2026-09-29 (Asia/Shanghai)  
**Variant:** `updater-vnext`  
**Target:** `http://127.0.0.1:8788/` (live shell; signed-out read-only session)  
**Browser:** Codex In-app Browser, 1280×720 rendered viewport  
**Tester:** Hermann User Tester

## Runtime and bundle parity

`/health` returned 200 and `/api/auth/me` returned `user: null`. Served assets matched the current local source: `app.js` SHA-256 `7f1b269330c0fffe7e49340dbeadb9c8ba178a17cc42a1ad0e0d3b0619b8a5e0`, `styles.css` `b6071808af773a20c03ace8f5d5be34c00a564cce32705a28da9f112d3e0ec8d`, `navigation.js` `7a1114587842f11bace2b1b4d69f9d15d5e35ae946abf7efd0f5564461dcea56`, and root-served HTML matched `index.html` hash `09379f2df2553c5de80ce22c90d8953906c7781f6e5f953b4bef65dd2bea2459`.

No credentials or account data were entered. The flow remained signed out. The empty form triggered required-field validation; this browser pass did not inspect network requests.

## Browser journey and results

Signed-out Reports displayed the approved-account access notice. Account opened to the login form; Register with invitation exposed Username, Password, Invitation code, and the helper asking an approved member to create and share a one-use invitation. Switching to Chinese while registration remained open translated the navigation, form fields, buttons, and helper without leaving the route. Clicking Create account with all fields blank displayed localized required-field errors for all three inputs and focused Username.

No new defect was observed in this path. This check complements the separate confirmed admin-only in-place locale defect `UI-ADMIN-I18N-01`.

## Git state

`updater-vnext`, branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`. This QA note and backlog link are uncommitted among existing shared work; no app change, commit, or push.
