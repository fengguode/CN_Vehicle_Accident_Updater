# Hermann browser feedback full lifecycle — 2026-09-30

## Runtime and scope

- Target: isolated current-source `updater-vnext` service (`apps/api/server.js`) on ephemeral localhost, with a fresh synthetic SQLite database and temporary Edge profile. Live 8788 received no requests or writes.
- Browser: headed Microsoft Edge 154.0.4258.37 via cached Playwright Core, viewport 390×844.
- Source: exact parity for the six served UI assets. `app.js` SHA-256 `3e47741844e6329e6a089b553ccafa8a5144c7b8cda1c1ee6970757ba6367450`; `styles.css` `a8b4940018d81333226db42bf7507c57af51b6cdc1e120ced4fb660a36e06423`.

## Acceptance and results

PASS. Admin created a one-use invitation (201; token redacted), signed-out visitor registered (201) and became a pending member. Reports and admin navigation remained gated, while the pending member could submit an Issue (201). It appeared in their own request list and the administrator queue with correct submitter attribution.

The administrator progressed the request through Under review, Added to backlog (linked to canonical `FEEDBACK-DUPLICATE-LINK-01`), In progress, and Complete. Each UI save returned 200. Priority changed at each stage; public updates appeared in submitter history; internal notes were not exposed. The member saw final status, all public history, and backlog ID. Admin then approved the member; fresh login unlocked Reports and kept admin navigation hidden.

No page errors. Isolated database contained only synthetic admin/member/invitation/request; service stopped and database/profile removed. 8788 untouched. This checks the synthetic lifecycle; the live-server loading/creation report remains unverified against authenticated live data because live database binding is unknown.

## Evidence

- Runner: `../output/playwright/feedback-full-lifecycle-current-3e477-20260930/run.mjs`
- Results: `../output/playwright/feedback-full-lifecycle-current-3e477-20260930/results.json`
- Screenshots: `../output/playwright/feedback-full-lifecycle-current-3e477-20260930/pending-member-issue-submitted.png`, `admin-queue-pending-issue.png`, `admin-complete-lifecycle.png`, `member-completed-feedback.png`, `admin-approved-member.png`, `approved-member-reports.png`, `admin-own-feature-and-queue.png`, `member-feedback-list-retry.png`, `admin-locale-switch-draft-preserved.png`



