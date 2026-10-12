# Release Manager role configuration QA — 2026-09-29 (updated)

## Acceptance checks

- Define Wang Bingshan as owner of the release and rollout process, including component-version, feature integration/configuration, release note, and live-experience-time responsibilities.
- Preserve authorization boundaries around activation and live changes; distinguish measured elapsed time from unavailable timing evidence.
- Sync the shared role configuration to all five nested repositories and verify there is no configuration drift.
- Record the affected repository Git states without disturbing existing user work.

## Session

- **Environment:** PowerShell, `D:\project\ChinaTrafficIssueMonitor`; no live product was changed or activated.
- **Role review:** Read root README, `updater-vnext/README.md`, `docs/CODEX_WORKFLOW.md`, and existing custom agent conventions. `release_manager.toml` explicitly includes all requested responsibilities, timestamp evidence requirements, release plan evidence, and the live-action authorization boundary. Pass.
- **Configuration sync:** `scripts/sync-codex-setup.ps1` initially reported the expected five missing role copies; `scripts/sync-codex-setup.ps1 -Apply` copied the source role into all five repositories. Pass.
- **Drift check:** `powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\sync-codex-setup.ps1` reported that all shared Codex configuration copies match the workspace source; an explicit content comparison of `release_manager.toml` across all five repositories also matched. Pass.
- **Whitespace check:** `git diff --check` exited 0 in each of the five repositories. Git emitted line-ending conversion warnings for pre-existing modified files; no whitespace errors were reported. Pass.
- **Git evidence:** Captured branch, HEAD, and full `git status --short --branch` for all five nested repositories using per-call `safe.directory` overrides. Each was already dirty with substantial pre-existing work. The only newly introduced paths from this task are `.codex/agents/release_manager.toml` in each repository; no existing changes were reverted or staged.
- **Review/findings:** Focused read-through confirms the role includes the requested responsibilities and constraints. No product behavior changed, so application tests and browser acceptance do not apply. No independent review performed.
- **Limitations:** Root `.codex/` and `docs/CODEX_WORKFLOW.md` are outside any Git repository; those root-level instruction/config changes have no Git state. The five nested repositories are independently tracked and retain other pre-existing dirty work.

## Git snapshot

- `china-adas-accident-database`, `main`, HEAD `719ed8aeb8310e18afc4732d3f5b98f9cd33942b`, ahead 6 / behind 7.
- `china-adas-accident-methods`, `main`, HEAD `ee2cc1679084ae3e334f69c56ca752ab47d5f80f`, ahead 7 / behind 9.
- `database-publish-weibo`, `publish-weibo-20260924`, HEAD `b85555101bfc44f49c330d56e43c77ca74baaf46`, ahead 3.
- `updater-publish-weibo`, `publish-weibo-20260924`, HEAD `fc04c463a420ac0c92559154803099fe7914e875`, ahead 3.
- `updater-vnext`, `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`, ahead 18.

All new role files are uncommitted. No commit, push, deployment, publication, or live-service change was made.

## Owner clarification follow-up

The project owner clarified that Bingshan also owns the release and rollout process. Updated the display name from Wang Binshan to Wang Bingshan, and made process ownership explicit: lifecycle stages, readiness criteria, decision gates, checklists, rollout/rollback coordination, and handoff evidence. The root role was synced to all five nested repositories. The standard drift check and explicit five-copy content comparison passed; `git diff --check` passed in all five repositories. The root source/workflow remain outside Git, and all nested release-manager role files remain uncommitted. No live activation or deployment was performed.
