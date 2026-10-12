# LIVE-FEEDBACK-01 — current listener observation

## Session record

- **Target:** local vNext port 8788, read-only runtime observation.
- **Check:** PowerShell `Get-NetTCPConnection -State Listen -LocalPort 8788 -ErrorAction SilentlyContinue`.
- **Result:** `Get-NetTCPConnection` returned no listener row, but follow-up read-only checks succeeded: TCP connect to `127.0.0.1:8788` was true, `/health` returned 200, `/api/auth/me` returned `user:null`, and `GET /api/feedback/mine` returned 401 `authentication_required`. Served `app.js` and `styles.css` SHA-256 values match workspace files (`9F56A408…` and `11BE0D54…`). Thus the endpoint is currently responsive; the listener cmdlet result is not reliable evidence that the service is stopped.
- **Scope/safety:** no process was started or stopped; only read-only GET requests were sent. No account or database was changed; no authenticated path was attempted. CIM/task inspection remains denied, so process startup arguments and selected database are unidentified. Port 8788 data was not mutated.
- **Disposition:** `LIVE-FEEDBACK-01` remains open. Current source parity and signed-out behavior are established, but the authenticated path and active database identity are not. Isolated current-source feedback E2E passes do not prove the deployed runtime's authenticated lifecycle.

## Git state

`updater-vnext`, branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`; this QA note and backlog update are uncommitted among the existing shared changes. No commit or push.

## Fresh read-only continuation — 2026-09-29

- `http://127.0.0.1:8788/health` returned 200 with `{ok:true,service:"adas-vnext"}`; `/api/auth/me` returned 200 with `user:null`; `/api/feedback/mine` returned 401. `127.0.0.1:8793` actively refused connection.
- `Get-NetTCPConnection` returned no listener rows for either port in this sandbox call; `Get-CimInstance Win32_Process` returned no Node process rows; filtered `Get-ScheduledTask` returned no output. This does not establish that 8788 is down: its HTTP health endpoint responded. Process/task/database identity remains unverified.
- No authenticated request, DB query/write, task/service change, or process action occurred. An isolated current-source synthetic lifecycle remains positive implementation evidence but is not linked to the active service process or effective DB.
- Next safe evidence is an authorized task owner/admin sharing sanitized service identity only: task name/path/state, executable, working directory, script entrypoint, trigger/principal/settings, process PID/start time/executable and resolved entrypoint, plus resolved DB path/identity with user directory redacted as needed. Exclude raw arguments, environment values, secrets, and database contents. Then reproduce the identified artifact/config on an isolated service while overriding only its DB path to a fresh synthetic DB and capture hashes before running authenticated member/admin flows.

## Fresh source-parity observation — 2026-09-30

- Read-only GET checks to `127.0.0.1:8788` returned `/health` 200 (`adas-vnext`), `/api/auth/me` 200 (`user:null`), and `/api/feedback/mine` 401 (`authentication_required`). No authenticated request was made.
- Served `/`, `/app.js`, `/styles.css`, `/navigation.js`, `/viewport.js`, and `/report-presentation.js` byte-matched the current workspace source. App SHA-256 `3e47741844e6329e6a089b553ccafa8a5144c7b8cda1c1ee6970757ba6367450`; CSS SHA-256 `a8b4940018d81333226db42bf7507c57af51b6cdc1e120ced4fb660a36e06423`.
- Read-only GET to `127.0.0.1:8793/health` received no HTTP response (connection failure). This does not identify the running process or database on 8788.
- No database query/write, account use, process action, or scheduled-task action occurred. Effective 8788 database identity and authenticated lifecycle remain unverified; keep `LIVE-FEEDBACK-01` open.

