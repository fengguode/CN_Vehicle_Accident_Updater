# Hermann live signed-out browser recheck — 2026-09-29

## Scope and safety

Read-only rendered recheck of live `http://127.0.0.1:8788/`: Reports gate, Account login/invitation registration, English/Chinese language switching, responsive layout, and visible keyboard focus at 320×800 and 390×844. No credentials were entered; no forms were submitted; no live account/report/admin data was requested or mutated.

## Preflight and environment

- `/health` returned 200. `/api/auth/me` returned `{ "user": null, "csrf": null }` before and after the browser pass.
- Current app.js SHA-256: `9F56A4081A8D3F6369B52D1805D8960EF6D86BBAB2B9A21CD94E697654ADFC1F`; live-served `/app.js` matched byte-for-byte.
- Current styles.css SHA-256: `CAFE53B8491E9BCE07476A33EEF7CB2A4DE424ADF21ACDC4B06FFEF44E573EC8`; live-served `/styles.css` matched byte-for-byte. This is newer than the supplied `91615ADD…` CSS reference; verification used the exact current matching source/served pair.
- Browser: Microsoft Edge 154.0.4258.37, headed. Automation: direct import of the already cached `playwright-core` module from a Node v24.14.0 script, with a unique disposable Edge profile under `%LOCALAPPDATA%\Temp\hermann-live-signedout-8788-current-20260929`.
- The task context reported that the `npx` Playwright CLI had hung. I did not retry it; the cached direct Playwright Core path rendered and controlled the expected live app. An initial runner stopped on a DOM-only selector syntax error after opening registration; no form submission or write occurred. The corrected headed runs completed.

## Results

| Check | Result | Evidence |
| --- | --- | --- |
| Reports gate, 390×844 and 320×800 | Pass | Rendered “Reported incident leads” and “Sign in with an approved account to view reports.” Admin and Feedback navigation were hidden. Document/body client and scroll widths were 390/390 at 390px and 320/320 at 320px. |
| Account login and registration | Pass | Account initially showed Log in and username/password only. “Register with invitation” switched to the registration form; the invitation input became required and its helper remained visible and associated by `aria-describedby="invite-help"`. |
| English/Chinese switch | Pass | `document.documentElement.lang` changed between `en` and `zh-CN` while registration stayed open. English helper: “Ask an approved member to create and share a one-use invitation code with you.” Chinese helper: “请联系已获批准的成员为您创建并分享一次性邀请码。” |
| Keyboard/focus | Pass | At 320×800, activating registration focused the invitation-code input with `:focus-visible` and a 3px blue outline (`rgb(33, 125, 206)`). Keyboard traversal then reached submit/mode/navigation controls and the username input; no form was submitted. At 390×844, a 3px focus-visible outline was also observed on the active button in the registration view. |
| Requests and errors | Pass | Browser network log contained static GETs and `/api/auth/me` only. No `/api/reports`, admin, or feedback data requests; no non-GET requests; no browser page errors. Final auth remained user-null. |

Screenshots: [live signed-out pass](../../output/playwright/live-signedout-8788-current-source-20260929/), including Reports gate and English/Chinese registration at both viewport widths, plus keyboard-sequence images.

## Cleanup and Git state

The disposable Edge profiles and runner files were removed. No service was started, stopped, or reconfigured. Port 8788 remained healthy and signed out. No application code was edited. The QA note and canonical backlog update are uncommitted in the existing shared working tree; branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`. `git diff --check` was run after the backlog update; result is recorded in the handoff.
