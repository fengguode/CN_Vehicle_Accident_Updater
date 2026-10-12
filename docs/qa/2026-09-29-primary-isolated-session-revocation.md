# Synthetic member session revocation browser QA

**Date:** 2026-09-29 (Asia/Shanghai)
**Target:** primary-created isolated `updater-vnext` service at `http://127.0.0.1:8794/`
**Browser:** Codex In-app Browser, tab 11, default viewport; browser build and exact viewport dimensions were not captured.
**Tester:** Primary CUA fallback; synthetic admin/member accounts only.

## Runtime and data boundary

- Service PID 29804 (`C:\Program Files\nodejs\node.exe`) was started from `updater-vnext/apps/api/server.js` with `ADAS_VNEXT_PORT=8794` and `ADAS_DB_PATH=C:\Users\guofe\AppData\Local\Temp\ctim-hermann-browserqa-20260929-06\qa.sqlite`.
- The disposable database contained a synthetic initial admin and one synthetic unverified report with an `example.invalid` source URL. One synthetic invite and member were created through the browser. No external source URL was opened, and no 8788 account or data was read or changed.
- At preflight and after the browser pass, `/health` returned `{"ok":true,"service":"adas-vnext"}`. The served `/app.js` and local file matched byte-for-byte at both checks: 71,016 UTF-8 bytes, SHA-256 `9D62378353F342C53A01798282C4B6A39AFD91751618A792247AAB4A57DA5E7C`.
- A second admin HTTP session was isolated in PowerShell to model a distinct administrator device while the browser tab kept the member session. That synthetic admin API session approved and later disabled the test member. These state changes were not performed through the admin UI in this pass; browser observations describe the member-side response.

## Browser results

| Scenario | Observation | Result |
|---|---|---|
| Synthetic admin login/invitation | Admin signed in through the browser, saw administrator navigation, and created a one-use invitation. | Pass |
| Member registration | `qa-member` registered through the invitation form and initially saw Member / pending with only Reports and Account navigation. | Pass |
| Approval refresh | The separate synthetic admin session approved the member. The browser account state changed from pending to approved, and Reports loaded one unverified synthetic report without a full-page reload. | Pass |
| Disable and session revocation | The separate synthetic admin session disabled the approved member. Within the documented 30-second refresh interval, the browser cleared the signed-in Account controls and returned to the login form. Reports displayed the signed-out approved-account gate. | Pass |
| Disabled-account login | The disabled synthetic member tried to sign in again; the UI reported “Username or password is incorrect” and did not create an authenticated session. | Pass |

No new UX defect was reproduced in this slice. This extends previous browser-based admin/member coverage with the member-side revocation state transition; the administrative approval/disable mutations in this specific pass used an isolated authenticated API client, not the admin UI.

## Cleanup and Git state

After recording the results, I verified PID 29804 was the listener on 8794, then stopped that process and removed only its exact temp directory after confirming the port had no listener. Port 8788 was left running and untouched. No application source changed in this pass. No automated test suite was run.

Git evidence: `updater-vnext`, branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`, ahead 18. Existing shared changes were preserved; this session adds only QA/backlog documentation; no commit or push.
