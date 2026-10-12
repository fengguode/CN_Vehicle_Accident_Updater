# Hermann feedback full lifecycle QA — 2026-09-29

## Scope and acceptance

Run a realistic browser session for new feedback and its complete reported lifecycle: member and administrator submission, admin queue visibility and submitter attribution, triage through more than one status, persistence after reload, submitter-visible status history/public updates, and privacy of internal notes. The test must use synthetic accounts/data and a disposable database/service. Confirm the separate localhost service remains available and untouched.

## Runtime and setup

- Variant: `updater-vnext` (per its `README.md`); source entrypoint `apps/api/server.js`.
- Before test: `http://127.0.0.1:8788/health` returned 200 (`adas-vnext`). `http://127.0.0.1:8793/health` refused the connection. No authenticated request or write was sent to either service.
- Browser: headed Microsoft Edge 154.0.4258.37, direct Node Playwright API with cached `playwright-core`, isolated disposable profile, viewport 390×844.
- Test target: fresh ephemeral localhost service on port 63779, started with a new SQLite database and synthetic admin/member accounts. All six served UI assets exactly matched workspace source. App SHA-256 `ccc1ad5466c0f6c1a457d65b70a04c6e369eec3c99a361a5db96c628399cceea`; CSS SHA-256 `520e72d26606638d7a4b9133ff3db0ab0a1af30ddbbbd85e900c628e4f0d97f8`.

## Results

- Synthetic approved member submitted an Issue; POST returned 201 and it appeared in that member’s Account list with `Submitted`. Member could not see admin navigation.
- Synthetic admin submitted a separate Issue; it appeared in the admin’s own list. Admin navigation and Feedback were visible only to the admin.
- Admin queue resolved `aria-busy=false`, displayed both requests, and showed the member’s username as submitter.
- Admin changed the member request to `Under review` with a public update and private note. After member re-login, status and public update appeared; the private note did not appear in rendered text or `/api/feedback/mine`.
- Admin changed the same request to `Complete`, supplied a second public update and a second private note, then reloaded the admin view. The final status, both public lifecycle events, and admin-only private note persisted.
- After member re-login, the request showed `Complete` and both public updates in chronological history. The member response contained all three public events (`Submitted`, `Under review`, `Complete`) and neither private note.
- No page errors. Only expected feedback POST/PATCH writes were made to the synthetic service. Synthetic service was stopped, isolated database/profile removed, and its health endpoint no longer responded. Port 8788 returned health 200 after cleanup and was not touched.

## Outcome and artifacts

Pass; no lifecycle defect found in the tested current source. This does not authenticate against or diagnose the unavailable 8793 runtime, and does not resolve `LIVE-FEEDBACK-01`.

- Runner: [run.mjs](../../output/playwright/feedback-lifecycle-full-20260929/run.mjs)
- Structured results: [results.json](../../output/playwright/feedback-lifecycle-full-20260929/results.json)
- Screenshots: member submission, admin submission, admin triage, and member public/private visibility are in the same artifact directory.
- The first isolated preflight was safely aborted before browser launch because its copied CSS hash guard referenced an older bundle. The guard was updated to the measured current source hash; this recorded passing run then verified exact six-asset parity.

## Repository state

`updater-vnext`, branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`, ahead 18. The QA note, runner, results, and canonical backlog supplement are uncommitted among the pre-existing shared changes; no source change, commit, or push was made. `git diff --check` passed (Git emitted existing LF-to-CRLF advisory warnings).
