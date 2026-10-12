# Pending Account status and heading geometry — current 69F09 source

**Date:** 2026-09-29. **Target:** isolated `updater-vnext` service with synthetic admin and unapproved member; read-only after synthetic member login. No live 8788 authentication or writes.

## Preflight

Service `/health` returned 200 and auth was user-null before the browser login. The root shell and six UI assets matched current workspace source. SHA-256: app.js `9f56a4081a8d3f6369b52d1805d8960ef6d86bbab2b9a21cd94e697654adfc1f`; styles.css `69f09a8d660b83e808715a2045e313a30e94eccfdbd3dddc76553a4e535454fc`; index.html `09379f2df2553c5de80ce22c90d8953906c7781f6e5f953b4bef65dd2bea2459`; navigation.js `7a1114587842f11bace2b1b4d69f9d15d5e35ae946abf7efd0f5564461dcea56`; report-presentation.js `d0a081dc918f6c848d15a865d890eb8695d6554d1f626a8db4f26edcf1d07d6f`; viewport.js `fef9e10e9114de24f83a0ca909b841c1b93f1a6aa84fe8dabb023235893922da`.

Headed Microsoft Edge 154.0.4258.37, direct Node Playwright/cached playwright-core, unique disposable profile. Synthetic pending member `qa-pending-geometry` logged in and Chinese UI was selected. Viewports: 390×844 and 320×800. No page errors.

## Results

At 390×844, document/body client and scroll widths were 375/375; no visible nested element overflowed. The pending status text was not clipped or hidden: `#auth-status` had box x=75.9..363, width/client/scroll=287/287/287px, `overflow:visible`, and its full text laid out in two lines whose range rects ended at x=363. The earlier screenshot-based right-edge clipping candidate is therefore **not confirmed**.

The Chinese Account heading did exhibit an awkward responsive wrap: `#account-heading` text `账户` had a 48×72.3px box and two range rects (one glyph per line, each about 30.6×41px), side-by-side with the long pending status. At 320×800 the heading fit on one line in a 61×36.2px box; pending status wrapped to two lines and remained visible. The 320 document/body widths were 305/305, also with no nested overflow. The 390 screenshot makes the vertical heading wrap visible. This is recorded as new P3 candidate `UI-ACCOUNT-ZH-390-01`; the candidate concerns heading wrapping, not clipping or hidden status text.

Only a synthetic `/api/auth/login` POST occurred; after login the view used GETs. Browser errors were zero. No production data or 8788 was touched.

Evidence: [`results.json`](../output/playwright/pending-account-status-geometry-69f09-20260929/results.json), [390×844 screenshot](../output/playwright/pending-account-status-geometry-69f09-20260929/pending-account-390x844.png), [320×800 screenshot](../output/playwright/pending-account-status-geometry-69f09-20260929/pending-account-320x800.png), and [`run.mjs`](../output/playwright/pending-account-status-geometry-69f09-20260929/run.mjs).

Cleanup passed: port 55551 stopped and health unreachable; exact disposable DB/profile removed; port 8788 untouched. Native zoom and English locale were not assessed.
