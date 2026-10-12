# Registration error current-source audit — 2026-09-29

## Scope

Dennis performed a read-only audit of the current `updater-vnext` registration flow after a release review identified older browser reports that still showed raw SQLite errors and untranslated invitation errors. Current files inspected: `apps/web/app.js`, `apps/api/server.js`, `apps/api/auth.js`, and `test/feedback-api.test.js`.

## Findings

- **UX-REG-03 remains a current client defect.** API returns stable `code` plus English `error` for `invalid_invitation_code` and `username_taken` (`apps/api/server.js`, registration route). `authRequest()` in `apps/web/app.js` currently copies `result.error` into `error.code`, discarding `result.code`. The submit handler looks up localized messages by `error.code`; the lookup misses and falls back to English server text. Correct client parsing to prefer `result.code`.
- **Duplicate username API normalization is implemented.** `apps/api/auth.js` rolls back and maps the `users.username` unique constraint to `username_taken`; `server.js` returns that safe message/code. `test/feedback-api.test.js` asserts the error and that the invitation remains usable. Older Edge reports showing raw SQLite detail exercised earlier bundles and do not establish behavior for the current API bundle.
- Current app source at audit time was SHA-256 `a438bd543df864f9837c06e9603ef160cecbf1135856237cc8225bbe322ecb9b`; current server source was `8a65a1d53753e721a7179fd19df430ee27116e9f2db4860075e9edb8fc0724d2`. The cited raw-SQL/untranslated QA bundles used older app hashes `9f56a408…`, `817225c7…`, and `aae23b6a…`.

## Required follow-up

Fix `authRequest()` to preserve the API code (`result.code || result.error`) and run fresh headed Edge acceptance against the exact resulting bundle for invalid invitation and duplicate username in English and Chinese, live locale switching, retained form fields, focus, generic errors, no account/session/invitation mutation on rejection, and invitation reuse after a rejected duplicate. Keep UX-REG-03/04 open until the current rendered bundle passes; API/source checks alone do not close the UI behavior.

No files were changed during Dennis's audit. This note records the defect and corrects the scope of older evidence.

## Post-fix review — 2026-09-29

Torsten changed the client error parsing to prefer `result.code` and retain `result.error` as compatibility fallback. Dennis reviewed the final `apps/web/app.js` SHA-256 `3e47741844e6329e6a089b553ccafa8a5144c7b8cda1c1ee6970757ba6367450` and `apps/web/styles.css` SHA-256 `a8b4940018d81333226db42bf7507c57af51b6cdc1e120ced4fb660a36e06423`; no actionable finding. Hermann's current-bundle headed Edge acceptance then passed in [UX-REG-03/04 QA](2026-09-29-hermann-ux-reg-03-04-current-bundle.md). Full `npm test` passed 73/73.
