# QA session: read-only vNext Task Scheduler inspection

**Date:** 2026-09-28 (Asia/Shanghai)
**Target:** live vNext Windows scheduled-task definitions, read-only. No registration, trigger, action, principal, service, or account was changed.
**Environment:** elevated PowerShell query using `Get-ScheduledTask`; output was reduced to task name, state, logon type, run level, action target, and trigger. User identity was not emitted.

## Acceptance and results

| Check | Result | Evidence |
|---|---|---|
| Live daily and backup task definitions can be inspected without changing them. | **Pass** | `China ADAS vNext Daily`: Ready, InteractiveToken, Limited; daily trigger at 08:20 local; action `node scripts/vnext-daily.mjs`. `China ADAS vNext Backup`: Ready, InteractiveToken, Limited; daily trigger at 09:30 local; action `node scripts/vnext-backup.mjs`. |
| Service/watchdog definitions and availability-relevant logon modes are recorded. | **Pass** | Service: Running, Password, Limited, AtBoot, `node apps/api/server.js`. Watchdog: Ready, Password, Limited, periodic time trigger, `scripts/vnext-watchdog.ps1`. |
| Live definitions agree with checked-in installer and documentation. | **Partial; corrected 2026-09-29** | Daily/Backup's observed InteractiveToken definitions agree with the main installer's principal and triggers. The observed Service AtBoot/Password and Watchdog Password definitions reflect the separate elevated `scripts/configure-vnext-password-boot.ps1` step, not the main installer's fresh-registration defaults. README and `docs/SELF_HOSTED_DATABASE_PLAN.md` describe the two-stage setup. See [task installer drift review](2026-09-29-task-installer-drift.md). |

## Findings and limits

- The earlier non-elevated query returned Access denied. The approved elevated read-only query succeeded and supersedes that inspection limitation.
- This establishes configured logon modes, not that each task successfully completes while signed out or after a physical reboot. No task was manually run, no user logged off, and no reboot occurred.
- On 2026-09-29, the owner selected signed-in-only Daily/Backup operation. That resolves the policy decision; the recorded definitions do not prove execution after sign-out or reboot.
- The main installer updates only Settings for existing tasks; it will not reconcile a stale action/working directory or other definition drift. See open backlog item TASK-INSTALL-01 and the already-open LIVE-STARTUP-01. No live registration was changed.
- Git state and follow-up are recorded in [the shared project backlog](../PROJECT_BACKLOG.md#active-and-blocked-work), item OPS-01.

**Result (historical session, with correction):** live task configuration inspection passed. The original parity claim was too broad and is corrected above; the owner policy decision is now recorded in OPS-01. Runtime availability after sign-out or reboot remains unverified.
