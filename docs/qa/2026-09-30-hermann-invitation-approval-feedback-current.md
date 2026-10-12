# Hermann invitation-to-feedback-and-approval current-source journey — 2026-09-30

## Runtime and browser

- Target: isolated current-source `updater-vnext` service on ephemeral localhost with a fresh SQLite database.
- Browser: headed Microsoft Edge 154.0.4258.37 via cached Playwright Core, disposable profile, 390×844 viewport.
- Source: exact parity for all six served UI assets; app.js SHA-256 `3e47741844e6329e6a089b553ccafa8a5144c7b8cda1c1ee6970757ba6367450`, styles.css `a8b4940018d81333226db42bf7507c57af51b6cdc1e120ced4fb660a36e06423`.
- Live port 8788 was not used for authentication or writes.

## Journey and results

PASS. A synthetic admin created an invitation (HTTP 201); its displayed token was redacted in structured results. A signed-out synthetic visitor registered with that token (HTTP 201) and entered as an active pending member. Reports stayed gated and admin navigation stayed hidden. The pending member submitted an Issue (HTTP 201); it appeared in the member's own list and the admin queue with correct submitter attribution. Admin approved the member (HTTP 200); after logout and fresh login the account was approved, Reports gate was hidden, and Reports view accessible while admin navigation remained hidden. The fixture has no reports, so the accepted member saw the expected empty state. Zero page errors.

The isolated service stopped; its database and browser profile were removed. The temporary DB held only the synthetic admin, pending member, one invitation and one feedback request before cleanup; no live data was read or changed.

## Artifacts

- Runner: `../output/playwright/invitation-approval-feedback-current-3e477-20260930/run.mjs`
- Results: `../output/playwright/invitation-approval-feedback-current-3e477-20260930/results.json`
- Screenshots: `../output/playwright/invitation-approval-feedback-current-3e477-20260930/pending-member-account.png`, `pending-reports-gate.png`, `pending-member-issue-submitted.png`, `admin-queue-pending-issue.png`, `admin-approved-member.png`, `approved-member-reports.png`
