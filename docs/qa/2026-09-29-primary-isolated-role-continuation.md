# Isolated member/admin browser continuation

**Date:** 2026-09-29 (Asia/Shanghai)
**Target:** primary-created isolated `updater-vnext` service at `http://127.0.0.1:8794/`
**Browser:** Codex In-app Browser, two same-origin tabs. Default viewport was 1280×720; explicit report-view checks used 390×844 and 320×800. Browser build was not exposed.
**Tester:** Primary CUA fallback. Hermann's browser agent was not available for direct interaction in this environment.

## Runtime and data boundary

- Service PID 36336 was started by the primary agent from `updater-vnext/apps/api/server.js` with `ADAS_VNEXT_PORT=8794` and `ADAS_DB_PATH=C:\Users\guofe\AppData\Local\Temp\ctim-hermann-browserqa-20260929-05\qa.sqlite`.
- The database was initialized in that unique temporary directory with only a synthetic administrator and one synthetic unverified report whose source URL uses `example.invalid`. An invitation was created through the synthetic admin UI; one synthetic member and one synthetic feedback request were created in-browser. No 8788 account or data was read or modified.
- At startup, `/health` returned `{"ok":true,"service":"adas-vnext"}`, `/api/auth/me` returned user null, and the app rendered. A byte-for-byte served bundle fingerprint was not captured during this run. After the browser interactions, current local `apps/web/app.js` measured 71,016 bytes, SHA-256 `9D62378353F342C53A01798282C4B6A39AFD91751618A792247AAB4A57DA5E7C`, last written at 07:24 local time. The worktree file was modified during the broader QA window, so this local fingerprint is not proof of the exact bundle returned to the browser at the start of the session.
- The 8794 service stopped responding before planned cleanup. A later health request was connection-refused and PID 36336 was no longer present; termination cause is unknown. This is distinct from port 8788, which remained available but whose runtime/database identity is still unknown.

## Browser results

| Scenario | Observation | Result |
|---|---|---|
| Admin sign-in and invitation | Synthetic admin logged in, saw admin navigation, created a one-use synthetic invitation. | Pass |
| Invitation registration and pending state | `qa-member` registered through the invitation form, signed in as Member / pending, and received no admin navigation. | Pass |
| Pending report access | Reports displayed the approval gate; no report content was exposed while pending. | Pass |
| Pending feedback | Pending member submitted one synthetic feature request. It appeared in the member's Account list. | Pass |
| Admin user management | Admin saw both synthetic accounts, approved `qa-member`, and received “Changes saved.” | Pass |
| Approved report access | Fresh member login showed approved access and the single unverified synthetic report. Its provenance and unverified status were displayed; the `.invalid` source link was not opened. | Pass |
| Member rating and undo | First attempt returned “Invalid fingerprint or vote” because the test fixture used an invalid non-hex fingerprint. I corrected the fingerprint in the disposable database to a 64-character SHA-256 value and retried: the Relevant vote saved, the summary showed one relevant rating, and Undo vote removed it and restored zero ratings. This was a fixture correction, not a product defect. | Pass after fixture correction |
| Search recovery | An unmatched query displayed “No reports match these filters”; Reset filters restored the one synthetic report. | Pass |
| Admin feedback triage | Admin saw submitter attribution, changed the member request to Under review, and saved separate public update and private note. | Pass |
| Member feedback privacy | After a fresh member login, Account showed Under review and the public update; private admin note was absent. | Pass |
| UX-STATE-02 cross-tab history switch | Tab 9 showed the member request in Account. Tab 10 shared that member session, then signed out and signed in as admin. Without navigating tab 9, it changed to the admin identity and showed no member request. This did not reproduce in the observed browser run. The local worktree `app.js` subsequently inspected clears `#my-feedback-list` and invalidates its request on identity changes, then reloads for the new identity in Account; the relevant lines were 128–136 and 583–599. However, the served bundle was not fingerprinted, and the local source file was modified during the broader QA window, so the inspected file is not proven to be the exact browser bundle. Prior Dennis review and a separate headed Edge race test had already closed the tracked finding; this is supplemental browser evidence only. | Not reproduced in supplemental pass |
| Responsive report view | At 390×844 and 320×800, report content remained readable and `documentElement.scrollWidth` did not exceed `innerWidth` (375/390 and 320/320 respectively). | Pass for sampled widths |

## Boundaries and QA result

Only synthetic data was used. The browser did not open any external source link. No app source was changed. No automated test suite was run. The first invalid-vote response was caused by the incorrect synthetic fixture and passed after correcting that fixture. Console logs were not reviewed in this run. The final viewport override was reset before ending the browser session.

Git evidence: `updater-vnext`, branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`, ahead 18. Shared dirty/untracked changes were preserved; only backlog/QA documentation was updated; no commit or push.
