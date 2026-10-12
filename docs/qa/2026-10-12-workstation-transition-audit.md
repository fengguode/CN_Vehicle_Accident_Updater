# Workstation transition readiness audit — 2026-10-12

- **Task:** WORKSTATION-TRANSITION-01
- **Target:** `D:\project\ChinaTrafficIssueMonitor`, an umbrella workspace containing five independent Git repositories.
- **Acceptance:** identify each Git checkout; inspect branch, HEAD, upstream, ahead/behind counts, and worktree status; determine whether transition can proceed from Git alone; record a safe Codex CLI prompt.
- **Environment:** PowerShell, read-only Git inspection. No files were staged, committed, fetched, pushed, or discarded as part of the audit. The only edits are this QA record and the canonical backlog entry.

## Results

| Repository | Branch / HEAD | Upstream state (local tracking refs) | Changed paths | Result |
|---|---|---:|---:|---|
| `updater-vnext` | `vnext-home-hosted` / `daa5b58` | `origin/vnext-home-hosted`, ahead 18, behind 0 | 353 | **Fail: dirty; 18 commits not pushed** |
| `updater-publish-weibo` | `publish-weibo-20260924` / `fc04c46` | `origin/main`, ahead 3, behind 0 | 7 | **Fail: dirty; 3 commits not pushed** |
| `database-publish-weibo` | `publish-weibo-20260924` / `b855551` | `origin/main`, ahead 3, behind 0 | 7 | **Fail: dirty; 3 commits not pushed** |
| `china-adas-accident-database` | `main` / `719ed8a` | `origin/main`, ahead 6, behind 7 | 17 | **Fail: dirty and tracking refs show divergence** |
| `china-adas-accident-methods` | `main` / `ee2cc16` | `origin/main`, ahead 7, behind 9 | 12 | **Fail: dirty and tracking refs show divergence** |

The umbrella folder itself has no `.git` root. All five nested repositories have an `origin`; the two publisher branches track `origin/main` despite their local branch names. Counts are from existing local remote-tracking refs and do not prove current remote state. No network fetch was run. No commit, push, merge, rebase, or cleanup was run. The four `Fail` findings mean a Git-only handoff is not yet established. In particular, do not force-push or resolve divergence without reviewing the actual commits and local changes.

## QA session

- **Pass:** read the active variant README and workflow instructions; identified the five independent Git roots.
- **Pass:** ran `git status --short --branch`, `git branch -vv`, `git rev-parse --short HEAD`, `git rev-parse --abbrev-ref --symbolic-full-name '@{upstream}'`, `git rev-list --left-right --count 'HEAD...@{upstream}'`, and `git status --porcelain=v1` independently in every repository.
- **Fail:** transition-ready from committed/synced Git state. Every worktree has changes and every branch has local commits; two branches show divergence against cached refs.
- **Blocked/unverified:** whether the tracking refs still match GitHub now; requires fetching from the remotes in the next authorized network-enabled environment.
- **Review:** no code change was made. The transition prompt must preserve the existing working trees and must not ask CLI Codex to commit, push, rebase, reset, or discard without explicit owner direction.
- **Disposition:** this audit and prompt do not make the repositories ready. Keep WORKSTATION-TRANSITION-01 In progress until changes are reviewed and preserved, remotes are reconciled, and a fresh audit verifies the chosen handoff state.

## Cleanup follow-up (2026-10-12)

- **User direction:** clean the repositories until ready for workstation transition; preserve current project work and target a committed/synced state.
- **Expanded inventory:** `updater-vnext` has 1,948 untracked paths; the visible inventory includes `output/` and source/tests/docs among those files. `china-adas-accident-database` modifies `data/reports.json` and `site/data/reports.json`, with `data/svm-scores.json` and privacy remediation artifacts untracked. These must not be mass-added or pushed without per-file privacy/intent review. The canonical backlog also records release HOLD and open P1 gates; publication readiness is not established.
- **Remote refresh:** initial sandboxed fetch failed (`getaddrinfo() thread failed to start`). With approved network access, fetch refreshed `updater-vnext`, `updater-publish-weibo`, and `china-adas-accident-methods`; `database-publish-weibo` and `china-adas-accident-database` share the same database remote and a concurrent fetch raced (`incorrect old value`), then a sequential fetch completed. Current upstream counts are listed in the canonical backlog. Upstream-only commits include vNext boot-service changes and database privacy/cutover changes.
- **Disposition:** no destructive or irreversible Git action was taken. Existing edits and user files were preserved. Commit/push and transition readiness remain blocked until files are classified, divergent histories and the open privacy/release gates are reviewed, and the owner chooses how to handle sensitive/generated local data. A Git clone alone omits current uncommitted work.
- **QA result:** inventory and remote refresh completed; cleanup goal **not complete**. No claim of clean, committed, or synced state. `git diff --check` on the audit edits completed without whitespace errors (Git emitted expected LF-to-CRLF working-copy warnings on existing files).

## GitHub transition snapshot (2026-10-12)

- **Primary branch:** pushed `codex-transition-vnext-20261012` at `8389814` to `CN_Vehicle_Accident_Updater`, parented on refreshed `origin/vnext-home-hosted` `56bf625`. It is a single snapshot commit on a non-default branch, so it does not merge into or activate the default branch. It includes the current source tree, tests, agent setup, backlog, and QA/requirements notes, plus the remote boot-support files. It excludes `output/`, browser profiles, logs, and SQLite databases.
- **Publisher source:** pushed `codex-transition-methods-20261012` at `9bd3332` to `CN_Vehicle_Accident_Updater`, parented on refreshed `origin/main` `837f906`. It includes the sanitizer, unit tests, README update, instructions, and QA evidence. The publisher suite passed 34/34.
- **Supporting configuration:** pushed `codex-transition-updater-publish-20261012` at `ed6309c` to the updater remote and `codex-transition-database-publish-20261012` at `90e92ef` to the database remote. Each contains only current agent configuration and repository guidance, layered on the refreshed upstream default branch.
- **Verification:** `npm test` on the complete primary transition worktree passed 85/85. `git diff --cached --check` passed before commits. Each push returned success; every branch uses upstream tracking to its matching remote branch. No existing branch was force-pushed and no default branch was changed.
- **Withheld items:** the old `china-adas-accident-database` working export/UI changes were not transferred: the local records differ from refreshed upstream and PRIV-02 still requires row-level and history disposition; the default branch has retired static publication. Its current public `main` at `a216c36` already has the newest upstream privacy/cutover state. Original working copies and generated test artifacts remain untouched on this workstation. This keeps the source-code transition reproducible without accidentally publishing unreviewed records or local browser/runtime data.
- **Next workstation:** clone `https://github.com/fengguode/CN_Vehicle_Accident_Updater` with `--branch codex-transition-vnext-20261012`; for publisher work, use `--branch codex-transition-methods-20261012`. Supporting branches are optional for the active vNext task. Confirmed this is a clone-ready snapshot; the prior Codex CLI prompt remains valid with the updated branch names above.
- **Disposition:** GitHub-based transition of the active source and safe supporting work is ready. Historical/privacy and uncommitted public-output decisions remain tracked in the canonical backlog and were not silently folded into the source handoff.

## Handoff prompt for Codex CLI on the other workstation

```text
You are continuing the ChinaTrafficIssueMonitor project from another workstation. Start by inspecting AGENTS.md, docs/CODEX_WORKFLOW.md, updater-vnext/README.md, and updater-vnext/docs/PROJECT_BACKLOG.md. The active implementation variant is updater-vnext, but the umbrella workspace contains five independent Git repositories; inspect each repository separately.

The prior audit (2026-10-12) found these local states, which may be stale: updater-vnext vnext-home-hosted at daa5b58 (18 ahead of origin/vnext-home-hosted, 353 changed paths); updater-publish-weibo publish-weibo-20260924 at fc04c46 (3 ahead of origin/main, 7 changed paths); database-publish-weibo publish-weibo-20260924 at b855551 (3 ahead of origin/main, 7 changed paths); china-adas-accident-database main at 719ed8a (6 ahead/7 behind origin/main, 17 changed paths); china-adas-accident-methods main at ee2cc16 (7 ahead/9 behind origin/main, 12 changed paths). The umbrella directory is not a Git repository. These counts used cached tracking refs and were not remotely refreshed.

First run read-only discovery in all five Git roots: status, branch/upstream, HEAD, ahead/behind after a safe fetch if network is available, changed file names and diff summaries. Do not assume the uncommitted changes are disposable or represented in the remote. Preserve user data, ignored files, inbox data, secrets, local databases, backups, and user-specific configuration. Do not stage, commit, push, pull, merge, rebase, reset, clean, delete, or overwrite anything until you have reported a concrete per-repository preservation and reconciliation plan to the owner and received authorization. Never copy raw databases, secrets, logs, or personal data into published outputs.

Use updater-vnext/docs/PROJECT_BACKLOG.md as the sole shared backlog. Update WORKSTATION-TRANSITION-01 with fresh per-repository evidence and keep it In progress until every intended change is preserved and the target workstation has a verified, reproducible state. Then continue the specific backlog item the owner selects. Treat public incident records as unverified leads unless reviewed under the README protocol; do not infer ADAS causation. Before any implementation, define acceptance checks; after authorized changes, run and record the required QA session and review evidence. Report blockers precisely. Ask the owner which repository/workstream to continue only after completing the read-only inventory and preservation assessment.
```
