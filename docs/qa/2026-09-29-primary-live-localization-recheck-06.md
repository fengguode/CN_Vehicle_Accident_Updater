# Live localhost localization recheck 06

**Date:** 2026-09-29 (Asia/Shanghai)
**Target:** `http://127.0.0.1:8788/`
**Browser:** Codex In-app Browser, tab 16, 1280 x 720 screenshot
**Tester:** Primary CUA; read-only with respect to accounts and report data

## Runtime and safety

- `/health` returned HTTP 200 with `ok:true`; `/` returned HTTP 200; `/api/auth/me` returned HTTP 200 with `user:null`.
- The API process/database identity remain unverified. No login, registration submission, or data mutation was attempted.
- Served `/app.js` exactly matches current local `apps/web/app.js`: 71,597 bytes, SHA-256 `38304aaf4481d476d0cabd8ecc85876028d5355bee8b620b1f7a775f88b1a1d9`.

## Browser observations

| Check | Result |
|---|---|
| Signed-out Reports gate | Research-lead caveat and approved-account requirement rendered. |
| Chinese title | Switching from English to Chinese changed the browser tab/document title to the Chinese database title. |
| English title | Switching back to English restored `China Traffic Incident Database`. |
| Persistence | Reloading after selecting Chinese restored the Chinese title and Chinese page content. UX-I18N-01 appears corrected in the currently served source; keep its backlog item open until source review and regression disposition. |
| Invitation registration | Chinese Account registration showed Username, Password, Invitation code, and Create account, with no visible explanation or path for an unregistered visitor to request an invitation. UX-REG-01 remains reproduced. |

The browser tab was closed after capture. No source files were edited in this pass. `updater-vnext` branch `vnext-home-hosted`, HEAD `daa5b58`; existing source and documentation changes were preserved; no commit or push.
