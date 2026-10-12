# QA session: ongoing independent User Tester recheck

**Date:** 2026-09-28 (Asia/Shanghai)
**Target:** `updater-vnext`, current working tree served at `http://127.0.0.1:8788/`; revision could not be established in this session.
**Tester:** Independent project User Tester. No application or test code was changed.
**Safety:** Only unauthenticated, read-only loopback GET requests were made. No report API data, account state, production database, or external endpoint was accessed.

## Acceptance focus

Recheck that the current local shell and assets are reachable, check unauthenticated access behavior, and continue the outstanding desktop/mobile rendered UI acceptance when browser tooling is available. Known UI-ACCEPT-01 (390px admin nav overflow), UI-ACCEPT-02 (196px no-media placeholder), and UI-ACCEPT-03 (vote rerender focus loss) are tracked in prior QA notes and the roundtable; they are not duplicated as new findings here.

## Environment and evidence

- Windows PowerShell; Node.js v24.14.0 and npm 11.9.0 are recorded by adjacent QA sessions.
- `Invoke-WebRequest -UseBasicParsing` against the loopback service returned: `/` 200 (7,824 bytes, HTML), `/styles.css` 200 (12,063 bytes), `/app.js` 200 (44,200 bytes), `/api/auth/me` 200 (25 bytes), `/api/reports` 401 Unauthorized.
- The `/api/reports` denial is expected for the unauthenticated visitor; the response body was not included in the request output and no report data was read.
- `cua.getState()` returned no apps or browsers, with browser inventory error `Unable to load browser request-header policy`.
- The installed Chrome executable exists at `C:\Program Files\Google\Chrome\Application\chrome.exe`, but project policy routes UI control through CUA; no connected browser surface was available. A node-repl browser-runtime probe also failed before execution because Windows sandbox helper launch failed (`setup refresh failed to launch helper: program not found`). No alternate browser-control method was used.

## Scenario results

| Automated regression | Expected | Actual | Status |
|---|---|---|---|
| `npm test` | Existing UI/contract tests remain green | 60 tests passed, 0 failed, 0 skipped. Relevant checks included keyboard focus restoration after vote refresh, missing/disabled vote target focus, admin-only user management, and safe view fallback. | PASS (automated; does not replace browser acceptance) |

| Scenario | Expected | Actual | Status |
|---|---|---|---|
| Loopback shell and linked assets are served | HTML/CSS/JS reachable | All three GETs returned 200 with expected content types and nonzero lengths. | PASS (transport only) |
| Unauthenticated auth state endpoint | Read-only auth-state response is available | `/api/auth/me` returned 200, 25-byte JSON response. Body not captured in this session. | PASS (status only) |
| Unauthenticated report API boundary | Report data remains protected | `/api/reports` returned 401 Unauthorized. No report content was read. | PASS (status only) |
| Render signed-out shell on desktop and 390px; keyboard navigation and focus | Login/account entry is visible/reachable, responsive nav fits and focus is clear | No browser surface or controllable Playwright runtime was available. | BLOCKED |
| Approved-admin and member responsive navigation regression | No nav overflow at 390px; correct role links and 44px targets | Requires disposable approved accounts plus browser; not attempted. | BLOCKED |
| Card text/provenance hierarchy and no-media geometry | Title/source/status precede any empty preview; provenance preserved | Requires report rendering in disposable browser session; not attempted. | BLOCKED |
| Search, filters, empty/error recovery, rating focus, back/refresh, and repeated actions | Feedback, focus, and state remain correct through interruptions and repetition | No browser operation was possible. | BLOCKED |

## Findings and disposition

No new UI defect is reported: this session did not render or interact with the page. The shell/API response checks do not verify computed layout, keyboard behavior, data rendering, or role-dependent navigation. Existing UI-ACCEPT-01/02 remain confirmed from prior synthetic browser sessions and current regression verification remains blocked. UI-ACCEPT-03 was implemented and regression-tested by prior sessions documented in `docs/qa/2026-09-28-ui-accept-03-regression.md`; this session could not repeat the browser checks.

Read-only source inspection confirms the existing UI-ACCEPT-02 path is still present: `reportCard()` in `apps/web/app.js` appends `.report-preview` before `.report-card-body`, and `apps/web/styles.css` gives that preview a 16:9 aspect ratio. This corroborates the prior 196px mobile measurement but is not a new finding or a rendered recheck.

## Untested areas and limitations

Desktop/mobile visual inspection, accessibility tree and keyboard checks, signed-in role flows, report cards, data interactions, navigation/back/refresh, error/retry recovery, and browser console are all untested in this session. Browser acceptance remains incomplete. Re-run the disposable role matrix at desktop and 390px when CUA browser inventory is restored; include the known nav/card reproducers and full role/access/error coverage before closing the UI gate.
