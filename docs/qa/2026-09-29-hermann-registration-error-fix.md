# UX-REG-03 / UX-REG-04 registration error QA (2026-09-29)

## Target and scope

- **Target:** `updater-vnext`, branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`; shared working tree has unrelated uncommitted edits. No product files were edited by this tester.
- **Assignment:** rendered acceptance for UX-REG-03 (invalid/expired/used invitation errors) and UX-REG-04 (duplicate username errors), expanded by the primary to malformed username, reserved `anonymous-` username, and short-password errors. Verify EN/ZH messages, locale switching, retained fields/focus, generic failure response with no SQL details, and failed-duplicate invitation retry.
- **Intended target:** disposable same-origin app/API at `http://127.0.0.1:8789`, isolated SQLite under `output/playwright/hermann-registration-error-fix-20260929/disposable.sqlite`. Live `8788` and production were not accessed.
- **Current source identity:** `apps/api/server.js` SHA-256 `C12BC091897669D15A702D30089360A50E68D94C2751D60BF171DF92B606ED3D`; `apps/web/app.js` SHA-256 `6A4B6C125763569AAE68CFBCAFF4197E5EF335F2297C0372E5469EF3A0931FDE`. While the disposable service was available, `/health` returned HTTP 200 and `/app.js` decoded to the same SHA-256 as current `apps/web/app.js`; `/api/auth/me` returned `{"user":null,"csrf":null}`. The service was stopped after the browser attempts.

## Environment and browser preflight

- Windows PowerShell; Node.js `v24.14.0`; disposable service started from `node apps/api/server.js` with `ADAS_DB_PATH` pointing to the isolated fixture and `ADAS_VNEXT_PORT=8789`.
- Requested browser: headed Microsoft Edge `154.0.4258.37`.
- Required Playwright CLI preflight attempted twice: `npx --yes --package @playwright/cli playwright-cli --help`; each attempt produced no output within the 30-second command bound, and no CLI session was available.
- Bounded automation fallback: direct Edge DevTools Protocol with unique profile(s) under this workspace output folder and a fresh debug port. `/json/version` briefly returned `Edg/154.0.4258.37` on the first startup, but a controllable page target was not established. On a fresh profile Edge logged `FATAL:content/browser/gpu/gpu_data_manager_impl_private.cc:436: GPU process isn't usable. Goodbye.` A final bounded retry with `--disable-gpu --disable-features=VizDisplayCompositor` produced the same fatal GPU startup error and no debug endpoint within the timeout. Logs also reported OS encryption and profile-cache access failures.
- **Rendered target application preflight: BLOCKED.** No DOM, screenshot, rendered interaction, browser viewport measurement, keyboard/focus state, or accessibility tree was controllably inspected. Do not count the brief DevTools version response as proof that the application rendered.
- The source/API results below do not substitute for the blocked browser checks.

## Acceptance criteria and results

| Check | Expected | Actual | Status |
|---|---|---|---|
| Invalid invitation | Clear, localized message; no database detail | Isolated API integration assertions return HTTP 400 and `invalid_invitation_code`; browser copy/state unobserved | **Partial: API PASS / rendered BLOCKED** |
| Expired invitation | Same safe invalid-invitation error | Updated isolated API test seeds an invitation expired by 60 seconds and asserts HTTP 400 with `invalid_invitation_code`; browser path not run | **PASS (API integration) / rendered BLOCKED** |
| Already-used invitation | Same safe invalid-invitation error | Updated isolated API test seeds an invitation with `used_at` and asserts HTTP 400 with `invalid_invitation_code`; browser path not run | **PASS (API integration) / rendered BLOCKED** |
| Duplicate username, EN and ZH | Localized message, values retained, expected focus | API returns HTTP 400 `username_taken`; no browser language-switch, retained-field, or focus observation | **API PASS / rendered BLOCKED** |
| Malformed username | Localized safe error | API test returns HTTP 400 `invalid_username`; no rendered/language-switch check | **API PASS / rendered BLOCKED** |
| Reserved `anonymous-` username | Localized safe error | API test returns HTTP 400 `reserved_username`; no rendered/language-switch check | **API PASS / rendered BLOCKED** |
| Short password | Localized safe error | API test returns HTTP 400 `invalid_password`; normal browser form path remains unverified | **API PASS / rendered BLOCKED** |
| Locale switch updates visible error | Existing error changes language without clearing fields | Source contains EN/ZH copy and `data-error-key` re-render handling; no rendered interaction possible | **BLOCKED** |
| Error preserves form values and usable focus | Username/password/invite remain; visible keyboard focus is sensible after server error | Source handler does not reset on failure and focuses submit when the form is visible; no rendered confirmation | **BLOCKED** |
| Duplicate attempt does not consume invitation | Same valid code registers successfully after duplicate failure | Isolated integration test confirms duplicate gives HTTP 400 and retry with same invitation returns HTTP 201 | **PASS (API integration)** |
| No SQL/database detail in error responses | Public response remains generic | Integration test forces an unexpected registration DB failure and asserts `{error: "Registration could not be completed.", code: "registration_failed"}`; semantic validation errors return documented codes/messages | **PASS (API integration)** |

## Commands and evidence

- `node --test test/feedback-api.test.js` — **PASS**, 1 test, 1 pass, 0 fail. The test provisions a temporary SQLite database and server, covers reserved/malformed username, short password, invalid invite, duplicate-name failure followed by success using the same invitation, and a forced unexpected DB failure with generic response; its teardown removes the disposable service/database.
- After the expired/used fixtures were added, reran `node --test test/feedback-api.test.js` — **PASS**, 1 test, 1 pass, 0 fail. It separately checks unknown, expired, and previously used invitations return HTTP 400 with `invalid_invitation_code`.
- `npm test` — **PASS**, 67 tests, 67 pass, 0 fail.
- `git diff --check -- apps/api/auth.js apps/api/server.js apps/web/app.js test/feedback-api.test.js docs/qa/2026-09-29-hermann-registration-error-fix.md` — **PASS**.
- Source inspection confirmed `apps/api/server.js` maps the registration codes, and `apps/web/app.js` has EN and ZH message keys plus the error-key rerender path.
- During the isolated server session, `GET /health` returned `200 {"ok":true,"service":"adas-vnext"}`; served `app.js` matched the current file hash exactly. No UI submit or test account was created by this session.
- Playwright/Edge startup logs are in `output/playwright/hermann-registration-error-fix-20260929/edge-attempt-2.stderr.log` and `edge-software.stderr.log` (under the assigned disposable output location).

## Tester finding for primary

**Short-password disposition: source-path review addressed; rendered behavior remains unverified.** The primary confirmed that `apps/web/app.js` has a document-level `invalid` handler which uses `validationMessage()` and the selected EN/ZH `validationTooShort` text for `validity.tooShort`, sets custom validity and `aria-invalid`, and renders a `role="alert"` message. Thus the normal browser form path uses localized client-side validation before submit; the API `invalid_password` mapping is for direct/bypassed API requests. This resolves my source-based concern; no requirements decision is pending from this finding. Edge could not be controlled to verify the displayed copy, locale change, field/focus behavior, or accessible announcement.

## Cleanup and limitations

- Stopped the isolated `8789` service and browser processes launched for this session. Removed the disposable database, invitation-code fixture, and Edge profiles after the browser attempts. Retained only startup logs under `output/playwright/hermann-registration-error-fix-20260929/`. The separate service on port `8788` was neither queried nor changed.
- **Known status:** The remaining gate for UX-REG-03 and UX-REG-04 is **rendered/customer acceptance**: this run could not control a headed browser to verify the current localized messages, locale switch, field retention, focus, or accessible announcement. Current API integration passes for unknown, expired, and previously used invitation codes, duplicate-name failure followed by successful retry, and generic unexpected database errors. No separate API-state gap remains for these invitation cases. This note does not certify the UI fix or close backlog issues.
