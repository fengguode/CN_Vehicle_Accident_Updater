# Hermann current-source member and admin feedback QA

**Date:** 2026-09-29 (Asia/Shanghai)  
**Variant:** `updater-vnext`  
**Target:** isolated service `http://127.0.0.1:57769/`, fresh disposable SQLite database  
**Browser:** Microsoft Edge 154.0.4258.37, headed cached Playwright Node API, 1280×800  
**Tester:** Hermann User Tester

## Runtime and isolation

The service health check returned 200 and its UI and API were served from the same origin. Served assets matched tested source: `app.js` SHA-256 `8bd163704700a1680158c24375dd17d5a52898b472b3d43e5f0f85e27a817384`, `navigation.js` `7a1114587842f11bace2b1b4d69f9d15d5e35ae946abf7efd0f5564461dcea56`, `index.html` `09379f2df2553c5de80ce22c90d8953906c7781f6e5f953b4bef65dd2bea2459`, and `styles.css` `9fc657c3bcb35626d84d012ca43a9142f84a44155755f33cf48a0f6e1a4b9d4e`. Server, auth and feedback repository assets also matched the tested checkout.

The fresh database began with only synthetic admin and approved-member accounts and zero feedback. No request was sent to live port 8788. At cleanup the fixture/profile directory was removed, the test process was stopped, and port 57769 had no listener. No source files were edited.

## Browser journeys and results

| Journey | Browser/API evidence | Result |
|---|---|---|
| Empty member submission | Native required validation blocked submit (`checkValidity=false`, “Complete this field.”); no POST was sent. | Pass |
| Member creates Issue and Feature requests | Two `POST /api/feedback` responses were 201; form reset and success references appeared. Own-list GET returned exactly the two member requests in Submitted state, with no `internal_notes`. | Pass |
| Admin creates Issue and Feature requests | Two `POST /api/feedback` responses were 201; admin own-list GET returned two requests. | Pass |
| Admin reviews queue | Feedback view rendered all four requests with submitter identities. Queue GET returned 200. | Pass |
| Admin triages member Issue | UI PATCH returned 200; request became Under review / High with public update and private note. Admin saw the note and confirmation. | Pass |
| Member sees triage result and privacy boundary | Member list showed exactly their two requests; Issue showed Under review and public update, Feature remained Submitted. Member did not see private note or admin-created titles. Admin queue API returned 403 `admin_required`. | Pass |
| Browser runtime | Zero page errors. | Pass |

No reproducible defect was found in these member/admin feedback journeys. This run used synthetic data and does not establish the identity of the live service's database.

## Git state

`updater-vnext`, branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`. This QA note and canonical backlog update are uncommitted alongside existing shared work; no source edit, commit, or push was made.
