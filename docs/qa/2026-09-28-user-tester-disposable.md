# QA session: disposable User Tester UI acceptance

**Date:** 2026-09-28 (Asia/Shanghai)  
**Target:** `updater-vnext`, branch `vnext-home-hosted`, HEAD `b1c7cf6`; UI served from the current working tree. No application code or test files were edited by this session.  
**Environment:** Windows; Node.js v24.14.0, npm 11.9.0; installed Chrome controlled by headed `@playwright/cli` in named session `ctim-accept-20260928`. Disposable service on `127.0.0.1:8792`, fresh SQLite file under `%TEMP%\ctim-ui-accept-f8dd3cad497947809e3083272f3cbae0\staging.sqlite`, seeded with three wholly synthetic reports, one synthetic administrator, and one synthetic pending member. No production credentials, accounts, records, service, or database were used. The API health check returned `{"ok":true,"service":"adas-vnext"}` before browser testing.

## Acceptance criteria and results

| Scenario | Result | Evidence |
| --- | --- | --- |
| Fresh signed-out desktop first viewport presents a keyboard reachable sign-in/access entry. | **Pass** | At 1280×900, `Log in` bounds were x=1040.7, y=15.3, bottom=59.7; both `Log in` and `Open account` had accessible names in the snapshot. Signed-out screenshot: `.playwright-cli/page-2026-09-27T16-22-25-814Z.png`. |
| Fresh signed-out 390px first viewport presents a keyboard reachable sign-in/access entry. | **Pass** | At 390×844, `Log in` bounds were x=222.7, y=67.2, bottom=111.6; the entry was in the viewport. Hidden admin navigation meant the workspace nav had no overflow while signed out. Screenshot: `.playwright-cli/page-2026-09-27T16-24-14-342Z.png`. |
| Keyboard-only login works on desktop and 390px using a synthetic account. | **Pass** | Typed the synthetic admin username, used Tab to reach password and submit, and pressed Enter. Repeated at 390px. Account view showed `Administrator · Database access: approved`. |
| Approved admin and member navigation is role appropriate. | **Pass** | Admin saw User management; approved member did not. Admin view exposed accessible role/approval/status selectors. |
| Pending member remains signed in but cannot access report data or admin view. | **Pass** | `qa-pending` account state showed `Database access: pending`; Reports displayed the waiting-for-approval notice, zero articles, and no admin nav. |
| Admin approval transition enables member report access after re-login. | **Pass** | Admin changed the pending member’s approval selector to Approved and saved; API request `PATCH /api/admin/users/2` returned 200. The member re-logged in; account showed approved, and Reports loaded all 3 synthetic records. |
| Lead/unverified meaning, provenance, and report details are understandable. | **Pass** | Intro states listing is not incident/cause confirmation; cards show `Unverified lead` or `Verified`; details show summary, source, platform, location, verification status, and `Open original source`. Synthetic source link retained its HTTPS URL, `_blank`, and `noopener noreferrer`. Link destination itself was not opened. |
| Search, no-result state, reset, and verification filter work. | **Pass** | Search `no-such-synthetic-match` returned “No reports match these filters”; Reset restored 3 records; selecting `unverified` returned exactly the 2 unverified fixtures. Requests returned 200. |
| Rating, changing rating, and undo work on disposable data. | **Pass** | Synthetic approved member saved Relevant (status “Your rating was saved”), changed to Not relevant (pressed state and counts updated), then used Undo (status “Your rating was removed”; undo control disappeared). Final UI showed 3 records and no undo control. Requests: POST, POST, DELETE each returned 200. |
| Accessible names and keyboard behavior are usable through the tested flows. | **Fail — focus loss after rating** | Labels/names were present for login, search, navigation, details, source, filters, rating buttons, and admin fields. After a rating caused list rerender, `document.activeElement` was `<body>` rather than the previous rating/undo control; the details disclosure was closed and scroll was y=1731. Reproducer: sign in as approved synthetic member, open first report details, activate Relevant, inspect focus after rerender. Expected a meaningful focus location in the updated rating context. Finding `UI-ACCEPT-03`, new/confirmed; needs root-cause review. |
| Signed-in admin layout at 390px has no clipped navigation. | **Fail** | At 390×844, admin `.workspace-nav` measured `scrollWidth=354` and `clientWidth=351` (3px overflow). Page-level width did not grow, so the excess is inside the nav. Finding `UI-ACCEPT-01`, reproduced; fix-awaiting requirements agreement. Screenshot of mobile cards/layout: `.playwright-cli/page-2026-09-27T16-23-48-266Z.png`. |
| The first report’s text/provenance remain visible without a large empty media panel at mobile width. | **Fail — hierarchy** | At 390×844, card starts y=815.7, empty “No preview available” panel is 196.3px tall, and first title starts y=1049.8 (below the first viewport). At desktop, the placeholder is about 201px tall. Finding `UI-ACCEPT-02`, reproduced; fix-awaiting requirements agreement. |
| Browser console/network. | **Pass with advisory** | Current run’s console had 0 errors and 0 warnings; one verbose Chrome password-form username advisory. Observed API and vote requests returned 200. Prior Sep 27 QA found `/favicon.ico` 404; this run’s CLI excludes static requests from its default request listing, so that prior finding was not reverified here. |
| Empty API/service error and retry recovery. | **Not run / incomplete** | No service/network interruption was injected in this pass. |
| Browser Back/Forward, refresh mid-flow, repeated/double rating, malformed/very long query, pagination, tablet widths, screen-reader operation, contrast/forced-colors, mobile virtual keyboard, and source-link destination. | **Not run / incomplete** | Scope was shortened at primary agent’s request after priority role, source, filter, and rating scenarios; these cases remain open. This is not an exhaustive accessibility or responsive signoff. |

## Findings handoff

- **UI-ACCEPT-01 — Confirmed:** signed-in admin navigation overflows by 3px at 390px. Affected UI: `apps/web/styles.css`, `.workspace-nav`; reproduce using the disposable staging setup and measurements above.
- **UI-ACCEPT-02 — Confirmed:** empty media placeholder pushes title/provenance below the first 390px viewport. Affected UI: `apps/web/app.js` report card rendering and `apps/web/styles.css` card layout.
- **UI-ACCEPT-03 — New/confirmed:** rating list rerender leaves keyboard focus at `<body>` and closes the details disclosure. Affected path: vote interaction/list rerender in `apps/web/app.js`. The primary should route this through the System Architect/Worker root-cause and agreement workflow before implementation.

These statuses are QA handoff findings only; no external issue tracker was modified. UI-ACCEPT-01 and UI-ACCEPT-02 were previously observed in the Sep 27 partial staging pass and are now independently reproduced. UI-ACCEPT-03 was not in that prior note.

## Evidence and cleanup

Screenshots and Playwright snapshots are under `.playwright-cli/`; relevant screenshots are listed above. Browser session and staging service were closed after the run. The temporary staging DB, WAL/SHM files, and synthetic service logs were removed from the unique `%TEMP%` directory. No live endpoint or user browser session was used. No automated test suite was run; this was a manual real-browser session with disposable integration data.

## Overall status

**UI acceptance gate: FAIL / incomplete.** Desktop and mobile login entry, role transitions, reports/details/provenance, search/filter/reset, and reversible voting passed. UI-ACCEPT-01 and UI-ACCEPT-02 remain release-readiness failures, UI-ACCEPT-03 is a new keyboard-accessibility regression finding, and error/retry plus several broader acceptance cases remain untested. Re-run this session after agreed fixes, including the three reproducers and the untested cases before calling the gate complete.
