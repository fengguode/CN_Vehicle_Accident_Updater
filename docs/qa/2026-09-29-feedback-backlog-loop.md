# Feedback-to-backlog loop — isolated current-source acceptance (2026-09-29)

## Scope

Verify the implemented user-to-backlog flow required by `FEEDBACK-TRIAGE`: a signed-in member submits a Feature, an admin accepts it into an existing canonical backlog item with a public explanation, and the member sees status/link/update while private triage notes remain hidden.

## Runtime and fixture

- Final rerun: isolated `apps/api/server.js` at `http://127.0.0.1:50930/`, ephemeral port, disposable SQLite database, and synthetic member/admin accounts. No real account or database was used; port 8788 was not touched. The initial pass used port 51851.
- Headed Microsoft Edge 154.0.4258.37 via direct Playwright Node API, 390×844 CSS px.
- Current source: app.js `9f56a4081a8d3f6369b52d1805d8960ef6d86bbab2b9a21cd94e697654adfc1f`; styles.css `cde5d66726ddfa3f7c8ec20fcb195abe80589c8ea580d70ef2a7f8764d8c9583`; server.js `7485771fc8a5c7b8ea9ecf9a1e5204b086abae694a2f6daa41cc17dd621b0949`. Served app assets matched the workspace.
- Fixture: 105 synthetic queue rows; two synthetic admins; a clean synthetic member submitted the request.

## Acceptance results

1. Member submitted a Feature from Account. `POST /api/feedback` returned 201; its UUID appeared in the member's own Submitted list and in the separate admin Feedback queue with submitter attribution.
2. Admin selected `Added to backlog`, entered canonical ID `FEEDBACK-TRIAGE`, a public update, and a private note. `PATCH /api/admin/feedback/{id}` returned 200; returned backlog IDs and append-only status/public-update event were present.
3. After refreshing, the member saw status `Added to backlog`, canonical backlink `FEEDBACK-TRIAGE`, and the public update in the UI/API. Member UI/API contained no private note; the administrator retained the private note.
4. The suite also reran 105-row pagination/filter/keyboard, cross-identity draft isolation, EN/ZH successful submission color, synthetic 503 error styling/recovery, 390px overflow, and zero browser errors. Isolated service, database and profiles were cleaned up.

Result: `PASS`. Command: `node output/playwright/feedback-backlog-loop-20260929/run.mjs`. Full evidence: [`results.json`](../../output/playwright/feedback-backlog-loop-20260929/results.json), SHA-256 `0F1F9FCD9B262B2025D96EFC98324A7976D2755088646FAC2BCB940EDC41F608`; [screenshots and harness](../../output/playwright/feedback-backlog-loop-20260929/). After Dennis identified that the first run only retained event count, the harness was tightened and rerun. It now asserts and records the triage event actor (`qa-feedback-admin-b`), action, resulting status, exact public update, and parseable timestamp. Dennis independently re-reviewed the revised assertions/result and found the expanded evidence supported. The final run used exact current source, completed cleanup, and did not touch port 8788. The synthetic private-note sentinel is retained only in the disposable test result/screenshots; it was not published or copied into the product backlog.

## Limits and disposition

This proves the current implemented workflow end-to-end with synthetic data, including the returned event actor/time/action/status/public update and member exclusion of the private note. It does not prove that the team's weekly review cadence has operated on a real request. `FEEDBACK-TRIAGE` remains In progress. Xiaofeng recommends that Feng explicitly decide whether current history (actor, time, resulting status, and public update) is enough or whether edits to priority/backlog/duplicate/private-note fields need before-and-after snapshots; this is a policy decision, not an assumed QA gate. Hermann notes the canonical backlog ID is displayed as plain text, not a clickable hyperlink; whether that needs follow-up depends on whether “link” means a navigable URL or a canonical ID reference. The member-after screenshot is clipped before the full request card, so private-note exclusion is most strongly evidenced by the member UI/API assertions and the separate public-update view, not by that clipped screenshot alone. The 503 error message/draft visible in that screenshot came from the intentional error-recovery scenario, not triage. No release or live service behavior is inferred from this isolated run.

`updater-vnext` HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`; no product source edits in this QA correction; harness assertion, screenshots/result, and this note are uncommitted among shared changes. No commit or push.
