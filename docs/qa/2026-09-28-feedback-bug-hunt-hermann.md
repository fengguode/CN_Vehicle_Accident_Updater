# Feedback feature bug hunt — Hermann User Tester

**Date:** 2026-09-28 (Asia/Shanghai)  
**Target:** `updater-vnext` feedback lifecycle and administrator queue.  
**Owner:** Hermann (User Tester); primary records and integrates findings.  
**Git state:** repository HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`, branch `vnext-home-hosted`, ahead 18; source and QA files remain uncommitted among pre-existing shared changes.  
**Environment:** Windows, Node.js v24.14.0; disposable SQLite database and synthetic admin/member identities in `%TEMP%`. No production service, real account, or project data was used.

## Acceptance checks and results

### Isolated API and lifecycle checks — PASS

- `node --test test/feedback-api.test.js` — 1/1 passed.
- `npm test` — 66/66 passed.
- `node --test test/web-viewport.test.js test/web-navigation.test.js` — 3/3 passed. These tests cover navigation/focus behavior, not rendered feedback UI.
- Synthetic Issue and Feature submissions returned 201 and appeared in the submitter's list.
- A second member saw none of the first member's requests.
- `Not planned` and `Duplicate` dispositions without a public rationale returned 400; each succeeded when a rationale was supplied.
- The submitter's history included public updates and excluded the private administrator note.
- Admin filtering found the duplicate request. Pagination returned 100 and 7 records with 105 seeded requests plus two new submissions.
- This session reproduced no API defect in validation, receipt, ownership/privacy, admin authorization, filtering, pagination, rationale enforcement, public/private updates, history, or duplicate-cycle handling.

### Initial browser bridge/CLI attempts — BLOCKED

- CUA inventory returned no browser and a browser request-header-policy error.
- The official Playwright CLI and headless Chromium downloaded successfully. Browser launch failed first on profile-directory creation outside the writable workspace. Redirecting daemon/profile/cache paths to `%TEMP%` avoided that denial, but the CLI daemon exited with `Session closed`; retry with installed system Chrome failed the same way.
- These initial attempts did not verify rendered behavior; the separate direct-Edge session below supplies the UI evidence.

### Cleanup

Stopped the disposable API process and removed its temporary database, scripts, and task-specific Playwright profile directories; their absence was confirmed. The downloaded CLI/browser cache remains in the user-level cache. No live service was restarted or changed.

### Edge browser tool diagnosis — bridge/CLI blocked; direct API path works

At the owner's direction, a fresh Edge path was tested. The installed Edge executable started, but the browser connector enumerated only a Chrome extension session. Edge was unavailable to `cua.createBrowserTab("edge", ...)`; Chrome tab listing continued to fail while loading browser request-header policy. Resetting the CUA REPL did not change that result.

The official CLI accepts `--browser msedge` and `browser.isolated=true`; `PWTEST_DAEMON_SESSION_DIR` and `LOCALAPPDATA` can direct daemon/cache state to `%TEMP%`. A non-isolated Edge launch failed with Chromium ProcessSingleton exit code 21 (“Browser is already in use” for its unique temp profile). The isolated launch removed that profile collision but the CLI daemon still exited with `Session closed`; its temp error log was empty, and no CLI daemon remained. The system Edge process predated the failed isolated attempt. No controllable session was established through the CUA bridge or CLI; the later direct Playwright API path did work. The user's normal profile was not touched.

These bridge/CLI errors are tool-path failures, not product findings. The successful direct Edge checks are recorded separately below and in the linked Edge session note.

### Direct Edge UI run and FEEDBACK-05

Primary verified a direct Playwright API fallback using the installed Playwright library with `chromium.launchPersistentContext(..., {channel:'msedge', headless:false})`, a unique `%TEMP%` profile, and a local data-page smoke URL. Edge returned the expected URL, document title, and page text; the context/profile were closed and removed. This proves a controllable Edge path exists, but by itself is not feedback UI acceptance.

Hermann rendered the isolated feedback app in Edge. Request submission, requester isolation, admin queue/triage, native rationale validation, and 390px/752px/1280px renders succeeded without horizontal overflow. A fixture-count setup mistake (the 105 pagination seeds were initially assigned to the member instead of the synthetic admin) made the first own-list count wrong; the corrected run reassigned seeds and verified 0 requests before submission and exactly 2 after.

**Finding FEEDBACK-05:** Keyboard Tab then Enter on **Load older requests** appended the second page and focused `#feedback-admin-status`, but that live region was empty, so completion was not announced. The primary added localized `feedbackMoreLoaded`/`feedbackNoMore` messages in `apps/web/app.js`. `npm test` passed 66/66, `node --check apps/web/app.js` passed, and `git diff --check` exited 0. Dennis independently reviewed the page-one empty/populated states, later-page announcements, empty later page, localization lookup, and triage success-message precedence; no actionable finding.

**Corrected Edge regression — PASS:** Hermann reran with the 105 pagination seeds owned by the synthetic admin. The member's list started empty, then showed exactly the two submitted requests; another member remained isolated. The 100+7 queue/paging flow passed. At 390px, 752px, and 1280px there was no horizontal overflow; at 390px the two-column navigation displayed all four links. After keyboard Tab→Enter on **Load older requests**, 107 cards appeared, the load-more button hid, focus moved to `feedback-admin-status`, and its status text passed in English (`Older requests loaded.`) and Chinese (`已加载更早的请求。`). The page otherwise had no browser errors. A separate navigation-button subassertion was invalid because the harness queried the button as a container; viewport and link visibility checks passed independently.

The corrected full script later timed out in an additional triage step because its fixture API lookup used the wrong route shape. Baseline Edge triage already exercised valid disposition updates, public/private separation, and native rationale validation successfully, and the isolated API suite covers the same contract; however, post-fix triage was not fully re-run in that script. A separate exact-100-row Edge run then verified the exhausted-page status (`No older requests remain.` / `没有更早的请求了。`) with focus and button state. See [Edge lifecycle QA](2026-09-28-feedback-lifecycle-edge.md).

**FEEDBACK-06 responsive follow-up — PASS:** After Dennis identified the untested 421–720px label-wrap interval and the primary extended the two-column rule through 720px, Hermann verified 421/500/720/721px in Edge. All four destinations remained visible/readable, document/body width matched each viewport, and Tab reached each item with a visible focus outline. Dennis re-reviewed the final rule and closed the finding. See [FEEDBACK-06 result JSON](../output/playwright/feedback-edge-full-20260928/feedback06-responsive-nav.json).

## Finding and handoff

No isolated API defect reproduced. The direct Edge sessions found and closed two UI findings: FEEDBACK-05 (empty pagination live-region announcement) and FEEDBACK-06 (mid-word navigation wrapping at 421–720px). Both fixes passed the English/Chinese pagination, keyboard/focus, boundary-width, overflow, and navigation checks; Dennis closed the code/CSS reviews. `FEEDBACK-04` remains open for broader untested Back/Forward, interrupted-submit recovery, malformed direct API input, concurrent triage, and a post-fix full triage rerun after the harness lookup error. `UI-ACCEPT-06` and `FEEDBACK-05`/`FEEDBACK-06` are complete. All disposable services and databases were stopped or removed; four locked, task-specific Edge `Intel` cache directories remain under `%TEMP%` after a primary cleanup retry returned access denied. The separate live-service diagnosis found that port 8788 still runs a server process started before feedback routes were added; source/API tests alone cannot activate that code. Keep `LIVE-FEEDBACK-01` open through owner-authorized activation and fresh authenticated end-to-end verification. `RETRO-LESSONS-01` is recorded in [lessons-learned QA](2026-09-28-retro-lessons-learned.md).

This evidence is the input to `RETRO-LESSONS-01`: improve tool-prerequisite checks and fallbacks, distinguish isolated source verification from running-service readiness, and require explicit evidence at UI/release handoff.
