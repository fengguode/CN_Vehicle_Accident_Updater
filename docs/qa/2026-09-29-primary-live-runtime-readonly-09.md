# Live vNext runtime read-only check 09

**Date:** 2026-09-29 (Asia/Shanghai)  
**Target:** `updater-vnext` local service on `127.0.0.1:8788`  
**Browser:** No browser used; this was an HTTP/runtime identity check. The rendered Edge checks are linked separately.  
**Scope:** Read-only GET requests and process/socket inspection. No login, writes, service restart, task change, or database access.

## Results

- `GET /health`: **200**, 34 response bytes.
- `GET /`: **200**, UI shell returned.
- `GET /app.js`: **200**, served bytes hash `a4ef417072e185bf8871c3f205aaad72ee348d259f163531a9e386bf74f9e794`, matching the current `apps/web/app.js` source hash exactly.
- `GET /api/auth/me`: **200**, `{"user":null,"csrf":null}`; the request was signed out.
- `GET /api/feedback/mine` and `GET /api/admin/feedback`: **401** signed out, confirming both routes require authentication.
- `netstat -ano` showed `127.0.0.1:8788` listening under PID `2368`. `Get-CimInstance Win32_Process` for that PID returned Windows `Access denied`, so executable command line, process working directory, and database path could not be established. No inference is made about which database that process uses.

## Disposition

The service is running and serves the final current UI bundle. Signed-out route protection is active. This does not test authenticated feedback reads/writes or persistence, identify the process's database, or satisfy `LIVE-FEEDBACK-01`. The active service and data were left unchanged.
## Feedback eligibility requirements check

Feng's request was that a logged-in user can submit issue/feature feedback, see their own request list, and receive status updates. The user confirmed submitter-and-admin-only visibility. The System Architect review correctly identified that active pending-account submission is already implied by “logged in” and implemented by the README/API. Updated the feedback spec, FEEDBACK-01/02 backlog records, and roundtable follow-up to mark this eligibility as confirmed; approval remains required for report/database access and admin triage. Triage cadence/authority, transitions, and account-linked retention remain unresolved. A focused cross-read found no remaining spec claim that pending-user eligibility needs owner approval.
