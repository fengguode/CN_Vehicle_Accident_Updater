# Hermann live invitation registration keyboard and locale check — 2026-09-29

## Session

- Target: live `updater-vnext` at `http://127.0.0.1:8788`; health was 200 immediately before this pass.
- Browser: headed Microsoft Edge via cached Playwright Core, fresh temporary profile, 390×844 viewport. The six served UI files were checked against current workspace immediately in the preceding signed-out continuation and were byte-identical.
- Scope: signed-out Account → invitation registration; inspect focus after mode switch, Tab order from invitation field, required state and associated help text, language switch to Chinese and back, and browser request methods.

## Result

PASS. Registration mode focused the invitation field; it was required and its `aria-describedby` target was visible. Tab moved from the invitation field to Create account. Chinese and English mode updated `html[lang]`, document title, and invitation label; invitation help and required state remained present. The browser sent only GET requests (`/`, assets, `/api/auth/me`, favicon), no writes; no page errors. Temporary browser profile was removed. No new defect found.

## Artifacts

- Runner: `../output/playwright/live-registration-keyboard-locale-20260929/run.mjs`
- Result: `../output/playwright/live-registration-keyboard-locale-20260929/result.json`
- Screenshot: `../output/playwright/live-registration-keyboard-locale-20260929/registration-zh-cn.png`
