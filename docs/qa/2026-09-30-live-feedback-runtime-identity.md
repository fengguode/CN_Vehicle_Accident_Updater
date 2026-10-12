# LIVE-FEEDBACK-01 runtime identity and bootstrap activation — 2026-09-30

## Scope and safety

Read-only inspection of the app.js bootstrap mismatch on localhost port 8788. No authenticated request, write, process stop, scheduled-task change, or database content read was performed.

## Findings

- TCP inspection identifies port 8788 listener PID 2368 as `node.exe`. The scheduled task `China ADAS vNext Service` is Running under `guofe`, with action `C:\Program Files\nodejs\node.exe apps/api/server.js`, last run 2026-09-29 03:00:33, and working directory `C:\Users\guofe\Documents\Codex\2026-09-08\make-a-new-project-locally-to\updater-vnext`.
- The task checkout's `apps`, `src`, and `data` directories are junctions into `D:\project\ChinaTrafficIssueMonitor\updater-vnext`. Its `apps/api/server.js` SHA-256 matches current source (`403436805df855db19652f4d81b99fcfbcaf347356745ec51471c7ba8bf80be3`). All eight checked web assets exist in both paths and match by SHA-256, including `app.js`, `feedback-drafts.js`, and `feedback-triage.js`.
- The default database file in the task path and current checkout has the same Windows file ID (`0x0000000000000000000100000000112e`), size (1,720,320 bytes), and last-write time. No database rows or contents were read. Task action arguments and the interactive user's environment registry contain no `ADAS_DB_PATH` override; the task's live process environment could not be read, so an inherited process-only override is not ruled out absolutely.
- Fresh read-only requests returned `/health` 200, `/app.js` 200, `/feedback-drafts.js` 404, and `/feedback-triage.js` 404. This confirms the currently loaded listener still has the earlier static asset route table although its on-disk server source includes both routes. A stale in-memory route table is the best-supported explanation.
- The admin service's current-source isolated Edge run already verified startup, helper module HTTP 200/source parity, and rendered triage behavior: [bootstrap follow-up QA](2026-09-30-feedback-triage-stale-editor-fix.md). Dennis independently reviewed the source route map and found no defect.

## Activation decision

The necessary live action is to stop and start the named service task so Node reloads the existing current-source route table, followed by fresh health, module-route, exact-source, and rendered-browser checks. The user asked the team to resolve the app.js blocker, but automatic review rejected the attempted `Stop-ScheduledTask`/`Start-ScheduledTask` operation as a distinct live-service side effect that was not explicitly authorized. The rejected command did not run; PID 2368 and the task remain unchanged. No workaround was attempted. Keep `LIVE-FEEDBACK-01` In progress until the owner explicitly authorizes this exact activation or selects another deployment path.

## QA session result

**Partial / activation not performed.** PID/task/source/default-database file identity and current route responses were checked; no live state was changed. Process-only database override and authenticated active-runtime behavior remain unverified. Branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`; QA/backlog records are uncommitted among existing shared changes; no commit or push.
