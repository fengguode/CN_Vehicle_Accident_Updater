# Hermann mobile feedback boundaries and triage QA

**Date:** 2026-09-29 (Asia/Shanghai)  
**Variant:** `updater-vnext`  
**Target:** isolated updater-vnext service on `127.0.0.1:58420`, disposable SQLite fixture  
**Browser:** headed Microsoft Edge 154.0.4258.37 via cached Playwright Core  
**Viewports:** 320×800 and 390×844  
**Tester:** Hermann User Tester

## Runtime and source parity

The isolated service health check returned 200; UI and API were same-origin. Served assets matched source: `app.js` SHA-256 `f43c8a5a7c766b97bc538c59342808da55f1a808b3a2323a679615b19db8ec2d`, `navigation.js` `7a1114587842f11bace2b1b4d69f9d15d5e35ae946abf7efd0f5564461dcea56`, `styles.css` `3e243b6268975d81a482843c19ee3bf49f8e8a9c3a50501f2eaf2b8acd90d213`, and `index.html` `09379f2df2553c5de80ce22c90d8953906c7781f6e5f953b4bef65dd2bea2459`. API files matched current source: `server.js` `e610efe25dfccb1b8cd7c45db16381a2d658c272c76365e8bec71b9a102da901`, `auth.js` `eebc14d0aa5e85420af365883ef8e120722a1605a7594430c94550db24105d1c`, and `feedback-repository.js` `0183f9fb4eef62090cd1ae1f93e1cab099dc15952d43ae910e2e8760a5ffe499`.

The live port 8788 was not used for authentication or writes. Cleanup removed the exact fixture directory, stopped PID 49904, and verified port 58420 was closed. No source files were edited.

## User journeys and observations

- Empty and whitespace-only title/body submissions were stopped by native required validation. Focus returned to Title and no feedback POST was sent.
- Input capped the title at 120 characters and description at 4,000. A member submitted a multiline Issue at both limits and a multiline Feature; both appeared in the member list.
- Admin queue GET returned 200. Type filters showed the corresponding Issue and Feature. Submitted status showed the Feature after the Issue was triaged.
- Attempting to set the Issue to Not planned without a public update triggered native validation, focused the public-update field, and sent no PATCH. Admin then set it Under review with a multiline public update and private note. The member saw the public update but not the private note.
- At 320×800 and 390×844, document/body scroll widths equaled client widths (305px and 375px respectively, after the browser scrollbar gutter). Cards and triage controls stayed within the viewport bounds. No page errors occurred.

No new reproducible defect was found in these boundary, privacy, and responsive checks.

## Git state

`updater-vnext`, branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`. This QA note and backlog update are uncommitted among existing shared changes. No code edit, commit, or push.
