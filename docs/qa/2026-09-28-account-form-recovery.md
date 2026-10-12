# Account form resilience and duplicate-submit QA

**Date:** 2026-09-28 (Asia/Shanghai)  
**Target:** `updater-vnext/apps/web/app.js`, Account login/register/password/logout/invitation controls.  
**Owner:** Primary; Hermann disposable browser acceptance; Dennis independent code review.

## Acceptance checks

- Native required/minimum-length validation prevents invalid credential submission and focuses the invalid field.
- Wrong credentials and server/network errors provide accessible feedback, retain relevant form values, and leave controls usable.
- A rapid repeated activation permits at most one in-flight POST for login/register, password change, logout, and invitation creation; pending controls are disabled. Completion restores controls and meaningful focus.
- Successful login or registration hides the auth form and moves focus to the visible Account heading; failures keep focus on the re-enabled submit button, and navigating away does not steal focus.
- Successful logout clears auth and protected report access; invitation output does not retain an earlier code after a new creation attempt begins.
- Test only with synthetic accounts, invitations, report data, disposable service/database, and local fault injection; record process/port/temp cleanup.

## Finding and code change

Hermann's first isolated browser pass submitted empty and short-password login forms; native validation stopped each before a request and focused the invalid field. Wrong credentials returned 401 with polite translated feedback, preserved values, and retained Login focus. A one-shot synthetic 500 preserved entered values and focus; the test proxy's message was synthetic, so no backend error disclosure defect is inferred. A held double-click on valid login produced two POSTs, two sessions, and duplicate protected-data loads. Logout otherwise returned the UI to signed-out state and report access to 401.

Primary added pending guards and disabled controls for auth form submission (login/register), password change, logout, and invitation creation; repeated activations are ignored. Failure restores controls and focus. Starting a new invite clears previous output. No API contract or server authentication behavior changed.

Dennis's independent review found that successful login/registration hid the focused form but left focus without a visible target. Primary added a guarded Account-heading focus. Hermann's browser regression then reproduced BODY focus after login, while confirming exactly one POST on held double-click. Primary tightened the fix by focusing the heading immediately after auth rendering (while Account is current) and checking actual rendered visibility in `finally`; Dennis reviewed the follow-up: immediate focus fixes the observed BODY result without refocusing after the database load, so it cannot steal focus from another control. A fresh route-held browser retest of this latest adjustment passed for a successful Account-origin login. **At this note's original 2026-09-28 checkpoint, registration remained untested; that statement was superseded by the 2026-09-29 same-session Edge retest below.**

## Verification

| Check | Result |
|---|---|
| `node --check apps/web/app.js` | PASS |
| `npm test` | PASS, 65/65, 0 failures |
| `git diff --check` | PASS; Git emits existing LF/CRLF normalization warnings |
| Dennis independent review of post-auth focus | PASS on latest adjustment: immediate Account focus; no late focus theft; failure retains visible Submit focus |
| Baseline synthetic login behavior (before fix) | PASS as a regression reproducer; rapid held double-submit produced two POSTs/sessions and duplicate reads |
| Post-fix login browser regression | PASS in fresh isolated run: held login yielded exactly one POST; button disabled while pending; after success Account remained aria-current and rendered, and activeElement was `#account-heading` |
| Registration held-submit/focus and invitation-invalid/expired/reused cases | NOT RUN; remain in QA-01. A fresh registration fixture on port 18892 was created, but Playwright session `qa-register-focus` closed before any assertions; service/browser PIDs 78812/81732 exited, port cleared, exact `output/playwright/qa-register-focus-20260928` removed |

## Isolation and cleanup

Baseline browser target: synthetic local service on `127.0.0.1:8891` and fault/hold proxy on `127.0.0.1:8892`, fresh synthetic database/accounts, cached Playwright CLI 0.1.21 with Chrome. Hermann stopped PIDs 80144 and 82688, verified both ports clear, closed `qa-login-form`, and removed only `output/playwright/qa-account-forms-20260928`. No production account, database, service, or source was used. The first post-fix browser run found BODY focus and its active-view context was ambiguous. A fresh, route-held login regression then verified successful Account-origin login remains on Account with visible H1 focus and exactly one POST.

Latest follow-up browser session: API `127.0.0.1:8889`, proxy `127.0.0.1:8890`, Playwright `qa-account-guard`. Login double-click produced exactly one POST; password, invitation, and logout double-clicks each produced one POST. Password 500 preserved values and restored enabled-button focus; invitation 500 cleared previous output and restored button focus; logout signed out and focused Account. This earlier run reported BODY focus with ambiguous active-view context; the subsequent 18891 run confirmed visible Account-current focus. Registration double-click/focus was unrun after the browser session disappeared. Cleanup stopped PIDs 78824/73516, verified both ports clear, and removed only `output/playwright/qa-account-guards-20260928`.

Latest post-fix browser run: synthetic service on `127.0.0.1:18891`, named Playwright browser `qa-auth-focus-retest`. Account-origin successful login passed: one held POST, disabled submit while pending, Account remains current, visible `#account-heading` focused. Registration duplicate-submit/focus remains unrun. A separate attempt created a fresh invitation/account on port 18892, but Playwright `qa-register-focus` disappeared before assertions. Cleanup stopped exact PIDs 78812/81732, verified no listener on 18892, and removed only `output/playwright/qa-register-focus-20260928`. Browser closed; service PID 84920 stopped; port 18891 clear. Synthetic files remain in `output/playwright/qa-auth-focus-20260928` because Node PID 66072 holds them open and process ownership could not be inspected (access denied); stop was rejected by auto-review and not retried.

**Disposition:** Login focus fix and one-request guard pass isolated browser regression; duplicate-submit guards for password, invitation, and logout also passed. Registration, invitation edge cases, password error matrix and broader accessibility/device QA remain open. QA-01 and release remain open.

## Superseding Edge retest (2026-09-29)

The `NOT RUN` statements above accurately describe the earlier 2026-09-28 session only. Hermann later completed the missing same-session registration case in Edge 154 with an isolated service/database: held invalid and valid invitation submissions each produced exactly one POST; pending controls disabled; invalid submission retained fields, announced the error, restored controls and submit focus; valid submission created one pending member, consumed the invitation, signed in, and focused Account H1. See the [latest lifecycle QA](2026-09-28-feedback-lifecycle-edge.md#qa-01-follow-up-same-session-registration-double-submit-and-recovery) and [registration result JSON](../../output/playwright/feedback-edge-full-20260928/qa01-registration-double-submit-recovery.json).

Invitation invalid/expired/reused and concurrent single-use redemption, password recovery/session revocation, and sampled normal/forced-colors contrast also passed later in isolated Edge; see the linked lifecycle QA. These results supersede the earlier open-case wording for those specific scenarios. QA-01 remains open for native screen-reader announcements, physical-device/touch/virtual-keyboard behavior, native Edge 200% zoom, physical high-contrast validation, and full dynamic/non-text contrast coverage. No production account or DB was used.
