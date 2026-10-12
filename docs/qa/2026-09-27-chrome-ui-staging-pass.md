# QA session: Chrome UI staging pass

**Date:** 2026-09-27 (Asia/Shanghai)
**Target:** Browser-based UI acceptance preflight for `updater-vnext`; no application code or dependencies changed.
**Environment:** Windows, Node.js v24.14.0, npm 11.9.0; Playwright CLI launched installed Chrome with `--browser chrome --headed`. Disposable API on `127.0.0.1:8791` used a newly created temporary SQLite DB with three synthetic reports and two synthetic accounts. The database and service were stopped and removed after the pass. No production credentials or data were used.

## Checks and results

| Check | Result | Evidence |
| --- | --- | --- |
| Visible Chrome browser opens and renders the local staging UI. | **Pass** | CLI opened the page; title `China Traffic Incident Database`; signed-out snapshot showed the report lead disclaimer and approved-account prompt. |
| Keyboard sign-in reaches the account form and succeeds. | **Pass** | Focused username, pressed Tab to password, entered the synthetic admin password, and pressed Enter; Account view showed approved Administrator status. |
| Approved report browsing shows lead state, provenance and details. | **Pass** | Three synthetic reports displayed as unverified with source/platform/location; details exposed summary, verification status, and original source link. |
| Search and empty-state recovery work. | **Pass** | Search returned exactly the matching synthetic report; an unmatched query displayed “No reports match these filters”; Reset filters restored all three. |
| Vote and undo work. | **Pass** | Synthetic relevant vote displayed “Your rating was saved” and updated the community counts; Undo vote displayed “Your rating was removed”. |
| Pending and admin states behave as expected. | **Pass** | Pending user saw “Database access: pending” and the report view withheld records. Admin User management listed the pending account; saving Approved succeeded in the staging DB. |
| 390px mobile view has no horizontal navigation overflow and keeps report text/provenance prominent. | **Fail** | Screenshot `.playwright-cli/page-2026-09-27T15-32-37-277Z.png` shows a horizontal scrollbar under the top navigation. DOM measurement found `.workspace-nav` scrollWidth 354px vs clientWidth 351px. The 16:9 “No preview available” panel dominates the report card; title/provenance appear below it. |
| Browser console is clean. | **Fail** | A request to `/favicon.ico` returns 404. The browser also emits its password-form username advisory. |
| Complete User Tester gate, including mobile keyboard login, filter controls, and all responsive/keyboard cases. | **Blocked / incomplete** | This pass covered the main signed-out, admin, pending, details/search, and reversible vote flows, but did not exhaust every required desktop/mobile/keyboard scenario. The mobile layout finding needs product disposition and recheck. |

## Findings and disposition

- The original **browser access blocker is resolved for testing**: use Playwright CLI with `--browser chrome --headed`. The separate Chrome extension connector still reports a request-header-policy error and is not needed for this workflow. npm package resolution may require the approved network-enabled execution path.
- Mobile navigation is horizontally scrollable by 3px at 390px; this creates a visible bar. The report cards also reserve a large empty media area even though no media is available. Recommend a text/provenance-first mobile layout and retest at 390px before closing the UI acceptance gate.
- `/favicon.ico` returns 404. The password warning is browser advisory output, not a failed form interaction.
- A first fixture vote attempt failed because the disposable setup used a fingerprint outside the API's 64-character hexadecimal contract. The fixture was corrected; the subsequent vote and undo both passed. No application defect was found in that initial failure.
- The earlier blocked UI QA session can now be superseded for tool availability, but this pass does not close the full UI gate because of the mobile finding and remaining scenarios.

## Cleanup and limitations

The named temporary staging service was stopped and its directories under the system temp folder were removed after verifying their paths. The visible Google Chrome session opened at the user's request was left open. No production service, task, database, account, or data was modified. No automated test suite was run; this was a real-browser session on a disposable app instance.
