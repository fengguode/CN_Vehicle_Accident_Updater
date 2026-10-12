# QA session: requested blueprint editing permissions for Architect and Designer

**Date:** 2026-09-29 (Asia/Shanghai)
**Scope:** Workspace agent configs for Feng Guo (`system_architect.toml`) and Wu Yunzhou (`ui_designer.toml`), plus the canonical backlog entry AGENT-02.

## Acceptance checks and results

- **PASS:** After the owner explicitly authorized workspace-wide write access, set both role configs to `sandbox_mode = "workspace-write"`.
- **PASS:** Added role-specific limits: Feng may edit only assigned blueprint files under `docs/requirements/` or `docs/architecture/`; Yunzhou may edit only assigned blueprint files under `docs/design/` or `docs/requirements/`. Both instructions exclude application code, runtime configuration, production data, and operational actions.
- **PASS:** Ran `powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\sync-codex-setup.ps1 -Apply`; it updated the two role configs in all five nested repositories.
- **PASS:** Ran the sync script without `-Apply`; it reported all configuration copies match the workspace source.
- **PASS:** Inspected all 12 source/copy files and verified each has workspace-write plus its role-specific blueprint path instruction.
- **PASS:** Re-read both edited source instructions and confirmed they preserve the original role responsibilities and add only the owner-authorized blueprint editing scope.
- **PASS:** Manually checked the changed TOML keys and quoted instruction strings in all 12 files for the expected setting and scope text.
- **BLOCKED (optional parser check):** No TOML parsing command/module was available (`python`, `py`, `python3`, and `ConvertFrom-Toml` are unavailable). The edits are limited to simple quoted strings and were manually checked; the synchronization script verified source/copy equality.
- **PASS:** Captured read-only Git branch, HEAD, and status for all five affected repositories using per-command `safe.directory` overrides; no persistent Git configuration was changed. Branches/HEADs: database `main` `719ed8a`; methods `main` `ee2cc16`; database-publish `publish-weibo-20260924` `b855551`; updater-publish `publish-weibo-20260924` `fc04c46`; updater-vnext `vnext-home-hosted` `daa5b58`. Each repository already had other modified/untracked work; the two role configs appear among modified files. No commit or push was made.
- **PASS:** The workspace source `.codex` is outside a Git repository; its Git state cannot be recorded in this layout.

## Result and limitations

AGENT-02 is **Complete**. This agent system has no path-specific sandbox write mode, so the technical sandbox permits writes across the workspace. The role instructions narrowly authorize editing only specifically assigned blueprint files under the stated documentation paths. The five nested copies match the root source. No application code, live service, account, or production data was changed.
