# Feedback account anonymization and report-vote deletion QA

**Date:** 2026-09-29  
**Primary:** Codex; independent reviewer: Dennis Windmaier; User Tester: Abt Hermann  
**Target:** `updater-vnext`; synthetic data only  
**Owner decision:** disabling is reversible; admins may separately and irreversibly anonymize a disabled account; feedback and audit history stay retained; report relevance votes remain until an admin separately deletes them.

## Acceptance criteria

- Admin-only, CSRF-protected actions enforce disabled-before-anonymized and anonymized-before-vote-deletion server-side.
- Anonymization revokes sessions and replaces the account identity without removing feedback rows, feedback events, or their relationships; the account cannot be restored.
- Vote deletion removes only `traffic_votes` and `traffic_rating_receipts`, refreshes community totals/relevance scores in the same transaction, and preserves feedback/audit history and legacy `review_votes`.
- Admin UI clearly separates the two irreversible operations and requires the exact typed confirmations. Render the retained feedback with anonymous attribution.
- Isolated authenticated Edge run shows no browser errors or horizontal overflow; tests and static checks pass.

## Session and results

- **Browser:** Microsoft Edge 154.0.4258.37, headed through cached direct Playwright Node API.
- **Viewport:** 1280 × 800 CSS pixels.
- **Target/service:** isolated `node apps/api/server.js` from this `updater-vnext` checkout, on disposable `127.0.0.1` port 55569 for the final run; fresh synthetic SQLite under OS temp. Port 8788 and its unknown database were not touched.
- **Source identity:** served `/app.js` SHA-256 `8bd163704700a1680158c24375dd17d5a52898b472b3d43e5f0f85e27a817384`; served `/styles.css` SHA-256 `9fc657c3bcb35626d84d012ca43a9142f84a44155755f33cf48a0f6e1a4b9d4e`; both matched workspace files byte-for-byte. Backend entrypoint is the source path `apps/api/server.js` spawned by the harness.
- **Browser outcome:** PASS. The disable/restore/anonymize/delete controls and Feedback flow were exercised at mobile 390×844; desktop 1280×800 was also checked after the mobile interaction pass. Active-account anonymize action is disabled. The UI exercised reversible disable→restore and a second disable before anonymization. Canceling or entering an incorrect username leaves identity unchanged; exact username succeeds and revokes the old session. The admin Feedback view shows the retained request/event under the anonymous label without the old username. Vote deletion appears separately; canceling or entering incorrect `DELETE VOTES` text leaves it available, while the exact phrase deletes vote/receipt rows. Both widths had no horizontal overflow or page errors.
- **API outcome:** `node --test test/feedback-api.test.js` passed. Covers CSRF/admin access, active-account denial, vote deletion before anonymization denial, disabled-only anonymization, collision-free anonymous identity and reserved namespace, retained request/event foreign keys and pre-existing auth-audit rows, old-session invalidation, rejected restoration, and audit. A seeded historical `review_votes` row remains untouched. For vote deletion, ten synthetic reports provide enough training examples: community count/label changes are asserted, an SVM model/score is rebuilt, and an injected rebuild failure proves votes, receipts, and model rows roll back together.
- **Static/package checks:** `node --check apps/api/auth.js`, `node --check apps/api/server.js`, `node --check apps/api/votes-repository.js`, `node --check apps/web/app.js`, and `git diff --check` passed. `npm test` passed 66/66. Git printed only existing LF-to-CRLF working-copy warnings.
- **Artifacts:** [`run.mjs`](../../output/playwright/user-anonymize-20260929/run.mjs), [`results.json`](../../output/playwright/user-anonymize-20260929/results.json). Browser profile and synthetic DB were removed after the run.

## Review and limits

Dennis's independent review identified a race in the disabled-account check, a possible collision with an existing `anonymous-<id>` username, and missing model/rollback assertions. The state check now runs inside `BEGIN IMMEDIATE`; generated aliases use a collision-safe suffix and new `anonymous-` usernames are reserved. The API regression asserts model/score refresh and rollback on injected failure, and seeds pre-existing audit and legacy vote records to verify retention/exclusion. Dennis confirmed the reviewed fixes. Hermann confirmed the rendered acceptance, including explicit overflow, anonymous feedback attribution/history, reversible disable/restore, and canceled/wrong confirmations. Native screen-reader, physical-device, native zoom, and forced-colors coverage are outside this focused session and remain under QA-01. No production account/service/database was changed. The wider release remains HOLD.
