# Hermann UX-AUTH-I18N-01 — current-source password error regression

**Date:** 2026-09-29 (Asia/Shanghai)  
**Target:** `updater-vnext`, branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`.  
**Finding:** UX-AUTH-I18N-01 remains reproduced. No app source was edited.

## Environment and preflight

- Fresh isolated `apps/api/server.js` service at `http://127.0.0.1:57475` with a disposable synthetic SQLite database. `/health` returned 200; initial `/api/auth/me` was user-null.
- Headed Microsoft Edge `154.0.4258.37`, direct Node Playwright API using cached `playwright-core`, unique disposable profile, viewport 390×844.
- Served assets matched source: `index.html` SHA-256 `09379F2DF2553C5DE80CE22C90D8953906C7781F6E5F953B4BEF65DD2BEA2459`, `app.js` `9F56A4081A8D3F6369B52D1805D8960EF6D86BBAB2B9A21CD94E697654ADFC1F`, `styles.css` `CAFE53B8491E9BCE07476A33EEF7CB2A4DE424ADF21ACDC4B06FFEF44E573EC8`, and `navigation.js` `7A1114587842F11BACE2B1B4D69F9D15D5E35AE946ABF7EFD0F5564461DCEA56`. `server.js` SHA-256 `7485771FC8A5C7B8EA9ECF9A1E5204B086ABAE694A2F6DAA41CC17DD621B0949`; `auth.js` `EEBC14D0AA5E85420AF365883EF8E120722A1605A7594430C94550DB24105D1C`.
- Fixture had one synthetic administrator and one synthetic approved member. The browser authenticated only to this isolated service using the synthetic member credentials.

## Results

| Scenario | Actual | Result |
|---|---|---|
| Wrong current password in zh-CN, valid distinct new-password candidate | `POST /api/auth/password` returned 400; visible message was English `Current password is incorrect.` Both current/new values remained. Message had `role="status"` and `aria-live="polite"`. Enter restored focus to the Change password submit button with a visible 3px blue focus ring. Synthetic member remained authenticated. | Fail — untranslated message, UX-AUTH-I18N-01 |
| New password equal to current password in zh-CN | `POST /api/auth/password` returned 400; visible message was English `Choose a password different from the current one.` Both fields remained; polite status and visible submit focus remained; session stayed active. | Fail — untranslated message, same issue |
| English wrong-current baseline | HTTP 400 showed the expected English `Current password is incorrect.` Fields, polite status, active session, and keyboard focus behavior matched the Chinese attempt. | Pass |
| No password/session mutation | Before/after DB comparison showed unchanged password salt and hash, two users, and one active session. All three password requests returned 400; no success response or password change occurred. | Pass |
| Runtime/errors/cleanup | No browser page errors. After context close the isolated service stopped, `/health` was unreachable, and the temporary DB/profile directory was removed. Port 8788 was untouched. | Pass |

Full requests, responses, focus and database checks are in [`results.json`](../../output/playwright/password-error-current-9f56-cafe53-20260929/results.json). Screenshots: [Chinese wrong-current](../../output/playwright/password-error-current-9f56-cafe53-20260929/wrong-current-zh-CN.png), [Chinese same-as-current](../../output/playwright/password-error-current-9f56-cafe53-20260929/same-as-current-zh-CN.png), and [English baseline](../../output/playwright/password-error-current-9f56-cafe53-20260929/wrong-current-en.png). The only POSTs after sign-in were the three rejected password changes; expected isolated GETs to reports and the member feedback list occurred while opening the approved Account view.

**Disposition:** Keep UX-AUTH-I18N-01 `In progress`; latest 9F56/CAFE source still displays both password-change validation errors in English under zh-CN.  
**Git/evidence state:** QA note, result, screenshots and backlog reference are uncommitted among existing shared changes. No commit or push.
