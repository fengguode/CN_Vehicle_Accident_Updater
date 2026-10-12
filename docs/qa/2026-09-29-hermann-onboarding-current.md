# Hermann current-source invitation and approval browser QA — 2026-09-29

## Runtime and safety

`updater-vnext` source was exercised on a fresh ephemeral `apps/api/server.js` service with a disposable SQLite database and synthetic accounts. All six served assets matched current workspace source (app.js `dc897167…`, styles.css `8550ae76…`). Headed Microsoft Edge 154, direct Playwright Node API, disposable profile, viewport 390×844. Port 8788 health was verified before the test and its database/service were not used for authenticated operations.

## Journey and results

1. Synthetic admin signed in and created a one-time invitation (201).
2. Signed-out, not-yet-registered visitor registered using it (201) and became a pending member.
3. Pending member could see Account and submit an Issue (201), while Reports remained approval-gated and admin navigation remained hidden.
4. Admin Feedback queue loaded and showed the pending member's submission and attribution.
5. Admin approved the account in User management (PATCH 200).
6. Member signed in again, opened Reports, and the approval gate was gone; the Reports workspace loaded without admin navigation.

The fixture contained no synthetic reports, so this verifies transition into an empty Reports workspace, not populated report browsing or voting. No page errors. Synthetic service stopped, database/profile removed, and 8788 remained untouched. The invitation code was redacted from structured output and the code-bearing screenshot was not retained. No product defect found in this onboarding flow.

See [runner, redacted results and screenshots](../../output/playwright/onboarding-current-dc897-20260929/). `LIVE-FEEDBACK-01` remains open because the user-reported port-8793 session is unavailable and the authenticated 8788 database identity is still unknown.

Repository: `updater-vnext`, branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`, ahead 18. QA/backlog/artifacts remain uncommitted among existing shared changes; no source edit, commit, or push.
