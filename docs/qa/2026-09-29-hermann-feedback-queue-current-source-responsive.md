# Hermann administrator feedback queue — current-source volume and responsive pass

**Date:** 2026-09-29 (Asia/Shanghai)  
**Owner:** Primary agent, Hermann User Tester  
**Target:** Current `updater-vnext` source in a disposable local API service  
**Outcome:** Recheck admin queue loading, pagination, filtering, keyboard operation, and narrow layouts using synthetic data.

## Acceptance checks

- Create a disposable database containing 105 synthetic feedback requests and a synthetic admin; launch the current API/UI on an ephemeral localhost port.
- Confirm all six served assets match source before opening the browser.
- In headed Edge, verify initial load, keyboard access to Load older, 100→105 pagination, Issue/Feature filters, empty intersection message, and filter recovery.
- Measure document/body/queue overflow at 320×800 and 390×844; verify no page errors and clean up all test resources without touching 8788.

## Results

- Edge 154.0.4258.37, headed Playwright Node API, disposable profile, synthetic database, ephemeral service at `http://127.0.0.1:56083`. API entrypoint was `apps/api/server.js`; health 200; initial auth user-null.
- All six served assets matched local source. Hashes: `index.html` `38efdd3f…`, `app.js` `f3871211…`, `styles.css` `0f2c9475…`, `navigation.js` `c2658b3d…`, `report-presentation.js` `dc9065ad…`, `viewport.js` `fef9e10e…`.
- Admin Feedback queue resolved `aria-busy=false` and rendered 100 of 105 requests. Status/type Tab traversal reached Load older with visible focus. Enter requested offset 100 (GET 200), rendered all 105, hid the button, announced “Older requests loaded.”, and focused the queue status.
- Type filters returned 53 Issues and 52 Features. Issue + Complete returned zero rows with an empty-state announcement; clearing status restored 53 Issues.
- At 320×800, document/body scroll/client widths matched (305/305) and queue widths matched (250/250). At 390×844, document/body widths matched (375/375) and queue widths matched (320/320). No horizontal overflow or page errors.
- Cleanup confirmed service stopped, isolated health unavailable afterward, temporary database/profile directory removed, and port 8788 untouched. Mutations were limited to synthetic admin login; queue/list/filter actions were GETs.
- No harness issue or product defect was observed in this run.

## Disposition

Current-source administrator queue loading, 105-row pagination, filtering, recovery, keyboard traversal, and the sampled responsive widths passed. The user's authenticated stuck-loading report on port 8793 remains unverified; an isolated current-source pass cannot identify or explain that unavailable runtime.

## Artifacts and Git

- [Results/API trace](../../output/playwright/feedback-queue-volume-f387-20260929/results.json)
- [Runner](../../output/playwright/feedback-queue-volume-f387-20260929/run.mjs)
- [Initial queue screenshot](../../output/playwright/feedback-queue-volume-f387-20260929/admin-queue-initial-390x844.png)
- Repository: `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`, ahead 18. Shared UI/API/docs were already dirty; this QA note/backlog/artifacts are uncommitted. No commit or push.
