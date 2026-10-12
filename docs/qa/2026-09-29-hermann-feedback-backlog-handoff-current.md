# Hermann current-source feedback backlog handoff QA — 2026-09-29

## Setup

Fresh isolated service and disposable SQLite DB with synthetic approved member/admin. Headed Microsoft Edge 154, Playwright, 390×844. Six served UI assets matched current source (app.js `314bb82b…`, CSS `8550ae76…`). Port 8788 was available before the test and was not used for authenticated actions.

## Journey and result

- Member and admin submitted Feature requests; own lists and admin queue attribution were correct.
- Admin opened the member request triage form and selected `Added to backlog`, with a public update and private note. Saving without a canonical ID returned 400 with `Add at least one backlog ID before accepting this request.` The triage form preserved the selected status and remained enabled for correction.
- Admin entered existing canonical backlog ID `FEEDBACK-03`; PATCH returned 200. Admin queue showed the status, ID, event and private note.
- Member re-logged in and saw `Added to backlog`, backlog ID `FEEDBACK-03`, and public update in request metadata/history. The member saw neither private note in UI or API. Admin then marked Complete; persisted history retained Submitted→Added to backlog→Complete and the backlog ID.
- No page errors. The only feedback PATCHes were the expected failed validation, valid ID-linked update, and completion update. Isolated service stopped, health endpoint disappeared, DB/profile removed, and port 8788 stayed untouched.

Pass; no backlog-handoff validation or visibility defect found. A stale copied app-hash guard first aborted before browser launch; it was updated to the measured current bundle. Subsequent test-only history/write-count assertions were updated for the intended Added-to-backlog lifecycle, then the final run passed. See [runner, structured result and screenshots](../../output/playwright/feedback-backlog-handoff-current-20260929/).

Repository: `updater-vnext`, branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`, ahead 18. QA/backlog/artifacts are uncommitted among existing shared changes; no source edit, commit, or push.
