# QA: VIDEO-PLAYER-01 media review API

Date: 2026-09-29  
Scope: isolated admin review API and schema migration v11. This is source/integration evidence only; no live service, live database, browser UI, or published allowlist was changed.

## Environment

- Windows workspace, Node.js test runner, project package `updater-vnext`.
- Each integration run starts a disposable child API bound to a free loopback port and a temporary SQLite database.
- Test allowlist contains only `https://video-cdn.example.test`; it is a synthetic test origin and is not configured in a live service.
- No browser rendering check applies to this backend-only slice; the admin review UI is not implemented in this assignment.

## Scenarios and results

| Scenario | Result | Evidence |
|---|---|---|
| Schema migration records version 11 and stores append-only review events | Pass | `test/media-review-api.test.js` asserts v11 and rejects event update/delete through SQLite triggers. |
| Unauthenticated and member access to the admin queue; unauthenticated/member mutation | Pass | Queue returns 401/403 and mutations return 401/403. |
| Admin mutation without CSRF | Pass | Approval request returns 403. |
| Candidate enumeration includes only explicit `video_status='present'`; does not expose raw importer JSON | Pass | Four explicit candidates are listed; unknown status is excluded and `DO_NOT_LEAK` marker is absent. |
| Arbitrary/unconfigured thumbnail origin in admin queue | Pass | URL is omitted and `thumbnail_policy_blocked` is true; approval is rejected. No fetch is performed by this API. |
| Invalid HTTPS candidate, report, and action | Pass | HTTP thumbnail approval, malformed id, non-video report, and invalid action are rejected. |
| Explicit approval and exact-origin public exposure | Pass | Admin approval records actor/time/state; reports API exposes the URL only under matching configured origin. |
| Rejection and removal | Pass | Rejection suppresses public URL; removal clears stored URL and marks rejected. |
| Audit data and privacy | Pass | Event captures action, actor ID, timestamp, old/new state; raw data is not returned. |
| Focused integration test | Pass | `node --test test/media-review-api.test.js`: 1/1. |
| Full project automated suite | Pass | `npm test`: 73/73. |
| Scoped whitespace check | Pass | `git diff --check -- src/db.js apps/api/server.js apps/api/media-review-repository.js test/media-review-api.test.js`; only CRLF normalization notices. |

## Findings and limitations

- The admin review endpoint never retrieves remote images; it withholds candidate URLs outside the exact HTTPS origin allowlist and rejects approval for those candidates. The UI should clearly explain this policy-blocked state and disable approval.
- No production origin was added. Public exposure still requires both explicit approval and the report repository's existing exact-origin gate.
- Safe host policy selection and image content/non-graphic review procedure remain outstanding. The admin review UI and rendered browser evidence are recorded separately in [media-review UI QA](2026-09-29-video-media-review-ui.md).
- No service was restarted and no production data was accessed or altered.
