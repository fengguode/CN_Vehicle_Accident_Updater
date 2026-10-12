# Hermann live signed-out feedback boundary — 2026-09-30

## Runtime and scope

- Target: live `updater-vnext` at `http://127.0.0.1:8788`; `/health` returned 200 (`adas-vnext`). Port 8793 refused connection.
- Browser: headed Microsoft Edge 154, cached Playwright Core, disposable profile, 390×844.
- All six served UI assets byte-matched current `apps/web` source, including `app.js` SHA-256 `3e47741844e6329e6a089b553ccafa8a5144c7b8cda1c1ee6970757ba6367450` and `styles.css` `a8b4940018d81333226db42bf7507c57af51b6cdc1e120ced4fb660a36e06423`.

## Results

PASS for the signed-out boundary. Feedback submission and administrator navigation were hidden. Signed-out GET `/api/feedback/mine` and `/api/admin/feedback` both returned 401 `authentication_required`. In registration mode, a one-character username showed the browser validation message “Enter at least 3 characters,” focus stayed on Username, and no registration request was sent. Chinese locale rendered after toggling. Network log contained only GET requests; no POST or other writes occurred. No page errors. Two browser console 401 messages corresponded to the intentional unauthenticated feedback/admin GET checks. Temporary browser profile removed.

Authenticated live flows were not exercised because the running service's database/account binding is still unknown; the prior isolated synthetic lifecycle pass covers those journeys without touching live accounts or data.

## Evidence

- Runner: `../output/playwright/live-signedout-feedback-boundary-20260930/run.mjs`
- Results: `../output/playwright/live-signedout-feedback-boundary-20260930/results.json`
- Screenshots: `../output/playwright/live-signedout-feedback-boundary-20260930/signedout-invalid-registration.png` and `signedout-registration-zh.png`
