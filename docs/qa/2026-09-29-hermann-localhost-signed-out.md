# Hermann localhost signed-out UX continuation

**Date:** 2026-09-29 (Asia/Shanghai)
**Target:** current local service at `http://127.0.0.1:8788/`
**Browser:** Codex In-app Browser, rendered screenshot 1280×720; browser version unavailable.
**Runtime evidence:** `GET /health` returned `{"ok":true,"service":"adas-vnext"}`; `GET /api/auth/me` returned `{"user":null,"csrf":null}`; `GET /api/reports` returned HTTP 401. UI title was “China Traffic Incident Database”. Listener process/database identity could not be inspected (Windows returned Access Denied for process inspection). Only signed-out, read-only browser paths were exercised; no account, registration, invitation, or database mutation was attempted.

## Results

- Signed-out Reports rendered research-lead framing and the clear rule that listings are not confirmation or evidence of vehicle-system causation. It withheld report data and offered “Sign in with an approved account to view reports.” This matched the 401 API gate.
- Account view rendered login fields. Opening invitation registration showed username, password, invitation code, Create account, and return-to-login controls. The form did not say where an unregistered person can obtain an invitation code.
- English/Chinese switching updated navigation, login/registration labels and helper text. In both rendered languages, no invitation-acquisition guidance appeared in the registration form.
- Clicking Create account with all fields blank was stopped by browser-native required-field validation; focus moved to Username and no account API call or data mutation was made.
- Navigation between Account and Reports remained available while signed out. Account focus moved to the Account heading on entry; language toggle retained usable focus.

## Finding UX-REG-01 — registration gives no path to obtain invitation

- **Status:** New; primary review needed. P3 usability/access friction.
- **Reproduction:** Open Account while signed out; choose Register with invitation; inspect the form in English or Chinese.
- **Expected:** Explain that invitations are required and how to request one from an approved account holder (or provide the intended contact path).
- **Actual:** The form presents a required-looking Invitation code field and Create account action without acquisition instructions or a way to contact an inviter. A person without an existing invitation has no next step in the UI.
- **Evidence:** Rendered AX tree and screenshot from the page; relevant Account and registration copy in `apps/web/app.js`; `README.md` says approved users can create invitations, which expire after seven days and are single-use.
- **Scope limitation:** No attempt was made to submit a fabricated/real invitation, create an account, or access authenticated routes on the unidentified existing database.

## Git and QA disposition

No application source changed. `updater-vnext`, branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`, ahead 18; this QA note and canonical backlog are uncommitted among pre-existing shared work; no commit or push.
