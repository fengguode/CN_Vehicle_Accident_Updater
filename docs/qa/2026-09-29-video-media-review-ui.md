# VIDEO-PLAYER-01 administrator media-review UI QA

**Date:** 2026-09-29 (Asia/Shanghai)  
**Scope:** authenticated synthetic administrator/member UI for the media-review queue, origin-blocked candidates, rejection, and audit history. No real accounts, media, live service, or production database were used.

## Acceptance checks defined before implementation

1. Only an approved administrator sees the separate Media review route; API authorization remains authoritative.
2. The queue clearly separates media review from incident verification and keeps the exact original source URL available.
3. A disallowed/unconfigured cover is neither rendered nor fetched; approval stays disabled, while reject/remove remain available.
4. Review actions refresh the current queue and expose actor/action/time history to admins; phone layout remains usable.
5. Verify served HTML, JS, and CSS against current source before interaction; use only a disposable service, DB, browser profile, and synthetic data.

## Results

- **Target:** isolated service `http://127.0.0.1:56610`; `/health` returned 200. Assets `index.html`, `app.js`, and `styles.css` all matched source hashes before UI interaction. Disposable SQLite included one synthetic video candidate whose cover host was intentionally absent from the empty allowlist.
- **Browser:** Microsoft Edge 154.0.4258.37, headed Playwright API, disposable persistent profile. Initial viewport 1280×800; mobile check 390×844.
- Anonymous queue request returned 401. Approved synthetic admin saw the separate Media review nav and candidate; exact source URL remained `https://weibo.com/status/synthetic-review-1`; the card separately labeled incident verification `Unverified lead` and media review `Pending`.
- The candidate displayed “Preview blocked by origin policy.”, had no image element, made zero requests to `unconfigured.example.test`, and had a disabled Approve preview button.
- Admin rejected the candidate. It left Pending, appeared under Rejected, and Review history displayed the rejection action, reviewer ID, and timestamp. The original source link remained intact.
- At 390×844 there was no horizontal overflow; all three visible review actions measured at least 44px high. A member account did not see the media-review nav and received API 403.
- The first harness attempt checked `/index.html`, which the service does not serve; the corrected preflight hashes `/`. Two later harness attempts tried to interact with the header Account/login button while it was intentionally hidden in Account view; the runner now navigates through the visible Account nav button. These were harness navigation/setup failures, not product defects. The final run passed.
- Results and screenshot: [runner](../../output/playwright/video-media-review-ui-20260929/run.mjs), [machine results](../../output/playwright/video-media-review-ui-20260929/results.json), [phone screenshot](../../output/playwright/video-media-review-ui-20260929/admin-media-review-mobile.png).
- Service, DB, and Edge profile were removed; port 8788 was untouched.

## Post-fix regression recheck (2026-09-29)

- **Target:** fresh isolated synthetic service `http://127.0.0.1:52459` (ephemeral port); disposable SQLite and Edge persistent profile. `/health` passed. Served `index.html`, `app.js`, and `styles.css` SHA-256 values matched source. Port 8788 was untouched.
- **Browser:** Microsoft Edge 154.0.4258.37, headed Playwright API. Checked desktop at 1280×800, phone at 390×844, and narrow viewport at 240×800. Only synthetic hosts were used.
- The no-allowlist candidate remained blocked, had no image element, retained its exact source URL, and had Approve disabled. Browser request instrumentation confirmed zero requests to `unconfigured.example.test`.
- A second synthetic candidate used an exact configured test origin whose intercepted image response was HTTP 404. The UI showed the localized image-load failure message and disabled Approve. No review POST occurred before the explicit reject action.
- Rejection moved only the selected candidate to Rejected, retained source provenance, and showed actor/action/time. At 390px the heading stacked, no horizontal overflow occurred, and buttons measured 44.4px high. At 240px navigation used one column and the document did not overflow. Member navigation remained hidden and the API returned 403; anonymous API access returned 401.
- The initial recheck harness had two selector/assertion mistakes (multiple cards were present; rejection leaves the other pending candidate). Both were corrected in the harness and the complete rerun passed. No product defect remained in these tested paths.
- Reproduction: [runner](../../output/playwright/video-media-review-ui-20260929/run.mjs), [results](../../output/playwright/video-media-review-ui-20260929/results.json), [phone screenshot](../../output/playwright/video-media-review-ui-20260929/admin-media-review-mobile.png). Service, DB, and profile were removed after the run.

## Findings and limits

- Current UI behavior passes the tested blocked-origin, failed-image, admin/member access, exact provenance link, rejection/audit, and responsive checks.
- Approve behavior is verified at the isolated API layer, but no UI approval action is possible with the deliberately empty origin allowlist. Remove is also covered by API integration; a rendered confirmation/removal journey remains untested.
- No allowed host or real cover was fetched. A project-approved platform/CDN allowlist, supported image MIME/format requirements, and human non-graphic review/removal criteria are still needed before enabling real thumbnail requests. Media/browser acceptance outside these tested synthetic states remains open.
