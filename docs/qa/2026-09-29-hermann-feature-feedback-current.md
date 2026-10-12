# Hermann current-source Feature feedback browser QA — 2026-09-29

## Setup

`updater-vnext` app.js `dc897167…` and styles.css `8550ae76…` were checked on a fresh isolated service/database. Exact parity held for all six served shell/UI assets. Headed Microsoft Edge 154, Playwright, 390×844, synthetic approved member/admin accounts. Live 8788 health was 200 before test and no authenticated live request was made.

## Results

- Member and admin each submitted a Feature request; each appeared in the submitter's own Account list with `Submitted`.
- Admin Feedback queue loaded both with member attribution. Type filter `Issue` returned zero; type filter `Feature` returned both.
- Admin triaged member Feature through `Under review` and `Complete`, with public updates and private notes, then reloaded the queue.
- Member re-login showed `Complete` and both public updates in chronological history. Private notes were absent from member UI and `/api/feedback/mine`.
- No page errors. Isolated service stopped, database/profile removed, and port 8788 remained untouched.

Pass; no Feature submission/filter/lifecycle defect found. The first wording-cleanup run exposed a stale harness assertion that still used Issue result property names; after correcting that test-only assertion, the final passing run above completed successfully. See [runner, structured results, and screenshots](../../output/playwright/feature-feedback-current-20260929/).

Repository: `updater-vnext`, branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`, ahead 18. QA/backlog/artifacts remain uncommitted among existing shared changes; no source edit, commit, or push.
