# Localhost signed-out UX continuation

**Date:** 2026-09-29 (Asia/Shanghai)
**Target:** `http://127.0.0.1:8788/`, active `updater-vnext` variant (selected from [README](../README.md))
**Browser:** Codex In-app Browser, fresh tab 7, default viewport (dimensions and browser build not exposed). The browser rendered the page and its accessibility snapshot.
**Tester:** Primary CUA fallback. Hermann's prior browser agent could not access a browser in this environment; this is not represented as a Hermann-executed interaction.

## Runtime preflight

- `GET /health`: HTTP 200, `{"ok":true,"service":"adas-vnext"}`.
- `GET /`: HTTP 200, document/tab title `China Traffic Incident Database`.
- `GET /api/auth/me`: HTTP 200, `{"user":null,"csrf":null}`.
- `GET /api/reports`: HTTP 401 while signed out.
- `netstat` identified listener PID 2368. Windows denied `Win32_Process` command-line/path inspection, so the process entrypoint and database path/identity remain unknown.
- Served `/app.js` and current local `apps/web/app.js` were both 69,878 UTF-8 bytes with SHA-256 `C6F88A4A926AE25C89F1690B26A75C3A2CCF53F35E295F22B82480A99DABF041`. This ties the UI bundle to the current file but does not establish which API code or database is running.
- No login, registration, invitation, or data mutation was attempted. Admin/member journey testing on 8788 remains unsafe until the runtime/database is identified or a disposable service is used.

## Browser observations

| Scenario | Actual observation | Result |
|---|---|---|
| Signed-out report gate | Main view was Chinese; it labeled reports as unverified research leads, stated that presence does not mean an incident is confirmed or caused by vehicle systems, and required an approved account to view reports. | Pass |
| Account entry | Account view exposed username/password login and “Use invitation to register.” | Pass |
| Invitation registration | Registration view exposed username, password, invitation code, and Create account, but no visible way to request or obtain an invitation. No code was entered and account creation was not attempted. | Reconfirmed UX-REG-01 |
| Chinese document title | DOM reported `lang="zh-CN"` and Chinese account text while `document.title` remained `China Traffic Incident Database`. Console had no warning/error messages in the inspected log window. | Reconfirmed UX-I18N-01 |

The session reproduces two existing P3 findings; it did not identify a distinct new issue. CUA screenshots and accessibility tree were available during the live browser session, but no screenshot artifact was saved.

## Boundaries and QA result

Only signed-out read-only interaction was performed on 8788. No external links were opened. No source was changed and no automated test was run. Admin/member testing remains gated on runtime/database identification or a disposable service. This pass did not cover screen-reader use, zoom, responsive breakpoints, keyboard-only completion, or dynamic error/success states.

Git evidence: `updater-vnext`, branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`, ahead 18. Existing shared dirty/untracked work was preserved; only QA/backlog documentation is in scope; no commit or push.
