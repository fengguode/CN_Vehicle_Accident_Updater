# LOCK-01 shared ingestion mutex QA

- **Target:** `updater-vnext`, branch `vnext-home-hosted`, HEAD `5291f92ba977f7abec6ce1d1250645fb4f82cb62`; working changes are uncommitted.
- **Acceptance:** `vnext:daily`, `vnext:update-public`, and `vnext:import-social` contend on one Windows global mutex before writes; contention exits with code 75; an abandoned owner does not strand future runs; the aggregate owns the mutex once across both children and its completion log; child failure is logged and releases the mutex; non-Windows fails closed before work; do not change live Task Scheduler state.
- **Environment:** Windows 11, Node.js (repository engine requirement `>=22.5`), PowerShell Windows PowerShell 5.1. Mutex tests used unique disposable `Global\ChinaTrafficIssueMonitor_test_*` names. Aggregate test used a disposable temp directory. No service, scheduled task, production account, or database was touched.

## Checks and results

| Scenario | Result | Evidence |
| --- | --- | --- |
| Syntax for lock helper, command wrapper, and daily runner | PASS | `node --check scripts/vnext-ingestion-lock.mjs`; `node --check scripts/vnext-locked-command.mjs`; `node --check scripts/vnext-daily.mjs` |
| Unsupported platform rejected before executing a task | PASS | `assertWindowsPlatform('linux')` and `acquireWindowsIngestionLock({ platform: 'linux' })` test; task callback remained uncalled |
| Same mutex admits one owner; three concurrent contenders fail busy | PASS | `node --test test/vnext-ingestion-lock.test.js`; contender error includes retry guidance and `exitCode === 75` |
| Abandoned Windows mutex can be acquired by a later run | PASS | Focused test terminated the exact test helper PID while it owned the unique mutex; next acquisition succeeded |
| Aggregate owns lock through both child calls and log write; child failure is logged and lock releases | PASS | Focused test verified both child slots see busy, log includes both outcomes, first child failure produces aggregate exit code 1, and a post-run acquisition succeeds |
| All three npm command paths refuse work while the shared mutex is held | PASS | Manually held the production-named mutex from a separate process and ran `npm run vnext:daily`, `npm run vnext:update-public`, and `npm run vnext:import-social`. Each printed “Another vNext public/social ingestion run is already active. Retry after it finishes.” The underlying Node lock wrapper returns documented busy code `75`; npm presents any non-zero script status as npm exit `1`. All three were rejected before ingestion code ran. |
| Targeted lock suite | PASS | `node --test test/vnext-ingestion-lock.test.js` — 3 passed, 0 failed, 0 skipped |
| Repository suite | PASS | `npm test` — 63 passed, 0 failed, 0 skipped |
| Whitespace check | PASS | `git diff --check` on the LOCK-01 files; only Git's LF/CRLF normalization warnings were emitted |

## Findings and limitations

- The first targeted run found a QA assertion mismatch: the durable JSONL record includes `finished_at` while console output only contains `outcomes`. The assertion was corrected to compare the outcome arrays; the final targeted and full test runs passed. A trailing whitespace character in the edited task installer file was also removed; the final whitespace scan was clean.
- No public/social import was allowed to run against repository or production data. Real command entrypoints were verified under deliberate contention, and aggregate child behavior was exercised with disposable injected child outcomes.
- A second Windows identity or session was not available to exercise mutex ACL denial from another account. The `Global\\...` mutex creation and wait errors propagate as hard failures; there is no `Local\\...` fallback. The successful same-account global-mutex behavior, contention, and abandoned-owner recovery were exercised.
- The installer was not run and no Task Scheduler task was changed. Dennis review found `$projectRoo` instead of `$projectRoot` at the scheduled action working-directory parameter. The typo was corrected; a PowerShell AST parse plus dry-path source check confirmed the defined `$projectRoot` is passed and no stale variable remains. The installer was not executed to avoid modifying real Task Scheduler tasks. The daily action remains `scripts/vnext-daily.mjs`, which now acquires the shared lock itself; its installer description documents signed-in-only shared-mutex operation.

## Git evidence

- `git status --short --branch`: `vnext-home-hosted...origin/vnext-home-hosted [ahead 14]`; changes remain uncommitted.
- `git rev-parse HEAD`: `5291f92ba977f7abec6ce1d1250645fb4f82cb62`.
- Whitespace checks: `git diff --check` for tracked LOCK-01 paths and a PowerShell trailing-whitespace scan across every LOCK-01 file both passed (line-ending normalization warnings only).
- LOCK-01 files: `package.json`, `scripts/install-vnext-tasks.ps1`, `scripts/vnext-daily.mjs`, `scripts/vnext-ingestion-lock.mjs`, `scripts/vnext-ingestion-lock.ps1`, `scripts/vnext-locked-command.mjs`, `test/vnext-ingestion-lock.test.js`, and this QA note.
- Other pre-existing/parallel dirty paths were left untouched; this note does not attribute them to LOCK-01.

## Release-audit follow-up: mutex ACL

Xiaofeng's independent audit found that the default named-mutex DACL could permit unrelated local users to open or hold the global mutex. The helper now creates new mutexes with an explicit protected DACL granting only the current Windows account SID `Modify`, `Synchronize`, and `ReadPermissions`. Existing objects are opened with those required rights, then checked for the exact protected single-SID DACL and current-user owner; an existing broad or otherwise mismatched ACL fails closed and is not repaired. Mutex names remain in the `Global\` namespace. In the create race, if the security-taking constructor cannot open a concurrently-created object, the helper retries only with `OpenExisting` using minimum required rights, then applies the same strict checks.

### ACL hardening QA

- **Environment:** Windows 11, Node.js repository runtime, Windows PowerShell 5.1. Tests used unique disposable global mutex names and a disposable default-DACL mutex. No live scheduler, service, account, or production data was touched.
- **Created-object ACL readback:** PASS. Focused test opened the mutex while held, read the owner and DACL, and asserted the owner was the current SID and the DACL was protected with exactly one non-inherited `Allow` ACE for that SID with `Modify, ReadPermissions, Synchronize` rights.
- **Existing broad-DACL fail-closed:** PASS. A separate process created and held a default-DACL global mutex; the lock helper rejected it as unsafe, and a second ACL read confirmed the original descriptor remained unmodified.
- **Same-account contention:** PASS. Four concurrent lock helper processes admitted exactly one owner; all others returned the documented busy result. Existing abandoned-owner recovery and aggregate hold/log/release checks also passed.
- **Syntax and regression:** PASS. Windows PowerShell 5.1 parser accepted `scripts/vnext-ingestion-lock.ps1`; `node --check` passed for the lock module and daily runner; `node --test test/vnext-ingestion-lock.test.js` passed 5/5; `npm test` passed 65/65; scoped `git diff --check` passed (line-ending normalization warning only).
- **Scope limitation:** Other Windows identities and hostile code running as the same SID are outside the signed-in application account contract. A second-SID denial attempt and a separate-logon-session browser/ingestion run were unavailable. The readback proves the global mutex is owned and explicitly accessible only to the intended SID; Windows global namespace documentation supports same-SID cross-session naming. This does not claim direct runtime testing in a second logon session.

References: [MutexAcl documentation](https://learn.microsoft.com/en-us/dotnet/api/system.threading.mutexacl.create?view=net-11.0-pp) and [Synchronization object security](https://learn.microsoft.com/en-us/windows/win32/sync/synchronization-object-security-and-access-rights).

**Independent disposition:** Dennis found no actionable issue in the ACL/create race design. Xiaofeng concluded ACL readback is equivalent evidence for the documented same-account scope and withdrew the lock-specific release blocker. LOCK-01 is Complete under that contract. No live Task Scheduler task was changed.