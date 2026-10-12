# Hermann member login error recovery — 2026-09-29

## Session

- Target: a fresh `updater-vnext` API/UI service on ephemeral localhost with a disposable SQLite DB; `8788` was health-checked but not used for authenticated traffic.
- Browser: headed Microsoft Edge 154 via cached Playwright Core, fresh temporary profile, 390×844 viewport.
- Readiness: health passed and all six served UI assets byte-matched current `apps/web` source.
- Synthetic fixture: one approved member and one synthetic administrator; no real credentials or user data.

## Results

PASS. The synthetic member submitted one deliberately incorrect password. The browser displayed “Username or password is incorrect.”, kept the form visible and enabled, and focused the submit button. Retrying with the correct password signed in successfully. The approved member identity was confirmed by `/api/auth/me`, the Reports access gate closed, and the Account feedback form appeared while User management and Feedback-admin navigation stayed hidden. No page errors. The isolated service stopped, and the disposable DB and browser profile were removed.

A first runner attempt stopped after the wrong-password response because its harness tried to read an unused undefined value; no product behavior failed. The harness was corrected and the entire flow rerun successfully from a fresh DB/profile. The first attempt's isolated service and files were cleaned.

## Artifacts

- Runner: `../output/playwright/member-login-recovery-current-20260929/run.mjs`
- Accepted result: `../output/playwright/member-login-recovery-current-20260929/result.json`
- Screenshots: `../output/playwright/member-login-recovery-current-20260929/member-login-error.png` and `member-approved-account.png`
