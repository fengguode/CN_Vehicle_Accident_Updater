# Hermann localhost availability change during browser retest

Date: 2026-09-30 11:31Z

## Readiness outcome

- Initial read-only PowerShell preflight: `http://127.0.0.1:8793/health` returned HTTP 200 with `{"ok":true,"service":"adas-vnext"}` and `/` returned 200.
- The service stopped responding before the fresh browser harness reached its browser launch. The first harness fetch failed with `ECONNREFUSED 127.0.0.1:8793`; a follow-up health request also received connection refused, and `netstat` showed no listener on port 8793.
- Workspace hashes at preflight remained app.js `ad3cea5921901a7a17550455200f293df7c61b07663c8c5d1ed979c69579ef1f` and styles.css `61e43beb97e57899738c65e6662bd05107dc4e7d05899c2720fb915a841a06e0`. No served-asset parity could be checked after the service stopped.
- Browser launch, renderability, and role acceptance were not run. No login, write, service restart, or action on port 8788 occurred. The synthetic fixture files still exist, but the service availability gate failed.

## Attempted scope and outcome

The planned current-hash check was the approved member's single `/api/feedback/mine` read on login, Account revisit, and explicit Refresh. No product inference or finding is drawn from this unavailable-service attempt. Retest only after 8793 is available again and its synthetic fixture is verified.

Runner: [edge-member-list-single-read-ad3-1131.mjs](../../output/playwright/live-feedback-user-story-suite-20260930/edge-member-list-single-read-ad3-1131.mjs). The runner failed before writing a machine-results file because its preflight `fetch` was refused.
