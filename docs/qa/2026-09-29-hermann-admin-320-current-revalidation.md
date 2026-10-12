# Hermann current-source admin User management 320px revalidation

**Date:** 2026-09-29 (Asia/Shanghai)  
**Variant:** `updater-vnext`  
**Target:** isolated service on `127.0.0.1:58913` with synthetic admin and member accounts  
**Browser:** headed Microsoft Edge 154.0.4258.37 via cached Playwright Core  
**Tester:** Hermann User Tester

## Runtime and source parity

Isolated service health returned 200. A synthetic admin was signed in and the current User management view rendered. Served app, stylesheet, index, and navigation assets matched the source used in the browser run; `app.js` SHA-256 was `792ecbcd21d534d14ea6a3e1d2680975ad60decc79dc4bf9a9fee1eda1af82d3` and `styles.css` was `37d59f49d60f2f9be7c78f7c5b1d61b3bd7608e1d4e38c91bf9cd7f657b28282`. (The working-tree stylesheet subsequently changed to hash `fdc6827a18c4252a280ba3573a4df013d04531f61c3bf8019ce573e5cf342654`; it was not revalidated in the 58913 session.) The live 8788 service was not used for authenticated requests or writes.

## Reproduction and viewport results

At 320×800, `#admin-view .view-heading > span` (“Administrator access”) measured x=226.6–317.2 while the heading ended at x=293 and usable document width was 305px. The label is visibly clipped and document/body scrollWidth is 317px versus clientWidth 305px, yielding 12px horizontal overflow.

At 360×800, 390×844, and 1280×800, the label fit and page-level horizontal overflow was absent. Synthetic user-row controls remained visible and within their rows at all four viewport sizes. No browser page errors occurred. No new distinct defect was found.

Evidence: [320×800 screenshot](../../output/playwright/user-management-overflow-20260929/user-management-320x800.png), [metrics JSON](../../output/playwright/user-management-overflow-20260929/user-management-metrics.json), [360×800 screenshot](../../output/playwright/user-management-overflow-20260929/user-management-360x800.png), [390×844 screenshot](../../output/playwright/user-management-overflow-20260929/user-management-390x844.png), and [1280×800 screenshot](../../output/playwright/user-management-overflow-20260929/user-management-1280x800.png).

The isolated service and browser session were closed; port 58913 was unavailable after cleanup. The exact fixture and profile directories were removed. No application source was edited.

## Git state

`updater-vnext`, branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`. This QA note and the canonical backlog update are uncommitted among shared changes; no commit or push.
