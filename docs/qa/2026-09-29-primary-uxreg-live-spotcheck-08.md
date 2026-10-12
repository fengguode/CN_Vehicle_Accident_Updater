# UX-REG-01 current live helper spot-check

**Date:** 2026-09-29 (Asia/Shanghai)
**Variant:** `updater-vnext`
**Target:** `http://127.0.0.1:8788/`
**Browser:** Codex In-app Browser, hidden disposable tab; 390×844 and 320×800 explicit viewport checks.
**Tester:** Primary, read-only browser interaction.

## Runtime and source identity

- `/health` returned 200; `/api/auth/me` returned `user:null`; `/api/reports` returned 401. The live service's account database identity remains unknown, so no authentication or data write was attempted.
- Served `/app.js` SHA-256 `a4ef417072e185bf8871c3f205aaad72ee348d259f163531a9e386bf74f9e794` exactly matched local `apps/web/app.js`; local file size was 77,393 bytes.

## Registration helper result

- Account → Register with invitation rendered the new English helper: “Ask an approved member to create and share a one-use invitation code with you.” Switching to Chinese rendered: “请联系已获批准的成员为您创建并分享一次性邀请码。”
- At both 390×844 and 320×800, the invitation field and helper were visible and the document scroll width equaled the viewport (390 and 320 respectively); no horizontal overflow was found.
- Switching back to Login hid the invitation field and helper. The browser accessibility tree also omitted the hidden field/helper in Login and exposed them in registration mode. The hidden input retains `aria-describedby="invite-help"` in the DOM while Login is active, but neither target is exposed in the rendered accessibility tree until registration mode is shown.
- No form was submitted and no credentials were entered. The temporary viewport override was reset and the tab closed.

## Result and remaining acceptance

The previous UX-REG-01 report that no invitation guidance existed no longer reproduces on the latest source-matched live bundle. The factual, bilingual guidance is now present and visible at 320px and 390px. This read-only pass does not verify an invalid/expired invitation response or account non-creation; Hermann is running that remaining submit/recovery scenario against an isolated disposable database.

`updater-vnext`, branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`; app source and QA/backlog edits are shared uncommitted work; no commit or push.
