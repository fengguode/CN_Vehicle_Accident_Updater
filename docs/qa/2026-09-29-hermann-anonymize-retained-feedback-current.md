# Hermann current-source anonymization and retained feedback QA — 2026-09-29

## Setup

Isolated ephemeral service and disposable SQLite database with synthetic admin/member, one synthetic report, and synthetic feedback. Separate headed Microsoft Edge 154 admin/member contexts at 390×844. All six served UI assets matched source (app.js `314bb82b…`, CSS `8550ae76…`). Port 8788 health was 200 and no authenticated live action was performed.

## Journey and observations

- Approved synthetic member accessed one report and created a feedback Issue.
- Admin disabled the member; after the save completed, the user row showed Disabled. Member `/api/auth/me` returned `user:null` and `/api/reports` returned 401.
- Admin used the typed confirmation in User management to anonymize the disabled member (POST 200). The row rendered `anonymous-2 · Anonymized account`.
- The existing feedback request and its submission event remained in the admin queue. Queue UI and admin API showed `anonymous-2` as submitter and event actor; neither contained the original synthetic username. The member session remained revoked.
- Zero browser errors. Synthetic service stopped, its health endpoint disappeared, and DB/profile data were removed. Port 8788 remained untouched.

Pass; no anonymization/feedback-retention privacy defect found. The first runner edit attempt did not change the copied harness; it was not counted as anonymization evidence. The applied harness then passed; one additional assertion ensured the disable row had finished saving before the anonymization action. See [runner and final structured results](../../output/playwright/admin-anonymize-feedback-current-20260929/).

Repository: `updater-vnext`, branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`, ahead 18. QA/backlog/artifacts remain uncommitted within existing shared changes; no product source edit, commit, or push.
