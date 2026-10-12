# Hermann latest-source member/admin feedback lifecycle

**Date:** 2026-09-29 (Asia/Shanghai)
**Variant:** `updater-vnext`
**Target:** isolated `updater-vnext` service at `http://127.0.0.1:53690/`
**Browser:** Microsoft Edge 154.0.4258.37, headed direct Node ESM using cached `playwright-core`, two fresh disposable profiles, 1280×800.
**Tester:** Hermann User Tester.

## Runtime identity and isolation

A fresh unique temporary SQLite DB started with one synthetic administrator and zero feedback requests. `/health` returned 200; the same-origin UI rendered; `/api/auth/me` initially returned user-null. Served assets exactly matched current source:

- `apps/web/app.js`: SHA-256 `a4ef417072e185bf8871c3f205aaad72ee348d259f163531a9e386bf74f9e794`
- `apps/web/index.html`: SHA-256 `09379f2df2553c5de80ce22c90d8953906c7781f6e5f953b4bef65dd2bea2459`
- `apps/api/server.js`: SHA-256 `f6760db746861e3cff69d982904f52a9e0d0d5f5e64a321916e6124fe0b7e9`
- `apps/api/auth.js`: SHA-256 `3c931cbe1c8c9b95984f6a302467df99f3750d2d1b0d3f125084ab1b6b94692d`

The live 8788 service received no authentication or write requests.

## Rendered member/admin journey

| Step | Browser/API observation | Result |
|---|---|---|
| Synthetic admin login | Rendered admin session | Pass |
| Admin creates one-use invitation | Invitation request returned 201 | Pass |
| Admin logout; synthetic member registers with invitation | Registration returned 201; member showed Pending; admin Feedback navigation was absent | Pass |
| Admin re-login and approves member | Pending shown; approval selector changed false→true; PATCH returned 200; `#admin-load-status` announced “Changes saved.”; freshly rendered replacement row showed approved=true | Pass |
| Member logs in | Account showed approved access | Pass |
| Member submits synthetic Issue | Feedback POST returned 201; request appeared in own Account list as Submitted | Pass |
| Admin reviews/triages request | Queue GET returned 200 and showed request and submitter; admin set Under review plus synthetic public update/private note; PATCH returned 200 | Pass |
| Member checks request | Own list showed Under review and the public update; private admin note was absent | Pass |

No product UX/privacy defect was found in the checked lifecycle. The API writes were confined to the synthetic login/logout, invitation, registration, approval, feedback submission and triage actions above.

## Cleanup and Git state

The isolated DB contained only the two synthetic users and one synthetic request before cleanup. The database/WAL and both Edge profile directories were removed; port 53690 no longer accepted connections. Live 8788 remained healthy and untouched.

`updater-vnext`, branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`; working tree has shared source/QA/backlog changes; no commit or push.
