# QA session: invitation and approval journey

**Date:** 2026-09-29 (Asia/Shanghai)  
**Target:** `updater-vnext`, disposable isolated service/database on port 58921  
**Browser:** Microsoft Edge 154.0.4258.37, headed Playwright  
**Viewport:** 390×844  
**Source parity:** served app.js SHA-256 `141611330174FCC8E71890290BC6F98A591F826500A81CE6224017C4E3D89B39`; served/local CSS SHA-256 `B6071808AF773A20C03ACE8F5D5BE34C00A564CCE32705A28DA9F112D3E0EC8D`. Tester verified served assets matched workspace before and after the session.

## Acceptance journey and results

- Synthetic admin created an invitation through the UI (HTTP 201; code and expiry displayed).
- A separate signed-out synthetic member registered through the UI using the invitation (HTTP 201) and saw pending status.
- While pending, Reports remained gated, and admin-only navigation/invitation controls were hidden.
- Admin found the pending account in User management and approved it through the UI (PATCH 200; “Changes saved.” status received focus).
- Member reload refreshed identity to approved; the approval gate disappeared and Reports controls became available. The empty synthetic dataset showed the expected zero-report state.
- Member did not receive admin or Feedback navigation.

No page errors or distinct defects observed. Screenshots: [admin invitation](../../output/playwright/invitation-flow-20260929/admin-invitation-390x844.png), [pending gate](../../output/playwright/invitation-flow-20260929/member-pending-reports-gate-390x844.png), [admin approval](../../output/playwright/invitation-flow-20260929/admin-approved-member-390x844.png), [approved member](../../output/playwright/invitation-flow-20260929/member-approved-reports-390x844.png).

## Isolation and cleanup

All accounts and data were synthetic. No authentication or writes were made to live port 8788. Disposable service, database, and browser profile were removed; port 58921 has no remaining listener. No source files changed during this session. Workspace has shared uncommitted changes; branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`; no commit or push.