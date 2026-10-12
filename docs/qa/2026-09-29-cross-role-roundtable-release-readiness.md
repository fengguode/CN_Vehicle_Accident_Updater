# Cross-role release-readiness roundtable — continuation

**Date:** 2026-09-29 (Asia/Shanghai)  
**Target:** `updater-vnext`; canonical status remains [`PROJECT_BACKLOG.md`](../PROJECT_BACKLOG.md).  
**Participants:** Feng (System Architect), Dennis (Reviewer), Hermann (User Tester), Xiaofeng (Quality Manager), Yuzhou (UI Designer), Torsten (Worker), Nils (Controller), and Wang Bingshan (Release Manager). Each hosted five questions from their role perspective. In the cross-answer phase, each participant answered six questions hosted by other participants; nobody answered their own hosted questions. Bingshan's five follow-up questions were answered by the assigned architect, worker, reviewer, tester, and quality manager. Responses were read-only and role-identified.

## Stage verdict

**Release remains HOLD.** There is substantial current-source functionality and synthetic integration/browser coverage, but the evidence does not satisfy release readiness. In particular, current-source isolated feedback journeys do not identify the active runtime's effective database or verify the user's reported authenticated session; the owner explicitly left the historical privacy gate open while preserving `v0.1.0`; required QA-01 accessibility/device evidence or an explicit residual-risk disposition is outstanding; and customer acceptance plus Xiaofeng's final GO recommendation are absent. The release disposition is not inferred from passing unit, API, or synthetic browser tests.

Video thumbnails are a P2 enhancement and need not block an initial release if they remain fail-closed and are explicitly held out. `VIDEO-PLAYER-01` is not complete: no real origins or human review policy are approved, and several synthetic moderation UI cases remain. Dennis identified a separate queue-scale issue, recorded as `VIDEO-REVIEW-PAGINATION-01`: only the newest 100 candidates are reachable.

## Hosted question themes

The five questions from each participant were circulated for cross-role answers. To keep this record focused, the five hosted themes are summarized here; the individual evidence and limits below capture the resulting discussion.

| Host | Five hosted themes |
|---|---|
| Feng | Safe deployed-runtime proof; historical privacy disposition under immutable tag; QA-01 release-critical scope; feedback-to-backlog operating contract; media origin/format/safety policy. |
| Dennis | Production thumbnail security/review contract; legacy-schema/import-spoof tests; phone/scale suitability of media review; missing media customer acceptance; ordered release-gate evidence. |
| Hermann | Customer and Xiaofeng release evidence; stale scheduled-task correction and verification; safe feedback runtime/database evidence; historical privacy impact; current-source user acceptance matrix. |
| Xiaofeng | Historical privacy disposition; safe authenticated runtime arrangement; blocker vs risk-acceptance classification; mandatory user journeys; bounded QA-01 matrix. |
| Yuzhou | Submitter-visible backlog statuses; highest-risk user journey; privacy/no-promise feedback handoff; media review usability; highest-priority stability gap before feature work. |
| Torsten | Intended runtime/port and safe identity; exact startup task correction and authority; QA-01 native acceptance; thumbnail policy ownership; release commitments vs backlog-only work. |
| Nils | Customer-facing go evidence; highest unmet requirement; severe reproducible risk; combined checks vs independent reviews; whether thumbnails block initial release. |
| Wang Bingshan | Requirement/candidate readiness; implementation/migration gaps; independent blockers/review evidence; customer/device acceptance; Xiaofeng's HOLD exit criteria. |

## Cross-role discussion and evidence

### 1. LIVE-FEEDBACK-01 — P1, remains open

- The reported target at `127.0.0.1:8793` was read-only observed as refusing connections. Port 8788 has served health 200, signed-out auth, feedback API 401, and source-matched UI assets, but the effective `ADAS_DB_PATH` of the active process and an authenticated journey remain unverified.
- No participant recommends synthetic authenticated writes to the unknown active database. Isolated same-source E2E is positive implementation evidence, but the owner has explicitly kept this gate open until a safe arrangement is accepted.
- Proposed closure: read-only identify intended task/process/build/config/database path without printing secrets; then run a member Issue/Feature submission and own-list check, admin queue/triage, and member public/private visibility only on a disposable database associated with the identified deployed artifact/config. Capture asset/API parity, responses, database fixture identity, cleanup, and independent review. If permissions or linkage are unavailable, keep the gate open and seek the owner's decision; do not change the live service or task by inference.

### 2. PRIV-02 — P1, current files sanitized; historical gate intentionally open

- Current public JSON sanitation was previously authorized and verified. The owner subsequently decided: keep `v0.1.0` immutable and keep the history gate open. The recorded historical tag contains 54 social-author fields. This decision is not authorization to rewrite history and is not an acceptance of the historical exposure risk.
- The owner/project owner must authorize any history change or explicitly own a residual-risk disposition. Dennis notes the remote-history/ref observation may need fresh read-only verification; without owner direction, do not alter tags/history or claim this gate closed.

### 3. QA-01 — P1 release gate with narrower P2 evidence gaps

- Focused browser runs cover many authentication, feedback, role, viewport, retry, keyboard-focus, and contrast cases. This does not prove native 200% zoom, screen-reader announcement timing, physical forced-colors, mobile virtual keyboard/device behavior, or every unsampled control boundary.
- The team can close these by running the named native/device cases. If actual equipment or tooling is unavailable, record each scope as unverified with affected users, impact, compensating evidence, workaround, and named owner/customer acceptance; Xiaofeng must include the disposition in the release recommendation. CSS-width emulation is not native zoom evidence.
- Hermann confirms two separate 195px effective-width P2 findings remain tracked: `UI-ADMIN-195-02` (admin User management clipping) and `QA-01-ZOOM-OVERFLOW-02` (member Reports advanced-filter overflow). Fix/retest those at 195 and 320/390 before describing the narrow-width findings as closed.

### 4. LIVE-STARTUP-01 — P2 operational verification; action remains separately authorized

- The recorded service task uses an old Documents working directory. A saved task correction and runtime verification have not been completed; task inspection/change requires the task owner/admin arrangement. Do not restart or mutate a live task from this roundtable.
- Release Manager/Torsten should preserve principal, trigger, arguments, and supported logon settings; once the authorized owner applies the correction, verify saved task action/workdir, service health, exact served assets/routes, and a fresh safe authenticated journey. Rollback and database identity must be known before activation.

### 5. Feedback-to-backlog — working UI/API path is not proof of operating cadence

- Isolated synthetic QA demonstrates member submission and own-list visibility; admin disposition to `Added to backlog` with canonical ID/public update; and member separation from private notes. The accepted wording is consideration-only, not a delivery promise. Feng owns scope/priority; canonical `PROJECT_BACKLOG.md` remains the engineering source of truth.
- FEEDBACK-TRIAGE remains open for evidence that the weekly review cadence occurs and for any remaining value-level audit-scope decision. The cross-role discussion does not invent an automatic backlog write or response-time SLA.

### 6. VIDEO-PLAYER-01 — P2, fail-closed and incomplete

- Owner-confirmed experience remains source-provided still/cover only, linked to exact original source, no player, neutral fallback, and previews on desktop/phone with differing ratios. Real origins stay empty until the owner approves origin, supported format/limits, redirects, human non-graphic review, and removal criteria.
- Current synthetic UI coverage: blocked host has zero requests and approval disabled; allowed synthetic origin returning 404 shows failure copy and disables approval with no write; rejection preserves source and audit; members cannot enter the queue. Missing UI checks include allowed-image approval, rendered Remove confirmation/removal, missing/malformed source and absent image, plus a true pre-video legacy DB migration fixture.
- Dennis's code review found the API/UI fixed limit of 100 silently prevents access to older candidates. `VIDEO-REVIEW-PAGINATION-01` is now centrally logged as P2 In progress and assigned to Torsten. Acceptance is >100 synthetic candidates, keyboard-accessible bounded pagination/load-older, all older pending records reachable, no duplicate/lost records across filters, and audit/public exposure invariants intact.
- Yuzhou, Xiaofeng, Dennis, and Hermann agree actual real-cover enablement is not authorized by synthetic tests. This feature may follow the initial release only if the product scope explicitly holds it back and all existing report/source behavior remains stable.

### Superseding evidence update — 2026-09-29

The paragraphs above preserve the evidence available during the roundtable; subsequent work closed several test and defect items. `VIDEO-REVIEW-PAGINATION-01` and its keyboard-focus follow-up are now Complete with >100-row coverage across all three review statuses: [pagination QA](2026-09-29-video-review-pagination.md). The five formerly missing VIDEO-PLAYER-01 synthetic cases now pass in headed Edge: allowed-origin approval, remove confirmation (dismiss and accept), missing-thumbnail and malformed-source fallback, and migration preserving a pre-video record: [targeted follow-up QA](2026-09-29-video-player-followup.md). This does not authorize real origins or settle production format/review policy; `VIDEO-PLAYER-01` remains In progress and P2 proposed.

Registration evidence has also been reconciled. The raw SQLite browser reports used older bundles; current API code safely maps duplicate usernames, but current `authRequest()` was found to discard the stable API error code, preventing localized server-error copy. That client defect is being fixed and fresh current-bundle Edge acceptance is pending. See [current-source audit](2026-09-29-registration-current-source-audit.md) and the canonical UX-REG-03/04 backlog rows.

### Registration closure update — 2026-09-29

Torsten corrected `authRequest()` to preserve the API stable code and let the existing bilingual error mapping run. Dennis reviewed the corrected current source with no actionable issue; Hermann's headed Edge 154 pass on exact app hash `3e47741844e6329e6a089b553ccafa8a5144c7b8cda1c1ee6970757ba6367450` passed invalid invitation and duplicate errors in EN/ZH, live locale switching, retained fields/focus, invitation reuse, safe unexpected DB failure, and data invariants. UX-REG-03/04 are now Complete in the canonical backlog. See [current-bundle registration QA](2026-09-29-hermann-ux-reg-03-04-current-bundle.md).

## Release Manager follow-up

Bingshan's question set received targeted answers from Feng, Torsten, Dennis, Hermann, and Xiaofeng:

1. **Requirements (Feng):** Release candidate must meet documented provenance, lead/verification, signed-in-only operation, Windows locking, feedback privacy/status, and release QA/runtime requirements. Video behavior follows the owner's thumbnail decisions but stays fail-closed; real-media policy, live runtime evidence, QA residuals, task path, and customer acceptance remain open.
2. **Implementation (Torsten):** Highest concrete feature gaps are media-review pagination above 100 and a direct v9/pre-video DB migration fixture preserving legacy rows as unknown/pending, provenance/fingerprint, and raw-data privacy. Verify exact source hashes, focused migration tests, full suite, and headed isolated >100-row review behavior.
3. **Independent blockers (Dennis):** P1 gates are historical PRIV-02, LIVE-FEEDBACK-01, and REL-01 customer acceptance/Xiaofeng disposition. LIVE-STARTUP-01, QA-01 native/device coverage and video moderation/UI/migration checks are separately tracked P2; risk acceptance cannot be called a test pass.
4. **Customer-facing acceptance (Hermann):** Active runtime identity/authenticated path and native screen-reader/zoom/device/forced-colors remain unverified; two narrow-width UI defects are P2. Video also lacks successful approval, rendered removal, invalid/missing media, and >100-item queue acceptance. Close with exact-build, reproducible role/state/viewport evidence, or explicit scoped owner/customer risk disposition where suitable.
5. **Quality release disposition (Xiaofeng):** HOLD persists until the owner resolves or formally accepts privacy-history risk, safe runtime evidence passes independent review, QA-01 closes or receives an authorized risk disposition, and the identified customer accepts the exact candidate. Then Xiaofeng issues the final recommendation; P2 task correction remains needed for rollout confidence.

## Common prioritized todo

| Priority | Item / owner | Status | Acceptance evidence / dependency |
|---|---|---|---|
| P1 | `LIVE-FEEDBACK-01` — Primary diagnoses; Hermann tests; Dennis reviews; Feng accepts the safe evidence arrangement; Xiaofeng rechecks | In progress | Identify intended service/build/effective DB read-only, then authenticated role lifecycle on a disposable database demonstrably tied to the identified deployed artifact/config; no writes to unknown live DB. Owner previously said keep gate open. |
| P1 | `PRIV-02` — Feng/project owner decision; Dennis independently verifies any authorized disposition | In progress | Keep `v0.1.0` immutable and gate open unless owner gives a new explicit disposition. No history rewrite or silent risk acceptance. Reverify reachable refs after any separately authorized action. |
| P1 | `QA-01` — Hermann closes named native/device tests; Dennis reviews; Xiaofeng records release disposition | In progress | Native zoom, assistive technology, physical forced-colors, device/virtual keyboard and remaining specific UI defects; or explicit owner/customer risk disposition with scope and mitigations. Effective-width simulations do not substitute. |
| P2 | `LIVE-STARTUP-01` — Bingshan coordinates with task owner/admin; Torsten verifies; Xiaofeng reviews | In progress | Preserve task settings, correct saved path only with authorized owner, prove task and served build/database identity, verify health and authenticated acceptance on safe data, and record rollback. |
| P1 | `REL-01` — Feng/customer acceptance; Bingshan candidate/release package; Xiaofeng final decision | In progress | Exact candidate/version and requirement-to-test matrix; customer acceptance artifact; all P1 gates resolved or explicitly accepted by the right authority; release notes, rollback and Git handoff reconciled. Current verdict HOLD. |
| P2 | `UI-ADMIN-195-02` and `QA-01-ZOOM-OVERFLOW-02` — primary fixes; Hermann verifies; Dennis reviews | In progress | Fix clipping/overflow at 195 effective CSS px and retest 320/390 plus keyboard/focus; do not mark native zoom complete from these results. |
| P3 | `QA01-NARROW-CONTROL-01` — primary fixes; Hermann regression; Dennis review | In progress | Follow-up Edge measurements found 3px nested excess in the admin user row and 2px in the Reports search/sort row at 195px. Remove those excesses while preserving page-level and control geometry at 195/320/390; this is not native zoom evidence. |
| P2 | `VIDEO-REVIEW-PAGINATION-01` — Torsten implements; Dennis reviews; Hermann tests | In progress | Correctly page/load older than 100 candidates in UI/API; >100-row synthetic browser test with filters, audit, no loss/duplication, and keyboard behavior. |
| P2 | `VIDEO-PLAYER-01` — Feng policy decision; Torsten implementation; Yuzhou design; Dennis review; Hermann acceptance | In progress | Keep real media disabled. Complete synthetic allowlisted approval/remove, missing/malformed states, >100 queue and legacy migration checks; enable real sources only after recorded owner policy. |
| P2 | `FEEDBACK-TRIAGE` — Feng operating policy; admins enact; primary tracks | In progress | Demonstrate weekly triage and stable canonical ID handoff; settle any remaining audit-field scope without implying delivery commitment. |

**Controller checkpoint:** The latest Controller account-wide reading was 10% used in the 5-hour window and 59% weekly, below the requested 95% stop threshold. Per-project/per-agent tokens and billing are unavailable. Recheck before substantial additional work; stop if either observed usage bucket reaches 95%, and resume only after a fresh read confirms the applicable reset (or after user direction).

## Session disposition and Git evidence

Roundtable itself was read-only; participants made no source edits. Primary added the new `VIDEO-REVIEW-PAGINATION-01` backlog entry. At record time, `updater-vnext` branch was `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`, with 206 tracked/untracked status entries in the shared tree. Whole-tree `git diff --check` exited 0; only line-ending conversion warnings were emitted. No commit, push, release, task change, database write, publication, or live-service restart was performed.
