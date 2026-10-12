# QA session: feedback draft privacy integration checks

**Date:** 2026-09-30 (Asia/Shanghai)  
**Scope:** Primary integration verification after the worker added static module serving and identity transition safeguards. The shared product workspace was used; no live service or account was touched.  
**Target:** `updater-vnext`, branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`.

## Acceptance checks and results

- Checked worker-reported and current source SHA-256 values for `apps/web/app.js`, `apps/api/server.js`, and `apps/web/feedback-drafts.js`; values match the hashes recorded in `docs/PROJECT_BACKLOG.md`.
- Ran `node --test test/web-feedback-drafts.test.js test/web-feedback-drafts-route.test.js`: **3/3 passed**. The route test starts an isolated local service/database, verifies same-origin `GET /feedback-drafts.js`, and checks JavaScript MIME/module export.
- Ran `npm test`: **76/76 passed**, exit 0.
- Ran `git diff --check`: passed. Git emitted only existing LF-to-CRLF working-copy warnings on shared files; no whitespace errors were reported.
- Reviewed the implementation diff and confirmed the static asset entry, validation cleanup call, content-free auth broadcast, and submission result guard are present. The app/server files contain extensive pre-existing shared changes, so this session does not attribute all hunks in those files to this fix.
- Updated the contract and Hermann's browser test plan for static module delivery, cross-tab auth notification, identity validation cleanup, and same-user-ID held submit success.

## Limitations and disposition

This note records primary source and isolated-service verification; Hermann's separate source-matched rendered-browser acceptance is now complete for the listed flows. The initial module-404 preflight remains documented at [identity regression preflight](2026-09-30-hermann-member-feedback-draft-identity-regression.md). Dennis's independent source review closed the P2 held-submit data-loss finding with no remaining code-level issue. The task remains **In progress** for only one browser scenario: natural `document.hidden`/`visibilitychange` on tab hide was not observed under Edge/Playwright. See the [final Edge session](2026-09-30-hermann-member-feedback-draft-identity-regression.md).

**Review update:** Dennis's initial review found a P2 race: an earlier successful POST could clear newer same-account text entered after reauthentication. Torsten added submitted-snapshot comparisons for the live same-account form and cached draft, plus helper regression coverage. Dennis re-reviewed the final hashes and confirmed that finding closed with no additional source-level issue. Hermann's Edge session then confirmed the held POST preserves newer same-account text and records one receipt/list row.

No commit or push. The shared working tree remains dirty with unrelated project changes; live service ports 8788 and 8793 were not touched.
