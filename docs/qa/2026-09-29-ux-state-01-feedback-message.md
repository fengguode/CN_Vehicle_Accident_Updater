# QA session: clear feedback notice on account change

**Date:** 2026-09-29 (Asia/Shanghai)  
**Target:** `updater-vnext`, Account feedback lifecycle.  
**Finding:** UX-STATE-01, stale submit-success notice after same-tab identity changes.  
**Owner:** Primary; independent rendered regression by Hermann (User Tester).  
**Source:** branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`; existing shared changes remain uncommitted.

## Change and acceptance

`apps/web/app.js` clears `#feedback-message` whenever `renderAuth()` detects an authenticated identity change. It also increments `authIdentityGeneration`; both the success and error continuation of a pending feedback submission check that generation before changing feedback UI state. A delayed response from an earlier identity therefore cannot recreate a notice after logout or account switching.

## Browser and service

- Browser: Microsoft Edge 154.0.4258.37, headed.
- Automation: Playwright direct Node API using cached `playwright-core`, `launchPersistentContext(channel: 'msedge')`.
- Profile: new disposable Edge profile.
- Viewport: 1280×800.
- Target: isolated vNext service at `http://127.0.0.1:52568` with a fresh disposable SQLite database and synthetic `qa-member` / `qa-admin` accounts. Port 8788 and its database were not used.
- Race follow-up: fresh isolated service/database at `http://127.0.0.1:50195`, same browser/version/viewport and synthetic account pattern, fresh disposable profile.

## Results

| Scenario | Expected | Actual | Result |
|---|---|---|---|
| Member submits an Issue | Stable request reference and success confirmation | Request created; reference displayed | Pass |
| Member logs out | Old confirmation clears | Feedback message became blank | Pass |
| Admin triages request | Admin can update status and public/private text | Status changed to Under review; admin saw both updates | Pass |
| Member logs in again in the same tab | No stale success confirmation; latest public status remains; private note is absent | Feedback message stayed blank; Under review and public update appeared; private note was absent | Pass |
| Browser errors | No page errors | None | Pass |
| Delayed successful submit response | A submission accepted before logout must not restore a notice after an identity change | Playwright forwarded the member POST; isolated API committed HTTP 201, then Playwright held the response through member logout, admin login/triage/logout, and member relogin. The member saw Under review + public update, no private note, and a blank message before release. After releasing HTTP 201, the message remained blank; the request/status/update persisted and the private note remained absent. | Pass |

Two earlier harness attempts stopped because of locator mistakes (the update was nested in the history paragraph; logout required opening Account). The corrected run completed the full sequence and all checks above. This is a harness correction, not an application failure.

## Evidence and cleanup

Sanitized results and screenshots: [`output/playwright/ux-state-01-regression-20260929/`](../../output/playwright/ux-state-01-regression-20260929/), including [`results.json`](../../output/playwright/ux-state-01-regression-20260929/results.json) and [`race-results.json`](../../output/playwright/ux-state-01-regression-20260929/race-results.json). Both disposable databases, profiles, and harnesses were removed; both isolated service ports were confirmed closed. No real account or database was changed. No live service was restarted.

Source checks after the fix: `node --check apps/web/app.js` passed; `npm test` passed 66/66; `git diff --check` exited 0 (Git reported existing LF-to-CRLF working-copy warnings only). Dennis's read-only review independently confirmed the root cause and the current anonymous 8788 routes; authenticated use of that live process remains unverified under LIVE-FEEDBACK-01.

## Disposition and Git state

The original sequential UX-STATE-01 flow and Dennis's asynchronous-race follow-up both passed in fresh isolated Edge sessions. The race harness verified the backend committed the submission before holding its HTTP 201 response; identity changed while the response remained pending; releasing the response did not restore a stale notice or expose private data.

Primary added `authIdentityGeneration`, incremented on every auth identity change. The submission success and error continuations return before changing feedback UI state if the generation changed while awaiting the request. `node --check apps/web/app.js` passed and `npm test` passed 66/66 after this guard. Dennis independently reviewed the guard and held-response evidence and found no regression in the UX-STATE-01 path; he did identify a separate cross-tab request-list issue, tracked as UX-STATE-02. UX-STATE-01 is complete for the sequential and delayed-response flows tested here. LIVE-FEEDBACK-01 still requires an owner decision on authenticated verification against the active service. The `updater-vnext` working tree contains the existing shared modifications plus the fix, backlog update, and this QA note; no commit or push was made.
