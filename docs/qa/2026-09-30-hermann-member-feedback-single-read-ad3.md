# Hermann current-hash member feedback list single-read regression

Date: 2026-09-30 local

## Preflight

- Isolated synthetic service at `http://127.0.0.1:8793`; health and root both returned 200.
- Verified scoped synthetic credentials and `synthetic.sqlite` before member login. Port 8788 untouched.
- Headed Edge 154.0.4258.37 at 1280×900. All eight served UI assets were byte-identical to workspace source: app.js SHA-256 `ad3cea5921901a7a17550455200f293df7c61b07663c8c5d1ed979c69579ef1f`; styles.css SHA-256 `61e43beb97e57899738c65e6662bd05107dc4e7d05899c2720fb915a841a06e0`.

## Results

The approved synthetic member login returned 200 and caused exactly one successful `/api/feedback/mine` GET; 13 own-feedback cards rendered. Leaving Account for Reports and returning caused exactly one additional GET. Using Refresh caused exactly one GET. The same 13 cards appeared after each operation. There were zero page errors and failed requests. No record writes were made.

This confirms the existing `FEEDBACK-MY-LIST-DUPLICATE-GET-01` fix on the current ad3 hash. No new issue found.

## Evidence

- [Machine results](../../output/playwright/live-feedback-user-story-suite-20260930/edge-member-list-single-read-ad3-results.json)
- [Screenshot](../../output/playwright/live-feedback-user-story-suite-20260930/edge-member-list-single-read-ad3.png)
