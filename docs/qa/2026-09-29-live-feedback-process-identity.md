# LIVE-FEEDBACK-01 read-only process and database identity recheck

**Date:** 2026-09-29 (Asia/Shanghai)  
**Target:** `updater-vnext`, branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`.  
**Scope:** Identify the live 8788 listener, scheduled task action, and whether the old task path currently resolves to the active checkout. No authentication, database-content read, service change, or task change.

## Evidence

- Read-only `netstat` maps `127.0.0.1:8788` to PID 2368. An approved read-only process query reports `C:\Program Files\nodejs\node.exe` with command line `node.exe apps/api/server.js`; parent PID 2024 is `svchost.exe`.
- The `China ADAS vNext Service` scheduled task is Running and launches the same executable/relative entry point. Its configured working directory remains `C:\Users\guofe\Documents\Codex\2026-09-08\make-a-new-project-locally-to\updater-vnext`.
- The old directory's `apps`, `src`, `data`, and `scripts` children are Windows junctions into `D:\project\ChinaTrafficIssueMonitor\updater-vnext`. Read-only NTFS file-ID checks matched between old and current paths for `apps/api/server.js`, `src/config.js`, `src/db.js`, `apps/api/auth.js`, `apps/api/feedback-repository.js`, and `data/adas-accidents.db`. The source config defaults the database to `data/adas-accidents.db` relative to its module root.
- Read-only GET checks on 8788 returned `/health` 200, `/api/auth/me` user-null, and `/api/feedback/mine` 401. `index.html`, `app.js`, `navigation.js`, `viewport.js`, `report-presentation.js`, and `styles.css` all returned 200 and matched current workspace bytes.
- The service task principal is `guofe` with interactive-token logon. Read-only machine, task-user registry, and current-user checks found no configured `ADAS_DB_PATH`; this still does not directly reveal PID 2368's inherited environment block or rule out a process-only override.
- No authenticated request or mutation was made. The effective process `ADAS_DB_PATH` override was not read, so the process's actual open database binding remains unconfirmed. The database contents were not inspected.

## Assessment and disposition

The old scheduled-task directory does not currently point to a distinct source/data copy: its relevant subdirectories resolve to the current checkout, and sampled source plus default DB identities match. This narrows the stale-source concern but does not satisfy the scheduled-task acceptance criterion, which still requires updating and verifying the saved working directory. No such operation was authorized here.

Keep `LIVE-FEEDBACK-01` open. Current asset and default-path identity evidence does not show whether PID 2368 received an `ADAS_DB_PATH` override, and no authenticated lifecycle was verified through the live process. Do not write to 8788 while the effective DB binding is unknown. Next safe step is a narrowly scoped, approved read-only check of only that environment variable; if it confirms the expected DB, plan the required authenticated lifecycle against an isolated runtime associated with deployed service state. Otherwise obtain an authorized deployment arrangement. Keep `LIVE-STARTUP-01` open until the task action is corrected and the authorized restart/health checks pass.

**Git/QA state:** No application source changed for this runtime investigation. Focused `git diff --check` passed for the note and backlog changes. The note/backlog remain uncommitted in the existing dirty `updater-vnext` tree; no commit or push.
