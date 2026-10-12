# UI-ACCEPT-03 regression session

**Date:** 2026-09-28  
**Target:** `updater-vnext`, UI-ACCEPT-03 focus and stale-refresh recovery changes  
**Revision:** repository base `b1c7cf6`; test run against Torsten's current uncommitted implementation in `apps/web/app.js` and `apps/web/viewport.js`.  
**Tester:** project User Tester / Test Manager.

## Environment and isolation

Windows, Node.js v24.14.0, npm 11.9.0, headed Chrome controlled by `@playwright/cli` session `ctim-ui-03-20260928`. The service ran at `http://127.0.0.1:8793` against a newly created SQLite database at `C:\Users\guofe\AppData\Local\Temp\ctim-ui-03-89fa139f627a482b944a1efcc51dc69b\staging.sqlite`. The database contained only synthetic `qa-member` / `qa-admin` accounts and three synthetic reports. No live service, account, database, or production data was contacted. Playwright network routes injected synthetic POST/DELETE/GET failures.

Cleanup completed: the named browser session was closed, exact service PID 36732 was stopped, the unique temp directory and marker `C:\Users\guofe\AppData\Local\Temp\ctim-ui-03-current.txt` were removed, and port 8793 had zero listening processes afterward. A `Get-CimInstance` process command-line lookup was denied by Windows permissions; process identity was checked using the task marker, PID, executable path, start time, service port, and recorded startup before stopping it.

## Test artifacts and automated checks

- `test/ui-accept-03-focus.test.js`: focused unit coverage of enabled target selection, native-details open state in the test double, focus target, and heading fallback behavior.
- `test/web-viewport.test.js`: migrated the existing viewport/focus test from the removed `restoreVoteViewport` API to `restoreVoteInteraction`, preserving its prior viewport/focus assertions and adding details semantics.
- `node --test test/web-viewport.test.js test/ui-accept-03-focus.test.js` — **PASS**, 3 tests.
- `npm test` — **PASS**, 60 tests, 0 failures.

The node tests use a lightweight DOM double; they do not establish browser-native disclosure behavior. The browser cases below cover the interactions directly.

## Browser acceptance scenarios

| Scenario | Expected | Actual / Evidence | Status |
|---|---|---|---|
| Synthetic member opens report details and views source/provenance | Details expose synthetic source, platform, location, verification status, source link; lead remains explicitly unverified | Opened `QA target B: intersection stop`; details showed `Synthetic source`, `Web`, `Shanghai`, `Unverified lead`, original source URL and explicit “Cause unknown.” | PASS |
| POST rejection | Preserve details/list and vote state; announce failure; refocus enabled original vote control; do not issue report GET | Injected POST 503 (`synthetic vote rejection`). Error text appeared; original details stayed open and Relevant control focused. Request log showed POST `/api/vote` 503 with no report GET afterward. | PASS |
| Save Relevant, change to Not relevant, undo Not relevant | Successful actions report result and leave the matching vote control focused; details stay open | Each action succeeded against synthetic backend. Snapshots showed corresponding active/pressed state and status; Undo removed the vote and restored counts/score. | PASS |
| DELETE rejection | Preserve the active vote; announce failure; refocus Undo; skip report refresh | Injected DELETE 503 (`synthetic delete rejection`); details remained open, Undo was active, status read “Your rating was not removed. synthetic delete rejection.” Browser request trace showed DELETE 503; no GET was initiated for this rejection. | PASS |
| POST success followed by report GET failure | Commit the per-user rating; preserve stale list/details/scroll; hide stale counts/scores; announce commit and stale ordering; expose retry; focus current rating control | POST succeeded; `/api/reports` was routed to 503. Status stated the rating was saved and latest data could not load, and warned counts, ranking scores, and relevance ordering may be stale. Same details/list remained; B's Not relevant control was pressed and focused; Retry appeared. Snapshot showed score/count paragraphs omitted while stale. | PASS |
| Retry failure | Preserve stale results and committed state; keep retry available/focused and explain staleness | Second reports GET returned synthetic 503. Status changed to “Your rating remains saved…” and stated counts/scores/order remain stale. Retry remained visible and active; vote controls/list were retained. | PASS |
| Retry success | Fetch fresh report data, clear stale state, present refreshed order/counts and preserve contextual focus | Removed the route and activated Retry; command completed without browser error and captured a fresh snapshot. This confirmed request recovery; detailed post-refresh focus/order assertions were not captured before the session was closed. | PASS (request/UI recovery); PARTIAL (assertions) |
| Missing report after successful vote refresh -> visible Results heading fallback | Focus Results heading, make it visible by scrolling, never focus body/detached node | Not run. The requested final pass reopened a clean browser session, which had lost the synthetic member login; I stopped rather than reuse/create credentials beyond the seeded isolated-account flow. | INCOMPLETE |
| 390px keyboard save/undo and overflow/focus | Controls reachable by keyboard, layout usable without horizontal overflow, restored focus remains usable | Not run after the final bounded request because the reopened browser required reauthentication. | INCOMPLETE |
| Ordinary refresh does not steal unrelated focus | Background/regular report load leaves search/navigation focus where the user put it | Not run in this session. | INCOMPLETE |
| Approved/pending/admin transitions, filter/reset/error empty states, back/refresh navigation | Correct permission boundaries and recoverable navigation/filter states | Not run in this focused UI-ACCEPT-03 regression. | INCOMPLETE |

Browser snapshot evidence is under `.playwright-cli/` with session timestamps on 2026-09-27; the seeded app reported fixture dates 2026-09-25 through 2026-09-27. Synthetic routed console errors correspond to the injected 503 responses. No unrelated external requests were intentionally made.

## Findings and disposition

- No new confirmed defect in the exercised POST rejection, successful save/change/undo, DELETE rejection, committed-save/refresh-failure, retry-failure, or retry request recovery cases.
- **UI-ACCEPT-03 remains fixed-awaiting-regression / incomplete at the acceptance gate** until missing-report fallback, 390px keyboard/layout behavior, ordinary refresh focus, and any required broader role/navigation cases are run. The successful retry's final detailed focus/order assertions also remain incomplete.
- This is not a final integrated QA sign-off. The primary agent owns completion status and should not treat the unrun scenarios as passed.

## Evidence limitations

Screenshots and snapshots were captured through the named Playwright CLI session in `.playwright-cli/`; this record summarizes their visible/request evidence. The database was deliberately deleted during cleanup, so the environment must be recreated for any remaining checks. During one later retry of the browser, CLI did not retain the prior synthetic login after the browser was closed; no password was recovered or guessed.

## Follow-up browser regression

**Date:** 2026-09-28. Ran against Torsten's updated, still-uncommitted AC03-8..10 implementation. New unique disposable root: `C:\Users\guofe\AppData\Local\Temp\ctim-ui03-followup-7e5352b45cf4421e881b3a77d184f278`; isolated SQLite `staging.sqlite`; loopback service `127.0.0.1:8794`, exact service PID 2392; headed Chrome session `ctim-ui03-followup`. Created new synthetic approved admin/member through the service auth flow and seeded only three synthetic reports. The generated credentials were stored only in the temporary identity file and deleted during cleanup.

| Scenario | Actual / Evidence | Status |
|---|---|---|
| Successful retry: focus and results after committed vote + first GET failure | After retry success, DOM inspection showed the `Relevant` control focused, its report's native details open, stale marker absent, Retry absent, and score display restored. Refreshed relevance order was `second, first, third`, matching server data. This fixture's one vote did not change the order, so no movement claim is made. | PASS |
| Missing-report fallback heading visibility/focus | Mocked a successful empty report GET after a committed removal. Action status announced “Your rating was removed, but the report is no longer in the current results.” Zero articles remained; active element was the Results `H2` (`tabindex=-1`), bounds top 524/bottom 552 inside a 917px viewport, and body was not focused. | PASS |
| 390px keyboard save and undo | At 390px viewport, opened native details with Space; keyboard Tab reached Relevant; Enter saved. Status was “Your rating was saved.”, Relevant was focused and details stayed open. Tab moved to enabled Undo; Enter removed the vote. Status was “Your rating was removed.”, focus returned to Relevant with `aria-pressed=false`, details stayed open. `innerWidth=390`, document width 375; workspace-nav client and scroll widths were both 351px. Screenshot: `.playwright-cli/page-2026-09-27T17-37-43-089Z.png`. | PASS |
| Ordinary search refresh and focus | Filled the search box with `Follow-up synthetic`; after the debounced GET, the same input remained the active element with its query intact. No stale Retry appeared; 3 report cards remained. | PASS |
| Committed vote followed by reports GET 403; auth check still approved | Synthetic POST committed; injected report GET returned 403 while real `/api/auth/me` confirmed the synthetic member still approved. Report content was gated, Account H1 focused, committed status retained (“Your rating was saved, but report access changed…”), and visible “Retry access check” appeared. Snapshot `.playwright-cli/page-2026-09-27T17-45-14-572Z.yml`. | PASS |
| Vote POST 403 | Injected POST 403 on another synthetic report. Report view was gated; Account H1 focused; message explicitly said the rating was not saved because access changed; Retry access check appeared. No report refresh was issued by the action path. Snapshot `.playwright-cli/page-2026-09-27T17-50-30-039Z.yml`. | PASS |
| Signed-out auth confirmation after report GET 401 | `/api/auth/me` returned signed-out. Report data cleared; Account/login rendered; fresh DOM evaluation showed the Account heading focused. | PASS |
| Pending auth confirmation after report GET 403 | `/api/auth/me` returned a pending member. Initial stale-ref observation showed BODY, but a controlled replay with fresh refs after the request settled showed visible Account, pending message, zero cards, and `H1#account-heading` focused. A later delayed-auth check verified focus remains on the Account heading throughout the 15s pending interval and after `/api/auth/me` returns approved; report summary/cards stay cleared and Retry access check remains available. | PASS |
| Undo DELETE 403 | With a saved synthetic vote, injected DELETE 403 kept the vote uncommitted as removed, gated report data, focused Account H1, announced that the rating was not removed because access changed, and exposed Retry access check. | PASS |
| Auth-check unavailable after report GET denial | Not confirmed in browser. | INCOMPLETE |
| Undo DELETE 401 | Not run separately; DELETE 403 was exercised. | INCOMPLETE |
| Delayed vote-context report GET superseded by newer search, then old request returns 401/403 | Initial Playwright `run-code` injection attempts closed the CLI session. This was later re-run successfully via the isolated local proxy; see “Final security-precedence race regression” below. | SUPERSEDED BY PASS |

Cleanup completed: browser session `ctim-ui03-followup` was no longer open after the CLI error; I left unrelated `user-google` untouched. I verified `identity.txt` matched the unique temp root, PID 2392, port 8794; verified PID 2392 was `node.exe` started at 2026-09-28 01:26:57 and owned the `127.0.0.1:8794` LISTENING socket; stopped only PID 2392; removed only the unique temp root. Follow-up checks confirmed the root did not exist and port 8794 had zero listeners. No live service/account/database was contacted.

**Follow-up disposition at that time:** The requested visible fallback, responsive keyboard save/undo, ordinary focus retention, retry restoration, approved-auth access denial, and vote-POST denial were verified. AC03-8 remained incomplete for additional 401/pending/signed-out/unavailable variants; AC03-9 remained incomplete for DELETE denial; AC03-10 was then blocked by the closed browser session during delay injection. The final race regression below supersedes the AC03-10 block for delayed 403 precedence.

## Final security-precedence race regression

**Date:** 2026-09-28. Recreated a fresh isolated SQLite service and proxy under `C:\Users\guofe\AppData\Local\Temp\ctim-ui03-race-0f9b7d79eaf347749569cd6cdfae8e92`. Service `127.0.0.1:8797` used synthetic admin/member and three synthetic reports; proxy `127.0.0.1:8798` had a one-shot local fault control delaying the next report GET for 20 seconds before returning synthetic 403. Browser session: `ctim-ac0310-race2`.

| Scenario | Expected | Actual / Evidence | Status |
|---|---|---|---|
| Older vote-context report GET returns 403 after a newer search request starts and succeeds | Security denial takes precedence over supersession: clear/gate report data, show Account access state, focus Account heading, and prevent newer response from restoring restricted content or stale retry | Logged in as synthetic member; armed one-shot delayed 403; clicked Relevant (POST `/api/vote` 200) and immediately changed query to `two`. Request trace showed the old report GET returned 403 and the newer `q=two` GET returned 200. Final DOM evaluation: `accountVisible=true`, `accountHeadingVisible=true`, active element `H1#account-heading`, `reportCards=0`, empty `#record-total`, no filter options, and only button “Retry access check”; query text remained `two` but no report data reappeared. | PASS |

The earlier failed `run-code` delayed-route attempts are superseded by this deterministic local-proxy reproduction. The test demonstrates the critical old-request denial precedence case; it does not cover ordinary superseded 5xx/network failures. Cleanup: closed only Playwright session `ctim-ac0310-race2`; verified the exact identity marker named the unique temp root, database, service PID 31588/port 8797, and proxy PID 43660/port 8798. Both listener checks returned no process after their recorded processes had exited. Removed only the verified unique disposable root. No live app, account, database, or unrelated Chrome session was used.

**Updated disposition:** AC03-8 signed-out, pending, still-approved, delayed-auth focus, and auth-check-unavailable behavior passed. AC03-9 POST/DELETE 401 and 403 cases passed. AC03-10 security-denial precedence race is verified for delayed 403 following a newer successful search. Direct activation of access Retry after auth-check failure remains unverified; recovery via normal reload passed. Ordinary obsolete 5xx/network handling and broader role/navigation acceptance remain incomplete; this session is not final integrated QA sign-off.

## Auth-unavailable and write-denial 401 regression

**Date:** 2026-09-28. Fresh disposable SQLite service on `127.0.0.1:8799`, database and identity marker under `C:\Users\guofe\AppData\Local\Temp\ctim-ui03-auth-edge-b3def8368f3f4442a3113d3bd2ae7d77`. Seeded one synthetic administrator and one synthetic report; browser session `ctim-ui03-auth-edge`. Playwright CLI routes injected only synthetic responses into the local browser.

| Scenario | Expected | Actual / Evidence | Status |
|---|---|---|---|
| Committed vote POST, report GET 403, then `/api/auth/me` unavailable (500) | Clear report data, focus Account H1, preserve accurate committed-action message, show access-check Retry | Vote POST reached the service and returned 200; routed report GET returned 403; routed auth check returned 500. Snapshot `page-2026-09-27T18-55-20-544Z.yml` showed Account H1 active, no report data, “Your rating was saved, but report access changed. Access could not be confirmed. Report data remains hidden.” and “Retry access check.” | PASS |
| Access recovery after auth service recovers | On successful reauthorization, reload data only after approval | Retry control's old snapshot reference expired while removing routes and the UI status changed, so direct click was not verified. A normal reload then returned auth 200 and restored the approved synthetic account's report (snapshot `page-2026-09-27T18-55-59-273Z.yml`). | PASS (reload recovery); INCOMPLETE (Retry activation) |
| Vote DELETE 401 | Do not commit removal or fetch reports; clear/gate report state and focus Account H1 with accurate status and access Retry | Existing Relevant vote was present. Routed Undo DELETE returned 401; Account H1 became active, message said the rating was not removed because access changed, and “Retry access check” appeared. Request trace ended this action with DELETE 401 then auth-me 200; no reports GET followed. | PASS |
| Vote POST 401 on rating change | Do not commit new rating or fetch reports; clear/gate report state and focus Account H1 with accurate status and access Retry | After approved reload the existing Relevant vote remained. Routed change to Not relevant returned POST 401; Account H1 became active, message said the rating was not saved because access changed, and “Retry access check” appeared. Trace showed POST 401 then auth-me 200 and no reports GET afterward. | PASS |

Cleanup: closed only `ctim-ui03-auth-edge`; verified the identity marker matched the exact temp root/database, service PID 31004, and port 8799; stopped only that recorded `node.exe`; removed the exact unique temp root. Final existence check was false and port 8799 had no listener. No live service, account, database, or unrelated Chrome session was contacted.

**Updated disposition:** AC03-8 auth-check-unavailable handling and AC03-9 write-denial 401 handling are verified. Direct access-Retry activation after auth-check failure remains incomplete; normal reload after recovery passed. Ordinary superseded 5xx/network behavior and broader roles/navigation remain incomplete, so the overall UI gate remains open.

## UI-ACCEPT-03 retry-state follow-up

**Date:** 2026-09-28. Torsten's retry-state correction was checked in a headed disposable browser against synthetic data served on loopback (`127.0.0.1:8810`) through a local fault proxy (`127.0.0.1:8811`). The isolated browser used one synthetic admin and two synthetic reports; no production service, account, or database was used.

| Scenario | Actual / evidence | Result |
|---|---|---|
| Access check recovers to approved and Retry is activated | After synthetic reports GET 403 and auth `/me` 500, a fresh Retry locator was clicked. Retry `/me` returned 200 approved; summary, filters, my-votes, and reports returned 200; two synthetic cards and counters returned. Reports H1 was visible and focused. | PASS |
| Access check recovers to pending | Retry `/me` returned a pending user. The page showed the approval-pending message; Retry and report navigation/data were absent; Account H1 was focused. | PASS |
| Access check recovers to signed-out | Retry `/me` returned `user:null`. The login form and normal sign-in message appeared; no stale Retry remained; Account H1 was focused. | PASS |
| Retry while auth remains unavailable | The initial failure UI was captured; retry was not activated in this run. | INCOMPLETE |
| Older ordinary reports request returns 503/network error after a newer search succeeds | Not run in this browser pass. | INCOMPLETE |

**Code/review:** Torsten updated `apps/web/app.js` so confirmed pending/signed-out retry outcomes replace stale access-check feedback and remove the obsolete Retry control, while retaining a committed vote message. Successful approved recovery clears old access feedback after reports load and focuses the Reports heading. `node --check apps/web/app.js` passed; integrated `npm test` passed 65/65. Dennis independently reviewed the changed retry state paths and found no actionable source defect.

**Cleanup:** The primary confirmed ports 8810/8811 had no listeners and no matching disposable `*881*` temp directories remained after the browser pass.

**Disposition:** The approved/pending/signed-out Retry flows are verified. Keep UI-ACCEPT-03 and QA-01 open until retry-while-unavailable and ordinary superseded 503/network behavior are verified, and broader role/accessibility coverage is complete.

## Bounded Retry-unavailable recheck

**Date:** 2026-09-28. A fresh disposable service/proxy/browser was opened on loopback ports 8812/8813 with synthetic user/report data. Auth denial reproduced: Account H1 focused, access-unavailable message present, Retry control visible. During the attempt, the first snapshot locator for Retry had gone stale; a new snapshot then observed the app's 30-second `refreshAuth` poll after repeated synthetic auth 500s. The UI had transitioned to the separate “Could not check your sign-in session. Try again.” state before Retry could be activated. The bounded attempt was stopped rather than repeated. No ordinary superseded 503/network race was run.

**Result:** retry-while-auth-unavailable and ordinary superseded 503/network behavior remain **INCOMPLETE**. This run does not establish a product defect: it establishes a timing/tooling limitation where the session refresh poll changed the UI between snapshot and click. The session-level “Try again” state appeared after the separate refreshAuth poll failed; no assertion about the access-Retry button after a second failure is made. Direct approved/pending/signed-out Retry outcomes are independently PASS as recorded above. Service/proxy listener checks returned empty after the attempt. Hermann closed browser `ctim-hermann-ui03b`, stopped only recorded Node PIDs 60104/40032, removed the exact unique temp root `ctim-ui03-hermann-retry-race-20260928-b902`, and confirmed ports 8812/8813 clear.

## Ordinary superseded 503 race attempt

A fresh isolated service/proxy/browser used one approved synthetic member and two synthetic reports. An older `q=alpha` request was delayed 25 seconds; search was changed to `beta` and its GET completed first. Before the older request returned, the browser showed only “Synthetic report Beta”, query value `beta`, page status `1 / 1 · 1 reports`, search remained focused, and no error or Retry state appeared. The attempt was interrupted before the delayed alpha response returned, so whether its eventual 503 leaves the newer state intact is **INCOMPLETE**; the network-failure variant was not attempted. Cleanup completed: browser `ctim-hermann-race` closed, recorded API/proxy PIDs 62764/66224 stopped, exact temp root `ctim-ui03-hermann-race-20260928-d441` removed, ports 8820/8821 clear.

## Ordinary superseded HTTP 503 race — completed

On the same fresh synthetic approved-member service/proxy/browser, the old-alpha response was delayed and scheduled to return HTTP 503. The tester filled `alpha`, then `beta`; proxy trace showed alpha entered delayed-503 at 07:12:24.662, beta returned 200 at 07:12:25.037, and the obsolete alpha returned 503 at 07:12:26.166. Final DOM after the old 503: query `beta`, only “Synthetic report Beta”, page status `1 / 1 · 1 reports`, focus still on `#query`, no action/error text, no stale retry button, and `aria-busy=false`. **PASS.** A separate network-abort variant remains untested.


**Final disposition:** The delayed obsolete HTTP 503 race passed with beta state and focus preserved. The separate network-abort variant remains untested. Retry while auth stays unavailable and broader accessibility/role/error-recovery acceptance remain open; no scoped showstopper is confirmed, but release evidence is incomplete.

## Prolonged auth-outage Retry fix — browser regression

**Date:** 2026-09-28. Target: modified `apps/web/app.js` in `updater-vnext`, branch `vnext-home-hosted`, HEAD `5291f92ba977f7abec6ce1d1250645fb4f82cb62`. Test used a disposable synthetic account/report service and local fault proxy on ports 8850/8851; no live account, service, or database was used.

| Scenario | Actual evidence | Result |
|---|---|---|
| Vote committed, report access denied, auth stays unavailable through the 30-second poll | Trace: vote POST 200, reports GET 403, `/api/auth/me` 500 at denial and through the 30-second poll. The Account message retained the committed-action and access-unavailable wording; Retry remained visible and enabled. Account stayed active; zero report cards/content/vote controls, filters contained only All, and count/status were empty. Retry retained focus when it had focus before the poll. | PASS |
| Auth recovers and user activates Retry | Trace: auth 200 then summary, filters, my-votes, and reports all 200 in order. Final page showed one synthetic report and its vote state; access message cleared; Reports H1 received focus. | PASS |
| Automated regression and syntax | `node --check apps/web/app.js` passed; `npm test` passed 65/65, 0 failed. | PASS |

**Change/review:** `refreshAuth()` now restores the Account access message and Retry after a poll failure while report access remains blocked, preserving the committed-action text and retry focus. Report data stays gated. Dennis identified the defect before the fix; independent post-fix code review is pending.

**Cleanup:** Hermann closed the named Playwright session, stopped only service/proxy PIDs 65996/65424, verified ports 8850/8851 had no listeners, and removed the exact temporary root `ctim-ui03-hermann-poll-retry-20260928-3a9f` under `%TEMP%`.

**Disposition:** Prolonged auth-outage and recovery acceptance pass. The separate obsolete-request network-abort case and broader role/accessibility/error-recovery matrix remain open; UI-ACCEPT-03/QA-01 are not complete.

## Obsolete search network-abort race — completed

**Date:** 2026-09-28. Isolated synthetic service on `127.0.0.1:8789`, local forwarding proxy on `127.0.0.1:8790`, browser session `ctim-hermann-abort`. The test held the older `alpha` response, allowed the newer `beta` request to return 200, then reset the browser-facing socket for obsolete alpha.

Proxy timestamps confirmed alpha held at 1790581381591/1594, beta received at 1790581381870 and returned 200 at 1790581381873, and alpha was reset at 1790581383095. Final DOM: query `beta`, only “Synthetic report Beta”, status `1 / 1 · 1 reports`, total `2 reports · 2 unverified`, focus remained `#query`, reports `aria-busy=false`, no Retry/alert/action error. **PASS.** The browser logged the expected console network error from the intentional reset.

Cleanup: closed browser session `ctim-hermann-abort`; stopped service PID 50248 and recorded proxy PIDs 34076, 67292, 66372, 67208, and 67232; verified ports 8789/8790 had no LISTEN sockets (TIME_WAIT only); removed the exact temp root `ctim-ui03-hermann-abort-20260928-fresh`. No live service/account/database was used; no source or shared documentation was changed by Hermann.

**Disposition:** Together with the delayed-503 test, obsolete HTTP and network failures now preserve the newer result. This does not complete the broader role/accessibility/error-recovery matrix.

## UI-ACCEPT-05 — focus after error Retry

**Date:** 2026-09-28. Initial defect was reproduced by Hermann on synthetic admin/member/pending data on `127.0.0.1:8860` through a disposable proxy on `127.0.0.1:8861`: Reports GET returned 503; keyboard activation of Try again led to 200 and an empty-results state, but focus fell to BODY when the Retry button was removed.

**Fix:** `apps/web/app.js` now focuses the Results heading after a successful Reports Retry and focuses the newly rendered Retry button after another request failure. Access-denial handling remains responsible for Account H1 focus.

| Regression | Actual result | Status |
|---|---|---|
| Initial 503, keyboard Enter on focused Retry, then 200 | Empty-results state replaced the error and focus moved to `H1#heading` (“Reported incident leads”). | PASS |
| Two 503 responses with Retry activated by keyboard | First failure rendered Retry; after second activation/503, the old Retry disconnected and the replacement visible/enabled Retry held focus. | PASS |
| Reports 403 and approved auth check | Account view shown, focus moved to `H1#account-heading`; zero cards/content, one All option per filter, `aria-busy=false`. | PASS |
| Automated checks | `node --check apps/web/app.js`; `npm test` 65/65, 0 failures; `git diff --check`. | PASS |

The same User Tester pass found that app-view navigation does not push browser history: Back leaves the root page (the disposable browser showed `about:blank`) and Forward returns to default Reports rather than the previous Account view. No browser-history contract is documented, so this is recorded as a navigation limitation, not a confirmed defect. Empty-results feedback was announced in the polite live region, query focus stayed in place, and `aria-busy` cleared. A synthetic original-source link opened a new tab with `_blank` and `noopener noreferrer`, `window.opener` was null, and the app tab remained open; the `.invalid` host prevented real external contact.

Cleanup: Hermann closed the browser, stopped recorded service PID 66604 and proxy PIDs 65380, 67256, 48004, and 68384, confirmed ports 8860/8861 had no listeners, and removed the exact temp root `ctim-qa01-matrix-20260928-hermann`. No live service/account/database was used.

**Disposition at this browser run:** UI-ACCEPT-05 focused-retry behavior passed its isolated browser regressions and automated suite. The pending independent review at that time was completed afterward; Dennis found the Reports-view focus guards sound. A later browser check of navigation away during an in-flight retry is still open.

## UI-ACCEPT-05 independent browser retest and cleanup

In a fresh disposable session, Reports GET 503 → keyboard Retry → 200 focused `H1#heading` (“Reported incident leads”). A second run with two consecutive 503s focused the replacement visible/enabled Retry after the first retry failed. A 403 with auth still approved routed to Account, focused `H1#account-heading`, and kept report/filter data hidden. **All three PASS.**

This focused retest used browser `ctim-ui05-focus`, service PID 64612 and proxy PID 64996 on ports 8870/8871. Cleanup closed the browser, stopped both recorded processes, confirmed no listeners (TIME_WAIT only), and removed exact temp root `%TEMP%\ctim-ui05-focus-20260928-hermann`. No source/shared docs were changed by Hermann.

At this point the browser regression passed; code review and the navigation-away edge review were still pending. Dennis has since reviewed the Reports-view guards and found them sound. A final browser check covering navigation away during an in-flight retry remains open.

## Independent review follow-up: focus when leaving Account during auth polling

Dennis's independent source review identified a focus edge in `refreshAuth()`: when the Account Retry had focus as `/api/auth/me` began, a failed poll rebuilt Account feedback and unconditionally refocused its Retry even if the user had navigated to Reports while the request was pending. The existing browser regression covered remaining on Account, not this navigation-away case.

The primary added a `currentView === 'account'` guard before restoring focus. Hermann's requested browser retest could not start: browser discovery failed twice with `Unable to load browser request-header policy`; `npx --yes --package @playwright/cli playwright-cli --version` produced no output before a 30-second timeout in this network-disabled environment. A later fresh CUA inventory again returned no apps or browsers and the same request-header-policy error. No server, proxy, temp data, or process was created or changed. No browser result is claimed.

During that source check, Hermann noted that `retryReportAccess()` also unconditionally focused Account after a failed request. The primary guarded catch-path focus to avoid stealing focus after the user navigates away, and guarded successful Reports heading focus so it only runs when returning from Account. Both navigation-away paths remain browser **UNVERIFIED** because the environment could not start a browser. `node --check apps/web/app.js`, `npm test` (65/65), and `git diff --check` pass after the source guards.

## Navigation-away browser retest through cached Playwright CLI — 2026-09-28

The CUA browser inventory still fails with `Unable to load browser request-header policy`. The cached `@playwright/cli` 0.1.21 package did work when its disposable browser process was launched with the approved local-cache access; no package installation or network access was needed. Browser automation ran against the local vNext UI on port 8789 with `ADAS_DB_PATH` set to a newly created disposable SQLite path under `output/playwright/qa-isolated-20260928`. Every API call was intercepted with synthetic JSON; no real accounts, production DB, service, or network source was used.

| Regression | Result | Outcome |
|---|---|---|
| Vote POST 200, report GET 403, then 30-second `/api/auth/me` poll held pending; user navigates from Account to Reports before poll returns 500 | `authCalls=3`, `reportCalls=2`; focus remained on the Reports navigation target (`data-view-target=reports`) after poll failure. Committed-vote/access message and Retry stayed in Account; page remained in Reports. | PASS |
| Same committed vote/access denial, user remains on Account with Retry focused, then 30-second auth poll returns 500 | Account remained selected, Retry stayed visible and focused, and message retained “Your rating was saved, but report access changed” plus access-unavailable/retry guidance. | PASS |
| Reports GET 503; Retry request held pending; user navigates to Account before retry returns 200 | Account remained selected and `H1#account-heading` kept focus; report card rendered in the hidden Reports view without stealing focus. | PASS |

These checks close the two navigation-away behavior gaps identified by Dennis. The prior committed-action/auth-outage browser acceptance remains valid. Browser snapshots/results were returned in the CLI execution output; no visual screenshot was needed for these keyboard-focus regressions. The report-card content was synthetic and the focused assertions covered selected view, target focus, retry visibility/message, and hidden-view behavior.

**Cleanup:** see the later Access Retry follow-up; all created service/browser processes and isolated files are verified stopped/removed. Dennis's post-fix review found no remaining actionable code issue in the navigation-away guards. Broad QA-01 role/accessibility/error-recovery coverage remains open.

## Dennis review finding and Access Retry navigation regression — 2026-09-28

Dennis identified a third path in `retryReportAccess()`: when Access Retry began on Account, the user navigated to Reports, authentication succeeded, but the subsequent Reports load failed, the old code returned the UI to Account and focused its heading. The primary changed the unsuccessful-load branch to focus/show Account only if Account is still the active view. The unapproved-user branch remains explicitly routed to Account; report access remains blocked on any unsuccessful load.

The exact flow was reproduced and then retested with explicit Playwright assertions against the isolated UI and synthetic API: initial report load 200; vote write 200; report reload 403; Access Retry auth check 200; retry's Reports load held pending; user navigated to Reports; held request returned 503. Final checks passed: Reports remained selected; focus stayed on the Reports navigation target before and after the failed request; the global access notice and its Retry button were visible; the report container was hidden with zero cards. `npm test` passed 65/65, `node --check apps/web/app.js` passed, and `git diff --check` passed. Dennis's independent re-review found that the `currentView === 'account'` guard addresses the reported P2; he confirmed the asserted behavior and found no remaining actionable code issue.

**Cleanup complete:** closed Playwright sessions `roundtable` and `roundtable2`; stopped the isolated vNext service and the two browser launcher shells; verified recorded PIDs 75460, 75456, and 77648 had exited and port 8789 had zero listeners; removed only the two newly created in-repository directories `output/playwright/session/ffd870807829e70a` and `output/playwright/qa-isolated-20260928`. Existing `output/playwright` artifacts were preserved.

**Disposition:** all three focused navigation-away cases in this note pass, with independent Dennis review and cleanup complete. CUA browser enumeration remains broken, but the cached Playwright CLI successfully exercised the actual local UI without network package installation. UI-ACCEPT-03 focused acceptance is complete; QA-01's broader User Tester matrix remains open.
