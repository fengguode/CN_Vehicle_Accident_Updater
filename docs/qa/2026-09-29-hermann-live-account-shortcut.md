# Hermann live signed-out header Account shortcut — 2026-09-29

## Session

- Target: live `updater-vnext` at `http://127.0.0.1:8788`; health 200.
- Browser: headed Microsoft Edge via cached Playwright Core, fresh temporary profile, 390×844 viewport.
- Scope: click the signed-out header Log in shortcut, verify Account form visibility and keyboard focus, navigate back to Reports, and monitor requests.

## Result

PASS. The header shortcut showed “Log in” on the signed-out Reports gate. Clicking it opened Account, hid the redundant header shortcut, focused the username field, and displayed the login form. Returning to Reports restored the Reports gate and header shortcut without overflow. Requests were GET-only (shell/assets/auth state/favicon); no writes or page errors. The temporary profile was removed. No new defect found.

Process safety: the current listener is PID 2368 per `netstat`, but this shell's read-only CIM query returned Access Denied. Port 8793 still refuses connections. No authentication or mutation was attempted.

## Artifacts

- Runner: `../output/playwright/live-account-shortcut-20260929/run.mjs`
- Result: `../output/playwright/live-account-shortcut-20260929/result.json`
- Screenshot: `../output/playwright/live-account-shortcut-20260929/account-shortcut.png`
