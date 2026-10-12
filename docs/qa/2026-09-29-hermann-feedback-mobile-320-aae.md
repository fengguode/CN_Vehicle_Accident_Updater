# QA session: AAE member/admin feedback at 320px

**Date:** 2026-09-29 (Asia/Shanghai)  
**Target:** isolated synthetic AAE service/database on port 58936  
**Browser:** Microsoft Edge 154.0.4258.37, headed Playwright  
**Viewport:** 320×800  
**Source parity:** served/source app.js `AAE23B6A90DD7DF84354990CF6F9EB4B7D1476C10A019FDC7987E325AD5FB7E2`; styles.css `D761134A7738B6D6620074CC39C516DC0FE6D4B82134D6397514DEA02FE2A380`; matched before and after. No page errors.

## Results

- Synthetic approved member submitted an Issue (201); it appeared in own Account list as Submitted and in admin Feedback queue.
- Member could not see User management/Feedback navigation; both appeared for admin.
- Keyboard from form title reached description, context, Submit, Refresh; each focus target had a visible 3px blue outline.
- Document/body client/scroll widths were 305px (320px viewport less 15px vertical scrollbar); member form/list width 250.22px; admin list 250px and card 248px. No horizontal/nested overflow.
- Admin triage was not part of this 320px session; current-source admin triage passed in [AAE Issue lifecycle QA](2026-09-29-hermann-feedback-issue-aae-current-source.md).

Screenshots: [member Account](../../output/playwright/feedback-mobile-320-aae-20260929/member-account-320.png), [admin queue](../../output/playwright/feedback-mobile-320-aae-20260929/admin-queue-320.png).

Synthetic DB/profile removed; port 58936 stopped. No live 8788 access/writes; no source edits. Branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`; shared work remains uncommitted.