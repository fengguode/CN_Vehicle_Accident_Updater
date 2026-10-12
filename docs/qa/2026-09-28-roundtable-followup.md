# Roundtable follow-up: documentation and QA-01 reconciliation

**Date:** 2026-09-28 (Asia/Shanghai)  
**Target:** `updater-vnext` README, canonical backlog, and roundtable record.  
**Scope:** Document the already-implemented LOCK-01 support contract; reconcile completed UI-ACCEPT-03/05 evidence; record independent remaining QA-01 coverage. No application behavior changed.

## Acceptance checks

- README precisely matches the tested lock contract: Windows-only, current-account SID scope, three public entry points, busy response, abandoned-owner recovery, and fail-closed behavior.
- Completed UI-ACCEPT-03/05 acceptance and Dennis review agree across the QA note and canonical backlog.
- QA-01 remains open with each independently identified remaining test group and priority.
- Roundtable preserves release blockers and records reviewer findings without claiming release readiness.

## Checks and results

| Check | Evidence | Result |
|---|---|---|
| Lock behavior source cross-read | `scripts/vnext-daily.mjs`, lock QA `docs/qa/2026-09-28-lock-01-ingestion-mutex.md`, and README command/availability section | PASS. README describes one Global mutex for `vnext:daily`, `vnext:update-public`, and `vnext:import-social`, current Windows account SID scope, busy exit/retry, abandoned-owner recovery, and fail-closed errors/non-Windows behavior. |
| UI-ACCEPT-03/05 evidence reconciliation | `docs/qa/2026-09-28-ui-accept-03-regression.md`; Dennis independent review; UI-ACCEPT-03/05 backlog rows | PASS. UI-ACCEPT-03 and focused UI-ACCEPT-05 are Complete; Dennis found no remaining actionable focus-guard issue. QA-01 remains distinct and In progress. |
| Remaining QA-01 coverage reconciliation | Hermann's read-only review of README, canonical backlog, and linked browser QA; new QA-01 backlog text | PASS. The two P1 groups (live permission/admin-role loss and admin view failure/races) and P2 account-form/accessibility/device matrix are individually listed with observable assertions. No new defect is represented as reproduced. |
| Release disposition | Latest privacy, favicon, customer-acceptance records in canonical backlog and roundtable | PASS. REL-01 remains hold: remote public-data handling decision, QA-01, normal-service favicon verification, and customer acceptance remain open. |
| Documentation read-through | Re-read edited README paragraph, affected backlog rows, and appended roundtable notes against LOCK-01 QA and linked UI QA | PASS. No conflicting status or unsupported test claim found in the edited sections. |

## Reviewer findings and limits

- Architect found README omitted the supported locking boundary and found UI-ACCEPT-05's status stale. Both are corrected.
- Designer found UI-ACCEPT-05's status stale and clarified that broad QA-01 remains open. Corrected.
- Hermann independently audited remaining UI coverage; no new defect was reproduced. The detailed remaining test plan is centralized in QA-01; this documentation session does not execute those browser tests.
- CUA remains unavailable (`Unable to load browser request-header policy`). The cached Playwright CLI previously passed focused UI regressions; these documentation edits do not claim completion of the additional QA-01 groups.
- No live service, scheduler task, public remote, production database, or account changed. No commit or push made.

**Disposition:** Focused documentation and status consistency checks pass. QA-01 and REL-01 remain In progress.
