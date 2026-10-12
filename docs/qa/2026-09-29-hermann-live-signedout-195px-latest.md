# Hermann signed-out 195 px layout recheck — current 8788 bundle

**Date:** 2026-09-29 (Asia/Shanghai)  
**Owner:** Primary agent, Hermann User Tester  
**Target:** Live `updater-vnext` `http://127.0.0.1:8788`, signed-out Account registration view  
**Outcome:** Recheck the suspected header clipping and account form at the previously problematic 195 px effective width.

## Acceptance checks

- Confirm live health and six-asset source parity before browser interaction.
- In headed Edge, inspect English and Chinese registration at 195×844, 320×844, and 390×844.
- Measure document/body widths plus header, language toggle, and Account view bounds; record any clipping or overflow.
- Confirm signed-out state, API methods, page errors, and disposable-profile cleanup.

## Results

- Health returned 200; Edge 154.0.4258.37 headed Playwright visited the actual 8788 origin. All six served UI assets matched source at the browser run: app `8e9299c9…`, styles `5227f5eb…`, index `38efdd3f…`, navigation `c2658b3d…`, report presentation `dc9065ad…`, viewport `fef9e10e…`.
- At 195×844 in Chinese registration, document/body scroll width equaled client width (180/180, with a 15 px vertical scrollbar). Header, language toggle, and Account view each ended at x=168, inside the client edge x=180. A second no-scrollbar signed-out viewport measurement showed the brand ending at x=183 of 195 and the language button ending at x=183; its control and text were within the viewport. No clipping was reproduced.
- At 320×844 and 390×844, document/body scroll and client widths matched (320 and 390 respectively); the language button and Account view remained within the header/content bounds.
- No page errors or non-GET API requests; auth remained user-null. The disposable browser profile was removed.
- The first geometry runner queried a nonexistent button-row selector and therefore failed its own assertion; the corrected selector and a separate element-boundary inspection completed. This was a harness issue, not a product defect.

## Disposition

No signed-out header or registration clipping was found at the tested widths. No new backlog defect is warranted from this candidate. This does not cover authenticated admin/member layouts at 195 px.

## Artifacts and Git

- [Results](../../output/playwright/live-header-195-diagnostic-20260929/results.json)
- [Runner](../../output/playwright/live-header-195-diagnostic-20260929/run.cjs)
- [Chinese registration at 195 px](../../output/playwright/live-header-195-diagnostic-20260929/registration-zh-195x844.png)
- Repository: `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`, ahead 18; shared checkout has existing UI/API changes; this QA/backlog/artifact update is uncommitted. No commit or push.
