# Hermann live signed-out UX recheck — current 8788 bundle

**Date:** 2026-09-29 (Asia/Shanghai)  
**Owner:** Primary agent, Hermann User Tester  
**Target:** `updater-vnext` localhost service `http://127.0.0.1:8788`  
**Outcome:** Exercise the available signed-out Reports and Account/registration UI without mutating the live service.

## Acceptance checks

- Confirm health and exact parity for the six served UI assets before browser acceptance.
- In headed Edge, verify the signed-out Reports gate and Account/login/registration at 390×844; verify registration at 320×844.
- Verify required invitation input and helper association, English/Chinese rendering, keyboard focus, and horizontal overflow.
- Confirm there are no non-GET API requests, page errors, or admin/Feedback navigation while signed out; close and remove the disposable browser profile.

## Results

- The server was ready: `/health` returned 200. `/api/auth/me` returned 200 with `user:null` and `csrf:null`.
- Microsoft Edge headed via bundled Node `playwright` API opened the actual 8788 origin. Root HTML, `app.js`, `styles.css`, `navigation.js`, `report-presentation.js`, and `viewport.js` all returned 200 and byte-hash matched the workspace source. Current `app.js` SHA-256: `f3871211b679e29c2a1d7c44c921871b740a2bf91fc96ce3888fbb93ec6ae6c6`; `styles.css`: `0f2c947585740633653741dadc1108a85b721f16846a0f622be56d14bc179e19`.
- At 390×844 the Reports view displayed the sign-in gate, no report cards, `aria-busy=false`, and hidden admin/Feedback navigation. Account opened the login form; switching to registration displayed a required invitation field, visible helper copy, and `aria-describedby="invite-help"`.
- Chinese registration kept the required invitation field and rendered the localized helper. 320×844 and 390×844 registration layouts had matching document/body scroll and client widths (no horizontal overflow).
- Keyboard check on Account: opening it focused Username; Tab reached Password, Log in, and Register with visible `:focus-visible` and a 3 px solid outline. Activating Register focused the invitation field and retained its required/helper association.
- Only API request observed was GET `/api/auth/me`; there were zero non-GET requests and zero page errors. Disposable profile was removed. No live write or test account was used.
- First keyboard harness attempt had a JavaScript variable-scope typo and stopped before focus checks; the corrected bounded rerun passed. This was a harness issue, not a product finding.

## Disposition

No new signed-out UI defect was observed in this session. This is a scoped acceptance result, not full UX closure: authenticated member/admin live behavior remains under `LIVE-FEEDBACK-01`, since the 8788 runtime database identity and authenticated live session are still unverified. Port 8793 remained unavailable during this recheck.

## Artifacts and Git

- [Browser results](../../output/playwright/live-signedout-8788-recheck-20260929/results.json)
- [Keyboard results](../../output/playwright/live-signedout-8788-recheck-20260929/focus-results.json)
- [Signed-out Reports screenshot](../../output/playwright/live-signedout-8788-recheck-20260929/reports-390x844.png)
- [Chinese registration screenshot at 320px](../../output/playwright/live-signedout-8788-recheck-20260929/registration-zh-320x844.png)
- Repository: branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`, ahead 18. UI source and shared QA/backlog were already dirty; this session changed only QA/backlog/artifact files. No commit or push.
