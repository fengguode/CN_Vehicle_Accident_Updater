# QA session: AAE pending member can submit feedback while Reports are gated

**Date:** 2026-09-29 (Asia/Shanghai)  
**Target:** isolated disposable AAE same-origin service/database on port 58937  
**Browser:** Microsoft Edge 154.0.4258.37, headed Playwright  
**Viewport:** 390×844  
**Source parity:** served/source app.js `AAE23B6A90DD7DF84354990CF6F9EB4B7D1476C10A019FDC7987E325AD5FB7E2`; styles.css `D761134A7738B6D6620074CC39C516DC0FE6D4B82134D6397514DEA02FE2A380`; matched during setup.

## Results

- Synthetic admin created one invitation (201); separate signed-out member registered (201) and remained unapproved.
- Pending member Reports view showed approval notice and hid search; User management and Feedback navigation were hidden.
- Account feedback form remained available to pending member. Synthetic Issue submission returned 201; own list showed Submitted; admin Feedback queue showed the same request.
- Keyboard focus on Description showed visible 3px blue outline. No page errors.
- This pass verified the rendered Reports gate but did not directly probe pending-user Reports API authorization.

One initial harness wait used the wrong invitation result selector (`#account-message` instead of `#invite-result`); corrected in the same fixture before registration. Final disposable DB contained only synthetic admin, pending member and Issue. Unused invitation removed; DB/profile removed; port 58937 stopped. No live 8788 actions and no source edits. Screenshots: [admin invitation](../../output/playwright/pending-feedback-aae-20260929/admin-invitation.png), [pending gate](../../output/playwright/pending-feedback-aae-20260929/pending-account-gate.png), [member Issue list](../../output/playwright/pending-feedback-aae-20260929/pending-member-own-issue.png), [admin queue](../../output/playwright/pending-feedback-aae-20260929/admin-pending-issue-queue.png).

Branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`; shared work remains uncommitted; no commit/push.

## Reports API access check

Follow-up on isolated port 58938: in the pending member’s same authenticated browser context, /api/auth/me identified active/unapproved status, and same-origin GET /api/reports?page=1&page_size=20 returned HTTP 403 dmin_approval_required. The UI showed the approval notice, hid search, and hid Admin/Feedback nav. DB had two synthetic users, one invitation, zero feedback. Edge 154 at 390×844; AAE/D761 source/served parity matched before/after; no page errors. DB/profile removed, service stopped; no live 8788 access.
