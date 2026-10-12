# Hermann admin feedback submission UX check

**Date:** 2026-09-29 (Asia/Shanghai)
**Variant:** `updater-vnext`
**Target:** isolated local service on ephemeral port 51715; synthetic SQLite database in a fresh temporary directory.
**Browser:** Microsoft Edge 154.0.4258.37, headed direct Playwright ESM with cached `playwright-core`, disposable profile, 1280×800.
**Tester:** Hermann User Tester.

## Runtime and source identity

- Fresh DB contained only synthetic approved administrator `qaadmin_42657724`.
- `/health` returned 200. Served `/app.js` was 77,151 bytes, SHA-256 `1351ab0a6bfe5d9fc67aea74d1a6d39faf635cde21669e5e4e897e5475f74f04`, matching local `apps/web/app.js`; `apps/api/server.js` SHA-256 was `f6760db746861e3cff69d982904f52a9e0d0d5f5e64a321916e6124fe0b7e0f9`.
- After Edge closure, the isolated service stopped, database/profile/temp directory were removed, and port 51715 refused connections. Port 8788 remained connected and healthy; it received no authentication or write requests.

## Rendered journey and result

The synthetic administrator signed in and saw the Administrator/approved account state, Account actions, and Feedback navigation. From Account, the admin submitted one Issue and one Feature request. Both synthetic `/api/feedback` requests returned 201. Each request appeared in the admin's own Account list with Submitted state and details, and in the administrator Feedback queue with type, Submitted status, and submitter identity. The admin's issue/feature submission and visibility flow passed. No triage mutation was performed in this run; prior isolated member/admin QA covers admin triage and member privacy.

Only expected synthetic login and feedback POST requests occurred. No live-service request, real account, or real data was used. No defect was found in this flow.

Git state at observation: `updater-vnext`, branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`; shared changes remain uncommitted. No commit or push.
