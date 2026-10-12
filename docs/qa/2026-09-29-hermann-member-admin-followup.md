# Hermann member and admin browser QA follow-up

**Date:** 2026-09-29 (Asia/Shanghai)
**Target:** isolated `updater-vnext` service at `http://127.0.0.1:8793/`
**Source:** `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`
**Data:** disposable `%TEMP%\ctim-hermann-browserqa-20260929-02\qa.sqlite`; synthetic accounts `qa-member` and `qa-admin`; one synthetic report and one synthetic feedback request. Test credentials were provided for this disposable database and are intentionally omitted here.
**Process/runtime:** PID 27304 (`node`, observed live); a direct CIM command-line read was denied by Windows. The QA setup owner identified this PID as the service using the disposable database. `GET /` returned HTTP 200 and `GET /health` returned `{"ok":true,"service":"adas-vnext"}`. The app shell and API-backed actions below succeeded on the same origin.
**Browser:** Codex In-app Browser, version not exposed by the available browser bridge; CUA accessibility tree and browser-tab interaction APIs. Fresh tab rendered the expected “China Traffic Incident Database” app. Screenshot viewport: 1265×715 CSS/device pixels as captured; a configurable mobile viewport was unavailable. No invitation token or credential is included in this record.

## Acceptance criteria

- An approved synthetic member can save and undo a report rating; visible rating totals and feedback match each action.
- A non-matching report search presents a useful empty state and can recover to the report list.
- A member can submit a synthetic feedback request; an admin can find and triage it; the member sees status and public updates while private admin notes remain hidden.
- Admin status/type filters handle empty combinations and restore the request when cleared; User management is inspectable without changing account permissions.
- Report only reproducible browser behavior, distinguish runtime evidence from source-only assumptions, and preserve all synthetic data inside the isolated database.

## Session results

| Level/scenario | Expected | Actual | Result |
|---|---|---|---|
| Runtime preflight | Fresh browser tab renders intended isolated app; service and UI origin are available. | Fresh in-app browser tab rendered the app at `127.0.0.1:8793`; `GET /` 200; `GET /health` returned `ok:true`, service `adas-vnext`. | Pass, with browser version and exact process command line unavailable. |
| Member report rating | Save one Relevant rating and show a saved acknowledgement, selected state, and incremented aggregate. | “Your rating was saved.”; checkbox value became 1; aggregate changed to 1 Relevant / 0 Not relevant and score from 50% to 63%. | Pass. |
| Member undo | Undo the synthetic rating and restore aggregate to baseline. | “Your rating was removed.”; undo control disappeared; checkbox and aggregate returned to zero and score returned to 50%. | Pass. |
| Search empty state and recovery | An unlikely query yields an understandable no-results state; reset restores the report. | `no-such-traffic-report-9f3c1e` yielded “No reports match these filters.” and `0 reports`; Reset filters restored the single report and cleared the query. | Pass. |
| Feedback submission | Valid synthetic member input gets a stable reference and member-visible status. | Submitted “Synthetic QA request 2026-09-29”; UI displayed request reference `aad7a279-4521-4266-9777-1463ffa7b4d7` and Submitted status. | Pass. |
| Admin Feedback queue and triage | Admin sees request identity, can set Under review and a public update plus private note, and gets a success state. | `qa-admin` was identified by the UI as Administrator with approved access. Feedback queue displayed the synthetic request and submitter. Saving Under review plus the public update returned “Request status updated.”; history showed status/update and the private note. | Pass. |
| Admin filters | Complete and Under review + Feature request filters show a useful empty state; clearing filters restores the matching Issue. | Complete and the combined status/type filter both showed “There are no requests to review.”; All statuses + All request types restored the synthetic Issue. | Pass. |
| Admin User management | Admin can inspect roles, approval, and active state without accidental changes. | UI listed only `qa-admin` (Administrator/Approved/Active) and `qa-member` (Member/Approved/Active), with controls visible. No save or account mutation was performed. | Pass, read-only inspection only. |
| Member-visible triage update and privacy | Submitter sees current status and public update, but not the private admin note. | After switching back to `qa-member`, Account showed Under review and “Synthetic QA triage completed; this request is test-only.” The exact private note was absent from the member view. | Pass. |
| Same-tab identity change feedback state | Transient action feedback should not mislead a later account session. | After member submitted, then logged out, admin signed in and triaged, then member signed back in without reloading, the Account page still displayed “Request submitted. Reference: #…” above the now Under review request. A full page reload cleared the stale success notice while retaining the signed-in member and report list. See UX-STATE-01. | Finding; reproducible, P3. |

## Finding UX-STATE-01 — stale submission confirmation persists through account switch

- **Status:** New; primary root-cause review needed. No source change or issue-status change made by tester.
- **Severity/impact:** P3, confusing transient feedback in an account/session transition. It can read as a fresh submission even though the item is already Under review.
- **Environment:** Source HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`; isolated service PID 27304 and disposable DB named above; Codex In-app Browser/CUA, 1265×715 capture; synthetic `qa-member` and `qa-admin` only.
- **Prerequisite/data:** A member has submitted a request in the current single-page browser tab. The synthetic request above was used.
- **Reproduction:** (1) As `qa-member`, submit a valid request. (2) Log out without reloading the page. (3) Sign in as `qa-admin` and update the request status/public update. (4) Log out, then sign back in as `qa-member` in that same tab. (5) Open Account.
- **Expected:** The member view should show the persisted current status/history without carrying a prior submit-success notice across logout and identity change.
- **Actual:** “Request submitted. Reference: #…” from the earlier member action remains visible alongside the already-updated Under review item. Reloading clears the notice, so this is transient page state rather than a stale server record.
- **Evidence:** Browser accessibility snapshots showed the notice immediately after the member's original submission, persisted after admin/member account switches, and absent after reload; member status and public update persisted across reload/login. The member view did not expose the admin-only note.
- **Affected path:** Account feedback request list and authentication/session transitions (`apps/web`); exact state ownership is not established by this browser-only check.
- **Suggested regression:** Submit as member; switch identities in one tab; assert old success notice clears after logout/account change; verify the persisted request status/public update remains visible and private note remains absent. Repeat with reload and a newly signed-in member session.

## Test boundaries and limitations

- This was rendered browser acceptance, not a source or automated unit/API test run. No application source was modified.
- Signed-out login was exercised only as the transition between member/admin sessions. Registration, unregistered-user boundary, pending account, malformed feedback input, form interruption/double-submit, keyboard-only traversal, screen reader, mobile viewport/reflow, native zoom, and physical forced-colors/device checks were not run in this continuation.
- The browser bridge did not expose a browser build/version or explicit viewport control. The screen capture measured 1265×715. Windows denied the process command-line inspection, so the precise runtime command was not independently re-read; process PID and disposable DB identity came from the QA setup owner, while the health/UI routes and synthetic data behavior were confirmed in this session.
- The synthetic feedback request remains in the disposable database at Under review so the parent QA owner can retain/reuse the evidence. The test vote was undone. The service and database were not stopped or deleted.
- No failures were attributed to the CUA harness; key actions were verified in the updated accessibility tree and, for the report view, a screenshot.

## Git and disposition

No application files changed. This note and the canonical backlog update are documentation changes in `updater-vnext`. At QA time, Git reported branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`, ahead 18 with numerous pre-existing shared modifications/untracked artifacts; no commit or push was made. `git diff --check` was not run after this note was written. QA-01 remains in progress; UX-STATE-01 is open for primary review and regression.
