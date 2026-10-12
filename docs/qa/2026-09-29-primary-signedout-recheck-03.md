# Signed-out localhost browser recheck 03

**Date:** 2026-09-29 (Asia/Shanghai)
**Target:** live `updater-vnext` shell at `http://127.0.0.1:8788/`
**Browser:** Codex In-app Browser, tab 12, viewport 1280×720. Console inspection returned no warning/error entries.
**Tester:** Primary CUA fallback; read-only with respect to service accounts and data.

## Runtime identity and safety

- `GET /health`: HTTP 200, `{"ok":true,"service":"adas-vnext"}`.
- `GET /`: HTTP 200; title `China Traffic Incident Database`.
- `GET /api/auth/me`: HTTP 200, user null.
- `GET /api/reports`: HTTP 401 while signed out.
- Listener PID 2368 is a Node process, but its executable path and command line were unavailable: `tasklist /V` and Windows CIM returned Access denied. The API process entrypoint and database identity therefore remain unknown.
- Served `/app.js` matches the current local `apps/web/app.js`: 71,016 UTF-8 bytes, SHA-256 `9D62378353F342C53A01798282C4B6A39AFD91751618A792247AAB4A57DA5E7C`. This only establishes the browser bundle source, not the API process or database.
- No login, registration, invitation creation, or other data mutation was attempted.

## Signed-out UX checks

| Check | Observation | Result |
|---|---|---|
| Reports gate | Chinese signed-out page described public reports as unverified research leads and required an approved account to view them. | Pass |
| Account and invitation registration | Account exposed login and invitation registration. The registration form had username, password, invitation code, and Create account, but no visible invitation request/help path. | Reconfirmed UX-REG-01 |
| Language and document title | In Chinese mode, `lang="zh-CN"` and page text were Chinese while `document.title` remained `China Traffic Incident Database`. English mode rendered English. | Reconfirmed UX-I18N-01 |
| Keyboard path | From the language button, Tab reached Username → Password → Invitation code → Create account → Already registered? Log in, then cycled through the home link, Reports, and Account controls. | Pass |

No distinct new defect was found in this pass. See the existing UX-REG-01 and UX-I18N-01 backlog entries for expected behavior and earlier reproductions.

## Git state

No app source changed in this pass. `updater-vnext`, branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`, ahead 18. Existing shared changes preserved; only QA/backlog documentation updated; no commit or push.
