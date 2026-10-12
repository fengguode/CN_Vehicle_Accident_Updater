# QA session: cross-tab feedback identity isolation

**Date:** 2026-09-29 (Asia/Shanghai)  
**Target:** `updater-vnext`, Account feedback list and shared session refresh.  
**Finding:** UX-STATE-02, prior member feedback remained in a tab after its shared session changed to a different member.  
**Owner:** Primary; Hermann User Tester; Dennis independent source reviewer.  
**Source:** branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`; shared worktree is dirty.

## Change and acceptance

On every auth identity change, `renderAuth()` now increments the feedback request ID, clears the prior identity's request list and status, and reloads the list for the new signed-in identity when Account is open. Shared `/api/auth/me` reads use a monotonically increasing request ID plus an identity-generation snapshot; older responses cannot overwrite a newer auth state. `loadMyFeedback()` already checks request ID, current view, and user ID before rendering results or errors.

Acceptance: switch a two-tab shared browser session from member A to member B while A's list GET and an older A auth response are held; confirm B becomes current, A's data clears, B sees only B's list, and releasing both old responses cannot restore A's data or identity. Confirm A's request remains available when A signs in again.

## Browser and isolated service

- Browser: Microsoft Edge 154.0.4258.37, headed.
- Automation: cached `playwright-core` direct Node API, persistent Edge context with two tabs sharing one disposable profile.
- Viewport: 1280×800.
- Target: fresh isolated service at `http://127.0.0.1:65516`, disposable SQLite database, synthetic member A/B only. Port 8788 and its database were not touched.
- To trigger the app's normal auth-refresh recovery deterministically, the harness returned controlled 403 responses for Refresh actions, then held A's successful `/api/auth/me` and `/api/feedback/mine` responses while B became current. These were harness controls in the isolated session.

## Results

| Scenario | Expected | Actual | Result |
|---|---|---|---|
| Member A request seeded and displayed | A sees own request | Both tabs initially loaded the synthetic A request | Pass |
| A feedback GET and auth snapshot held | Old responses remain pending through identity switch | A's list GET and `/api/auth/me` returned successfully upstream but were held by Playwright | Pass |
| Shared session changes to member B | Tab A clears A's card and displays B identity/list | Tab B switched shared cookies to B; Tab A displayed `qa-member-b`, cleared A's card, and showed B's empty list | Pass |
| Release old A list response | A data stays hidden from B | No A card reappeared | Pass |
| Release old A auth response last | B remains the displayed identity | Tab A remained `qa-member-b`; stale A response was discarded | Pass |
| Persistence and privacy | B has no A request; A retains own request | B API list count was zero; after signing back in, A still saw the persisted request | Pass |
| Browser errors | No page errors | None | Pass |

An earlier natural 30-second poll run passed the direct A→B list-clearing case before the latest auth sequencing guard. The recorded `current-race-results.json` is the authoritative regression for the latest source; it uses controlled 403 Refresh recovery instead of waiting on the periodic timer.

## Evidence and cleanup

Sanitized results and screenshots: [`output/playwright/ux-state-02-cross-tab-20260929/`](../../output/playwright/ux-state-02-cross-tab-20260929/), including [`current-race-results.json`](../../output/playwright/ux-state-02-cross-tab-20260929/current-race-results.json). Hermann removed the disposable service, database, profile, and harness and confirmed port 65516 closed. No real account or database was changed; no live service was restarted.

After the current source changes, `node --check apps/web/app.js` passed and `npm test` passed 66/66. Dennis independently reviewed the list invalidation and auth snapshot sequence and found no remaining cross-identity list leak in the reviewed scope. A neighboring retry-report-access stale-error path is tracked separately as UX-STATE-03.

## Disposition and Git state

This session passes the cross-tab feedback-list privacy regression for two synthetic members, including an older list response and auth snapshot arriving after the newer identity. Dennis's independent review found no remaining race in this scope; UX-STATE-02 is complete for the tested shared-session/list behavior. This does not prove authenticated feedback through the active port-8788 process, which remains LIVE-FEEDBACK-01. The `updater-vnext` working tree contains the source, backlog, and QA edits alongside pre-existing shared work; no commit or push was made.
