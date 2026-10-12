# Hermann QA-01 accessibility pass — current isolated source

**Date:** 2026-09-29 (Asia/Shanghai)  
**Target:** `updater-vnext`; isolated `apps/api/server.js` at `http://127.0.0.1:51231/`, stopped after the run.  
**Source/build:** SHA-256 for `apps/web/app.js`: `aae23b6a90dd7df84354990cf6f9eb4b7d1476c10a019fdc7987e325ad5fb7e2`. `/health` returned 200. Same-origin `index.html`, `app.js`, `styles.css`, and `navigation.js` matched workspace source before and after browser checks.  
**Browser:** headed Microsoft Edge 154.0.4258.37, direct Playwright Node API with cached `playwright-core`, fresh persistent profile. Main viewport 390×844 CSS px.  
**Test data:** synthetic approved admin/member, six synthetic reports, 105 synthetic queue requests; Account submit used a separate fresh synthetic member to avoid the feedback request limit.  
**Isolation:** synthetic SQLite and browser profile removed; service stopped; port 8788 not contacted.

## Acceptance results

| Scenario | Expected | Actual | Result |
|---|---|---|---|
| Reports search and no-results | Keyboard reaches Search with visible focus; typing a nonmatching term yields a useful empty state | Search was reached in four Tabs with 3px visible focus; “No reports match these filters” and inline Reset appeared; no horizontal overflow at 390px | Pass |
| Inline Reset | Keyboard can reach and activate it; restored cards and focus feedback are usable | Reached in four Tabs; Enter restored six reports and moved focus to `#heading`; no horizontal overflow | Pass |
| Reports filters | Search/sort/reset/more-filters and advanced selects are keyboard-operable with visible focus | Sort, reset, disclosure, then Brand, Cause, Province, Road type and Verification were reached by Tab; each showed a 3px focus outline | Pass |
| Account feedback | Keyboard can complete form fields and submit; confirmation and own request are visible | Focus traversed type→title→description→context→Submit→Refresh. Synthetic request was entered and submitted with Enter; confirmation included a request ID and the submitter saw one request | Pass |
| Admin Feedback queue | Keyboard navigation exposes Feedback; Load older is before the list, reachable with visible focus, and announces completion | Feedback nav reached in 17 Tabs with visible focus. Queue initially contained 100; Load older was before the list, reached in two Tabs from the status filter, and Enter loaded the remaining 6. “Older requests loaded.” was announced with focus on the live status | Pass |
| 200% effective-width viewport | Content reflows without horizontal overflow | Baseline reproduced 211px document/body scroll width vs 180px client width. After the scoped CSS fix, post-fix 195×422 Edge regression measured 180px scroll and client widths for both document and body, with Account content fitting. See `QA-01-ZOOM-OVERFLOW-01` below and linked post-fix results | Pass after fix |
| Forced colors | Focus remains visible; no horizontal overflow | Playwright forced-colors media emulation matched active; focused status select retained a solid 3px outline using forced palette `rgb(55, 0, 110)`; no overflow at 390px | Pass (emulated) |
| Errors and cleanup | No page errors; isolated data only | Zero page errors; source/served parity held before and after; synthetic DB/profile removed, process stopped, port 8788 untouched | Pass |

## Finding QA-01-ZOOM-OVERFLOW-01

- **Status:** Fixed and verified in the scoped 195×422 isolated Edge regression; tracked as Complete in the canonical backlog.
- **Severity:** P3, limited to the narrow 195 CSS px 200%-effective-width sample. This is not a certification failure at ordinary desktop widths; the condition is still reproducible and clips content in the tested viewport.
- **Prerequisites:** Fresh isolated service; sign in as an approved member; open Account; set the CSS viewport to 195×422 (half of the tested 390×844 viewport).
- **Steps:** Inspect `document.documentElement` and `body` scroll/client widths; inspect Account elements’ bounding boxes or open the saved screenshot.
- **Expected:** Account form and account controls remain within the viewport without page-level horizontal scrolling.
- **Baseline reproduction:** `document` and `body` scroll width were 211px while client width was 180px. `#account-view` had scrollWidth 199/clientWidth 156; `.account-section.account-content` 219/154; `#account-actions` 205/125; `.button-row` extended to x=232 while the viewport was 195px wide.
- **Fix and retest:** A max-width:360px responsive rule allows account form fields to shrink and stacks the Account heading/status. At 195×422, document/body scroll and client widths both measured 180px, with headings, actions, password and feedback controls fitting. See the post-fix results linked below.
- **Evidence:** [`account-feedback-200-percent-effective-viewport.png`](../../output/playwright/qa01-accessibility-current-20260929/account-feedback-200-percent-effective-viewport.png) and the `zoomViewport.offenders` array in [`results.json`](../../output/playwright/qa01-accessibility-current-20260929/results.json).

## Post-fix regression

The primary applied a responsive CSS fix and requested a same-session synthetic Edge regression. A fresh isolated instance at `http://127.0.0.1:62052/` served current `apps/web/styles.css` SHA-256 `d761134a7738b6d6620074cc39c516dc0fe6d4b82134d6397514dea02fe2a380`; `app.js` remained `aae23b6a90dd7df84354990cf6f9eb4b7d1476c10a019fdc7987e325ad5fb7e2`. At both 390×844 and the 195×422 200%-effective-width viewport, document/body scroll and client widths now match, and the Account heading, auth status, account actions, password controls and feedback form controls all fit within the viewport. The same run repeated Reports keyboard reset/filter checks, Account feedback submission, admin Feedback navigation and Load older, forced-colors emulation, and cleanup; all passed with zero page errors. This verifies the reported overflow condition at the tested CSS viewport; native browser zoom remains unverified.

Post-fix JSON: [`postfix/results.json`](../../output/playwright/qa01-accessibility-current-20260929/postfix/results.json), SHA-256 `df5f026977d02b34f66353cf42564e63499bdf4a6a1881dd045f901dbec10c3d`. Post-fix viewport screenshots are in [`postfix`](../../output/playwright/qa01-accessibility-current-20260929/postfix/). The baseline screenshot and result remain unchanged.

## Evidence and limits

Commands: `node output/playwright/qa01-accessibility-current-20260929/run.mjs` (baseline finding) and `node output/playwright/qa01-accessibility-current-20260929/run-postfix.mjs` (post-fix regression). Baseline results JSON SHA-256: `e862c53e2252b088e70a4b31ba1cb2ee62d43fabff179dccc2aa79ea84aee0f4`. Post-fix results JSON and screenshots are linked above. Other captures include Reports no-results/reset, Account submission, admin queue completion and forced-colors state in [`output/playwright/qa01-accessibility-current-20260929`](../../output/playwright/qa01-accessibility-current-20260929/).

The Playwright API does not control Edge’s browser-chrome zoom setting, so 200% was approximated by halving the CSS viewport; native zoom behavior remains unverified. Forced colors used Playwright media emulation, not a Windows high-contrast system setting. A native screen reader, physical device, and assistive-technology announcement review were unavailable. Keyboard actions were exercised in headed Edge with synthetic data. This pass does not cover every route/control or provide full WCAG conformance certification. No application source or backlog files were edited.
