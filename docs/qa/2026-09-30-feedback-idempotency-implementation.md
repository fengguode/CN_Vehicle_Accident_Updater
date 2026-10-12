# FEEDBACK-IDEMPOTENCY-01 implementation QA — 2026-09-30

## Scope and acceptance

Prevent a feedback retry from creating a second request when the API committed the original request but the browser did not receive its response. Reuse a per-attempt key only for the same normalized payload and submitter; matching retries must return the existing receipt, different-payload key reuse must fail, another submitter must not retrieve the receipt, and a distinct key must create a new request.

## Implementation

- Client keeps an attempt UUID in memory keyed by member ID and the exact form payload. An unchanged retry reuses the UUID; edits use another UUID; a confirmed receipt clears the key.
- API normalizes input before comparing it with the stored request and scopes keys by submitter.
- SQLite migration 12 adds an additive `feedback_submission_keys` table. Request, initial event, and key mapping are committed in one `BEGIN IMMEDIATE` transaction.
- Matching replay returns the original request with HTTP 200; first creation returns HTTP 201; changed-payload reuse returns HTTP 409.
- Existing requests receive no backfill. Keys are created only for new submissions.

## Verification performed

- `node --test test/feedback-idempotency.test.js` — passed. The isolated test verifies migration, create/replay after API restart, normalized payload matching, changed-payload conflict, cross-member key isolation, concurrent replay, new-key behavior, and event/request counts. Temporary database and child API are cleaned up by the test.
- `npm test` — passed, 78/78 tests, 0 failures.
- `node --check` passed for `apps/api/feedback-repository.js`, `apps/api/server.js`, and `apps/web/app.js`.
- `git diff --check` passed; Git emitted only line-ending conversion warnings for existing shared changes.
- Dennis read-only review found no actionable issue. He noted that retry after a full page reload is not covered; attempt keys are intentionally held in volatile page memory.
- Source hashes at primary verification: `app.js` `0170CAFA7F27FA5ACDC13D760A4128353A73FD1378753BDBFDD8CA303C984675`; `server.js` `90DF0727641C196927DC958F6359B75C3EA774BCE4C45EE680CBC5C640D02A08`; `feedback-repository.js` `8542FD9D89BDB0ACA05A8D49C5856D97BBCD3B0EC9D595AE220075582E3AE9DA`; `db.js` `CDCF86285296DC4F6DE0DD4681BB53A18F28D986B79AB6F4C9ACDFB86E47FD40`.

## Still required

Hermann's source-matched headed Edge acceptance is in progress. It must inject a committed POST whose browser-facing response is 503, retry unchanged input, and verify exactly one request and receipt, matching source/served asset hashes, no browser errors, and isolated-resource cleanup. Until that passes, this backlog item remains **In progress** and the browser retry behavior is not considered accepted.

No live service, account, or database was changed. Source changes are uncommitted on `vnext-home-hosted`; no commit or push was made.
