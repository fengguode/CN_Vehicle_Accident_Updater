# QA-01-DISABLED-PAGINATION-01 — native disabled pagination acceptance

## Session record

- **Target:** current `updater-vnext` workspace source, served by disposable `apps/api/server.js`.
- **Browser:** Microsoft Edge `154.0.4258.37`, headed; direct Playwright Node API using cached `playwright-core`; isolated persistent Edge profile. Node `v24.14.0`.
- **Origin:** `http://127.0.0.1:51058`; `/health` returned 200, and the same origin served the expected UI and API.
- **Viewports:** `1280×900`, `390×844`, `320×800` CSS px.
- **Data:** synthetic approved member `qa-disabled-page-member` and 21 synthetic reports (20/page); no real accounts/reports. No votes were sent.
- **Isolation / cleanup:** service, SQLite database, and Edge profile used a unique temp directory; Edge closed, service stopped, directory removed. Port 8788 untouched.
- **Git evidence:** Git status/HEAD was not queried in this subagent sandbox because prior access was denied by Git's dubious-ownership check. No Git configuration was changed. Source parity is established by SHA-256 below.

## Served asset parity

All six served assets matched the workspace source during preflight:

| Asset | SHA-256 |
|---|---|
| `index.html` | `09379f2df2553c5de80ce22c90d8953906c7781f6e5f953b4bef65dd2bea2459` |
| `app.js` | `9f56a4081a8d3f6369b52d1805d8960ef6d86bbab2b9a21cd94e697654adfc1f` |
| `styles.css` | `274db956b83acd4fae00e8eb3164849429060dbf267969b811a06b078e3c8f1a` |
| `navigation.js` | `7a1114587842f11bace2b1b4d69f9d15d5e35ae946abf7efd0f5564461dcea56` |
| `viewport.js` | `fef9e10e9114de24f83a0ca909b841c1b93f1a6aa84fe8dabb023235893922da` |
| `report-presentation.js` | `d0a081dc918f6c848d15a865d890eb8695d6554d1f626a8db4f26edcf1d07d6f` |

## Acceptance results

| Scenario | Result | Evidence |
|---|---|---|
| First page: native `Previous` disabled, `Next` enabled, indicator says `1 / 2 · 21 reports` | Pass at all 3 viewports | `results.json` records `disabled` and `disabled` attribute true for Previous, false for Next, exact page text, and their bounds/styles. |
| Disabled Previous cannot be reached by keyboard traversal or programmatic focus | Pass at all 3 viewports | `keyboardPreviousSkipped` and `previousProgrammaticFocusRejected` true. A Tab/Shift+Tab probe did not focus the disabled button. |
| Disabled Previous ignores Enter and mouse activation | Pass at all 3 viewports | After keyboard focus rejection, Enter and a pointer click at the in-viewport pagination control produced zero Previous click events; indicator stayed `1 / 2 · 21 reports`. |
| Enabled Next advances to last page | Pass at all 3 viewports | `Next` click changed indicator to `2 / 2 · 21 reports`; Next click counter incremented. |
| Last page: Previous enabled and Next natively disabled; indicator correct | Pass at all 3 viewports | Exact status text, native disabled attribute/state, enabled Previous and disabled Next are recorded. |
| Disabled Next cannot be reached by keyboard traversal or programmatic focus | Pass at all 3 viewports | `keyboardNextSkipped` and `nextProgrammaticFocusRejected` true. |
| Disabled Next ignores Enter and mouse activation | Pass at all 3 viewports | Click counters did not change during disabled Next attempts; status stayed `2 / 2 · 21 reports`; pointer target was confirmed in viewport. |
| Enabled Previous returns to first page | Pass at all 3 viewports | `previousWorksToFirstPage` true after click. |
| Horizontal page/control overflow | Pass at all 3 viewports | `documentWidth === clientWidth` at each viewport (`1265`, `375`, `305` px respectively); measured `html`, `body`, `main`, report view, pagination, buttons, and status overflow lists are empty. |
| Runtime errors and cleanup | Pass | No page errors. Result records Edge closed, service stopped, temp removed, and port 8788 untouched. |

### Disabled appearance and geometry

`Previous` on page 1 and `Next` on page 2 both had computed opacity **1**, native disabled state, `cursor: not-allowed`, muted text `rgb(100,116,111)`, soft-green fill, and a 1px control-border edge. Settled desktop styles at 1280×900 were background `rgb(233,244,239)` and border `rgb(115,135,123)`; border contrast was 3.40:1 against fill and 3.55:1 against the adjacent page surface. At 390×844 and 320×800, the last-page Next settled to the same colors and ratios. Disabled button height was 44.39px at desktop and mobile; width was 108px desktop and 71.25px mobile. The first-page Previous measured 108px desktop and 101.66px on mobile. All disabled buttons remained fully inside the viewport horizontally.

The separate pagination selector keeps disabled controls at opacity 1, so the browser's general `.45` disabled opacity does not wash out the boundary. Screenshots show the disabled control in a pale-green treatment while its enabled neighbor remains solid green or white, which makes the navigation state understandable. On the long synthetic first page, pagination naturally appears after the 20 cards and requires scrolling; no unexpected layout overflow was seen. The 320px page indicator sits close to the right content edge in the full-page image, but the recorded layout widths do not establish clipping or overflow; no defect is filed from that visual alone.

## Evidence artifacts

- Machine results: [`results.json`](../../output/playwright/qa01-disabled-pagination-20260929/results.json)
- Harness: [`run.mjs`](../../output/playwright/qa01-disabled-pagination-20260929/run.mjs)
- Screenshots: [first page desktop](../../output/playwright/qa01-disabled-pagination-20260929/first-page-1280x900.png), [last page desktop](../../output/playwright/qa01-disabled-pagination-20260929/last-page-1280x900.png), [first page 390px](../../output/playwright/qa01-disabled-pagination-20260929/first-page-390x844.png), [last page 390px](../../output/playwright/qa01-disabled-pagination-20260929/last-page-390x844.png), [first page 320px](../../output/playwright/qa01-disabled-pagination-20260929/first-page-320x800.png), [last page 320px](../../output/playwright/qa01-disabled-pagination-20260929/last-page-320x800.png).
- First-run screenshots and JSON are retained under [`first-run`](../../output/playwright/qa01-disabled-pagination-20260929/first-run). The initial sample captured disabled Next before its 150ms CSS color transition had finished. The final run waited 220ms after page navigation; settled colors were consistent across viewport widths.
- `node --check output/playwright/qa01-disabled-pagination-20260929/run.mjs` passed. `node output/playwright/qa01-disabled-pagination-20260929/run.mjs` completed with `PASS` on the final bounded run.

## Limits and disposition

The requested pagination behavior and visual disabled treatment passed. Measurements use computed CSS colors and browser-rendered screenshots, not physical-pixel colorimeter data. Native browser zoom, screen readers, forced-colors mode, physical devices, and other locales were not covered. No product defect was found in this scope.

## Primary review and repository evidence

The primary agent independently inspected the 320px first-page screenshot and desktop last-page screenshot, parsed the final `results.json`, confirmed all six served asset hashes match workspace source (including the workspace `styles.css` SHA-256), and verified `status: PASS`, zero page errors, and cleanup flags. `node --check` on the harness and scoped `git diff --check` passed; the project regression suite also passed `npm test` (67/67, zero failures). Current `updater-vnext` HEAD is `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`; the stylesheet, this QA note, and canonical backlog update are uncommitted in the existing shared dirty tree. No commit, push, or live-service change was made.
