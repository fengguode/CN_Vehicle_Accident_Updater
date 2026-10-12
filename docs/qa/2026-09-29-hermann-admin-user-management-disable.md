# Hermann admin User management and member-disable journey

**Date:** 2026-09-29 (Asia/Shanghai)  
**Variant:** `updater-vnext`  
**Target:** isolated current-source service `http://127.0.0.1:56572/`, disposable SQLite fixture  
**Browser:** Microsoft Edge 154.0.4258.37, headed Playwright; admin and member in separate browser contexts  
**Viewport:** 1280×800 desktop and 320×800 narrow mobile  
**Tester:** Hermann User Tester

## Runtime identity and cleanup

Fresh fixture began with one synthetic administrator. Same-origin `/health`, shell, and served assets returned 200. Served/source SHA-256 hashes: `app.js` `a4ef417072e185bf8871c3f205aaad72ee348d259f163531a9e386bf74f9e794`; `index.html` `09379f2df2553c5de80ce22c90d8953906c7781f6e5f953b4bef65dd2bea2459`; `server.js` `f6760db746861e3cff69d982904f52a9e0d0d5f5e64a321916e6124fe0b7e9`; `auth.js` `3c931cbe1c8c9b95984f6a302467df99f3750d2d1b0d3f125084ab1b6b94692d`.

Only synthetic admin/member/invitation/session data was used. Before cleanup the DB had two users, three sessions, and zero feedback rows. The service was stopped, port 56572 no longer responded, and the exact temporary DB/profile/harness directory was removed. Port 8788 was untouched. No source files were edited.

## Admin and member journey

| Step | Observation | Result |
|---|---|---|
| Admin creates invitation; member registers | Invitation POST 201; registration POST 201 | Pass |
| Admin finds new member in User management | Previously open admin list did not refresh on its own; revisiting the view showed the account | Pass after view revisit; no auto-refresh expected was assumed |
| Admin approves and enables member | User update PATCH 200; refreshed row showed approved and active | Pass |
| Member signs in and accesses Reports | `/api/auth/me` 200 with approved=true; `/api/reports` 200 with zero fixture reports | Pass |
| Admin disables member | PATCH `/api/admin/users/2` 200; refreshed admin row showed Disabled | Pass |
| Existing member session after disable | `/api/auth/me` returned 200 with `user:null`; Reports returned 401 `authentication_required`. Open Account UI retained stale signed-in status until the documented 30-second auth refresh, then showed signed-out state and Log in | Pass; API revocation immediate, UI refresh delayed by the configured poll |

No page errors were observed. Admin User management at 1280×800 had no overflow (document/body widths 1280/1160; row width 1072). At 320×800 the panel and controls fit within horizontal bounds, but document/body scroll width was 317px against client width 305px, a 12px page-level horizontal overflow; one rendered span extended to right=317. The exact element/text was not retained in this first pass. A focused fresh-fixture reproduction is underway; track as open pending its exact overflow source and repeat measurement.

## Scope and limitations

The member was approved and active before deactivation, so this run tests an authenticated member revocation. It does not test removing administrator privileges from the currently logged-in administrator. The admin-list staleness observation was handled by revisiting the view and was not classified as a defect. See [focused narrow-width reproduction](2026-09-29-hermann-admin-user-management-overflow-recheck.md) when available.
