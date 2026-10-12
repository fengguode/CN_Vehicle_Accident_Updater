# Hermann feedback triage disposition QA — 2026-09-29

## Scope and acceptance

Exercise administrator feedback triage for `Not planned` and `Duplicate` dispositions on a disposable service/database. Check required public reasons, malformed duplicate links and recovery, member visibility of public updates versus private notes after reload, and responsive rendering where practical. Do not authenticate or write against live port 8788.

Expected: a disposition without its required public explanation is blocked by native form validation; malformed backlog/duplicate references return a visible recoverable error without losing the draft; self/cyclic duplicate links are rejected; successful public updates appear in the submitter's Account list while private notes remain administrator-only.

## Environment and build

- Variant: `updater-vnext`; target commit `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`, branch `vnext-home-hosted`.
- Runtime: isolated same-origin service `http://127.0.0.1:58944`, synthetic SQLite fixture with one synthetic administrator, one synthetic approved member, and two synthetic Issue requests. `/health` returned 200; `/api/auth/me` was user-null before browser sign-in. Live 8788 was not accessed for authentication or writes.
- Browser: Microsoft Edge 154.0.4258.37, headed, direct cached `playwright-core` through Node.js v24.14.0. Fresh disposable profiles. Preflight rendered the expected app at 1280×800; final member privacy check was at 390×844.
- Source advanced during the run. Initial checkout/served page was app.js `AAE23B6A90DD7DF84354990CF6F9EB4B7D1476C10A019FDC7987E325AD5FB7E2`, styles.css `D761134A7738B6D6620074CC39C516DC0FE6D4B82134D6397514DEA02FE2A380`. Current rendered checks were repeated after source advanced; final source and served hashes matched exactly:
  - app.js `9F56A4081A8D3F6369B52D1805D8960EF6D86BBAB2B9A21CD94E697654ADFC1F`
  - styles.css `CDE5D66726DDFA3F7C8EC20FCB195ABE80589C8EA580D70EF2A7F8764D8C9583`
  - server.js `7485771FC8A5C7B8EA9ECF9A1E5204B086ABAE694A2F6DAA41CC17DD621B0949`
  - auth.js `EEBC14D0AA5E85420AF365883EF8E120722A1605A7594430C94550DB24105D1C`
  - feedback-repository.js `0183F9FB4EEF62090CD1AE1F93E1CAB099DC15952D43AE910E2E8760A5FFE499`

## Results

| Scenario | Result | Evidence |
| --- | --- | --- |
| Rendered preflight and source/served identity | Pass | Same-origin `/app.js` and `/styles.css` returned 200. Final member run hashed the served bytes and current files; both pairs matched. |
| `Not planned` without a public reason | Pass | Current-source admin UI exposed `required=true`; Save was blocked with no PATCH, focus stayed on the public-update field, and the browser supplied a native required-field message. |
| `Not planned` with public reason | Pass | Current-source save completed and the refreshed admin status announced “Request status updated.” |
| Duplicate self-link | Pass | Current-source PATCH returned 400 `Invalid duplicate request ID.` The form retained the duplicate ID and public reason, and focus returned to Save. |
| Duplicate cycle | Pass | Current-source attempt to add the reverse link returned 400 `Duplicate links cannot form a cycle.` Existing request A already linked to B, so the attempted B→A link was a true cycle candidate. |
| Member visibility and privacy after reload | Pass | At 390×844, `/api/feedback/mine` returned 200. The member saw both public updates and statuses (`Duplicate`, `Not planned`); none of the synthetic private-note sentinels appeared. Feedback admin navigation was hidden. |
| Current narrow admin queue/editor geometry | Pass | On current 9F56/CDE5 source, at 320×800 document/body widths were 305/305; card 250/248 and editor 223/223 client/scroll widths. At 390×844 document/body widths were 375/375; card 320/318 and editor 293/293. Every visible control's right edge remained within the document client width. |
| Current keyboard traversal | Pass | With the editor open, Tab from its disclosure summary focused the Status select at both widths; `:focus-visible` was true with a 3px blue outline. At 390px, Shift+Tab returned to the summary, and Tab returned to Status. |
| Invalid canonical backlog ID and recovery | Pass | On current source, keyboard-submitted `Added to backlog` with `QA-NO-SUCH-ITEM` returned HTTP 400 and the inline canonical-backlog error. Status/reason/private note/ID remained in the form, the request badge remained `Submitted`, and focus returned to Save. Replacing the ID with existing `RELMGR-01` then returned HTTP 200; the card showed `Added to backlog` and a success announcement. |
| Page errors | Pass | No browser page errors were captured in the current-source admin layout/backlog run or final member privacy run. |

The first run was interrupted by a strict-mode Account locator ambiguity, followed by a missing profile environment variable. A later current-source runner also encountered a stale disclosure locator after the list rerendered. These were harness issues; corrected current-source paths completed the member privacy check, admin responsive layout/keyboard pass, and invalid-backlog recovery. The current-source invalid backlog case below supersedes the earlier initial-bundle screenshot. No reproducible product defect was found in the exercised cases.

## Current-source narrow layout and backlog-ID continuation

- Build/target: app.js `9F56A4081A8D3F6369B52D1805D8960EF6D86BBAB2B9A21CD94E697654ADFC1F`, styles.css `CDE5D66726DDFA3F7C8EC20FCB195ABE80589C8EA580D70EF2A7F8764D8C9583`; served bytes matched both source files before interaction. API server.js/auth.js/feedback-repository.js matched the hashes recorded above.
- Runtime: fresh isolated same-origin service on port 58945, one synthetic admin, one synthetic approved member, and one synthetic Issue seeded into a new disposable SQLite DB. `/health` returned 200 and `/api/auth/me` was user-null before browser sign-in.
- Browser: headed Edge 154.0.4258.37 via cached `playwright-core` on Node.js v24.14.0. Viewports 320×800 and 390×844.
- UI: both widths rendered the Feedback card, disclosure, editor, and all controls inside the document client width. No document/body or nested card/editor horizontal overflow. Keyboard traversal focused Status with a visible 3px blue ring at both sizes.
- Invalid ID: set status `Added to backlog`, entered `QA-NO-SUCH-ITEM`, added synthetic public/private text, then Tabbed through duplicate target to Save and pressed Enter. PATCH returned 400 `Backlog ID does not exist in the canonical project backlog.`; inline error was visible, all draft fields remained, header status stayed `Submitted`, and Save held focus. Correcting the ID to existing `RELMGR-01` returned 200 and rendered the accepted status/success announcement.
- No page errors. The exact synthetic DB/profile directory and Node listener were removed; port 58945 had no listener and `/health` was unreachable after cleanup. Live 8788 remained untouched.

## Evidence and cleanup

Screenshots are in [`output/playwright/feedback-triage-disposition-aae-20260929/`](../../output/playwright/feedback-triage-disposition-aae-20260929/) and [`output/playwright/feedback-triage-followup-20260929/`](../../output/playwright/feedback-triage-followup-20260929/). Current-source captures include the latest Not planned/member privacy images and the admin editor at 320×800/390×844, keyboard focus at both widths, and invalid-backlog recovery. The initial-bundle screenshots remain for history and are not labeled as current-source results.

The exact synthetic fixture/profile directory under `%LOCALAPPDATA%\Temp\hermann-feedback-triage-edge-aae-20260929` was removed. Isolated PID 67852 was stopped; port 58944 had no listener and its health route timed out afterward. No application source was edited by this QA pass. The repository was already broadly dirty with shared work; this QA note and backlog update remain uncommitted. No commit or push was made. `git diff --check` was run after recording and its result is reported in the handoff.
