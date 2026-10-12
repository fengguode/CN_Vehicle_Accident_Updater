# Hermann disabled-member active-session feedback check — 2026-09-30

## Session

- Target: isolated current-source UI/API service with fresh SQLite DB and two disposable Edge profiles; live 8788 untouched.
- Browser: headed Microsoft Edge 154.0.4258.37; member 390×844, admin 1280×900.
- Preflight: health 200; all six served UI assets matched source (`app.js` SHA-256 `3e47741844e6329e6a089b553ccafa8a5144c7b8cda1c1ee6970757ba6367450`, CSS `a8b4940018d81333226db42bf7507c57af51b6cdc1e120ced4fb660a36e06423`).
- Accounts: synthetic admin and approved synthetic member only.

## Results

Member entered an unsent Issue draft. Admin disabled the member through User management (PATCH 200). The member's next submit returned 401; the app hid Account actions and showed the sign-in form, but the account status message was blank. The unsent title, description, and context remained in the in-memory form. Admin re-enabled the account (PATCH 200); the member signed in again and the draft was still present.

This adds browser evidence to **UX-AUTH-REVOKED-01**: the session is correctly denied after admin disable and recovery after re-enable works, but the sign-out state gives no reason. Owner disposition remains needed on whether to explain the revocation. No page errors; isolated service, database, and profiles removed.

## Evidence

- Runner: `../output/playwright/feedback-disabled-member-session-20260930/run.mjs`
- Results: `../output/playwright/feedback-disabled-member-session-20260930/results.json`
- Screenshots: `../output/playwright/feedback-disabled-member-session-20260930/member-unsent-draft-before-disable.png`, `member-disabled-after-401.png`, `member-restored-draft.png`

