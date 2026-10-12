# QA session: Controller cost/value and work-order review

**Date:** 2026-09-28 (Asia/Shanghai)  
**Reviewer:** Nils (Controller), read-only. No source or project settings changed.

## Evidence and findings

- Reviewed the canonical backlog, shared workflow, current User Tester recheck, scoped public-data reviewer handoff, and traceability audit.
- No trustworthy per-output token count, agent API total, or billing telemetry was available. The report provides no measured cost and no estimate.
- Independent reviewers agree the canonical backlog and links across five nested guides improve status traceability. The workflow/backlog authority ambiguity found by workflow audit has since been clarified and tracked as DOC-02.
- Hermann's automated suite passed 60/60; browser rendering remains blocked. UI-ACCEPT-01 and UI-ACCEPT-03 remain blocked for rendered regressions; UI-ACCEPT-02 needs owner concept decision plus rendered evidence.
- The record-296 reviewer confirms the scoped redaction and mirror equality. Unrelated generated report/site changes remain outside that review and stay uncommitted.

## Recommended order

1. Preflight browser availability once; resume Hermann's rendered acceptance matrix when a controllable browser exists.
2. Wait for the owner's answer on source-first cards before implementation.
3. Resolve lock support scope and mutex namespace before implementing dependent behavior.
4. Keep wider public snapshots held until their generated changes receive their own review.

**Result:** Controller review complete. No token/API cost claim is possible from available telemetry. See [backlog item CTRL-01](../PROJECT_BACKLOG.md#tracking-completed-work-and-git-handoffs) for the centralized task record.

## Account usage threshold check

**Checked:** 2026-09-28, while the roundtable follow-up and UI regression were in progress. The Codex account usage meter reported 2% consumed in the five-hour window and 19% consumed in the weekly window. Both remain far below the user's requested 95% stop threshold. This is account-wide limit telemetry, not this task's per-turn token count or a billing total; it cannot attribute consumption to individual agents. No pause or five-hour wait is indicated by the available account usage state.

## Follow-up usage threshold check

**Checked:** 2026-09-28 while ACL hardening and the release audit were in progress. The Codex account usage meter reported 12% consumed in the five-hour window and 21% consumed in the weekly window. Both remain below the user's 95% stop threshold. This is account-wide limit telemetry, not this task's per-turn token count or billing total; it cannot attribute use to individual agents.

## Current roundtable continuation threshold check

**Checked:** 2026-09-28 during PRIV-02 remediation and UI retesting. The account usage meter reported 25% consumed in the five-hour window and 23% consumed in the weekly window, below the user's 95% stop threshold. This is account-wide usage, not a per-agent token or cost measurement. No pause/reset is indicated.


2026-09-28 continuation check: current account-wide usage read showed 25% of the five-hour window and 23% of the weekly window consumed, below the user's 95% stop point. No per-agent attribution is available.

## 2026-09-29 Controller evidence reconciliation

Nils re-read the controller notes and backlog. Across the records, account-wide readings are 2%/19%, 12%/21%, 25%/23%, and 3%/25% (five-hour/weekly). These are checkpoints, and the documents do not establish a reliable relative ordering for the last two. No per-agent/per-output token attribution, API-call totals, or billing data is available, so no per-task usage or cost claim is made. The live usage meter became available in the later continuation below.

## Fresh 2026-09-29 usage threshold check

The live account usage tool reported **39% used** in the five-hour window and **38% used** in the weekly window. The requested 95% stop threshold is not reached. This is account-wide limit telemetry, not a project or per-agent token count, and no API/billing attribution is available. Nils recommends stopping if the observed five-hour account meter reaches 95%, then resuming only after a new usage read confirms the five-hour reset. No reset credit was consumed and no five-hour wait was needed for this check.
