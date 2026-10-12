# QA session: live signed-out registration route

**Date:** 2026-09-29 (Asia/Shanghai)  
**Target:** `http://127.0.0.1:8788/`, live read-only; `/health` 200 and anonymous `/api/auth/me` `{user:null,csrf:null}` before and after  
**Browser:** Microsoft Edge 154.0.4258.37, headed Playwright  
**Viewport:** 390×844  
**Build parity:** At test time, served app.js SHA-256 `E11633259C3400F532424AA63567C1A7D27F180290B8C413F625B06F358F65FC` and styles.css `B6071808AF773A20C03ACE8F5D5BE34C00A564CCE32705A28DA9F112D3E0EC8D` matched workspace source.

## Rendered checks

- Signed-out Reports displayed an approval/account gate. Navigation contained Reports and Account only; Login was available; no admin or Feedback navigation appeared.
- Account showed username/password login. Registration showed required username, password, and invitation-code fields.
- English helper instructed users to ask an approved member to create/share a one-use code. Chinese toggle showed the matching translation. The helper was associated with the invitation field (`aria-describedby`); switching to registration focused that field with a visible 3px outline.
- The UI offered no contact, access-request, or member-discovery path for a visitor who does not already know an approved member. Invitation-only policy may be intentional; tracked as UX-REG-02 pending product disposition, not asserted as a confirmed defect.

No credentials entered, no forms submitted, and all fields remained empty. Only API request was GET `/api/auth/me`; no report/admin/feedback data requests or writes. Zero page errors. Screenshots: [Reports gate](../../output/playwright/live-signedout-8788-20260929/signed-out-reports-390x844.png), [Account login](../../output/playwright/live-signedout-8788-20260929/account-login-390x844.png), [English registration](../../output/playwright/live-signedout-8788-20260929/account-register-en-390x844.png), [Chinese registration](../../output/playwright/live-signedout-8788-20260929/account-register-zh-390x844.png).

Disposable browser profile and script removed. No source files changed. 8788 remains running; no authentication or write action was attempted. Workspace has shared uncommitted changes; branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`; no commit/push.