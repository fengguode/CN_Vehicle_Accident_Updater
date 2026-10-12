# FEEDBACK-PRIVACY-DRAFT-01 — independent regression test plan

**Status:** Executed by Hermann in headed Edge 154; see [final identity regression QA](2026-09-30-hermann-member-feedback-draft-identity-regression.md). Natural tab-hide `document.hidden` behavior remains unverified.  
**Owner:** Hermann, User Tester.  
**Target:** `updater-vnext` isolated service and disposable database, two synthetic members, fresh headed Edge profile. Live ports 8788/8793 and real data are excluded.

## Preflight

- Verify isolated service health and same-origin UI/API access.
- Verify `GET /feedback-drafts.js` returns 200 with a JavaScript MIME type; a failure blocks browser scenarios because the app imports this required module.
- Record Edge version, viewport, build identity, and served/source hashes for HTML, JavaScript, CSS, and any changed assets.
- Use accounts A and B with no pre-existing feedback. Count POSTs and database records; remove synthetic service, DB, and profile after the run.

## Scenarios

| Scenario | Actions | Pass condition |
|---|---|---|
| Same-account recovery | A selects Feature and enters unique values in title, description, context; logout and log back in as A. | Exact values and type are restored in the same tab; no POST or record is created. |
| Cross-account isolation | From A's unsent draft, logout and sign in as B. | B sees blank/default fields; no A text appears in visible or hidden form DOM, status, accessibility content, or B's request list/API response. No POST occurs. |
| View navigation | A navigates Account → Reports → Account with the draft. | Draft stays available to A in that tab; no POST occurs. |
| Memory-only boundary | Inspect draft persistence and open a fresh tab/context or reload. | Draft text is absent from browser-persistent stores and server data. A fresh context/reload starts empty, consistent with the agreed contract. Existing `localStorage` preferences unrelated to draft content may remain. |
| Cross-tab visibility boundary | With A's draft visible in Tab A, switch to Tab B and change the shared session to B. Return to Tab A. Also switch away/back without changing the account. | The instant Tab A becomes hidden, A's values are saved only to A's per-tab memory and are absent from the form DOM. On return, Account-owned UI remains hidden until `/api/auth/me` resolves; then B sees only B's own draft (or blank), while same-account return restores A. |
| Cross-tab auth notification | Keep A's draft in Tab A; in Tab B log out and sign in as B (also check registration if feasible). | Content-free same-origin notification promptly locks Tab A and starts auth revalidation; notification includes no identity or draft data. Tab A shows B-owned/blank fields only after B is confirmed. |
| Identity refresh and held responses | Hold auth/list responses for A; change the shared session in another tab to B; release stale A responses in both orders. Exercise a delayed feedback response across an observed identity change. | Once B is confirmed, A's values and list are cleared. Stale responses cannot restore A's identity, draft, list, status, error, or receipt. B's view remains B-owned. |
| Same-ID held successful submit | Hold a successful submission response, sign out/back in as the same account (or change role/approval), enter a newer unsent draft, then release the response. | The submitter receives the success acknowledgement and their own request list refreshes; the newer unsent fields remain intact. A response from another account remains suppressed. |
| Identity-transition validation reset | Give A's form a custom validation error, switch to B, then inspect and validate B's blank form. | No `aria-invalid`, stale description link, custom-validity message, or generated error node from A remains. |
| Locale and accessibility | Repeat relevant screens in English and Chinese; traverse keyboard-only through form/logout/login/recovery. | Labels remain associated, focus remains visible and predictable, and no draft text is announced in live status. |

The `feedbackFormDrafts` map in `app.js` is for administrator triage editors. Tester must verify the member feedback form's actual storage path and its DOM values directly.

## Risk and coverage boundary

Same-origin cookies are shared across tabs while JavaScript memory is tab-local. The content-free auth notification locked and revalidated other tabs in the executed Edge pass. The natural visibility event did not fire in the harness, so synchronous DOM clearing on physical tab hide is not claimed as passed; visibility and periodic revalidation remain fallbacks. All other reported acceptance is limited to the exact source-matched isolated run linked above.
