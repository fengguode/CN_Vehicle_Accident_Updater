# UX-REG-03/04 current-bundle Edge acceptance — Hermann

**Date:** 2026-09-29 (Asia/Shanghai)  
**Target:** Isolated `updater-vnext` synthetic service, `http://127.0.0.1:59901`; current app bundle.  
**Browser:** Microsoft Edge 154.0.4258.37, headed Playwright API, unique disposable persistent profile, 390×844.  
**Data:** Disposable SQLite DB with synthetic admin, duplicate username, and three synthetic invitations. No real users or production data. Live ports 8788 and 8793 were not touched.

## Preflight and source identity

The isolated service returned `/health` 200. Before UI interaction, the browser fetched all six UI files from the same origin. Served/source SHA-256 matched for `index.html`, `app.js`, `styles.css`, `navigation.js`, `viewport.js`, and `report-presentation.js`. The served `app.js` hash matched the requested `3e47741844e6329e6a089b553ccafa8a5144c7b8cda1c1ee6970757ba6367450` exactly.

## Acceptance results

| Scenario | Result and evidence |
|---|---|
| Invalid invitation in English | **Pass.** Registration Enter submit returned HTTP 400 and displayed “This invitation code is invalid, expired, or already used. Check the code or ask for a new one.” The status is `role=status`, `aria-live=polite`; username, password (presence only recorded), and invitation values remained; Create account retained keyboard focus with a visible 3px outline. |
| Change locale while invalid-invitation error is visible | **Pass.** Switching to Chinese updated the existing message in place, preserved all three fields, and focused the language toggle. Submitting again in Chinese returned HTTP 400 with the Chinese localized error; switching back to English refreshed the visible error again. |
| Duplicate username in English and Chinese | **Pass.** Both submissions returned HTTP 400 with the matching locale-specific copy. Switching to Chinese while the English duplicate error was visible updated that message in place. Both retained the entered fields and returned visible 3px focus to Create account; the message remained a polite status. |
| Rejected-attempt account/session/invitation state | **Pass.** After invalid invitation and both duplicate attempts, synthetic DB remained at 2 users, 0 sessions, 3 invitations, 0 used invitations. All three invitation records remained unused. |
| Invitation reuse after duplicate | **Pass.** The same still-unused invitation used in the duplicate rejection then registered a different username successfully (HTTP 201); synthetic DB showed one new user, one session, and the invitation marked used by that new account. |
| Unexpected safe server error | **Pass.** A synthetic `BEFORE INSERT` trigger raised `PRIVATE_SQLITE_SENTINEL`. UI displayed only “Registration could not be completed.” with a polite status; no SQLite/SQL sentinel text appeared. DB user/session/used-invitation counts were unchanged and the invitation remained available. After dropping the test trigger, that same invitation registered a new user successfully (HTTP 201). |

There were zero browser page errors. Final acceptance checks all passed. Screenshots capture baseline, English/Chinese invitation errors and locale switches, English/Chinese duplicate errors, generic server failure, and successful pending-account states.

## Cleanup and artifacts

The isolated service was stopped; its health route was unreachable afterward. The synthetic database and Edge profile were removed. Machine-readable requests, per-case state, preflight hashes, acceptance booleans, and cleanup details are in [results.json](../../output/playwright/ux-reg-03-04-current-bundle-20260929/results.json). The repeatable harness and screenshots are in the same [output folder](../../output/playwright/ux-reg-03-04-current-bundle-20260929/).

No application source was changed by this tester run. Production origin and accounts were not involved.
