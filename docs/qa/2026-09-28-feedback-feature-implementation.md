# Feedback and feature-request implementation QA

**Date:** 2026-09-28 (Asia/Shanghai)  
**Target:** `updater-vnext`, branch `vnext-home-hosted`, current source changes uncommitted.  
**Requirements:** [Authenticated request spec](../FEATURE_FEEDBACK_SPEC_2026-09-28.md); shared backlog `FEEDBACK-01`–`FEEDBACK-04` and `FEEDBACK-TRIAGE`.  
**Environment:** Node.js local test runner, temporary SQLite fixtures. No production service, account, or database was used.

**Git evidence:** `git rev-parse HEAD` = `720278fbbcd8ddeb1f973c27ff85a230f03b9ff5`; branch is 17 commits ahead of `origin/vnext-home-hosted`, with feature and related pre-existing work uncommitted. `git diff --check` passed.

## Acceptance checks and results

- **Automated API/integration suite — PASS:** `npm test` — 66 tests passed, 0 failed. Includes authenticated submit/list, pending signed-in account behavior, owner isolation, admin-only queue/triage, CSRF denial, private-note separation, audit history, bounded filters/pagination (105 seeded records), duplicate-cycle rejection, existing canonical backlog ID validation, blank public-update preservation, and submission rate limit.
- **Syntax and patch checks — PASS:** `node --check apps/web/app.js`; `node --check apps/api/server.js`; `git diff --check`.
- **Independent browser acceptance — PASS (focused lifecycle):** Hermann used synthetic admin/member accounts and a disposable database. Blank submission was blocked and focused; a valid Feature submission announced its UUID, reset, and appeared in the own list. Admin status/priority/public update/private note saved; submitter saw the public update but not internal note; a second member saw no request and no admin Feedback navigation. Status/type filters returned the expected row. Language toggle localized cards/forms while preserving unsaved triage fields. At 1280×800 and 390×844, no horizontal document overflow; the form, card, filters, and Save control fit. Browser pagination and the latest server-side Not planned/Duplicate rationale validation were not exercised in this session; API regression tests cover pagination and rationale validation. Tester stopped owned service/browser processes, confirmed test port clear, and removed disposable data.
- **Requirements policy — PARTIAL:** Owner confirmed submitter-and-admin visibility. Pending-account eligibility follows the literal logged-in requirement as a release assumption. Triage cadence, lifecycle transitions, edit/withdraw and retention policy remain open; therefore FEEDBACK-01 and FEEDBACK-TRIAGE remain open.

## Findings fixed during this QA

- Admin queue filters and load-more controls were initially unwired; added localized options, filter reloads, and 100-record offset pagination.
- A blank public-update field could overwrite the current update; triage now omits blank updates and the API preserves the existing text.
- Duplicate references could form cycles; API validation now rejects them, with regression coverage.
- Backlog references now must match an ID in the canonical `docs/PROJECT_BACKLOG.md`.
- Changing language previously left feedback cards in the old language; active feedback lists re-render while admin form drafts are preserved.
- Review required a public rationale for `Not planned` and `Duplicate`; API now validates it, and UI asks for a rationale when changing to either disposition.
- The first full-suite rerun failed because the extra duplicate fixture caused the rate-limit test to exceed its allowance early. The fixture now explicitly verifies the tenth submission succeeds and the next is rate limited; rerun passed 66/66.

## Independent review and limits

Independent reviewer checked pagination/filter wiring and found/followed the language re-render issue; Hermann verified its correction and draft preservation. Dennis's final source review of non-destructive updates, backlog ID validation, duplicate-cycle/rationale checks, and draft restoration found no actionable defects. `Added to backlog` does not write Markdown: the triage workflow must still add the canonical item with its owner, priority, dependencies, acceptance evidence, source-request backlink, and Git state. A status-transition matrix, triage cadence adoption, retention promise, and production restart have not been tested or approved.

**Browser follow-up, 2026-09-28:** The terminal Playwright wrapper still cannot start here (`bash` is unavailable), but the connected Codex in-app browser successfully exercised this feature against a fresh isolated service/database. With 105 seeded requests, the admin queue rendered 100 rows, keyboard Tab reached **Load older requests**, and Enter appended the final five. The button disappeared at the end of the data; focus moved to the admin status region. Changing the first request to `Not planned` and activating Save with an empty public update was stopped by native required-field validation, which focused the public-update textarea. A read-only database check confirmed that request remained `Submitted`, so the invalid form did not send a triage change.

That populated queue originally showed horizontal overflow at the browser's 752px viewport. Primary moved the compact header/navigation layout breakpoint from 720px to 860px. After reloading the changed stylesheet, the same 752px page showed the full four-item navigation and populated queue without a horizontal scrollbar; the queue remained vertically scrollable. This follow-up is recorded in [responsive feedback queue QA](2026-09-28-ui-accept-06-responsive-feedback-navigation.md). Earlier 1280px and 390px feature checks remain the evidence at those widths; they were not repeated after this CSS-only breakpoint change. Independent User Tester confirmation and Dennis source review are pending.

