# Hermann current-bundle visitor onboarding discoverability — 2026-09-29

## Session

- Target: live `updater-vnext` at `http://127.0.0.1:8788`, read-only signed-out access.
- Browser: headed Microsoft Edge 154 via cached Playwright Core, disposable profile, 390×844 viewport.
- Preflight: `/health` 200. All six served UI assets byte-matched current workspace; `app.js` SHA-256 `3e47741844e6329e6a089b553ccafa8a5144c7b8cda1c1ee6970757ba6367450`.

## Result

Registration mode rendered the invitation-required field and helper text in English and Chinese. The wording instructs users to ask/contact an approved member, but the form contains no anchor/contact link or self-service access-request route in either locale. Requests were GET-only; no credentials, registration data, or writes were sent. No browser errors; profile removed.

This confirms current rendered behavior for `UX-REG-02`; whether to add a contact/request path remains an owner product-policy decision, so this remains a tracked UX finding rather than an asserted product defect. A first harness assertion incorrectly equated Chinese “contact” wording with a contact link. It was corrected to inspect actual rendered anchors; the clean rerun result is PASS.

## Artifacts

- Runner: `../output/playwright/live-onboarding-discoverability-3e477-20260929/run.mjs`
- Result: `../output/playwright/live-onboarding-discoverability-3e477-20260929/result.json`
- Screenshots: `../output/playwright/live-onboarding-discoverability-3e477-20260929/registration-en.png` and `registration-zh-CN.png`
