# QA-01 — current-source admin User management responsive pass

**Date:** 2026-09-29. **Target:** updater-vnext `apps/api/server.js` with disposable SQLite database and same-origin UI/API. No application source edits.

## Preflight and environment

- Isolated service `/health`: 200. `/api/auth/me` before browser login: user-null. Synthetic admin and one synthetic approved member only.
- Served UI/source parity passed for `index.html`, `app.js`, `styles.css`, `navigation.js`, `report-presentation.js`, and `viewport.js`.
- SHA-256: app.js `9f56a4081a8d3f6369b52d1805d8960ef6d86bbab2b9a21cd94e697654adfc1f`; styles.css `11be0d54e3d0757f640758c00dc2284441e2f3fad4c767e15b17e30b94cc1e3a`; index.html `09379f2df2553c5de80ce22c90d8953906c7781f6e5f953b4bef65dd2bea2459`; navigation.js `7a1114587842f11bace2b1b4d69f9d15d5e35ae946abf7efd0f5564461dcea56`; report-presentation.js `d0a081dc918f6c848d15a865d890eb8695d6554d1f626a8db4f26edcf1d07d6f`; viewport.js `fef9e10e9114de24f83a0ca909b841c1b93f1a6aa84fe8dabb023235893922da`.
- Browser: Microsoft Edge 154.0.4258.37, headed direct Node Playwright API using cached playwright-core and unique disposable persistent profile. Viewports: 320×800 and 390×844.

## Acceptance results

| Check | Result | Evidence |
|---|---|---|
| Synthetic admin login, User management load, member row visible | Pass | Browser navigated via admin UI; status “Accounts loaded.” and synthetic member row visible. |
| Page-level overflow at 320×800 and 390×844 | Pass | document/body client and scroll widths equal: 305/305 at 320 and 375/375 at 390. |
| Nested User management overflow | Pass | No visible descendant in `#admin-view` had `scrollWidth > clientWidth + 1`. |
| Row content and accessible names | Pass | Member row shows username/id, role, approval, active state, Save and disabled-account anonymize affordance. Selects have labels `Role: qa-member-readonly`, `Database approval: qa-member-readonly`, `Account status: qa-member-readonly`. |
| Controls and computed field cues | Pass | Role, approval, active selects 44.8px high with 3.83:1 border contrast and 14.77:1 text contrast against white. Save button text contrast is 6.45:1. Disabled anonymize action clearly carries the disabled account title and `disabled=true`. |
| Keyboard focus | Pass | Real Tab traversal from admin nav entered role, approval, active controls and Save in sequence; select/button focus-visible outline was 3px `rgb(33, 125, 206)`. Disabled anonymize was skipped. |
| Mutations / browser errors | Pass | Only non-GET request after preflight was synthetic `/api/auth/login` POST. No PATCH/PUT/DELETE or other write request; zero page errors. |

Screenshots: [`320×800`](../output/playwright/user-management-readonly-11be-20260929/admin-user-management-320x800.png), [`390×844`](../output/playwright/user-management-readonly-11be-20260929/admin-user-management-390x844.png). Full metrics/network/source evidence: [`results.json`](../output/playwright/user-management-readonly-11be-20260929/results.json); runner: [`run.mjs`](../output/playwright/user-management-readonly-11be-20260929/run.mjs).

## Cleanup and disposition

Isolated service stopped; health became unreachable; exact synthetic database/profile directory removed. Port 8788 was not touched. No new product issue found; this pass does not close broader QA-01 coverage. Native zoom, other locales, pending-member row, and live service remain outside this pass.
