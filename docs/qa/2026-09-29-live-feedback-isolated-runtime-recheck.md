# LIVE-FEEDBACK-01 isolated runtime recheck — 2026-09-29

## Scope and safety

Re-ran a headed member/admin feedback lifecycle after the owner chose to keep `LIVE-FEEDBACK-01` open pending an isolated authenticated runtime check. This was a separate local process on ephemeral port `58363`, with `ADAS_DB_PATH` explicitly set to a disposable synthetic SQLite file. Port 8788 was not touched. No real credentials or records were used.

## Runtime and source

- Entry point: `apps/api/server.js`, source SHA-256 `7485771fc8a5c7b8ea9ecf9a1e5204b086abae694a2f6daa41cc17dd621b0949`.
- Browser app: `apps/web/app.js`, SHA-256 `aae23b6a90dd7df84354990cf6f9eb4b7d1476c10a019fdc7987e325ad5fb7e2`.
- Styles: `apps/web/styles.css`, SHA-256 `d761134a7738b6d6620074cc39c516dc0fe6d4b82134d6397514dea02fe2a380`.
- Health returned 200; served index, app.js, and styles.css matched this workspace's source.
- Browser: Microsoft Edge 154.0.4258.37, headed direct Playwright Node API using cached `playwright-core`, 390×844 viewport, fresh disposable profile.
- Synthetic fixture: 105 feedback requests; two synthetic administrators and one approved synthetic member.

## Acceptance results

| Check | Result |
|---|---|
| Admin authentication, initial queue and pagination | Pass: admin authenticated; 100 newest cards rendered with named collapsed editors; keyboard reached Load older in two Tabs; remaining five loaded with announcement and expected focus. |
| Filters and keyboard triage | Pass: Feature returned 53; Feature + Complete returned 11; collapsed controls were skipped; editor focus order was logical. |
| Cross-identity data isolation | Pass: same-tab and shared-cookie cross-tab A→B transitions cleared old administrator drafts before showing B's server-backed queue. Same-identity refresh retained the current draft/editor/focus. |
| Member/admin privacy | Pass: administrator saved status/public update/private note; member saw the public update and did not see private notes in rendered UI or API. |
| Responsive and runtime errors | Pass: no horizontal overflow at 390×844; zero page errors. |
| Cleanup | Pass: isolated service stopped; synthetic database and Edge profile removed; recorded result confirms `port8788Touched: false`. |

Full machine-readable evidence and screenshots: [`results.json`](../../output/playwright/feedback-runtime-acceptance-20260929/results.json), result SHA-256 `A012911687C2D5425BE4C717728965B9B692A4CB4CE3A48BDEBCD9C5E3002C34`; [artifact folder](../../output/playwright/feedback-runtime-acceptance-20260929/). Command: `node output/playwright/feedback-runtime-acceptance-20260929/run.mjs`; result `PASS`.

## Gate disposition and remaining limit

The current-source isolated authenticated runtime check passed and adds a fresh session record. It does not prove which database the already-running port-8788 service uses. A fresh `Get-NetTCPConnection` query in this sandbox returned no listener PID even though `http://127.0.0.1:8788/health` returned 200. The prior known PID 2368 still resolves to a `node` process via `Get-Process`, but its executable path and start time are blank; `Get-CimInstance Win32_Process` returned Access Denied. Read-only `Get-ScheduledTask` and `Get-ScheduledTaskInfo` for `China ADAS vNext Service` also returned Access Denied. No authenticated request was sent to 8788, and no task/service was changed. Per the owner's instruction, `LIVE-FEEDBACK-01` remains **In progress** until the active runtime's database is safely identified or its authenticated runtime is explicitly isolated, followed by the required lifecycle check.

## Git and QA record

`updater-vnext` HEAD remains `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`. The fresh harness copy, screenshots, and JSON result are untracked under the artifact folder; this QA note and the canonical backlog update are uncommitted among existing shared changes. No commit or push. `git diff --check` exited 0 (standard existing LF→CRLF working-tree warnings only). No product source was changed in this session.
