# Hermann pending-member issue feedback check

**Date:** 2026-09-29 (Asia/Shanghai)  
**Variant:** `updater-vnext`  
**Target:** isolated service at `http://127.0.0.1:54506/` with a fresh disposable SQLite database  
**Browser:** Microsoft Edge 154.0.4258.37, headed direct Node ESM + cached Playwright, 1280×800  
**Tester:** Hermann User Tester

## Runtime and isolation

`/health` returned 200 and the app rendered. Served files matched the tested source: `app.js` SHA-256 `a4ef417072e185bf8871c3f205aaad72ee348d259f163531a9e386bf74f9e794`, `index.html` `09379f2df2553c5de80ce22c90d8953906c7781f6e5f953b4bef65dd2bea2459`, `server.js` `f6760db746861e3cff69d982904f52a9e0d0d5f5e64a321916e6124fe0b7e9`, `auth.js` `3c931cbe1c8c9b95984f6a302467df99f3750d2d1b0d3f125084ab1b6b94692d`, and `feedback-repository.js` `576e3180224b3bd277f2ff4af5e9a974edecd52ee12278d874797d8041da4c36`.

The fresh DB began with one synthetic admin, no reports, and no feedback. The test created one invitation, one synthetic pending member, and one synthetic Issue. Before cleanup it contained two synthetic users and one feedback row. Browser contexts closed; DB and profiles were deleted; port 54506 had no listener afterward. Live 8788 received no authentication or writes. No source files were edited.

## Browser journey and results

| Check | Observation | Result |
|---|---|---|
| Admin creates invitation | `POST /api/auth/invitations` returned 201 | Pass |
| Member registers | `POST /api/auth/register` returned 201; page showed pending approval | Pass |
| Pending member opens Reports | Workspace stayed hidden; explanatory approval message appeared; `GET /api/reports` returned `admin_approval_required` | Pass; reports remain gated |
| Pending member opens Account and submits an Issue | `GET /api/feedback/mine` returned 200; `POST /api/feedback` returned 201; own Account list showed title and Submitted status | Pass |
| Member attempts admin Feedback API | Returned 403 `admin_required`; admin navigation was hidden | Pass |
| Admin opens Feedback | Rendered queue showed the submitted Issue and submitter identity | Pass; queue API status was not retained in this run |

No visible submission error or focus anomaly was observed; this run did not include measured focus assertions. This confirms the implementation allows a pending signed-in member to submit feedback while Reports are gated; it does not resolve or change the project policy. See also [latest-source approved-member lifecycle](2026-09-29-hermann-latest-source-member-feedback-lifecycle.md) and [admin submission check](2026-09-29-hermann-admin-feedback-submission.md).

## Git state

At observation: `updater-vnext`, branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`; shared source/docs/QA changes remained uncommitted. No commit, push, or live-service change.
