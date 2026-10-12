# Primary isolated member and admin browser QA

**Date:** 2026-09-29 (Asia/Shanghai)
**Target:** isolated `updater-vnext` service at `http://127.0.0.1:8794/`
**Source snapshot:** branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`; served `/app.js` matched local `apps/web/app.js` byte-for-byte during prior localhost preflight. The working tree has pre-existing uncommitted application changes; this QA pass made none.
**Runtime and data:** service PID 31740 (`node`), launched by the primary agent with `ADAS_VNEXT_PORT=8794` and `ADAS_DB_PATH=C:\Users\guofe\AppData\Local\Temp\ctim-hermann-browserqa-20260929-04\qa.sqlite`. It contained only the synthetic admin/member invitation and one synthetic unverified report. `GET /health` returned `adas-vnext`; `GET /` returned HTTP 200; initial `GET /api/auth/me` returned user null and `GET /api/reports` returned 401. No user data from 8788 was read or copied.
**Browser:** Codex In-app Browser with accessibility tree/Playwright locators. Browser build and viewport were not exposed. Console inspection returned no warning/error entries during the observed run.
**Tester:** Primary CUA fallback. Hermann’s separate agent browser inventory was empty; its bounded attempts to use Playwright were unavailable due registry `EACCES`, so Hermann did not perform the interactions in this record.

## Session results

| Scenario | Expected | Actual | Result |
|---|---|---|---|
| Invitation registration | Valid invited user is created and can see approval state. | Registered synthetic `qa-member` in the browser; Account showed Member / pending and did not expose admin navigation. | Pass |
| Pending access | Pending members can use Account but cannot view reports. | Reports displayed the administrator-approval gate; the synthetic report stayed hidden. Account exposed password and feedback controls. | Pass |
| Admin approval | Administrator can approve the pending member and receive confirmation. | `qa-admin` opened User management, selected Approved for `qa-member`, saved, and saw “Changes saved.” Role and enabled state remained Member/Active. | Pass |
| Approved member access | Fresh approved-member session can access report workspace. | A fresh `qa-member` login showed Member / approved; Reports then showed the one synthetic unverified report and its provenance details. | Pass |
| Report search recovery | No-match search gives an understandable state; Reset restores results. | `no-such-qa-report` showed “No reports match these filters” and 0 reports; visible Reset filters restored the 1 synthetic report. | Pass |
| Pending member feedback | An active pending member can submit feedback as described in README. | After admin revoked approval and member re-logged in, pending `qa-member` submitted one synthetic Feature request. It appeared in member Account as Submitted. | Pass |
| Admin triage and privacy | Admin can triage pending member’s request; submitter sees public update but not private note. | Admin Feedback showed submitter `qa-member`, changed status to Under review, and saved separate public update/private note. After a same-tab logout/login as member, the request showed Under review and the public update; private note text was absent. | Pass |
| UX-STATE-01 same-tab retest | Old submit-success notice clears when identity changes, while request history remains. | Submit notice appeared immediately after the pending-member submission. After same-tab member logout, admin login/triage/logout, and member re-login, the old notice was absent; the persisted request and public status update remained visible. | Not reproduced in this run; primary review pending |
| Cross-tab account identity switch | A tab that refreshes into another account must not retain the prior account's feedback history. | Tab 5's Account view had visibly loaded the synthetic `qa-member` request. Tab 6 was already signed in as `qa-admin`; after the shared session refreshed, tab 5 displayed `Signed in as: qa-admin · Administrator` while still rendering the member's request title, description, status, and public update. Tab 6, freshly rendered as the same admin, showed “You have not submitted any requests yet.” | Reproduced; new UX-STATE-02 |

## UX-STATE-01 disposition

Current working `apps/web/app.js` contains a pre-existing dirty-tree change that clears `#feedback-message` when the rendered authenticated identity changes. The isolated same-tab regression above passed against the served UI; Dennis's source review confirms the delayed feedback POST response is generation-guarded. Keep UX-STATE-01 `In progress` until primary disposition. A separate cross-tab regression is confirmed: one tab's Account view retained `qa-member` feedback content after that tab's shared-session refresh changed its identity to `qa-admin`; a fresh admin tab showed no such content. This corresponds to UX-STATE-02 and needs a fix plus account-switch regression. Dennis's source review had identified the possibility that the Account list would neither clear nor reload on direct identity change; the browser observation confirms that concern. This session did not modify or commit application code.

## Boundaries and cleanup

All account and feedback mutations were confined to the identified synthetic database. No external source link was opened. No automated test suite was run. This pass does not cover native screen-reader operation, native zoom, physical forced-colors output, or responsive breakpoints.

Browser: Codex In-app Browser, two same-origin tabs, default viewport (dimensions/build not exposed). The isolated service and synthetic database were primary-created; account and feedback mutations stayed inside that temp database. Git snapshot: `updater-vnext`, branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`, ahead 18; shared dirty/untracked work preserved; only QA/backlog records updated; no source changes, tests, commit, or push.
