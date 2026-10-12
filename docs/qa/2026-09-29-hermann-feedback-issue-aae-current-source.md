# QA session: AAE current-source member Issue lifecycle

**Date:** 2026-09-29 (Asia/Shanghai)  
**Target:** isolated `updater-vnext` service/database on port 58926; health 200  
**Browser:** Microsoft Edge 154.0.4258.37, headed Playwright  
**Viewport:** 390×844  
**Source parity:** app.js SHA-256 `AAE23B6A90DD7DF84354990CF6F9EB4B7D1476C10A019FDC7987E325AD5FB7E2`; styles.css `B6071808AF773A20C03ACE8F5D5BE34C00A564CCE32705A28DA9F112D3E0EC8D`; served assets matched source before/after.

## Results

- Synthetic approved member created an Issue through the UI (201) and saw it in their Account list as Submitted.
- Member Feedback/Admin navigation was hidden; a signed-in member request to `GET /api/admin/feedback` returned 403 `admin_required`.
- Synthetic admin saw the request in the queue and triaged it to Under review with public update and private note (PATCH 200).
- After reload and explicitly opening Account, member saw Under review and public update, but not the private note; member remained non-admin.
- No page errors or distinct product defect observed.

Screenshots: [member Issue](../../output/playwright/feedback-issue-aae-20260929/member-issue-390x844.png), [admin triage](../../output/playwright/feedback-issue-aae-20260929/admin-triage-390x844.png), [member after reload](../../output/playwright/feedback-issue-aae-20260929/member-after-reload-account-390x844.png).

Synthetic account/data only. No authentication or writes on live 8788. Disposable DB, profiles and scripts removed; port 58926 has no listener. No source edits. Workspace has shared uncommitted changes; branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`; no commit/push.