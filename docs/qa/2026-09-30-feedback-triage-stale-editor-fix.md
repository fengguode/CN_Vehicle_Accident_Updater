# QA session: FEEDBACK-TRIAGE-STALE-EDITOR-01

**Date:** 2026-09-30 (Asia/Shanghai)  
**Target:** `updater-vnext`, branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`; changes remain uncommitted in the shared worktree.  
**Owner:** Primary; Dennis performed independent source review.  
**Result:** Isolated API/client tests and headed Edge acceptance pass. The initial browser run was executed by the primary while the collaboration service was at its thread limit. Hermann has since completed an independent current-hash User Tester regression; see [Hermann acceptance QA](2026-09-30-hermann-feedback-triage-stale-editor-acceptance.md) and [results/screenshots](../../output/playwright/hermann-feedback-triage-stale-editor-acceptance-20260930/).

## Acceptance

Two administrators editing one feedback request must not overwrite each other's newer data. A stale save must return 409, create no event, and return the latest admin state. The editor must preserve local edits, update its baseline/version, announce the conflict accessibly in English and Chinese, and require an explicit second save. A private-only save must not repeat an earlier public message in member history. Whitespace-only note/backlog/public-update input must not create a meaningless event or version bump.

## Implementation

- Schema migration 13 adds `triage_version` with default 1 for existing rows.
- Admin triage PATCH requires `expected_version`, compares it under `BEGIN IMMEDIATE`, and returns HTTP 409 plus the latest admin-only request on stale versions. A conflict performs no write and appends no event.
- Successful updates increment the version atomically with the request and event.
- The editor sends only fields changed from the current baseline. On conflict it overlays local edits on the returned latest state and requires a new user submission.
- The current public announcement remains on the request record, while a triage event stores only a newly supplied announcement. Private-only saves therefore do not duplicate public history.
- Notes and comma-separated backlog IDs are normalized before dirty comparison; the API also canonicalizes IDs and rejects semantic no-op updates without history/version churn. Blank public text preserves the latest announcement.

## Verification

- Focused `node --test test/feedback-api.test.js test/web-feedback-triage.test.js` — 5/5 passed. Covers stale non-overlapping update, same-field conflict and explicit retry, no write/event on conflict, normalized no-op behavior, blank announcement retention, and no duplicate member-visible update.
- Full `npm test` — 82/82 passed, 0 failures.
- `node --check` passed for API repository, server, app bundle, and triage helper. `git diff --check` passed; Git line-ending warnings reflect existing shared files.
- Dennis reviewed the version/conflict and normalization behavior; his remaining announced-history concern was addressed by storing only newly supplied text in each event. Dennis completed a fresh read-only final review on current source (`app.js` SHA-256 `3588924d1a795a45e476508caddd53338075946f22ebfad8c3745b7c45040468`; `feedback-triage.js` SHA-256 `34ad6cb8b6714cba72fe55236d82c1e7a137bb43e37872e8f03f062e2ca94312`) and found no actionable defect in versioning, conflict rebase, or announcement/no-op behavior. The existing rendered Edge run used an older app.js hash (`8acc3e…`), so current-hash rendered acceptance is still required.

## Headed Edge session

- Browser: Microsoft Edge 154.0.4258.37, headed Playwright persistent context, isolated profile.
- Viewport: 1280×900 CSS px.
- Target: isolated local service `http://127.0.0.1:58452`, synthetic member/admin and disposable SQLite database. Live 8788 and real data were not touched.
- UI and imported module assets were HTTP 200 and byte-matched the source: `index.html` `38efdd3f8c2c1b9522588accd56d3127fc3abace971542acb8e7e8fc07f24520`; `app.js` `8acc3e9b194f4dd225cff16960b4b660b285e3fb1b78ee760ae67fb5a10c74dd`; `styles.css` `a8b4940018d81333226db42bf7507c57af51b6cdc1e120ced4fb660a36e06423`; `navigation.js` `c2658b3def8edc3ef4625c40e1679e616ac16bb95b0b30e23bd98d0bf5145cd5`; `feedback-drafts.js` `789b36766bc396b5af0583544cfa82181f5be6ee5597f60aaf4f43227c13c66e`; `feedback-triage.js` `34ad6cb8b6714cba72fe55236d82c1e7a137bb43e37872e8f03f062e2ca94312`; `report-presentation.js` `dc9065adcf2eb5199a60315bc65fe76e43fb9e936172f7d06b552ea6ae5d49a0`; `viewport.js` `fef9e10e9114de24f83a0ca909b841c1b93f1a6aa84fe8dabb023235893922da`. Server source SHA-256: `403436805df855db19652f4d81b99fcfbcaf347356745ec51471c7ba8bf80be3`.
- Tab A saved Under review/high, public update, private note, and a backlog ID. Tab B's stale, non-overlapping save returned 409. Before/after SQLite snapshots were identical and event count remained unchanged; the status region received focus and announced the conflict. Tab B's private note remained editable on top of A's latest state; explicit save succeeded without rolling back A's fields.
- After reloading Tab A to the newest version, same-field public-message edits conflicted as expected. Tab B's local message stayed visible and the conflict notice focused. An explicit subsequent save committed it. No private-only event repeated the old public update.
- Zero page errors. Service stopped, disposable database and profile removed. Final machine result was `PASS`.

## App bootstrap blocker follow-up

The reported app.js startup blocker was traced to required static-module routes. Current `apps/api/server.js` explicitly serves every ES module imported by `apps/web/app.js`, including `/feedback-drafts.js` and `/feedback-triage.js`, with JavaScript MIME. Dennis's independent read-only review confirmed the route map and handler are correct. In the headed Edge run above, both helper modules and the rest of the UI assets returned HTTP 200 and byte-matched the current source; the app started and the administrator triage flow rendered and worked. The isolated current-source app.js SHA-256 was `8acc3e9b194f4dd225cff16960b4b660b285e3fb1b78ee760ae67fb5a10c74dd`.

The earlier Chrome/Edge 404 record remains historical evidence of the defect before the route fix. Port 8788 still returns 404 for the same helper modules under the separate `LIVE-FEEDBACK-01` runtime mismatch. Its effective database/process identity is unknown, so this QA did not restart or modify that listener. Current-source bootstrap finding `UX-APP-BOOTSTRAP-MODULE-404-01` is complete; active-runtime verification remains open under `LIVE-FEEDBACK-01`.

## Harness attempts and limitation

The first isolated browser attempt stopped at a harness selector that read the Issue type label instead of the request ID; the harness was corrected. The next attempt reached the form but Tab A was still stale after Tab B committed its rebased update, so the intended winning write correctly received 409; the harness was corrected to reload Tab A before the same-field case. The final complete run passed. These were harness setup/assertion issues, not product failures.

The original session preceded the independent current-hash regression. Hermann User Tester passed all recorded conflict, retry, localization, accessibility, and public-history cases on 2026-09-30; no source edits were made during that acceptance. No live service, account, or database was changed, and no commit or push was made.

## Backlog traceability read-through

The single canonical backlog now marks `FEEDBACK-IDEMPOTENCY-01` complete with API, reviewer, and Edge evidence; this stale-editor item remains In progress pending separate User Tester sign-off and final reviewer response. The source-level module-route fix is marked complete while active-process verification remains under `LIVE-FEEDBACK-01`. Repaired two concatenated backlog row boundaries, corrected the affected QA/artifact links, and checked that each of the five touched issue IDs appears exactly once and its QA link exists. The P1 `PRIV-02`, `LIVE-FEEDBACK-01`, `QA-01`, and `REL-01` release gates remain open.

## Artifacts

- Runner: [`run.mjs`](../../output/playwright/admin-feedback-stale-editor-regression-20260930/run.mjs)
- Result: [`result.json`](../../output/playwright/admin-feedback-stale-editor-regression-20260930/result.json)
- Screenshots: [`non-overlap-conflict-rebased.png`](../../output/playwright/admin-feedback-stale-editor-regression-20260930/non-overlap-conflict-rebased.png), [`same-field-conflict-keeps-local-draft.png`](../../output/playwright/admin-feedback-stale-editor-regression-20260930/same-field-conflict-keeps-local-draft.png)

## Current-bundle follow-up — 2026-09-30

After Hermann's stale-editor acceptance passed against `app.js` SHA-256 `3588924d1a795a45e476508caddd53338075946f22ebfad8c3745b7c45040468`, a separate P3 fix changed the member feedback submission catch and bilingual network-error strings. Current `app.js` is now `d1446ee96d06ac1054e0c073319507f27cf00b39ac62036d5206eea9a2e675fc`. The change is outside the admin stale-editor code path, and `npm test` remains green 82/82, but a focused Hermann regression on this current bundle is requested before treating this item as fully current-hash verified.
