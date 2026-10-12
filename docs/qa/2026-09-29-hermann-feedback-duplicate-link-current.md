# Hermann current-source Duplicate feedback link QA — 2026-09-29

## Setup

Fresh isolated service and SQLite database with synthetic member/admin Feature requests. Headed Microsoft Edge 154 via Playwright, 390×844. All six UI assets matched current source (app.js `a438bd54…`, CSS `6e447438…`). Port 8788 remained separate and was not used for authenticated actions.

## Admin Duplicate workflow

- Admin selected `Duplicate`. The public-update field became required; attempting submit with it empty triggered native validation and sent no PATCH.
- With a generic public explanation but no primary ID, the API returned 400 `Link a primary request before marking this request as a duplicate.`
- Admin linked the member request to the synthetic admin request ID; PATCH returned 200, and admin history/queue recorded Duplicate.
- Member endpoint returned the correct `duplicate_of` primary ID. After re-login, the rendered member card displayed the Duplicate status and generic public update but displayed neither the primary ID nor primary request title. The finding reproduced without putting the title/ID in the public update, avoiding a false pass from narrative text.
- Completion preserved event history; private notes remained unavailable to the member API/UI. Zero page errors. Isolated service/database/profile removed; live port 8788 untouched.

## Finding

Confirmed P2 `FEEDBACK-DUPLICATE-LINK-01`: request tracking requires duplicate requests to link to a primary request ([feature spec, Record history](../FEATURE_FEEDBACK_SPEC_2026-09-28.md)). Although `duplicate_of` is stored and returned by the submitter API, the rendered submitter card does not display the linked request identity. With a generic update, the submitter cannot tell which request this one duplicates. Fix/review remains outstanding; this QA does not imply a source fix.

See [runner and structured results/screenshots](../../output/playwright/feedback-duplicate-link-current-20260929/). A source-hash guard was refreshed after exact served/source parity detected the newer bundle; an initial harness used an unsupported locator helper and then a stale wait condition. Those were harness issues; the final isolated run passed and reproduced the UI finding.

Repository: `updater-vnext`, branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`, ahead 18. QA/backlog/results/runner are uncommitted among existing shared changes; no source edit, commit, push, or live mutation.
