# QA session: current AAE live signed-out registration

**Date:** 2026-09-29 (Asia/Shanghai)  
**Target:** live `http://127.0.0.1:8788/`, read-only; health 200 and `/api/auth/me` `{user:null,csrf:null}` before/after  
**Browser:** Microsoft Edge 154.0.4258.37, headed Playwright  
**Viewport:** 390×844  
**Source parity:** `apps/api/server.js` serves `apps/web`. Served/local app.js SHA-256 `AAE23B6A90DD7DF84354990CF6F9EB4B7D1476C10A019FDC7987E325AD5FB7E2`; styles.css `B6071808AF773A20C03ACE8F5D5BE34C00A564CCE32705A28DA9F112D3E0EC8D`; matched before and after.

## Results

- Reports showed the signed-out access gate with Reports and Account navigation only; no admin/Feedback navigation.
- Account login displayed required username/password. Registration kept the form open while switching English→Chinese; submit, mode, and guidance strings translated. Invitation input was required and associated to visible `invite-help` with `aria-describedby`.
- No contact/access-request links were present in either language; helper directs the visitor to contact an approved member. This remains the previously tracked UX-REG-02 access-discovery question, not a newly confirmed defect.

Only API request was GET `/api/auth/me` 200. No report/admin data requests, POSTs, credentials, form submissions, or writes. Zero page errors. Screenshots: [Account login](../../output/playwright/live-signedout-8788-aae-20260929/account-login-en-390x844.png), [English registration](../../output/playwright/live-signedout-8788-aae-20260929/account-register-en-390x844.png), [Chinese registration](../../output/playwright/live-signedout-8788-aae-20260929/account-register-zh-390x844.png).

Disposable profile/script removed. Live 8788 was not modified. Workspace has shared uncommitted changes; branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`; no commit/push.