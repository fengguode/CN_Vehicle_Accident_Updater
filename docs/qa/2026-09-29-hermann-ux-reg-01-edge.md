# UX-REG-01: Invitation guidance in registration mode

## QA session

- **Date:** 2026-09-29 (Asia/Shanghai)
- **Target:** `updater-vnext`, fresh disposable local service at `http://127.0.0.1:63854`
- **Build identity:** served `apps/web/app.js` SHA-256 matched the current workspace source: `a4ef417072e185bf8871c3f205aaad72ee348d259f163531a9e386bf74f9e794`
- **Browser:** Microsoft Edge `154.0.4258.37`, headed, direct Playwright API (`playwright-core`), isolated persistent profile under the OS temp directory
- **Viewports:** `320×800` and `390×844`
- **Data and safety:** fresh empty SQLite database; no account or invitation submissions; request monitor observed zero POSTs; port 8788 was not used
- **Startup/preflight:** isolated `/health` returned 200, app rendered, and UI/API shared the same origin. The served bundle hash matched source.
- **Cleanup:** Edge context/profile, isolated service, SQLite database and temp directory removed by harness.

## Acceptance criteria and results

| Scenario | Expected | Actual | Result |
|---|---|---|---|
| Signed-out Login mode | Invitation helper and code field are absent/hidden | Both helper and field were hidden at both viewport sizes | PASS |
| Keyboard-switch to registration | Registration mode exposes the invitation field and helper | Enter on the mode control switched to registration at both sizes | PASS |
| English guidance | Exact copy: “Ask an approved member to create and share a one-use invitation code with you.” | Exact expected copy rendered | PASS |
| Chinese guidance | Localized equivalent: “请联系已获批准的成员为您创建并分享一次性邀请码。” | Exact expected copy rendered, with document language `zh-CN` | PASS |
| Accessible field description | Invitation input references the helper; helper is hidden in Login | Register input had `aria-describedby="invite-help"`; helper was hidden in Login | PASS |
| Keyboard operation and focus visibility | Controls can be reached in form order and focus is visible | Username → password → invitation code → submit → mode; tested visible 3px solid outline on Login mode and invitation code controls | PASS |
| Responsive layout | No horizontal document/body overflow at 320×800 and 390×844 | `scrollWidth` equaled viewport width at both sizes in English registration, Chinese registration and returned Login mode | PASS |
| Side effects/runtime errors | No account/invitation submission or page error | No POST requests and no page errors | PASS |

The first harness attempt stopped on a harness focus setup error: after switching to registration it assumed focus had moved to the username field, but focus remained on the mode control. The screenshot showed registration correctly rendered and focus visibly on the mode control. I corrected the harness to focus username before checking sequential tab order and reran the full acceptance; the results above are from the successful rerun.

## Evidence

- Automated acceptance details: [`results.json`](../../output/playwright/ux-reg-01-edge-20260929/results.json)
- Reproducible harness: [`run.mjs`](../../output/playwright/ux-reg-01-edge-20260929/run.mjs)
- Screenshots: [`320-register-en.png`](../../output/playwright/ux-reg-01-edge-20260929/320-register-en.png), [`320-register-zh.png`](../../output/playwright/ux-reg-01-edge-20260929/320-register-zh.png), [`390-register-en.png`](../../output/playwright/ux-reg-01-edge-20260929/390-register-en.png), [`390-register-zh.png`](../../output/playwright/ux-reg-01-edge-20260929/390-register-zh.png)

## Disposition and limits

UX-REG-01 acceptance passed for the specified signed-out English/Chinese flows, keyboard navigation, helper association, and two mobile viewport widths. No user-facing defect was reproduced. This is browser automation evidence, not a native screen-reader or physical-device evaluation. No form submission, registration, invitation creation, account persistence, or broader authentication authorization behavior was tested.
