# LIVE-FEEDBACK-01 isolated runtime readiness QA (2026-09-30)

## Acceptance and target

- **Outcome:** provide Hermann a reachable, disposable current-source vNext runtime with synthetic signed-out, pending, approved-member, and admin coverage for systematic feedback UX testing.
- **Runtime owner:** primary agent. **Target:** `http://127.0.0.1:8793`, using current `updater-vnext/apps/api/server.js` on Node 24.14.0. **Database:** fresh SQLite file `C:\Users\guofe\AppData\Local\Temp\cn-traffic-hermann-ux-44a575ed25dc409aa7b65689448210d5\synthetic.sqlite`, configured explicitly by the isolated launch wrapper. Launcher PowerShell PID: 143316. The process was started hidden and is left running for tester use.
- **Credentials/fixtures:** test-only credentials are in `C:\Users\guofe\AppData\Local\Temp\cn-traffic-hermann-ux-44a575ed25dc409aa7b65689448210d5\synthetic-test-credentials.json`; it contains no production accounts/passwords. Three synthetic reports are seeded.
- **Safety:** port 8788, scheduled task, productive service, real users and data were not altered. This staging pass is not acceptance of the active 8788 runtime.

## Checks and results

- `/health` on 8793 returned `{ ok: true, service: "adas-vnext" }`.
- Read-only route requests: `/`, `/app.js`, `/navigation.js`, `/feedback-drafts.js`, `/feedback-triage.js`, `/viewport.js`, `/report-presentation.js`, and `/styles.css` all returned 200. `/api/reports` returned 401 signed out.
- Provisioned all role fixtures through the normal API: admin login created two invitations; two synthetic member accounts registered; one remained pending and one was approved by the synthetic admin. `/api/auth/me` returned expected admin/pending/approved roles. `/api/reports` returned 401 anonymous, 403 pending, and 200 with exactly three synthetic reports for the approved member.
- Fresh headless Chrome 153.0.8010.54 and Microsoft Edge 154.0.4258.37, Playwright Core launched the installed browser binaries at 1280×900. Both rendered the Reports shell with the correct title and heading, loaded without page-console errors, and clicking Account made `#account-view` visible while `#reports-view` hid. Evidence screenshots and JSON are in [`output/playwright/live-feedback-isolated-environment-20260930/`](../../output/playwright/live-feedback-isolated-environment-20260930/).
- **Setup issues and disposition:** the first seed attempt used a malformed Windows ESM import URL (`D:` scheme) and failed before seeding; it was corrected to a valid `file:///D:/...` URL and seeding then succeeded. The Playwright CLI `npx` attempt produced no output and stalled beyond 30 seconds; after this bounded attempt, the existing cached Playwright Core harness launched Chrome and Edge successfully. The CUA browser inventory was unavailable because its request-header policy failed; it was not needed after the browser binaries were successfully controlled via Playwright Core.

## Scope and follow-up

- **Pass:** isolated service health, helper asset routes, role-gated API access, signed-out rendering, and Account navigation in both browsers.
- **Not yet exercised:** signed-in browser journeys across feedback submission, pending access boundaries, admin queue/triage, public/private updates, keyboard, narrow mobile dimensions, error recovery, and unexpected actions. Hermann should execute the full acceptance set in [`docs/FEATURE_FEEDBACK_SPEC_2026-09-28.md`](../FEATURE_FEEDBACK_SPEC_2026-09-28.md) with the canonical `LIVE-FEEDBACK-01` acceptance in [`PROJECT_BACKLOG.md`](../PROJECT_BACKLOG.md). This environment is ready now.
- **Git:** `updater-vnext`, branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`, ahead 18; many pre-existing modified/untracked changes remain. Only this QA/backlog update and browser result artifacts were added by this run. No commit/push.
