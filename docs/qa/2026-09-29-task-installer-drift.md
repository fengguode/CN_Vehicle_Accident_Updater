# Task installer drift review — 2026-09-29

## Scope and acceptance

Read the updater-vnext README and scheduled-task scripts before assessing the task setup. Compare the documented two-stage installation flow with the installer behavior and the 2026-09-28 scheduler QA. Acceptance for this focused documentation investigation: state the observed behavior without conflating owner policy, initial installation, elevated conversion, and current live state; record an actionable backlog item; do not modify Task Scheduler.

## Evidence reviewed

- `scripts/install-vnext-tasks.ps1`: new task registrations share an Interactive/limited principal. The Service trigger is AtLogOn. When a named task already exists, the script updates Settings only and leaves its action, working directory, trigger, principal, and description untouched.
- `scripts/configure-vnext-password-boot.ps1`: a separate elevated flow converts Service to AtStartup + Password and Watchdog to Password while retaining its periodic trigger; it saves XML backups and attempts rollback on registration failure.
- `README.md`: describes interactive Service/Watchdog registration followed by optional elevated configuration, and states that this PC has the converted boot/password Service/Watchdog and signed-in-only Daily/Backup tasks.
- `docs/qa/2026-09-28-scheduler-task-readonly.md`: records live Service as Password/AtBoot and Watchdog as Password. Its statement that all definitions agree with the checked-in installer is too broad; it should distinguish the main installer from the separate elevated conversion.
- `docs/PROJECT_BACKLOG.md`: OPS-01 records the owner's signed-in-only availability choice. LIVE-STARTUP-01 records that the current Service action points to an older checkout and could not be updated due to Access Denied.
- Independent read-only review by Dennis reached the same interpretation and identified that rerunning the main installer cannot repair a stale existing task action/path because its existing-task branch only changes settings.
- Feng's architecture review confirmed that the README and owner decision sufficiently define the two-stage contract: the elevated conversion owns Service AtStartup/Password and Watchdog Password; the main installer must not downgrade them. Isolated checks should cover clean create, rerun repair, converted-state preservation, and fail-closed mixed/unexpected state.
- During implementation planning, Torsten identified that the ScheduledTasks `Set-ScheduledTask` surface does not expose a Description parameter, and safe description changes on Password tasks could require credential-sensitive re-registration. Primary decision: reconcile descriptions for Interactive tasks, preserve converted Password-task descriptions, and fail closed/report unexpected principal or trigger drift rather than re-register credentials without proof.

## Result

The two-stage setup is intentional and matches the signed-in-only Daily/Backup decision. The release evidence does not support claiming that the observed Password/AtBoot Service definition comes from the main installer's default registration. More materially, the installer does not reconcile existing task definitions. A stale Service working directory already has its own open runtime item, LIVE-STARTUP-01; installer idempotence and drift detection are tracked as TASK-INSTALL-01 pending role review and a defined safe contract.

## Implementation verification

Torsten implemented a preflight/reconcile flow in `scripts/install-vnext-tasks.ps1` and the isolated harness `test/install-vnext-tasks.mock.test.ps1`. Before mutations, the installer validates every existing task and rejects an incomplete Service/Watchdog pair or mixed logon modes. Interactive tasks receive the current checkout action/settings/description; Daily/Backup receive the documented daily schedules. Password Service/Watchdog use the action/settings update path while preserving credentials, principal, trigger, and description. Unsupported principal/trigger state fails before the mutation loop.

Dennis independently re-reviewed the initial implementation, found two P2 issues (mixed Service/Watchdog modes were accepted, and mocks did not prove exact trigger/schedule preservation), and confirmed both findings closed after the primary added pair-level preflight and stronger assertions. His review did not operate Task Scheduler or run tests.

Primary verification after those fixes:

- Focused PowerShell mock harness `pwsh -NoProfile -File test/install-vnext-tasks.mock.test.ps1`: **Pass**. It checks four fresh task names/actions/principals/triggers and exact 08:20/09:30 times; rerun repair of existing action paths/runners and all configured settings fields (execution limit, restart count/interval, multiple-instance policy, start-when-available, and battery behavior); converted Password action/settings reconciliation with principal and trigger object preservation; Daily/Backup Interactive/Limited daily schedules; and fail-closed unsupported trigger, unsupported logon type, mixed pair, and incomplete pair with zero task mutations.
- PowerShell AST parse of `scripts/install-vnext-tasks.ps1`: **Pass**.
- `git diff --check -- scripts/install-vnext-tasks.ps1 test/install-vnext-tasks.mock.test.ps1`: **Pass** (Git emitted only the repository's LF-to-CRLF warning for the installer script).
- No real `Get-ScheduledTask`, `Register-ScheduledTask`, or `Set-ScheduledTask` calls were made; the test harness mocks those commands. No live task, service, or credential was changed or used. No broad application test suite was run.

## Result and limitations

Source-level installer reconciliation is verified for the mocked cases. Dennis confirmed the two code/test findings closed; Xiaofeng's final source/evidence recheck found no remaining coverage issue. TASK-INSTALL-01 is Complete for the installer-source contract. Runtime behavior of Windows Task Scheduler cmdlets and saved Password credentials is not established by mocks; production tasks were deliberately untouched. `LIVE-STARTUP-01` remains open until an authorized task owner repairs the current service action and verifies the saved task/runtime. Overall `REL-01` remains HOLD for the separate live-runtime, privacy, accessibility, customer-acceptance, and release/package gates.

## Git state

Fresh scoped Git evidence after implementation/review: `updater-vnext`, branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`, ahead 18. `scripts/install-vnext-tasks.ps1` and the backlog/scheduler QA are modified; the mock harness and this QA note are untracked; all remain uncommitted among pre-existing shared changes. Scoped `git diff --check` passed; no commit or push.
