# Registration error handling fix — primary QA

**Date:** 2026-09-29 (Asia/Shanghai)  
**Target:** `updater-vnext`; current shared worktree based on `vnext-home-hosted` / `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`; dirty shared worktree, no commit or push.  
**Scope:** UX-REG-03 and UX-REG-04, plus adjacent malformed/reserved username and password validation errors reported by independent code review.  
**Status:** Source/API verification passed; required rendered Edge acceptance is blocked by browser startup/tooling in this environment. UX-REG-03/04 remain blocked/open in the backlog.

## Acceptance checks defined before implementation

1. Invalid, expired, used, or too-short invitation values return a stable invitation error code, preserve registration inputs and focus behavior, and display localized English/Chinese guidance.
2. Duplicate usernames return a stable duplicate code without exposing SQLite details, consuming the valid invitation, or creating a session/account; the same invitation can then register a different username.
3. Malformed/reserved usernames and out-of-range passwords return distinct stable codes with localized text that refreshes when the language changes.
4. An unexpected database failure returns a generic response and does not expose its SQL message; the registration transaction rolls back and leaves its invitation reusable.
5. Run syntax checks, focused isolated API integration checks, the repository regression suite, scoped diff validation, independent source review, and current-source headed browser acceptance on a disposable service/database. Do not touch live 8788 or production accounts/data.

## Implementation and evidence

- API registration errors now return stable codes for invalid invitation, duplicate username, invalid username, reserved username, and invalid password. Duplicate SQLite username constraints are normalized at the registration boundary. Unexpected registration failures return HTTP 500 with a generic response and no DB text.
- Browser maps codes to English/Chinese copy and stores the localization key so a language switch refreshes the existing error. The invite remains server-authoritative.
- `node --check apps/web/app.js`, `node --check apps/api/auth.js`, `node --check apps/api/server.js`: passed.
- `node --test test/feedback-api.test.js`: passed (1/1 API integration test), including nonexistent, expired, and previously used invitations; duplicate username; malformed/reserved username; short password; synthetic private DB trigger; invitation-preserving recovery after duplicate and DB failure.
- `npm test`: passed (67/67) after all code and fixture changes.
- `git diff --check -- apps/api/auth.js apps/api/server.js apps/web/app.js test/feedback-api.test.js`: passed; Git printed line-ending normalization warnings for existing CRLF-managed files.
- Dennis's initial source review found a remaining unlocalized invalid-registration case; the primary added distinct codes and localization. His focused re-review found no remaining actionable issue. Review scope covered the route, transaction, client localization state, and API-test coverage; rendered behavior remains delegated to Hermann.
- Hermann confirmed the isolated server health and served `app.js` parity, then exhausted the bounded headed-browser attempts: Playwright CLI returned no output within two 30-second attempts; Edge 154 DevTools startup failed with a fatal GPU-process error even after the no-GPU retry; CUA enumeration returned a browser request-header policy error. No page was controllable, so locale switching, field retention, focus and rendered messages remain unverified. See [Hermann browser QA](2026-09-29-hermann-registration-error-fix.md). Live port 8788 was untouched and isolated service/profile/database were stopped/cleaned.
- **Short-password disposition:** the UI's existing document-level `invalid` handler calls `validationMessage()`, which maps `validity.tooShort` to the English/Chinese `validationTooShort` key and renders an associated `role=alert` error before submit. The `invalid_password` API code therefore covers direct/bypassing requests; native interactive validation is already localized in source. Rendered confirmation is still blocked with the rest of the browser acceptance.

## Changed files in this task

- `apps/api/auth.js`
- `apps/api/server.js`
- `apps/web/app.js`
- `test/feedback-api.test.js`
- This QA record. The repository already contained broader shared modifications in these files; no unrelated edits were reverted.

## Remaining verification

Confirm latest-source asset parity and rendered English/Chinese errors, live locale switching, retained form values and focus, duplicate/invalid-invite behavior, invitation reuse after failures, and absence of SQL text in the UI/API. Browser version, automation path, viewport, screenshots/results, service/database identity, and cleanup will be recorded by Hermann. This change cannot be marked complete until that pass and Dennis's final review are reconciled.
