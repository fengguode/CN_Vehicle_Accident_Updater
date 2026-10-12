# Hermann Feedback workspace role and route-guard check

**Date:** 2026-09-29 (Asia/Shanghai)  
**Variant:** `updater-vnext`  
**Target:** isolated current-source service at `http://127.0.0.1:56880/`  
**Browser:** Microsoft Edge 154.0.4258.37, headed cached Playwright Node API, 1280×800  
**Tester:** Hermann User Tester

## Runtime and synthetic fixture

`/health` returned 200; served app/navigation assets matched the source used in the run. SHA-256: `app.js` `752d838601ff8c5a1a21196d40f65e0f8ccb2be87e6e7748da66254ec8ff3647`; `navigation.js` `7a1114587842f11bace2b1b4d69f9d15d5e35ae946abf7efd0f5564461dcea56`; `index.html` `09379f2df2553c5de80ce22c90d8953906c7781f6e5f953b4bef65dd2bea2459`; `server.js` `e610efe25dfccb1b8cd7c45db16381a2d658c272c76365e8bec71b9a102da901`; `auth.js` `7cd949d70f33b1c3ed8fd9c740c7a666b5edbd1ef4b915622312ae49924606e9`; feedback repository `0183f9fb4eef62090cd1ae1f93e1cab099dc15952d43ae910e2e8760a5ffe499`.

Fixture contained one synthetic administrator, one pending member, and one approved member; no reports or feedback. All interactions were on the disposable service. The DB, browser profiles, runner were removed and PID 34764 stopped; port 56880 health was unavailable after cleanup. Port 8788 received no authentication or writes. No source edits were made.

## Browser/API scenarios

| Role/scenario | Observation | Result |
|---|---|---|
| Signed out opens an unsupported `?view=feedback#feedback` URL | URL hash/query deep links are not implemented; app stayed in Reports and Feedback nav remained hidden. Feedback API returned 401 `authentication_required` | Pass; no deep-link contract inferred |
| Signed-out hidden Feedback navigation is invoked programmatically | `showView` guard routed to Account | Pass |
| Pending member attempts Feedback | Feedback nav hidden; guarded view remained Account; `/api/admin/feedback` returned 403 `admin_required` | Pass |
| Approved member attempts Feedback | Same hidden navigation/Account behavior; `/api/admin/feedback` returned 403 `admin_required` | Pass |
| Administrator opens Feedback through normal navigation | Feedback nav visible and selected; queue showed “There are no requests to review.”; API returned 200 with an empty list | Pass |
| Admin promotes approved member | User-management PATCH returned 200; browser DOM reflected the new role. The first harness wait expected visible text while that tab was on Reports; switching to a content poll resolved the harness wait | Pass; harness synchronization miss only |
| Promoted administrator opens Feedback | Admin navigation appeared after reload; Feedback view opened; queue GET returned 200 | Pass |
| Admin demotes the other administrator while Feedback is open | User-management PATCH returned 200; queue API returned 403 `admin_required`. On navigating again, the now-demoted user was routed to Account, Feedback nav disappeared, and the page showed “Administrator access changed. User management is unavailable.” | Pass |

No browser page errors occurred. Deep linking by URL hash/query was observed as unsupported, not reported as a defect. Current read-only live verification after cleanup confirmed 8788 health 200, `/api/auth/me` user-null, and served `app.js` hash matched current local source. The live process/database identity remains unknown, so no authenticated check was attempted there.
