# Hermann current-source member password UX QA

**Date:** 2026-09-29 (Asia/Shanghai)  
**Variant:** `updater-vnext`  
**Target:** isolated same-origin service at `127.0.0.1:58920`, disposable synthetic-member database  
**Browser:** headed Microsoft Edge 154.0.4258.37 via cached Playwright Core  
**Viewports:** 390×844 and 1280×800  
**Tester:** Hermann User Tester

## Runtime and source parity

Isolated health returned 200. Served `app.js` (`dfbfbe7f9dcbe564f90f05b826f08bb4fb43845d71ed315d01d50f5addeaa508`) and `styles.css` (`b6071808af773a20c03ace8f5d5be34c00a564cce32705a28da9f112d3e0ec8d`) matched source before and after. The test used synthetic credentials only; no live port 8788 authentication or writes occurred.

## Browser journeys and results

- The Current password and New password fields were clearly labeled, required, and constrained to 12–200 characters; their autocomplete values were `current-password` and `new-password`. There was no separate helper text explaining the length limits.
- Empty submission produced native required validation on Current password, focused that input, and did not send a password-change request.
- A deliberately incorrect current password produced “Current password is incorrect.” and preserved both entered values. Keyboard submission returned focus to Change password with a visible 3px focus outline.
- A correct change displayed “Password changed. Other sessions were signed out.”, cleared the fields, kept the current session signed in, and allowed navigation to Reports.
- A second synthetic session received `/api/auth/me` 200 with `user: null` after revocation. Reload showed the signed-out login state but no explanation in that session. This is recorded as a UX decision candidate, not a confirmed defect.
- No browser page errors occurred.

Screenshots: [mobile form](../../output/playwright/password-ux-20260929/password-form-mobile-390x844.png), [desktop form](../../output/playwright/password-ux-20260929/password-form-desktop-1280x800.png), [mobile success](../../output/playwright/password-ux-20260929/password-change-success-mobile-390x844.png), and [revoked second session](../../output/playwright/password-ux-20260929/revoked-second-session-1280x800.png).

The disposable service, database, and profile were removed; port 58920 was verified closed. No application source was edited.

## Git state

`updater-vnext`, branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`. This QA note and backlog updates are uncommitted among existing shared work; no commit or push.
