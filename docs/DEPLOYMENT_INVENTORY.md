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
| Local scheduled tasks | `China ADAS vNext Service` (AtStartup, password-backed limited `guofe`), `China ADAS vNext Watchdog` (every five minutes, password-backed limited `guofe`), `China ADAS vNext Daily` (08:20, interactive), and `China ADAS vNext Backup` (09:30, interactive) enabled. The previous `China ADAS Accident Monitor` task was disabled after cutover. |

The 2026-09-25 08:20 daily run returned success: 33 public leads, 0 inserted, 2 duplicates, 31 rejected, and no pending social imports. The backup passed an integrity and restore drill. The AtStartup service task and five-minute watchdog each restored the site after a forced process stop, and public HTTPS health returned OK. A physical reboot remains untested. Daily and backup tasks are still interactive; two attempts to convert them to background tasks were rejected by Windows credential validation and rolled back, without changing the working service/watchdog.

Windows denied passwordless S4U registration for `guofe` even after the approved batch-logon right was granted. Password-backed registration of the service/watchdog succeeded. Task Scheduler holds their credential; no password value is in the repository or logs. The old GitHub Pages URL now displays a link to the home service, not a live report list.
