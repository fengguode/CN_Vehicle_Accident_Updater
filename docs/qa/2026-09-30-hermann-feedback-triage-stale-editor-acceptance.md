# Hermann User Tester: stale triage editor regression — 2026-09-30

## Target and preflight

- `updater-vnext`, branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`.
- Isolated current-source `apps/api/server.js` at ephemeral localhost, synthetic member + admin, one disposable SQLite DB, two administrator tabs, unique temporary Edge profile. Port 8788 was not used or changed.
- Microsoft Edge 154.0.4258.37, headed Playwright persistent context, 1280×900 CSS px.
- `index.html`, `app.js`, `styles.css`, `navigation.js`, `feedback-drafts.js`, `feedback-triage.js`, `report-presentation.js`, and `viewport.js` served HTTP 200 and matched current workspace bytes. Current `app.js` SHA-256: `3588924d1a795a45e476508caddd53338075946f22ebfad8c3745b7c45040468`; server source SHA-256: `403436805df855db19652f4d81b99fcfbcaf347356745ec51471c7ba8bf80be3`.

## Acceptance outcome — PASS

- Admin A's Under review/high/public/private-note update succeeded. Admin B's stale backlog-ID edit received HTTP 409; before/after database row and event snapshots were identical. Only B's dirty backlog ID remained over A's latest status/priority/private note, while current public text remained intact.
- The conflict notice used `role=status`, `aria-live=polite`, received focus, and asked for review and explicit save. B's explicit retry returned 200 and preserved A's newer fields. The private-only event had empty `public_update` instead of repeating the earlier announcement.
- A same-field conflict returned 409 without a DB/event write. B's competing public draft remained visible, A's newer public update remained authoritative, the localized polite status notice received focus, and the enabled retry button required explicit resave. The explicit retry returned 200.
- A Chinese-language non-overlapping conflict returned 409 without mutation. The Chinese polite status notice received focus, B's dirty Blocked status was preserved over A's latest change, and latest Urgent priority was included. Explicit retry returned 200.
- The submitter's final history showed each supplied public announcement once. Private notes were absent from the member response. No stale field rollback, duplicate public message, or privacy leak was found.
- No JavaScript page errors, unexpected console errors, or failed network requests. Edge logged three expected “Failed to load resource” console messages for the intentional HTTP 409 conflict responses; these are recorded separately in results.
- The isolated service stopped and the DB/profile were removed; live port 8788 remained untouched.

## Findings and disposition

No new defect reproduced for `FEEDBACK-TRIAGE-STALE-EDITOR-01`. Independent User Tester acceptance passed the currently served source hash. The primary owns backlog/status integration and final disposition.

## Evidence

- Structured session: [results.json](../../output/playwright/hermann-feedback-triage-stale-editor-acceptance-20260930/results.json)
- Screenshots: `non-overlap-conflict-rebased.png`, `same-field-conflict-keeps-local-draft.png`, `chinese-conflict-focused-rebase.png`, and `member-public-history-no-private-note.png` in the same artifact folder.
