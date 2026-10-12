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

- **Primary branch:** pushed `codex-transition-vnext-20261012` to `CN_Vehicle_Accident_Updater`, current HEAD `92ff256`, parented on refreshed `origin/vnext-home-hosted` `56bf625`. The non-default branch includes the current source tree, tests, agent setup, backlog, QA/requirements notes, and remote boot-support files. It excludes `output/`, browser profiles, logs, and SQLite databases. `.gitignore` now excludes `output/playwright/`, preventing accidental future uploads; the files remain on the source workstation.
- **Publisher source:** pushed `codex-transition-methods-20261012` at `9bd3332` to `CN_Vehicle_Accident_Updater`, parented on refreshed `origin/main` `837f906`. It includes the sanitizer, unit tests, README update, instructions, and QA evidence. The publisher suite passed 34/34.
- **Supporting configuration:** pushed `codex-transition-updater-publish-20261012` at `ed6309c` to the updater remote and `codex-transition-database-publish-20261012` at `90e92ef` to the database remote. Each contains only current agent configuration and repository guidance, layered on the refreshed upstream default branch.
- **Verification:** `npm test` on the complete primary transition worktree passed 85/85. `git diff --cached --check` passed before commits. Each push returned success; every branch uses upstream tracking to its matching remote branch. No existing branch was force-pushed and no default branch was changed.
- **Withheld items:** the old `china-adas-accident-database` working export/UI changes were not transferred: the local records differ from refreshed upstream and PRIV-02 still requires row-level and history disposition; the default branch has retired static publication. The working changes and artifacts were preserved in local stash `stash@{0}` and local ref `local-preservation/pre-transition-publicdata-20261012`; the checkout now cleanly tracks refreshed public `main` at `a216c36`. The stash is not on GitHub. Browser/runtime test artifacts remain on this workstation, ignored by the transition checkout. This keeps the source-code transition reproducible without publishing unreviewed records or local browser/runtime data.
- **Next workstation:** clone `https://github.com/fengguode/CN_Vehicle_Accident_Updater` with `--branch codex-transition-vnext-20261012`; for publisher work, use `--branch codex-transition-methods-20261012`. Supporting branches are optional for the active vNext task. Confirmed this is a clone-ready snapshot; the prior Codex CLI prompt remains valid with the updated branch names above.
- **Final checkout verification:** all five local repositories are clean and report `0 ahead / 0 behind` against their configured transition/upstream refs. The fresh vNext clone at `21cabca` passed `npm test` 85/85; the final two vNext commits after that clone change only this QA/backlog text and `.gitignore`.
- **Disposition:** GitHub-based transition of active source and safe supporting work is ready. Historical/privacy and uncommitted public-output decisions remain preserved locally and tracked in the canonical backlog; they were not silently folded into the source handoff.

## Handoff prompt for Codex CLI on the other workstation

```text
Continue the China traffic incident research project from its GitHub transition snapshot. Clone the active vNext branch and run its verification first:

git clone --single-branch --branch codex-transition-vnext-20261012 https://github.com/fengguode/CN_Vehicle_Accident_Updater updater-vnext
cd updater-vnext
npm test

The expected result on 2026-10-12 was 85/85 tests passing. Read AGENTS.md, README.md, and docs/PROJECT_BACKLOG.md before changing behavior. This checkout is the active implementation; the umbrella workspace itself is not a Git repository. `data/` runtime databases, `.secrets/`, logs, and `output/playwright/` artifacts are intentionally not in the branch. Configure local secrets and an isolated test database as the README requires. Do not copy browser profiles, raw databases, logs, credentials, or personal data into GitHub.

For publisher sanitizer work on the same GitHub repository, fetch and inspect branch `codex-transition-methods-20261012`; its tested snapshot is based on refreshed origin/main and includes `src/public-privacy.js`, its test, and linked QA. Supporting safe configuration branches are `codex-transition-updater-publish-20261012` on CN_Vehicle_Accident_Updater and `codex-transition-database-publish-20261012` on CN_Vehicle_Accident_Database. The public database's refreshed main is `a216c36`; use that for the current published site/data baseline. Do not merge or publish the withheld local report-export/UI overrides: PRIV-02 row-level and history disposition remains open, and static publication has been retired.

Use docs/PROJECT_BACKLOG.md as the single work/status source. Continue the existing open backlog items; the project release state remains HOLD until their recorded acceptance gates close. Preserve provenance, distinguish leads from verified incidents, and do not infer ADAS causation. Define acceptance before implementation, use disposable services/databases for mutating checks, and record QA/review evidence before closing work.
```
