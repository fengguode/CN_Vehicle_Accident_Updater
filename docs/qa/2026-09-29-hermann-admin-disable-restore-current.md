# Hermann current-source admin disable and restore browser QA — 2026-09-29

## Setup and safety

Fresh isolated `apps/api/server.js`, disposable SQLite DB with synthetic admin, approved member and one fictional report. Headed Microsoft Edge 154, direct Playwright, separate persistent browser contexts for admin/member, 390×844. All six served UI assets exactly matched workspace source (app.js `314bb82b…`, CSS `8550ae76…`). Live 8788 health was 200 and untouched for authenticated operations.

## Results

- Admin opened User management and found the approved/active synthetic member.
- Member's separate session opened Reports; `/api/reports` returned 200 and one synthetic report rendered.
- Admin disabled the account in User management (PATCH 200). Without logging out manually, member `/api/auth/me` then returned `user:null`, and `/api/reports` returned 401. After reload and opening Account, the login form was available and account actions hidden.
- Admin re-enabled the member (PATCH 200). The member signed in again and recovered Reports access (200; one synthetic report).
- No page errors. Session response was recorded with no CSRF token. Isolated service was stopped, health endpoint disappeared, and the exact temporary database/profiles were removed. Port 8788 remained healthy and untouched.

Pass; no disable/restore access-control defect found. The first harness attempt after reload waited for the login form while still on Reports; corrected it to open Account before checking the form, then the final run passed. See [runner and structured results](../../output/playwright/admin-disable-restore-current-20260929/).

Repository: `updater-vnext`, branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`, ahead 18. QA/backlog artifacts remain uncommitted among existing shared changes; no source edit, commit, or push.
