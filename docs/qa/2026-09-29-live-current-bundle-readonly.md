# Active vNext service read-only bundle check

**Date:** 2026-09-29 (Asia/Shanghai)  
**Target:** Existing vNext listener at `127.0.0.1:8788`; no process restart, account use, authenticated request, or write was performed.  
**Method:** Node.js `fetch` with `cache: no-store` against only `/health`, `/`, `/api/auth/me`, `/api/feedback/mine`, `/api/admin/feedback`, `/app.js`, and `/styles.css`.

## Results

| Route | Result |
|---|---|
| `/health` | HTTP 200 |
| `/` | HTTP 200 |
| `/api/auth/me` | HTTP 200, signed out (`user` absent) |
| `/api/feedback/mine` | HTTP 401 |
| `/api/admin/feedback` | HTTP 401 |
| `/app.js` | HTTP 200, 87,215 bytes, SHA-256 `aae23b6a90dd7df84354990cf6f9eb4b7d1476c10a019fdc7987e325ad5fb7e2` |
| `/styles.css` | HTTP 200, 16,820 bytes, SHA-256 `d761134a7738b6d6620074cc39c516dc0fe6d4b82134d6397514dea02fe2a380` |

The served application and stylesheet match the current `updater-vnext` source. This confirms the signed-out route behavior and current client bundle only; it does not prove the authenticated write path or identify the database opened by the running process. The P1 `LIVE-FEEDBACK-01` gate remains open pending owner-approved isolated-runtime evidence or an authorized maintenance window.

No live database, account, session, scheduled task, or service state was changed.
