# Hermann QA-01 header regression — current isolated source

**Date:** 2026-09-29 (Asia/Shanghai)  
**Target:** `updater-vnext`, branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`.  
**Scope:** Regression of `QA-01-HEADER-01` for signed-in member and administrator header states at 195×422 and 390×844 CSS px. Boundary smoke checks also covered 320×568, 360×640, 361×640, and 420×844. No application source or backlog files were changed by this QA run.

## Browser preflight and runtime

- Headed Microsoft Edge `154.0.4258.37`, direct Playwright Node API using cached `playwright-core`, fresh isolated persistent browser profile.
- The isolated `apps/api/server.js` returned `/health` 200. The same origin served the expected UI and APIs; `index.html`, `app.js`, `styles.css`, and `navigation.js` all matched the workspace files.
- Instance: `http://127.0.0.1:49223`; viewport sizes were set by Playwright CSS viewport emulation. The 195×422 case is the agreed effective-width approximation for 200% at a 390×844 baseline, not native browser zoom.
- Test data: synthetic approved admin/member accounts and four fictional reports in a disposable SQLite database. Port 8788 was not touched. The service stopped and the database/profile were removed after the run.

## Exact source/build

| Asset | SHA-256 |
|---|---|
| `apps/web/index.html` | `09379f2df2553c5de80ce22c90d8953906c7781f6e5f953b4bef65dd2bea2459` |
| `apps/web/app.js` | `9f56a4081a8d3f6369b52d1805d8960ef6d86bbab2b9a21cd94e697654adfc1f` |
| `apps/web/styles.css` | `cafe53b8491e9bce07476a33eef7cb2a4de424adf21acdc4b06ffef44e573ec8` |
| `apps/web/navigation.js` | `7a1114587842f11bace2b1b4d69f9d15d5e35ae946abf7efd0f5564461dcea56` |

## Acceptance matrix

All 12 role/viewport cases passed against the exact CSS hash above:

| Role | Viewports | Result |
|---|---|---|
| Signed-in member | 195×422, 320×568, 360×640, 361×640, 390×844, 420×844 | Pass at all six sizes |
| Signed-in administrator | 195×422, 320×568, 360×640, 361×640, 390×844, 420×844 | Pass at all six sizes |

For every case, the rendered brand text wrapped at word boundaries, the `CT` mark text remained within the mark, and every visible nav label’s text rectangles stayed inside its own control. No header controls overlapped or extended outside the viewport. Document and body widths matched their client widths. The Reports, Account, administrator User management, and Feedback targets were at least 44 CSS px high. The current view was exposed through `aria-current="page"` and showed a distinct selected background in the rendered state.

Keyboard traversal from the brand reached every visible header control with `:focus-visible` and a visible outline. Enter activated Account and Reports; `aria-current` followed the active view. No browser page errors occurred. The current keyboard order follows DOM order: workspace nav buttons precede the Account and language header actions. At these widths, those actions are visually above or beside the nav, so traversal does not follow top-to-bottom visual placement; all controls remain reachable and focus is visible. This is recorded as an observation, not a failed assertion in this assigned scope.

The prior hash `91615add…` run exposed a 7.2px Account/language-action overlap at 195px and, for admin, the “management” text extending into the Feedback button. The final `cafe53b8…` run verified the corrected layout: at 195px, admin nav is one column, each label stays within its button, and the Account/language controls no longer overlap.

## Evidence

- Final machine-readable results: [`results.json`](../../output/playwright/qa01-header-regression-20260929/results.json), SHA-256 `F7473AC7218D6637B6ACF05E1BD6E3A75B81AB0A0908DDA7EEC3E11836DF633E`, overall `PASS`; 12/12 cases pass, zero page errors, cleanup true, and `port8788Untouched` true.
- Screenshots: [`member-195x422.png`](../../output/playwright/qa01-header-regression-20260929/member-195x422.png), [`admin-195x422.png`](../../output/playwright/qa01-header-regression-20260929/admin-195x422.png), [`member-390x844.png`](../../output/playwright/qa01-header-regression-20260929/member-390x844.png), [`admin-390x844.png`](../../output/playwright/qa01-header-regression-20260929/admin-390x844.png), plus the four boundary screenshots for each role in the same output directory.
- Command: `node output/playwright/qa01-header-regression-20260929/run.mjs`. The harness asserts the served CSS hash is `cafe53b8491e9bce07476a33eef7cb2a4de424adf21acdc4b06ffef44e573ec8`, records per-control bounds/word rectangles/heights/current state, keyboard traversal and activation, and removes its runtime database/profile.
- Independent review: Dennis reviewed this CSS hash and reported no source-level issue (per primary-agent handoff).

## Disposition and limits

No reproducible failure remains in the requested header regression scope on the final tested source. The 195×422 layout is still an effective-width approximation; native Edge 200% zoom remains unverified under the separate QA-01 accessibility gate. This session does not assess screen readers, physical devices, or every localized label combination. The earlier keyboard visual-order observation is retained above for the primary's disposition.

**Git state:** `updater-vnext` HEAD remains `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`; this QA note, harness, JSON and screenshots are uncommitted. Existing shared source changes were preserved; no application-source changes were made by the tester.
