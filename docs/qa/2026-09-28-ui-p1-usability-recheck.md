# QA session: UI P1 usability gate recheck

**Date:** 2026-09-28 (Asia/Shanghai)
**Target:** `updater-vnext`, current local UI served at `http://127.0.0.1:8788/`
**Revision:** Not available; `git` is not installed in this environment. No application files were changed by this session.
**Tester:** Project User Tester.

## Acceptance criteria

1. A fresh signed-out visitor can find and keyboard-reach login/account entry at desktop and 390px.
2. At 390px, brand and account/language controls fit the first row; role-dependent navigation occupies the second row, with 44px targets, visible focus, and no horizontal page overflow.
3. Report cards make lead/unverified state and source provenance clear; original source is reachable.
4. No-media reports avoid a large empty media placeholder and present useful text/provenance first.
5. Layout and copy remain usable during empty/error states. This pass is focused on the open P1 UI gate and is not a substitute for the full signed-in role and interaction matrix.

## Environment and methods

Windows PowerShell, Node.js `v24.14.0`, npm `11.9.0`. The local service returned HTTP 200. Read-only HTTP fetched `/`, `/styles.css`, and `/app.js`; no form was submitted and no account or report data was changed. `cua.getState()` reported no apps or browsers; `cua.listBrowsers()` returned an empty list; `cua.createBrowserTab('iab', ...)` reported that IAB is unavailable. Playwright CLI was attempted with `npm exec --yes --package=@playwright/cli -- playwright-cli --session ctim-p1-readonly-20260928 open http://127.0.0.1:8788/` and `... snapshot`; both produced no output within the 30-second command window. `npm exec --offline --yes --package=@playwright/cli -- playwright-cli --help` returned `ENOTCACHED` for the CLI package metadata. The registered CUA browser connector also reported `No browser is available`.

## Scenario results

| Scenario | Expected | Actual/evidence | Status |
| --- | --- | --- | --- |
| Local UI endpoint responds | Page is reachable | `Invoke-WebRequest http://127.0.0.1:8788/` returned 200 and HTML app shell, title `China Traffic Incident Database`. Shell includes brand, Reports/Account navigation, Log in, and language toggle. | PASS (HTTP/shell only) |
| Desktop signed-out first viewport, keyboard focus | Login/account entry is visible and keyboard reachable | Could not render or operate a browser; CUA and Playwright unavailable. | BLOCKED |
| 390px navigation fit and no horizontal scroll | No overflow; correct two-row navigation and 44px targets | Current served CSS includes a mobile page-header grid, `.header-actions { display: contents; }`, workspace nav 2-column grid (3-column when admin visible), and 44px nav-button min-height. This is source evidence only; viewport geometry, computed layout, target width, and focus were not measurable. Prior Sep 28 browser session recorded 3px mobile nav overflow. | BLOCKED (rendered criterion); prior defect remains open |
| Source/provenance and unverified label | Lead status, source and platform are understandable; source link opens original | Current JS contains translations for the unverified lead label and “Open original source”; HTML shell confirms no report records are embedded. Signed-out service gated report content, and no browser could load it; report-card behavior was not exercised. Prior isolated browser session verified synthetic source, platform, location, unverified badge, source URL, and cause-unknown note. | BLOCKED for current rendered build; prior synthetic case passed |
| No-media empty preview hierarchy | No large empty image panel; text/provenance appears first | Current source contains a `previewUnavailable` string. No authenticated disposable dataset/browser was available to inspect rendered card geometry. Prior Sep 28 browser session measured a 196px empty-media placeholder, recorded as an open issue. | BLOCKED (rendered criterion); prior defect remains open |
| Empty/error state and retry | State is understandable, actionable, and recoverable | No UI interaction possible in this session. | BLOCKED |

## Findings and known issue disposition

- **UI P1 mobile nav overflow (known):** prior Sep 28 browser observation measured 3px overflow at 390px. This session cannot establish whether current served CSS resolves the rendered defect. Status: **confirmed previously; current regression check blocked**.
- **UI P1 empty-media panel (known):** prior Sep 28 browser observation measured a 196px placeholder. Current source contains a preview-unavailable state; card ordering/geometry could not be checked. Status: **confirmed previously; current regression check blocked**.
- No new browser defect is reported because no browser interaction occurred.
- The agreed text/provenance-first card concept requires owner approval per `docs/ROUND_TABLE_2026-09-28.md`; this session does not treat source tokens or prior design notes as approval.

## Limitations / disposition

No desktop or mobile browser was available, so the signed-out visual/keyboard check and rendered report-card checks are incomplete. No synthetic account or database was created because browser tooling was unavailable and this focused read-only assignment could not safely exercise authenticated report rendering. No application tests were run. This is a blocked recheck, not a pass and not final UI acceptance. Restore an available browser/Playwright CLI, then rerun at desktop and 390px against signed-out and disposable approved synthetic views; verify overflow via document/client widths and inspect source-first/no-media cards visually before closing the P1 gate.
