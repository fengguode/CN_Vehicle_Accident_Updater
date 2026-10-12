# Live feedback service diagnosis

**Date:** 2026-09-28 (Asia/Shanghai)  
**Target:** the already-running local service documented for `updater-vnext` at `127.0.0.1:8788`.  
**Scope:** anonymous, read-only HTTP probes only. No sign-in, writes, restart, or process mutation.

## Reproduction and evidence

1. `GET http://127.0.0.1:8788/` returned **200** HTML. The response contains `feedback-nav` and `feedback-request-section`.
2. `GET http://127.0.0.1:8788/app.js` returned **200** JavaScript. The response contains the `feedback-nav` wiring and `/api/feedback` client paths.
3. `GET http://127.0.0.1:8788/api/feedback/mine` returned **404 Not found**.
4. `GET http://127.0.0.1:8788/api/admin/feedback` returned **404 Not found**.
5. `GET http://127.0.0.1:8788/health` returned **404 Not found**, while current workspace `apps/api/server.js` contains `/health`, `GET /api/feedback/mine`, and `GET /api/admin/feedback` handlers.
6. `netstat -ano` and an elevated read-only process query showed PID 3076 listening on `127.0.0.1:8788`, running `node.exe apps/api/server.js` since 2026-09-28 03:00:33. The current `apps/api/server.js` was last written at 19:51:15; `apps/web/index.html` at 19:47:02 and `apps/web/app.js` at 19:57:28. The server process predates those UI/API source updates and therefore has the old API routes loaded. No process was restarted or altered.
7. In the isolated current-source harness, `node --test test/feedback-api.test.js` passed 1/1, and the full `npm test` passed 66/66.

## Result and impact

The currently running Node API process predates the feedback implementation edits: its entrypoint was loaded at 03:00, while the current server source was modified at 19:51. The process continues to serve the updated web shell/client from disk, but its loaded server module lacks the new API routes. This reproduces the owner's report and identifies the immediate root cause. The working-tree source passes isolated API coverage, but that does not repair the already-running service.

**Status:** P1 active under `LIVE-FEEDBACK-01`. The service was not restarted or otherwise changed. Fresh restart/activation and authenticated end-to-end confirmation require explicit authorization after the candidate has passed independent review and isolated testing. No actual user submission or account data was read.
