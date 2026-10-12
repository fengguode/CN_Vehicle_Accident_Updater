# QA session: AAE pending-member feedback privacy and triage

**Date:** 2026-09-29 (Asia/Shanghai)  
**Target:** isolated disposable AAE service/database on port 58939, synthetic admin and pending member  
**Browser:** Microsoft Edge 154.0.4258.37, headed Playwright  
**Viewport:** 390×844  
**Source parity:** app.js `AAE23B6A90DD7DF84354990CF6F9EB4B7D1476C10A019FDC7987E325AD5FB7E2`; styles.css `D761134A7738B6D6620074CC39C516DC0FE6D4B82134D6397514DEA02FE2A380`; matched through cleanup.

## Results

- Pending synthetic member submitted an Issue. Admin triaged it to Under review with public update and private sentinel note.
- After signing back in and opening Account, pending member saw Under review and public update; private sentinel was absent. Read-only DB/admin view confirmed both public and private text persisted on the request.
- Reports remained approval-gated (notice visible, search hidden); User management/Feedback navigation remained hidden from pending member.
- Completed check had no page errors.

An initial harness attempt stopped at Logout while the admin Feedback view was open; after navigating to Account, the member visibility/privacy check completed. Screenshots: [pending member](../../output/playwright/pending-feedback-privacy-aae-20260929/member-pending-before.png), [admin triage](../../output/playwright/pending-feedback-privacy-aae-20260929/admin-triage-private-note.png), [member after update](../../output/playwright/pending-feedback-privacy-aae-20260929/member-after-public-update.png).

Synthetic data only. Fixture/profile removed; port 58939 stopped. No live 8788 access/writes or source edits. Branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`; shared work remains uncommitted.