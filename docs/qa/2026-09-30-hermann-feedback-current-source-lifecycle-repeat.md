# Hermann current-source feedback lifecycle recheck — 2026-09-30

## Target and safety

- Target: ephemeral `apps/api/server.js` service at `http://127.0.0.1:52953`, with a fresh synthetic SQLite database and test-only admin/member accounts. Port 8788 was not used for authentication or writes.
- Browser: Microsoft Edge 154.0.4258.37, headed through Playwright Core, 390×844 CSS px. Served index, app, and stylesheet matched the workspace source; service health returned 200.
- The harness exercised account sign-in, feedback queue and submission APIs, and triage only against the disposable service. It stopped the service and removed its database and profile.

## User journeys and result

- Administrator loaded a 100-item queue, keyboard-loaded the remaining 5, filtered the queue, edited and saved triage, and saw the public update and private note in the admin view.
- A synthetic member submitted a feature request from Account (HTTP 201), saw it in their own list, and the admin saw it with submitter attribution. Chinese and English success states were checked. A synthetic 503 showed an error state while preserving the draft and enabling retry.
- The member history displayed 105 items, including the triaged public update, and omitted private notes. A shared-session admin identity change cleared the old unsaved private draft before the replacement admin's queue was rendered. Both admin and member layouts had no horizontal overflow; there were no page errors.
- Result: PASS. Machine-readable results and screenshots are under [`output/playwright/feedback-submission-current-source-20260929/`](../../output/playwright/feedback-submission-current-source-20260929/). A first repeat run stopped at a stale harness assumption after a cross-tab logout moved the tab to Account; it is preserved as `cross-tab-recheck-harness-failure-20260930.json`. The harness now explicitly reopens Feedback after the new admin session is confirmed. This was a test-harness sequencing issue, not a reported product defect.

## Gate

Current-source member/admin feedback lifecycle works on an isolated service. The active listener at 8788 still returns 404 for both feedback draft/triage modules, while 8793 refuses connection. The active listener's database identity is not established, so `LIVE-FEEDBACK-01` remains In progress; no live authentication, write, or restart was attempted.
