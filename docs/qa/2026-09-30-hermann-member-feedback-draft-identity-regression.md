# QA session: FEEDBACK-PRIVACY-DRAFT-01 identity regression

**Date:** 2026-09-30 (Asia/Shanghai)  
**Target:** `updater-vnext`, branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59` (shared worktree has uncommitted integration changes).  
**QA owner:** Hermann (User Tester).  
**Final result:** **Pass for tested account isolation and draft lifecycle scenarios; natural tab-hidden event remains unverified.**

## Environment and source preflight

- Browser: Microsoft Edge 154.0.4258.37, headed, automated by direct Playwright Node API.
- Viewport: 390×844 CSS px.
- Target: disposable isolated service at `http://127.0.0.1:60903`; no live ports/accounts/data touched.
- Fixture: isolated SQLite database, disposable profile, synthetic admin plus approved members A and B. Initially no feedback requests. One synthetic B Feature request was created during the held-success test.
- Health and routes: `/health` 200, `/` 200, signed-out `/api/reports` 401 as expected. `/feedback-drafts.js` 200 with `text/javascript; charset=utf-8`.
- All source/served asset hashes matched:

| Asset | Source and served SHA-256 | Result |
|---|---|---|
| `index.html` | `38efdd3f8c2c1b9522588accd56d3127fc3abace971542acb8e7e8fc07f24520` | Match |
| `app.js` | `e4561f6507ea29583a8b94cedd8cb2f48285839d932bbc8e7ca64365f8224ce7` | Match |
| `styles.css` | `a8b4940018d81333226db42bf7507c57af51b6cdc1e120ced4fb660a36e06423` | Match |
| `navigation.js` | `c2658b3def8edc3ef4625c40e1679e616ac16bb95b0b30e23bd98d0bf5145cd5` | Match |
| `report-presentation.js` | `dc9065adcf2eb5199a60315bc65fe76e43fb9e936172f7d06b552ea6ae5d49a0` | Match |
| `viewport.js` | `fef9e10e9114de24f83a0ca909b841c1b93f1a6aa84fe8dabb023235893922da` | Match |
| `feedback-drafts.js` | `789b36766bc396b5af0583544cfa82181f5be6ee5597f60aaf4f43227c13c66e` | Match |

`apps/api/server.js` source SHA-256 was `dfd3701f35f8a0de45359e8badc3098b398bf9edd7e313f136fb558a2290c20f`; its explicit asset route served `feedback-drafts.js` with the matching client-module hash.

## Acceptance results

| Scenario | Expected | Actual | Result |
|---|---|---|---|
| A enters Feature type/title/description/context and navigates Account→Reports→Account | Exact values retained in same tab | All four values retained | Pass |
| A logs out and back in | Signed-out form clears; A may recover own draft | Form reset on logout; exact A values restored after A login | Pass |
| A logs out, B logs in | B sees no A form values, message, list, or POST | B showed default Issue, blank fields/list/message; zero feedback POSTs before explicit submit | Pass |
| Validation errors across identities | No stale error decoration crosses accounts; each account sees only own draft | Invalid B title `x` was preserved for B without stale `aria-invalid`/error UI; A still recovered A’s exact draft | Pass |
| Same-ID role refresh | Member→Administrator refresh preserves same user’s draft | App’s auth poll observed A as Administrator; exact A role-test draft remained | Pass |
| Cross-tab auth broadcast A→B | Old identity’s content/list/status clears; B sees only B-owned state | Main tab updated to B, A title absent, only B’s own `x` draft restored, validation decoration cleared | Pass |
| Held `/api/auth/me` following auth broadcast | Hide/inert account UI while identity is unconfirmed; restore only after confirmation | Main was hidden and workspace inert; status announced “Checking your sign-in before showing account information…”; held response release confirmed B and restored only B’s draft | Pass |
| Delayed successful feedback POST; user edits a newer draft while held | One receipt/list item; newer draft survives old response | Upstream POST returned 201; newer B type/title/description/context remained after release; one success receipt and one matching list card | Pass |
| Reload and fresh browser context | In-memory unsent draft is not durable | Newer draft was absent after reload and in a fresh context | Pass |
| Physical tab-hidden visibility event | Form synchronously blanks when browser hides the tab | `document.hidden` stayed false after Playwright `bringToFront()` on sibling tab; natural `visibilitychange` was not observed | **Unverified** |

No page errors were observed. Before the held success there were zero POSTs. Final isolated DB held exactly one feedback request, owned by B and matching the submitted snapshot. The displayed receipt and list card referred to that single request.

The storage check confirmed no draft content in `localStorage` or `sessionStorage`; reload/fresh-context behavior also passed. IndexedDB and Cache Storage contents were not enumerated.

## Initial blocker history

An earlier pre-fix isolated preflight found `/feedback-drafts.js` returned 404 because the static asset map omitted the module imported by `app.js`; those attempts stopped before Edge/account interaction. Torsten integrated the route. The final run above verified the route returns 200 with JavaScript MIME and the expected source hash. A setup-only `/api/reports` expectation was also corrected from 200 to the expected signed-out 401 before rendered testing.

## Evidence and cleanup

- Runner: [`run.mjs`](../../output/playwright/member-feedback-draft-identity-privacy-current-20260930/run.mjs)
- Final machine results and screenshots: [`output/playwright/member-feedback-draft-identity-privacy-current-20260930/`](../../output/playwright/member-feedback-draft-identity-privacy-current-20260930/), including `result.json`, `member-b-after-held-post-newer-draft.png`, and `member-b-own-account-after-transition.png`.
- Final isolated port 60903 was closed. Disposable DB and Edge profiles were removed. No live service was touched.
- The runner and QA note are uncommitted; no commit/push was made.

## Disposition

The tested identity isolation, same-account recovery, validation reset, auth broadcast/revalidation, and delayed-success draft preservation scenarios pass on the source-matched isolated build. Natural browser tab-hide event behavior remains open for a controllable visibility-change run; it is not represented as a pass. The earlier static-module 404 is resolved for the final isolated build. No production runtime readiness is inferred.

## Follow-up visibility probe — 2026-09-30

A separate headed Edge 154 capability probe used a disposable persistent profile and two pages opened in the same Playwright browser context. The first page began with `document.visibilityState === "visible"`; after creating/navigating the second page and again after calling `bringToFront()` on the first, the first page still reported `document.hidden === false` and no `visibilitychange` event. This probe had no app service or account data. It confirms this Playwright setup did not trigger the natural hidden-tab lifecycle event; it is not a product acceptance pass. Natural tab-hide acceptance remains open.
