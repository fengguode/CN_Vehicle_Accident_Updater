# Hermann current-source role journeys continuation — ad3

Date: 2026-09-30 local

## Readiness and test boundary

- Isolated service: `http://127.0.0.1:8793`; `/health` returned 200 (`adas-vnext`), `/` returned 200.
- Confirmed synthetic-only fixture before authenticated flows: service URL and synthetic admin/member names in the scoped temp credentials file point to a folder containing `synthetic.sqlite` plus its SQLite WAL/SHM files. The test used only the credentials from that fixture. No production service/database was used; port 8788 was untouched.
- The browser bridge failed twice while loading its request-header policy. The prescribed `npx` Playwright CLI attempt did not reach a browser launch, so the already-used repository Playwright Core harness and installed Chrome/Edge executables were used. Each run launched fresh ephemeral browser contexts at 1280×900; contexts were closed at completion.
- Current workspace/served parity was checked for all seven UI assets before role flows. `app.js` SHA-256: `ad3cea5921901a7a17550455200f293df7c61b07663c8c5d1ed979c69579ef1f`; `styles.css` SHA-256: `61e43beb97e57899738c65e6662bd05107dc4e7d05899c2720fb915a841a06e0`. The remaining assets also matched byte-for-byte (see bootstrap results).

## Role journeys

Fresh Chrome 153 and Edge 154 both rendered the signed-out Reports and Account views. Anonymous `/api/reports`, `/api/feedback/mine`, and `/api/admin/feedback` requests returned 401; the invitation helper/field appeared; admin and Feedback navigation remained hidden.

In both browsers, the synthetic approved member logged in successfully (200), saw three report cards and 13 own feedback cards, and did not see admin Feedback or Media Review navigation. The synthetic admin logged in successfully (200), saw the Feedback queue (29 rows; Under review filter 3 rows), and had User management and Media Review navigation. The User management screenshot shows the six-account fixture list loaded. These journeys used view/filter reads only after login; no records were submitted, triaged, or changed.

Both browser runs had zero page errors and zero failed requests. Expected signed-out 401 responses were the only auth denials. Screenshots were captured and visually inspected for the User management view; no new defect was confirmed.

An additional Edge 154 admin User management check at 195×844 CSS px also passed on the same exact source hashes. The six-account fixture loaded; `User management` heading bounds ended at x=168 px within the 180 px layout client width, and document/body scroll widths were both 180 px. Screenshot inspection found no clipping or horizontal page overflow. A first harness attempt used a nonexistent heading selector and stopped before collecting metrics; the corrected retry passed. The selector mistake is not a product issue; see retained first-attempt results.

## Artifacts

- [Chrome/Edge signed-out bootstrap results](../../output/playwright/live-feedback-user-story-suite-20260930/bootstrap-continuation-0424-results.json)
- [Chrome role journey results](../../output/playwright/live-feedback-user-story-suite-20260930/chrome-role-journeys-continuation-0424-results.json)
- [Edge role journey results](../../output/playwright/live-feedback-user-story-suite-20260930/edge-role-journeys-continuation-0424-results.json)
- [Edge 195 px User management regression results](../../output/playwright/live-feedback-user-story-suite-20260930/edge-user-management-195-ad3-retry-results.json) and [screenshot](../../output/playwright/live-feedback-user-story-suite-20260930/edge-user-management-195-ad3-retry.png)
- Screenshots in the same artifact folder: `chrome-bootstrap-continuation-0424-1280.png`, `edge-bootstrap-continuation-0424-1280.png`, `chrome-role-continuation-0424-signedout.png`, `chrome-role-continuation-0424-member.png`, `chrome-role-continuation-0424-admin.png`, `edge-role-continuation-0424-signedout.png`, `edge-role-continuation-0424-member.png`, `edge-role-continuation-0424-admin.png`.

## Outcome

No new issue found in these signed-out/member/admin journeys. QA-01 remains In progress because the complete story matrix, native accessibility/device coverage, and other explicitly unrun lanes remain outstanding. The separate 8788 live-runtime report remains outside this isolated result.
