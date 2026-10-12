# Hermann cross-tab role identity revalidation — ad3

Date: 2026-09-30 local

## Runtime and browser

- Isolated service: `http://127.0.0.1:8793`; health and root returned HTTP 200.
- Synthetic disposable SQLite fixture and scoped synthetic admin/member credentials were verified before authentication. Port 8788 was not accessed.
- Headed Microsoft Edge 154.0.4258.37; two tabs in one browser context (shared session cookies), viewport 1280×900.
- All eight served UI assets byte-matched workspace. `app.js` SHA-256 `ad3cea5921901a7a17550455200f293df7c61b07663c8c5d1ed979c69579ef1f`; `styles.css` SHA-256 `61e43beb97e57899738c65e6662bd05107dc4e7d05899c2720fb915a841a06e0`.

## Results

Tab A signed in as the synthetic administrator and rendered 29 Feedback queue cards. Tab B loaded the shared administrator session, logged out, then signed in as the approved synthetic member. The BroadcastChannel auth change caused Tab A to revalidate: after logout its admin navigation and stale queue cleared; after the member login its auth status changed to that member, admin and admin-Feedback navigation stayed hidden, and the old admin rows remained absent. Opening Account in Tab A showed the member's own 13 feedback cards.

The only state-changing requests were expected synthetic authentication login/logout calls. No feedback, report, triage, or user-management records were modified. Both tabs had zero page errors and zero failed requests. No cross-tab identity defect was found.

This verifies the direct shared-session identity transition on ad3. It does not repeat the separate held-stale-response race from [UX-STATE-02 QA](2026-09-29-ux-state-02-cross-tab-feedback.md), nor the natural document-hidden privacy scenario.

## Artifacts

- [Machine results](../../output/playwright/live-feedback-user-story-suite-20260930/edge-cross-tab-identity-ad3-results.json)
- [Screenshot](../../output/playwright/live-feedback-user-story-suite-20260930/edge-cross-tab-identity-ad3.png)

## Outcome

The direct cross-tab identity transition lane passes on exact current source. QA-01 and the separate visibility/draft-privacy acceptance remain open for their other specified coverage.
