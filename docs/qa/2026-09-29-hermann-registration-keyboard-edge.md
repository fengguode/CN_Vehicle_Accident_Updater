# QA session: signed-out registration keyboard and narrow layouts

**Date:** 2026-09-29 (Asia/Shanghai)  
**Target:** `updater-vnext`, isolated empty service/database on port 58923; health 200, SQLite users=0  
**Browser:** Microsoft Edge 154.0.4258.37, headed Playwright  
**Viewports:** 320×800 and 390×844  
**Source parity:** served app.js SHA-256 `E11633259C3400F532424AA63567C1A7D27F180290B8C413F625B06F358F65FC`; styles.css `B6071808AF773A20C03ACE8F5D5BE34C00A564CCE32705A28DA9F112D3E0EC8D`; parity verified before and after.

## Results

- Keyboard path from Account heading reached Username → Password → Log in → Register. Enter on Register opened registration and focused required invitation input with a visible 3px focus ring. Tab continued to Create account (not activated), then Log in.
- Invitation field `aria-describedby` referenced visible `#invite-help` in English and Chinese. Changing language with registration open retained registration mode and localized helper text. Reload persisted Chinese language but reset auth mode to Login; reopening registration showed Chinese guidance.
- No horizontal overflow or off-screen Account descendants at either viewport. At 320px, document/body scroll width equaled client width (320); card right edge 308px; form/helper right edge about 292.6px. At 390px, widths equaled 390; card right edge 378px; form right edge about 362.6px.
- No new actionable issue observed beyond UX-REG-02 (access-request discoverability pending product disposition).

Only GET `/api/auth/me` requests occurred (200 initial and after reload). No login/register POSTs, no report/admin APIs, and no data writes. No page errors. Screenshots: [English registration at 320](../../output/playwright/registration-keyboard-20260929/register-en-320x800.png), [Chinese registration at 320](../../output/playwright/registration-keyboard-20260929/register-zh-320x800.png), [Chinese registration at 390](../../output/playwright/registration-keyboard-20260929/register-zh-390x844.png).

Disposable DB/profile/script removed; port 58923 stopped. No source edits. Workspace has shared uncommitted changes; branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`; no commit/push.