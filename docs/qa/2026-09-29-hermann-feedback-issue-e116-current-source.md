# QA session: latest-source Issue submission and admin triage

**Date:** 2026-09-29 (Asia/Shanghai)  
**Target:** isolated `updater-vnext` service/database on port 58925 with synthetic member/admin; health 200  
**Browser:** Microsoft Edge 154.0.4258.37, headed Playwright  
**Viewport:** 390×844  
**Source parity:** At run start, served/local app.js E11633259C3400F532424AA63567C1A7D27F180290B8C413F625B06F358F65FC and CSS B6071808AF773A20C03ACE8F5D5BE34C00A564CCE32705A28DA9F112D3E0EC8D matched. During the pass, source advanced to app.js AAE23B6A90DD7DF84354990CF6F9EB4B7D1476C10A019FDC7987E325AD5FB7E2; served bytes matched the newly advanced source at end, but browser journey exercised the E116 bundle loaded at launch. AAE behavior is not verified in this session.

## Results

- Synthetic approved member submitted an Issue (POST 201); the admin queue showed it.
- Member admin-queue request returned 403 `admin_required`; admin/Feedback navigation remained hidden.
- Synthetic admin triaged Issue to Under review with public update and private note (PATCH 200).
- After reload and navigating from Reports to Account, member saw Under review and public update; private note remained hidden.
- One runner attempt timed out because reload returns to Reports, so Account feedback list was not loaded. Harness then explicitly opened Account in a fresh authenticated check and completed the visibility/privacy verification. No product page errors or distinct defect observed.

Screenshots: [admin triage](../../output/playwright/feedback-issue-e116-20260929/admin-issue-triage-390x844.png), [member submitted](../../output/playwright/feedback-issue-e116-20260929/member-issue-390x844.png), [member after triage](../../output/playwright/feedback-issue-e116-20260929/member-after-triage-390x844.png).

Disposable DB, profiles, and scripts removed; port 58925 has no listener. No source edits and no live 8788 access. Workspace contains shared uncommitted changes; branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`; no commit/push.