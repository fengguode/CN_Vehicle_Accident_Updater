# QA Session: Microsoft Edge feedback runtime recheck

- Date: 2026-09-28 (Asia/Shanghai)
- Target: `updater-vnext` at `http://127.0.0.1:8788/`.
- Browser: installed Microsoft Edge 154, launched visibly with the project URL. The project page title was `China Traffic Incident Database`; the Edge user agent ended in `Edg/154.0.0.0` during the direct browser check.
- Scope: service activation and browser acceptance. Production accounts and request data were not read or changed; authenticated submission used a disposable service/database.

## Checks and results

| Check | Result |
|---|---|
| Open project in Edge | PASS: Edge opened the local project; page title and Edge user agent confirmed. |
| Before activation: `GET /health` | PASS: HTTP 200 with `{"ok":true,"service":"adas-vnext"}`. |
| Before activation: unauthenticated feedback routes | FAIL: `/api/feedback/mine` and `/api/admin/feedback` both returned 404. |
| Source readiness before activation | PASS: `node --check apps/api/server.js`, `node --check apps/web/app.js`, and `npm test` (66/66). |
| Running service source/data identity | PASS: the registered task used an older working-directory string, but `fsutil file queryFileID` confirmed the old and active checkout resolve to the same file IDs for `apps/api/server.js`, `src/db.js`, `src/config.js`, and the live `data/adas-accidents.db`. The database itself was not read or changed. |
| Service restart | PASS: stopped and started the existing `China ADAS vNext Service` task after the source checks. Port 8788 returned healthy and listened under new PID 68560. |
| Live API after restart | PASS: `/health`, `/`, and `/app.js` returned 200; unauthenticated `/api/feedback/mine` and `/api/admin/feedback` returned 401, confirming the feedback routes are loaded and enforce authentication. |
| Signed-out Edge UI | PASS: Edge opened the local app, showed the Account heading and login form, kept the admin Feedback navigation hidden, and did not expose the member feedback form. Both feedback routes returned 401. Edge UA ended in `Edg/154.0.0.0`. |
| Authenticated Edge lifecycle after activation | PASS in a disposable API/database with a synthetic approved member: member opened Account, submitted a Feature request, saw it in their list, and the request remained after refresh. Result: `feedback_created_visible=true`, `persists_after_reload=true`. |
| Scheduled task path alignment | BLOCKED: attempted to update the task's future working directory from the old Documents checkout to the active `D:\project\ChinaTrafficIssueMonitor\updater-vnext`; Windows Task Scheduler returned `Access is denied`. The task definition remains on its old path. The service is running successfully now; track future-start path correction separately. |

The earlier mixed observation was resolved: inspection from the authorized elevated read-only session identified PID 3076 on port 8788 and the task's old working directory. The active and old checkouts share the same relevant source/database file identities, so restarting the existing service task loaded the reviewed current source against its existing database. Live anonymous route checks then changed from 404 to 401. The authenticated lifecycle used a separate disposable database and synthetic member, never a real account.

## Disposition

The original stale-route defect is fixed: the restarted live process loads the feedback routes and enforces authentication. The signed-in Edge lifecycle passed against a **separate disposable service/database**, not through PID 68560. No production account or feedback record was accessed or modified.

**Independent review (Dennis Windmaier, 2026-09-28):** The anonymous 401 probes and isolated authenticated flow do not together prove authenticated submission through the active process. Keep `LIVE-FEEDBACK-01` in progress until that acceptance is safely completed against an isolated database through the activated runtime, or the project owner records an explicit disposition for the evidence limit. Dennis confirmed the current route-loading repair, and classified the old scheduled-task path as a separate P2 startup reliability issue. Review conclusion: authenticated behavior through PID 68560 remains unverified; no claim of full feedback release acceptance is supported yet.

**Independent release review (Wang Xiaofeng, Quality Manager, 2026-09-28):** recommends hold release. P1 `PRIV-02` confirms that current public JSON mirrors still expose social account attribution; owner authorization is needed for remediation. At the time of Xiaofeng's review, `QA-01`, `FEEDBACK-04`, `LIVE-STARTUP-01`, and customer acceptance remained open. Hermann and Dennis subsequently closed scoped `FEEDBACK-04`, and the primary closed `UI-ACCEPT-04` after Edge rendered the icon. Remaining gates are `QA-01`, `LIVE-FEEDBACK-01` authenticated operation through the active process, `LIVE-STARTUP-01`, privacy disposition, and customer acceptance. The roundtable's `REL-01` reference has now been reconciled by adding the active release gate to the backlog. No public data, refs, or release state were changed.

`LIVE-FEEDBACK-01` remains **In progress** for the authenticated active-runtime evidence gap. The task-path correction also remains open because Task Scheduler denied the update. No production account or feedback record was accessed or modified.

## Git evidence

`updater-vnext`, branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`, ahead 18. QA/backlog changes are uncommitted with existing shared work. Elevated read-only `git status --short --branch`, `rev-parse HEAD`, and `git diff --check` ran; whitespace check exited 0 (standard LF/CRLF warnings only). No commit or push.
