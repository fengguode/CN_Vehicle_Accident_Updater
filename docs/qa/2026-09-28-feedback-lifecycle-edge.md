# QA Session: Feedback lifecycle and pagination accessibility

- Date: 2026-09-28 (Asia/Shanghai)
- Target: updater-vnext feedback feature, current shared working tree (Git executable unavailable in this shell, so commit could not be recorded; primary owns final Git evidence).
- Environment: Windows; installed Microsoft Edge via direct Playwright JS API (`playwright` from npm cache), visible browser, isolated local API service and SQLite database under `%TEMP%`. Synthetic admin/member accounts and requests only. No production account or data used.
- Evidence: [Edge screenshots](../../output/playwright/feedback-edge-full-20260928/); result JSON in the same directory. The result JSON contains the end-to-end run plus harness limitations; this session note separates product assertions from harness errors.

## Acceptance checks and outcomes

| Level / scenario | Expected | Actual | Result |
|---|---|---|---|
| Customer submission: empty and malformed title/description | Browser blocks invalid input and focuses the first invalid field | Native validation blocked both cases; focus was `title` | PASS |
| Customer submission: Issue and Feature | Receipt reference returned; requests appear in submitter list | Both returned UUID references and appeared in the list | PASS |
| Persistence and ownership | Own list survives refresh; another member sees none | Two submitted items persisted after refresh; second member had 0 items | PASS |
| Permission boundary | Non-admin cannot see Feedback admin navigation | Feedback admin nav hidden for second member | PASS |
| Admin queue and pagination setup | 100 initial rows, Load older available for 7 remaining | 100 displayed from 107 total; button visible | PASS |
| Responsive admin queue at 1280, 752, 390 px | No horizontal overflow | Document widths 1265/737/375 vs viewport 1280/752/390; no overflow | PASS |
| 390 px navigation | Two columns and four visible destinations | Computed columns `172.703px 172.703px`; four links visible | PASS |
| Keyboard pagination, English | Tab reaches Load older; Enter loads and announces result; focus moves to live status; button hides | Focus landed on `feedback-load-more`; status `Older requests loaded.`; focus `feedback-admin-status`; button hidden | PASS |
| Keyboard pagination, Chinese | Same behavior with Chinese announcement | Focus landed on `feedback-load-more`; status `已加载更早的请求。`; focus `feedback-admin-status`; button hidden | PASS |
| Exact page-boundary pagination, Chinese | With exactly 100 queue rows, second page announces no older requests and hides button | `没有更早的请求了。`; focus `feedback-admin-status`; button hidden | PASS |
| Exact page-boundary pagination, English | With exactly 100 queue rows, second page announces no older requests and hides button | `No older requests remain.`; focus `feedback-admin-status`; button hidden | PASS |

## Harness interruption and disposition

The runner continued beyond the requested pagination regression into a broader triage scenario, then timed out when its fixture-side API lookup used an incorrect route shape. It recorded a failure for that lookup and stopped. That is a test harness failure, not evidence of a product defect. Triage save/rationale and public/private status isolation are therefore not counted as passed in this regression session; earlier baseline evidence exists separately in `feedback-edge-baseline-results.json`, with its own synthetic-data caveat.

The exact-page-boundary English and Chinese checks were then run in separate fresh isolated services with exactly 100 synthetic queue rows and no data mutation between the initial page and Load older action. Both assertions passed.

## Cleanup and limits

- Isolated API ports 59804, 63132, 61432 were checked and were closed after the runs.
- SQLite files, temporary runner scripts, and app-local cache were removed. The Playwright contexts were closed. Two Edge-created `Intel` cache directories remain under `%TEMP%` because Windows denied deletion while locked: `%TEMP%\feedback-edge-ui-full-20260928\Intel` and `%TEMP%\feedback-edge-no-more-20260928\Intel`. Temporary app profile directories were removed where unlocked. No test database remains at either fixture path.
- Primary retried cleanup of those exact `Intel` directories after verifying their full paths remained under `%TEMP%`; Windows again returned access denied. They are reported as remaining temporary cache only, not test databases or profiles.
- No uncaught browser page errors were observed before the fixture lookup timeout.
- Not tested in this pass: browser Back/Forward behavior, interrupted submission retry, malformed direct API payloads, and cross-session concurrent triage updates.

## Follow-up findings

FEEDBACK-05's initially empty post-pagination live region was fixed and verified in English and Chinese, including the exact-100-row case that produces an empty second page. Dennis's subsequent source review found an additional navigation-label readability gap at 421–720px that the 390/752/1280 viewport set did not cover. The primary extended the feedback-visible two-column navigation rule through 720px in `apps/web/styles.css`. Hermann's focused Edge verification at 421/500/720/721px passed; all four destinations remained readable, document/body widths equaled each viewport, and keyboard traversal showed visible focus. Dennis re-reviewed the CSS change and confirmed the finding closed with no new breakpoint issue. FEEDBACK-05, FEEDBACK-06, and UI-ACCEPT-06 acceptance are complete. The broader feedback QA remains open for the untested journeys above.

## Follow-up: FEEDBACK-06 narrow admin navigation

- Date: 2026-09-28; isolated Windows Edge via direct Playwright JS API; admin-only synthetic user and temporary SQLite service.
- Tested viewport widths: 421, 500, 720, and boundary 721 px. All four destinations (Reports, Account, User management, Feedback) were visible/readable at every width. No horizontal overflow: document/body widths equaled viewport width at all four.
- At 421/500/720 px the feedback-visible nav computed as two columns. At 721 px it computed as four columns. `User management` fit within its button at 721 px (164 px button; scroll width 162 px).
- Keyboard: from the brand link, repeated Tab reached each of the four nav destinations in order at every width. Each focused nav button had a visible 3 px solid blue outline (`rgb(33, 125, 206)`). PASS.
- Cleanup: isolated service port 49261 was confirmed closed; SQLite main/WAL/SHM files, script, local app cache, and profile directories were removed from `%TEMP%\feedback06-edge-20260928b`. An earlier failed launch directory was also cleaned of script/database/profile files. Edge left locked `Intel` cache directories in `%TEMP%\feedback-edge-ui-full-20260928\Intel`, `%TEMP%\feedback-edge-no-more-20260928\Intel`, `%TEMP%\feedback06-edge-20260928\Intel`, and `%TEMP%\feedback06-edge-20260928b\Intel`; no test database or service remains. Primary retried removal only after verifying all four absolute targets stayed under `%TEMP%`, but Windows returned access denied for each.

## FEEDBACK-04 follow-up: navigation, retry, payload validation, concurrent triage

- Date: 2026-09-28 (Asia/Shanghai). Target: current updater-vnext working tree; visible Microsoft Edge 154 via direct Playwright JS API, 1280×900, isolated service at `127.0.0.1:57658`, disposable SQLite database under `%TEMP%`, two synthetic admins and one synthetic member.
- Browser preflight and same-origin service health passed. No live account/data used.

| Check | Evidence | Result |
|---|---|---|
| Back/Forward characterization | Switching Feedback→Account leaves URL at `/#qa-history` and creates no SPA history entry. Browser Back on this single-entry tab navigated to `about:blank`; Forward reloaded the app at the URL, with default Reports view visible. | PASS (characterized; app has no intra-view history policy) |
| Interrupted submission retry | Aborted first POST rendered `Failed to fetch`; form title/description remained and submit control was restored. Removing the network abort and resubmitting created one request, returned a reference, refreshed own list to one card, and cleared the form. | PASS |
| Malformed API payloads | Invalid JSON, array body, invalid request type, and numeric title each returned HTTP 400 with specific validation errors. Member request count stayed at one (the prior successful retry). | PASS |
| Concurrent triage | Two separate admin sessions PATCHed the same feature concurrently; both returned 200. History contains initial submission plus both triage events; final stored state is the later serialized update (`Complete`, Admin B public update/internal note). Submitter history contains all events but omits `internal_notes`. | PASS |

- Exact browser/API responses are in [feedback04-followup-results.json](../../output/playwright/feedback-edge-full-20260928/feedback04-followup-results.json). The tested server entrypoint was `apps/api/server.js`, pointed at the disposable `ADAS_DB_PATH`; `/health` succeeded before browser actions.
- Cleanup: service ports 62868, 49769, and 57658 are closed. All temporary DB, WAL/SHM, scripts, and app/browser profile/cache directories were removed. Edge retained locked `Intel` cache directories under `%TEMP%\feedback04-followup-20260928`, `%TEMP%\feedback04-followup-20260928b`, and `%TEMP%\feedback04-followup-20260928cb`; no database or service remains. Git evidence was not collected in this shell because `git` is unavailable on PATH.

- Primary Git traceability follow-up (2026-09-28): elevated read-only Git commands verified branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`, ahead 18, with QA/output artifacts uncommitted alongside existing shared work. `git diff --check` exited 0 (only LF/CRLF warnings). The QA-only agent shell's PATH limitation above does not prevent the primary's repository snapshot.

## QA-01 follow-up: invitation, password, keyboard, race, and accessibility checks

- Date: 2026-09-28 (Asia/Shanghai). Target: updater-vnext current working tree. Browser: Microsoft Edge 154 controlled through the cached Playwright JS API, visible, initial viewport 1280×900. Service entrypoint `updater-vnext/apps/api/server.js` served both UI and API from the same isolated origin; `/health` passed. All accounts and data were disposable.
- Evidence: [QA-01 detailed results](../../output/playwright/feedback-edge-full-20260928/qa01-remaining-results.json); screenshots [640 CSS px reflow](../../output/playwright/feedback-edge-full-20260928/qa01-640csspx-reflow.png) and [forced-colors emulation](../../output/playwright/feedback-edge-full-20260928/qa01-forced-colors.png).

| Scenario | Evidence / result |
|---|---|
| Invalid, expired, and reused invitation | All three registration attempts were rejected. UI showed “Invitation code is invalid, expired, or already used.” in `#account-message[role=status][aria-live=polite]`. A valid invitation registered a signed-in pending member (`approved:false`). PASS |
| Password change and recovery | Wrong current password displayed the error, retained both entered values, and restored the submit button. Correct password change showed success; current session stayed authorized, distinct second session’s protected `/api/feedback/mine` returned 401, old-password login returned 401, and new-password login returned 200. PASS |
| Member/admin keyboard traversal | From the Account/Feedback heading, Tab reached all 10 member-account and 9 admin-queue controls observed; each stop was visible with a solid focus outline. Admin queue status has `role=status`, `aria-live=polite`, and returned `aria-busy=false`. PASS |
| Long query | A 7,000-character report search was accepted, settled with “1 / 1 · 0 reports,” and did not overflow the 1280 px viewport. PASS |
| Refresh and pagination races | Delayed first member refresh followed by a newer refresh: releasing the stale response left the list stable and not busy. Delayed admin offset=100 response followed by a filter refresh: the 100-row refreshed first page remained intact after stale response release. PASS |
| Forced colors and contrast sample | Edge forced-colors emulation reported active; visible focus remained solid. Computed button black-on-white sample is 21:1; focus outline `rgb(55, 0, 110)` against white is approximately 15.13:1. This is a sample, not a full component/state contrast audit. PASS for sampled colors/focus only |
| 200% reflow approximation | A 640 CSS px viewport (half the 1280 px baseline) caused a two-column nav and no horizontal overflow (document/body widths 625 px due scrollbar). This is viewport equivalence, not native browser zoom. PASS |

- No product defect was confirmed in these checks. One preliminary password-session suspicion was a harness mistake: `/api/auth/me` intentionally returns HTTP 200 with `user:null` after logout. The rerun used protected `/api/feedback/mine` and confirmed revocation (401) for a distinct second session.
- Native screen-reader announcement speech/timing was not testable (no screen reader attached). A virtual keyboard, touch device, and physical-device zoom were unavailable. Native Edge 200% zoom was not exercised. Forced colors were emulated in Edge, not validated in a Windows high-contrast user session. The contrast sample does not cover all text, controls, cards, and error states.
- Cleanup: test ports 56566, 52459, 55620, and 65055 confirmed closed. Temporary database/WAL/SHM, scripts, profile, cache, and generated support files were deleted. Edge left locked `Intel` cache directories under `%TEMP%\qa01-edge-20260928`, `%TEMP%\qa01-edge-20260928b`, and `%TEMP%\qa01-edge-20260928eb`; those contained no test DB or profiles. Git status unavailable because Git is not on this shell PATH.

## QA-01 remaining feasible checks: invitation concurrency and rendered text contrast

- Browser/service setup remained available through Edge 154 and direct Playwright JS. Each check used a fresh local service and disposable SQLite database; no application or live service was changed.
- Concurrent registration raced two valid distinct usernames against the same invitation code. Edge first rendered the isolated app title; the two same-origin `/api/auth/register` requests returned 201 and 400 respectively. DB verification found exactly one new pending member and the invitation marked used. Result: PASS; evidence [invitation redemption race](../../output/playwright/feedback-edge-full-20260928/qa01-invitation-redemption-race.json).
- Computed-style contrast sampled visible text nodes in signed-in Account and admin Feedback views, both with normal colors and Edge `forced-colors: active` emulation. No sampled text fell below WCAG AA thresholds (4.5:1 normal text / 3:1 large text); minimum normal-mode ratio was 4.56:1 and forced-colors minima exceeded 13:1. Focus color checks remain in the previous QA entry. This is a visible-text heuristic and does not audit placeholders, pseudo-elements, images/gradients, every error/loading state, or native OS high-contrast rendering; result [contrast sample JSON](../../output/playwright/feedback-edge-full-20260928/qa01-contrast-sample.json), screenshot [forced-colors Feedback view](../../output/playwright/feedback-edge-full-20260928/qa01-contrast-forced-colors-feedback.png).
- Cleanup: ports 59644, 58238, and 53970 are closed; disposable databases, runner scripts, profiles, and caches are removed. Edge left locked `Intel` cache directories under `%TEMP%\qa01-invite-race-20260928`, `%TEMP%\qa01-contrast-20260928`, and `%TEMP%\qa01-contrast-20260928b`. No test database or service remains.

## QA-01 follow-up: same-session registration double-submit and recovery (2026-09-29)

- Environment: disposable SQLite and local `apps/api/server.js` at `127.0.0.1:57625`; visible Edge 154 via direct Playwright API, 1280×900. Edge opened the expected app title before the acceptance flow.
- Invalid-code attempt was held in flight after the backend returned 400. While the first request was pending, both Register and auth-mode controls were disabled, `data-submitting=true`, and a rapid browser double-click produced no second POST (one request total for the failed attempt).
- On release, the user saw the polite live-region error “Invitation code is invalid, expired, or already used.” Username and invalid code remained populated, controls were re-enabled, and focus returned to `#auth-submit`.
- The same user then replaced the code with a valid invitation. Its 201 response was held while pending controls were checked; a rapid double-click again generated no duplicate request. Releasing it signed in exactly one pending member (`approved:false`), marked the invitation used, hid the auth form, and left focus on `#account-heading` after loading settled.
- Result: all assertions passed, exactly one request per attempt and one valid account. No uncaught page errors. Evidence [registration double-submit/recovery results](../../output/playwright/feedback-edge-full-20260928/qa01-registration-double-submit-recovery.json).
- Cleanup: isolated port 57625 was confirmed closed and the SQLite DB, WAL/SHM, runner, local app data, and Edge profile were removed. Edge left locked `%TEMP%\qa01-registration-race-20260929\Intel` and `%TEMP%\qa01-registration-race-20260929b\Intel` cache directories only; no database or service remains.
