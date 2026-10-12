# QA session: AAE invitation, registration, approval and Reports access

**Date:** 2026-09-29 (Asia/Shanghai)  
**Target:** isolated disposable `updater-vnext` service/database on port 58929; health 200  
**Browser:** Microsoft Edge 154.0.4258.37, headed Playwright  
**Viewport:** 390×844  
**Source parity:** app.js SHA-256 `AAE23B6A90DD7DF84354990CF6F9EB4B7D1476C10A019FDC7987E325AD5FB7E2`; styles.css `B6071808AF773A20C03ACE8F5D5BE34C00A564CCE32705A28DA9F112D3E0EC8D`; matched before/after.

## Results

- Synthetic admin created an invitation through the UI (POST 201; 43-character code displayed).
- Separate signed-out synthetic member registered through the form (POST 201), then saw pending status and the Reports approval gate. Admin/Feedback/Invite controls were hidden for the pending member.
- Admin found the pending user in User management and approved via UI (PATCH 200); `Changes saved.` appeared and the status node received focus.
- After member reload, approved state appeared, gate disappeared, and Reports search/summary controls were available. Zero-report fixture showed `0 reports · 0 unverified`. Member still had no Admin/Feedback navigation.
- No page errors or distinct defect observed.

Screenshots: [admin invitation](../../output/playwright/invitation-approval-aae-20260929/admin-created-invitation-390x844.png), [pending member](../../output/playwright/invitation-approval-aae-20260929/member-pending-gate-390x844.png), [admin approval](../../output/playwright/invitation-approval-aae-20260929/admin-approved-member-390x844.png), [approved member](../../output/playwright/invitation-approval-aae-20260929/member-approved-reports-390x844.png).

Synthetic accounts/data only. No live 8788 authentication or writes. Disposable DB/profile/script removed; port 58929 has no listener. No source edits. Workspace has shared uncommitted changes; branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`; no commit/push.