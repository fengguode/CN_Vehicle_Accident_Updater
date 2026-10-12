# QA session: canonical backlog rule and baseline

**Date:** 2026-09-28 (Asia/Shanghai)
**Target:** umbrella workflow/guide, all five nested variant guides, and `updater-vnext` backlog; repository `updater-vnext`, branch `vnext-home-hosted`, HEAD `eff654933e5e5cf30a7fb09ddfbaae7230b3b743` at inspection.
**Environment:** Windows PowerShell, workspace `D:\project\ChinaTrafficIssueMonitor`. This is a documentation-only change.

## Acceptance checks and results

| Check | Result | Evidence |
|---|---|---|
| Project guide requires all project tasks/findings centralized in one canonical cross-variant backlog, with stable IDs, owner/status/date/scope/dependencies/acceptance/Git state, regular updates, and QA-backed closure. | **Pass** | Read root `AGENTS.md` and all five nested `AGENTS.md` files. All nested guides link to `updater-vnext/docs/PROJECT_BACKLOG.md`; root identifies it as the one shared status source. |
| Shared workflow identifies the one backlog and retains its handoff and Git-traceability requirements. | **Pass** | Read `docs/CODEX_WORKFLOW.md`; it links the shared backlog and prohibits competing variant lists. Existing per-repository Git and blocked-gate requirements remain consistent. |
| Backlog captures current roundtable priorities and unverified findings without upgrading their status. | **Pass** | Cross-read `updater-vnext/docs/ROUND_TABLE_2026-09-28.md`, README, existing User Tester QA, nav QA, usability recheck, prior task handoffs, and agent privacy review. The backlog preserves owner decisions/tooling blockers and separates deferred work. |
| Backlog Git claims match a live per-repository check. | **Pass** | Approved Git executable: `C:\Users\guofe\AppData\Local\Programs\Git\cmd\git.exe`. `-C updater-vnext status --short --branch` reported `vnext-home-hosted...origin/vnext-home-hosted [ahead 7]`, modified `AGENTS.md`, untracked `docs/PROJECT_BACKLOG.md` and `output/`; `rev-parse HEAD` returned `eff654933e5e5cf30a7fb09ddfbaae7230b3b743`. Public DB separately reported `main...origin/main [ahead 4, behind 7]` with listed report/site data changes. |

## Findings and disposition

- Xiaofeng's independent audit found five traceability/coverage issues. They were addressed: one cross-variant backlog, all nested guides link it, fresh Git evidence for all repos, cross-repo findings remain centralized, TRACE-02 now lists exact prior and session commits and current repository states, and each UI finding has a separate row. Xiaofeng's follow-up confirmed all five nested links/root wording; it caught a stale snapshot after later documentation changes, so the snapshot was refreshed again before commit.
- The initial `git diff --cached --check` found trailing Markdown spaces. They were removed in the new backlog/QA notes; the staged whitespace check passed before commit.
- Local commits were made without pushes: `updater-vnext` `a751ee3`, methods `28fac4d`, database-publish `31271a8`, updater-publish `b0d845d`, public database guidance-only `5dd0cb9`. Public report snapshots and other generated changes were excluded from the public database commit.
- A relative-link audit ran against 14 changed or linked project docs after the scheduler QA backlink correction: 0 broken local targets.
- Root `AGENTS.md` and `docs/CODEX_WORKFLOW.md` are outside the five nested Git repositories; their own Git history is unavailable in this workspace layout. `updater-vnext` copies in the canonical backlog rule and its backlog are covered by nested-repository Git evidence.
- No application tests apply to the guidance-only rule. This focused read-through is proportionate. DATA-01's six-log baseline and code trace are at `docs/DISCOVERY_QUALITY_REVIEW_2026-09-28.md`; the source trace confirms `feed_age_*` measures Google News RSS `pubDate` age, not original-post publication or discovery delay. No numerical threshold is claimed.

**Overall:** focused consistency review and nested backlog commit passed. `DOC-01` remains `In progress` because root guide files remain outside the nested repositories and have no umbrella Git metadata; `TRACE-01` records that traceability blocker. The workspace root was not initialized as a new repository.
