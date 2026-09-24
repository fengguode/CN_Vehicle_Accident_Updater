# Deployment inventory for the parallel vNext build

Recorded 2026-09-24. No credential values are stored here.

| Component | Current known setting |
| --- | --- |
| vNext API and UI | `127.0.0.1:8788`, local only |
| Previous local dashboard | `127.0.0.1:8787` by documented default |
| Previous vote API | `127.0.0.1:8790` by documented default; no listener observed during baseline |
| Tailscale Funnel | `https://win-dlf0f69f65u.tail68f4a2.ts.net/` now proxies to `127.0.0.1:8788`; HTTPS health, UI, approved/pending access, Secure cookies, and vote/revoke passed |
| GitHub OAuth callback for prior vote API | Last known `https://win-dlf0f69f65u.tail68f4a2.ts.net/auth/github/callback` |
| Public database repository workflow | `daily-update.yml` changed to a manual, read-only no-op; `pages.yml` deploys the archived landing page |
| Workflow variable/secret names | `VOTE_API_URL`, `VOTE_EXPORT_TOKEN`, `WEIBO_WEB_COOKIE` |
| Local scheduled tasks | `China ADAS vNext Service` (at interactive logon), `China ADAS vNext Watchdog` (every five minutes), `China ADAS vNext Daily` (08:20), and `China ADAS vNext Backup` (09:30) enabled. The previous `China ADAS Accident Monitor` task was disabled after cutover. |

The daily and backup tasks were started manually through Task Scheduler and each returned result 0. The daily log records 27 fetched public leads, 0 accepted, 2 duplicates, 25 rejected, and no pending social imports. The backup passed an integrity and restore drill. The at-logon service task started successfully. Its native restart setting did not recover a forced failure; the separate watchdog did recover the service in a forced-failure test. A physical reboot remains untested, and the interactive-logon task does not promise availability before a user signs in after reboot.

Windows denied changing the service task to a noninteractive S4U startup trigger. It still requires the user to sign in after a reboot. The old GitHub Pages URL now displays a link to the home service, not a live report list.
