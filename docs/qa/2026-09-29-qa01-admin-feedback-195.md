# QA-01-ADMIN-195-01 — admin feedback responsive controls

**Status:** PASS for the scoped rendered layout and keyboard checks. No app-source or backlog changes were made.

## Target and environment

- Variant: `updater-vnext` web UI and API, commit `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`.
- Disposable isolated service origin: `http://127.0.0.1:60502`; health returned HTTP 200. UI and API used the same origin. Port 8788 was not contacted.
- Browser: Microsoft Edge 154.0.4258.37, headed, isolated temporary profile; automation: direct Playwright Node API using cached `playwright-core`.
- Synthetic data only: one synthetic admin, one synthetic request; title 120 characters and private note 676 characters. No triage save/API mutation was performed.
- Viewports: 195×422, 320×800, and 390×844 CSS pixels.
- Served hashes matched local source for all six assets: `index.html` `09379f2df2553c5de80ce22c90d8953906c7781f6e5f953b4bef65dd2bea2459`; `app.js` `9f56a4081a8d3f6369b52d1805d8960ef6d86bbab2b9a21cd94e697654adfc1f`; `styles.css` `69f09a8d660b83e808715a2045e313a30e94eccfdbd3dddc76553a4e535454fc`; `navigation.js` `7a1114587842f11bace2b1b4d69f9d15d5e35ae946abf7efd0f5564461dcea56`; `viewport.js` `fef9e10e9114de24f83a0ca909b841c1b93f1a6aa84fe8dabb023235893922da`; `report-presentation.js` `d0a081dc918f6c848d15a865d890eb8695d6554d1f626a8db4f26edcf1d07d6f`.

## Acceptance criteria and results

| Check | Expected | Actual | Result |
|---|---|---|---|
| Open admin Feedback, expose filters and one triage disclosure | Controls render from tested current source | Rendered; all six served assets hash-identical to local source | PASS |
| Responsive overflow and control containment at all three viewports | No horizontal scrolling/clipping; nested content and controls fit | Document/body client and scroll widths equal at each viewport (195, 320, 390); all inspected nested elements reported no overflow | PASS |
| Labels and form control geometry | Each label above its select/input/textarea; control within label bounds | All seven triage fields/Save satisfy this at all three widths; controls fit their containers | PASS |
| Keyboard flow and focus | Tab traverses filters, disclosure, triage fields, and Save in order with visible focus | Exact order: `feedback-filter-status` → `feedback-filter-type` → disclosure `SUMMARY` → `status` → `priority` → `public_update` → `internal_notes` → `backlog_ids` → `duplicate_of` → Save button. All 10 stops visible/enabled with 3px solid blue focus outline at each width | PASS |
| Long content wrapping | Long title/private note wrap without horizontal overflow | Title wrapped to 11/5/4 measured lines and displayed private note to 119/47/35 lines at 195/320/390 px respectively; internal-note editor scrollWidth equaled clientWidth (111/236/306 px) | PASS |
| Runtime errors and cleanup | No page errors; disposable resources removed | Zero page errors; Edge closed, service stopped, temp fixture/profile removed; port 8788 untouched | PASS |

The 195 px viewport leaves only 180 CSS px of document content width after the browser's vertical scrollbar; this was accounted for, and content remained within the available layout width. The long textarea value uses normal internal vertical scrolling; it did not create page-level horizontal overflow.

## Reproduction evidence

The self-contained QA harness is [`run.mjs`](../../output/playwright/qa01-admin-feedback-195-20260929/run.mjs); machine-readable results are [`results.json`](../../output/playwright/qa01-admin-feedback-195-20260929/results.json). Open-state and keyboard screenshots for each viewport:

- 195×422: [`open`](../../output/playwright/qa01-admin-feedback-195-20260929/admin-feedback-open-195x422.png), [`keyboard`](../../output/playwright/qa01-admin-feedback-195-20260929/admin-feedback-keyboard-195x422.png)
- 320×800: [`open`](../../output/playwright/qa01-admin-feedback-195-20260929/admin-feedback-open-320x800.png), [`keyboard`](../../output/playwright/qa01-admin-feedback-195-20260929/admin-feedback-keyboard-320x800.png)
- 390×844: [`open`](../../output/playwright/qa01-admin-feedback-195-20260929/admin-feedback-open-390x844.png), [`keyboard`](../../output/playwright/qa01-admin-feedback-195-20260929/admin-feedback-keyboard-390x844.png)

## Harness correction and limitations

The first completed run recorded the actual correct Tab sequence but incorrectly set `keyboardOrderMatches=false`: its matcher compared the two filter selects' IDs against `name`. This was a harness false positive, not a product defect. The first-run record and screenshots are retained under [`first-run-matcher-investigation`](../../output/playwright/qa01-admin-feedback-195-20260929/first-run-matcher-investigation). A single targeted local harness correction compared those two controls by `id`; the bounded rerun above then passed. No app files changed.

This pass covers layout, keyboard traversal, and visible focus only. It does not verify screen-reader announcements, submit/save persistence, triage permission/API behavior, or other browsers and zoom settings. Those remain outside this acceptance result.

## Primary integration review

The primary inspected the 195px open-editor screenshot and parsed the final machine results. The narrow-width layout shows stacked labels and controls, wrapping long title/private text, and a visible Save button; results record all three viewport states as `PASS`, source parity for six assets, zero page errors, no overflow, exact keyboard order/focus, and successful cleanup. Dennis's source review confirmed the rules are scoped to `#feedback-view` at `max-width:240px` and do not change Account/Reports styles. `npm test` passed 67/67 and scoped `git diff --check` passed. Current HEAD is `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`; stylesheet, QA evidence, and backlog remain uncommitted among the shared work; no commit/push or live-service change.
