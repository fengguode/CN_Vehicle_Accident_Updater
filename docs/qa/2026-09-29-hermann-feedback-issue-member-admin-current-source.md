# QA session: member issue/feature submission and admin triage

**Date:** 2026-09-29 (Asia/Shanghai)  
**Target:** `updater-vnext`, isolated same-origin disposable service/database on port 58922  
**Browser:** Microsoft Edge 154.0.4258.37, headed Playwright  
**Viewport:** 390×844  
**Source parity:** app.js SHA-256 `C1E01513F4C1A2701E7863505535E8114330A6700BA0B2898A34FC4722053461`; styles.css `B6071808AF773A20C03ACE8F5D5BE34C00A564CCE32705A28DA9F112D3E0EC8D`. Served assets matched workspace before and after the run.

## Acceptance results

- Approved synthetic member submitted an Issue (HTTP 201) and a Feature (HTTP 201); both appeared in that member's own Account list with Submitted status.
- Member Feedback/admin-queue request returned 403 `admin_required`; admin-only Feedback navigation was hidden.
- Synthetic admin opened Feedback queue with both requests and moved the Issue to Under review with a public update and private note (PATCH 200). `Request status updated.` appeared and received focus.
- After member refresh, the Issue's Under review status and public update were visible; the private note was absent. Feature remained Submitted.
- A harness predicate initially raised a ReferenceError after the Issue submission; this was test-harness-only, not an application error. The run recovered in the same isolated fixture and verified the saved Issue and remaining journey. Corrected run reported no application page errors.

No distinct product defect observed. Screenshots: [member Issue and Feature](../../output/playwright/feedback-current-20260929/member-own-issue-and-feature-390x844.png), [admin triage](../../output/playwright/feedback-current-20260929/admin-feedback-triaged-390x844.png), [member after triage](../../output/playwright/feedback-current-20260929/member-after-triage-390x844.png).

## Isolation and cleanup

Synthetic identities and requests only. No live 8788 access, authentication, or writes. Disposable database/profile removed; port 58922 has no listener. No source edits. Workspace contains shared uncommitted work; branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`; no commit/push.