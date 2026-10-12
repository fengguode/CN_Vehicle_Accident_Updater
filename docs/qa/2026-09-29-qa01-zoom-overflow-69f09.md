# QA-01-ZOOM-OVERFLOW-02 current-source recheck — 2026-09-29

## Scope and acceptance

Recheck member Reports advanced filters and administrator Feedback filters/list/open triage editor against app.js `9f56a4081a8d3f6369b52d1805d8960ef6d86bbab2b9a21cd94e697654adfc1f` and styles.css `69f09a8d660b83e808715a2045e313a30e94eccfdbd3dddc76553a4e535454fc`. The primary acceptance is that both target surfaces fit without page-level or nested horizontal overflow, clipped controls, or controls extending beyond the viewport at 195×422 effective CSS width and the 320×800/390×844 controls. The 195px size is an effective-width approximation, not native Edge zoom.

## Environment and preflight

- Target: disposable `updater-vnext` service, started from `apps/api/server.js` with a unique temporary SQLite database; ephemeral loopback port 62280.
- Browser: Microsoft Edge 154.0.4258.37, headed, direct Node Playwright API via cached `playwright-core`, unique persistent profile under the temporary fixture directory.
- Synthetic fixture: one bootstrapped administrator, one approved member, three synthetic reports, and one synthetic Issue for the administrator queue. No real account or incident data.
- Service health returned 200. The root app shell and all six served UI assets matched local source byte-for-byte: index.html `09379f2df2553c5de80ce22c90d8953906c7781f6e5f953b4bef65dd2bea2459`; app.js `9f56a4081a8d3f6369b52d1805d8960ef6d86bbab2b9a21cd94e697654adfc1f`; styles.css `69f09a8d660b83e808715a2045e313a30e94eccfdbd3dddc76553a4e535454fc`; navigation.js `7a1114587842f11bace2b1b4d69f9d15d5e35ae946abf7efd0f5564461dcea56`; viewport.js `fef9e10e9114de24f83a0ca909b841c1b93f1a6aa84fe8dabb023235893922da`; report-presentation.js `d0a081dc918f6c848d15a865d890eb8695d6554d1f626a8db4f26edcf1d07d6f`.
- Page errors: zero. Same-origin mutations were limited to synthetic admin/member login and logout. No triage save or account/data mutation was made. Live port 8788 was not accessed or modified.

## Results

| Surface | Viewport | Document/body client → scroll width | Key geometry | Result |
|---|---:|---:|---|---|
| Member Reports, advanced filters open | 195×422 | 180 → 182px | `main` 156/170px; `.advanced-filters` 125/155px; five filter selects are 155px wide and end at x=182.4px, 2.4px beyond the 180px client viewport. | **Fail, 2px page overflow persists.** The small horizontal scrollbar is visible; the far right of each select/filter row lies outside the viewport. |
| Member Reports, advanced filters open | 320×800 | 305 → 305px | `.advanced-filters` 250/250px; controls fit. | Pass |
| Member Reports, advanced filters open | 390×844 | 375 → 375px | `.advanced-filters` 320/320px; controls fit. | Pass |
| Admin Feedback filters/list/open triage editor | 195×422 | 180 → 180px | Filters 125/125px; `#admin-feedback-list` 125/125px; editor and fields 98/98px. All sampled control bounds remain within x=0…180px. | Pass; prior 11BE overflow is fixed in this current stylesheet. |
| Admin Feedback filters/list/open triage editor | 320×800 | 305 → 305px | Filters/list 250/250px; editor/fields 223/223px; controls fit. | Pass |
| Admin Feedback filters/list/open triage editor | 390×844 | 375 → 375px | Filters/list 320/320px; editor/fields 293/293px; controls fit. | Pass |

The exact per-element geometry, served/source hashes, network methods, cleanup status, and screenshots are in [machine results](../../output/playwright/qa01-zoom-overflow-02-69f09-20260929/results.json). Screenshots are in [the evidence directory](../../output/playwright/qa01-zoom-overflow-02-69f09-20260929/); the three `member-reports-advanced-*` captures show the member state and the three `admin-feedback-editor-*` captures show the admin state.

## Test level and disposition

- Integration/runtime preflight: **Pass** (isolated service health and same-origin source parity).
- Rendered browser acceptance: **Partial**. Admin surface passes all three effective viewport widths. Member surface passes 320/390 but fails at 195 due to a reproducible 2px horizontal overflow in advanced filters.
- Keyboard traversal/accessibility tree and true native Edge zoom: **Not tested** in this continuation. 195×422 is a CSS viewport approximation only; it must not be reported as native 200% zoom acceptance.
- Cleanup: **Pass**. Edge profile and exact temporary database/runtime directory were removed; isolated service stopped and health became unreachable on port 62280; live 8788 untouched.
- Backlog disposition: keep `QA-01-ZOOM-OVERFLOW-02` **In progress**. Admin portion can be recorded as fixed by current CSS 69F09; member advanced-filter overflow needs follow-up and regression. This run does not close QA-01 or native zoom coverage.

## Reproduction

Run `node output/playwright/qa01-zoom-overflow-02-69f09-20260929/run.mjs` from `updater-vnext`. The runner creates only the synthetic fixture, verifies six-asset served/source equality before opening Edge, captures six screenshots and geometry, and cleans the exact profile/database/service in `finally`.
