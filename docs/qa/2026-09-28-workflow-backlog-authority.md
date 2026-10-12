# QA session: workflow backlog authority

**Date:** 2026-09-28 (Asia/Shanghai)  
**Target:** root `docs/CODEX_WORKFLOW.md` and cross-variant backlog. Documentation-only clarification.

## Acceptance and evidence

| Check | Result | Evidence |
|---|---|---|
| One authoritative source for task status and Git state is stated consistently. | **Pass** | Read root `AGENTS.md`, root workflow, all five nested `AGENTS.md` files, and `updater-vnext/docs/PROJECT_BACKLOG.md`. Root workflow now says the shared backlog is authoritative; conversations and task-specific QA/review notes are linked evidence, and competing status lists are prohibited. All nested guides point to that same backlog. |
| The traceability audit finding has a stable backlog record. | **Pass** | Added DOC-02 to the shared backlog, with owner, In progress status, date, scope, acceptance, evidence link, and Git limitation. |
| Git traceability for the root workflow is reported honestly. | **Pass with limitation** | The workspace root has no Git repository metadata. Nested repository Git state is recorded in the shared backlog; no root hash/status is claimed. |
| Tracking/completed-work table renders consistently. | **Pass** | After the quality audit found rows with 8–9 cells against a 7-column header, repaired TRACE-01, DOC-02, and CTRL-01; verified every row has exactly seven cells. All local Markdown links in `docs/PROJECT_BACKLOG.md` resolve. |

## Result

Focused documentation consistency check passed. No application tests apply. The wording correction is complete, but DOC-02 remains Blocked because the root workflow source is outside every nested repository and cannot meet the project's Git traceability gate; see TRACE-01. No repository completion is claimed for that root-file edit.
