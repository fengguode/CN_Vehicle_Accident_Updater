# QA-01 live signed-out registration and Reports gate — 69F09 stylesheet

**Date:** 2026-09-29. **Target:** existing `http://127.0.0.1:8788/`; strict read-only browser inspection. No credentials or form values were entered, and no form was submitted.

## Preflight and source identity

- `/health` returned 200 (`{"ok":true,"service":"adas-vnext"}`); `/api/auth/me` returned `{"user":null,"csrf":null}`.
- The app shell is served at `/` (200). `/index.html` is intentionally unrouted (404); root response bytes matched workspace `apps/web/index.html`.
- Six served asset/source comparisons passed: `index.html`, `app.js`, `styles.css`, `navigation.js`, `report-presentation.js`, and `viewport.js`.
- SHA-256: app.js `9f56a4081a8d3f6369b52d1805d8960ef6d86bbab2b9a21cd94e697654adfc1f`; styles.css `69f09a8d660b83e808715a2045e313a30e94eccfdbd3dddc76553a4e535454fc`; index.html `09379f2df2553c5de80ce22c90d8953906c7781f6e5f953b4bef65dd2bea2459`; navigation.js `7a1114587842f11bace2b1b4d69f9d15d5e35ae946abf7efd0f5564461dcea56`; report-presentation.js `d0a081dc918f6c848d15a865d890eb8695d6554d1f626a8db4f26edcf1d07d6f`; viewport.js `fef9e10e9114de24f83a0ca909b841c1b93f1a6aa84fe8dabb023235893922da`.
- Browser: Microsoft Edge 154.0.4258.37, headed direct Node Playwright API with cached playwright-core and unique temporary profile. 320×800 and 390×844.

## Results

At 320×800 the rendered Reports view showed the signed-out gate (“Sign in with an approved account to view reports. Open account”). Workspace navigation showed Reports and Account; User management and Feedback navigation were hidden. Page/body client and scroll widths were both 320px. The 390px run began after the first run left Account open; therefore **Reports gate at 390px was not independently re-observed** and is unverified in this session.

Account login mode appeared without filling fields. Its toggle was “Register with invitation”. The rendered invitation registration journey was inspected at both widths: invite helper visible in English and Chinese, invitation field required in registration mode, and input `aria-describedby="invite-help"` remained attached during language switch. Chinese labels/helper were rendered while registration remained open. At both viewports document/body scroll widths equaled viewport width (320/320 and 390/390); no horizontal overflow. Keyboard Tab sequence at each width reached username, password, invitation code, submit, and mode toggle with visible 3px blue focus outlines. No page errors.

Browser request log contained GETs only. The browser's final `/api/auth/me` check remained user-null. No report/admin data requests were made and no account/session changes occurred.

The first bounded browser attempt toggled from login into registration incorrectly because the helper was already open; it returned to login and timed out waiting for the invitation field. The corrected pass checked current form state before toggling and completed registration inspection. This is a harness issue, not a product finding. The mislabeled 390px Reports screenshot was discarded; screenshots listed below accurately represent their view/state.

Evidence: [`results.json`](../output/playwright/live-signedout-69f09-20260929/results.json), [320px Reports gate](../output/playwright/live-signedout-69f09-20260929/signedout-reports-320x800.png), English registration [320px](../output/playwright/live-signedout-69f09-20260929/signup-en-320x800.png) / [390px](../output/playwright/live-signedout-69f09-20260929/signup-en-390x844.png), Chinese registration [320px](../output/playwright/live-signedout-69f09-20260929/signup-zh-320x800.png) / [390px](../output/playwright/live-signedout-69f09-20260929/signup-zh-390x844.png), and keyboard sequences [320px](../output/playwright/live-signedout-69f09-20260929/signup-zh-keyboard-320x800.png) / [390px](../output/playwright/live-signedout-69f09-20260929/signup-zh-keyboard-390x844.png). Runner: [`run.mjs`](../output/playwright/live-signedout-69f09-20260929/run.mjs).

## Cleanup and disposition

The unique browser profile was removed. Live service was not modified; final auth remained null. No product issue found. Limitations: Reports gate at 390px is unverified here; live service/database identity remains unknown; authenticated UI and all writes remain excluded. QA-01 remains open.
