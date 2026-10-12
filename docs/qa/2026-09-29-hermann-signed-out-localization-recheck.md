# Hermann signed-out localization recheck

**Date:** 2026-09-29 (Asia/Shanghai)
**Target:** `http://127.0.0.1:8788/` (same-origin UI/API)
**Browser and automation:** Codex In-app Browser via CUA accessibility and screenshot APIs; browser version unavailable. Captured viewport 1280×720.
**Build identity:** Current repository snapshot is branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`. The served `/app.js` matched local `apps/web/app.js` byte-for-byte (69,559 bytes; SHA-256 `F9099995AFB6C5907D2B7281FE812ECB265E7D7134062CF6EBC6A519CD70BF04`). Windows process inspection was denied, so API process and database identity remain unverified.
**Service preflight:** `GET /health` returned `{"ok":true,"service":"adas-vnext"}`; `GET /api/auth/me` returned `{"user":null,"csrf":null}`; `GET /api/reports` returned HTTP 401. The rendered page returned HTTP 200. Process inspection remained unavailable. No login, registration, invitation, or other account mutation was attempted.
**Served document metadata:** A fresh read-only `GET /` confirmed the live HTML declares `<html lang="en">` and the fixed title “China Traffic Incident Database”. While the Chinese interface was visibly selected after reload, both metadata values remained English. Native screen-reader pronunciation was not directly tested.

## Acceptance checks

| Check | Expected | Actual | Result |
|---|---|---|---|
| Signed-out landing in Chinese | Research-lead explanation and access gate are understandable; report data remains gated. | Chinese heading and explanation rendered; notice directs the visitor to sign in with an approved account. `/api/reports` returned 401. | Pass |
| Switch to English, then Chinese | Rendered UI and browser document title reflect the selected language. | Body/navigation switched languages, but the browser tab title and accessibility document name remained “China Traffic Incident Database” in both languages. | Fail — UX-I18N-01 |
| Reload after selecting Chinese | Selected language and corresponding title remain consistent after reload. | Chinese rendered UI persisted; browser tab title/document name remained English. | Fail — UX-I18N-01 |
| Recheck invitation registration | Explain where an unregistered person can obtain the required code. | UX-REG-01 reproduced: registration shows an invitation-code field but no request/obtain path. No submission attempted. | Confirmed existing finding; see [UX-REG-01 QA](2026-09-29-hermann-localhost-signed-out.md) |

## Finding UX-I18N-01 — browser title is not localized

- **Status:** New; primary review needed. P3 localization usability issue.
- **Reproduction:** Open the signed-out page in the browser. Activate the language switch to English and then Chinese. Observe the visible Chinese interface and the browser tab title/accessibility document name. Reload while Chinese is selected and compare again.
- **Expected:** The page title should follow the selected UI language, such as “中国交通事故数据库” in Chinese.
- **Actual:** The body/navigation are Chinese, but the browser tab title and accessibility document name remain “China Traffic Incident Database”; this also persists after reload.
- **Evidence:** CUA rendered accessibility tree identified the page as `China Traffic Incident Database` while its Chinese heading and nav were rendered. A screenshot showed the Chinese page at 1280×720. `apps/web/index.html` contains a static English `<title>`.
- **Impact:** Chinese-speaking users encounter English in browser tabs, history, and other title-based browser/assistive-technology contexts.
- **No mutation:** This check remained signed out; no credentials or registration data were entered or submitted.

## Disposition and limitations

No application source changed. UX-REG-01 remains open and was reconfirmed. UX-I18N-01 is a distinct new finding, recorded in the canonical backlog as `In progress` pending primary review. Service process/database identity and browser version were unavailable. This pass covered signed-out rendered language/title behavior only; responsive breakpoints, native screen reader, and authenticated roles were not exercised against the unidentified 8788 service.

`git diff --check` passed after recording this note and backlog entry. Git snapshot observed: `updater-vnext`, branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`; shared working tree already contained modifications and untracked files. No commit or push.
