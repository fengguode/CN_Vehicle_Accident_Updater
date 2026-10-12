# Release HOLD resolution review — 2026-09-29

## Scope and sources

Reviewed the active `updater-vnext` release records and constraints in `README.md`, `docs/SELF_HOSTED_DATABASE_PLAN.md`, the shared workflow guide at `../docs/CODEX_WORKFLOW.md`, `docs/PROJECT_BACKLOG.md`, Xiaofeng's release recheck, and the Edge runtime recheck. Target is branch `vnext-home-hosted`; the frozen v0.1.0 release remains an immutable historical snapshot per the self-hosted plan.

## Resolution sequence

1. **P1 privacy (`PRIV-02`)** — The owner authorized sanitized current public JSON publication and decided to keep `v0.1.0` immutable, leaving historical exposure as an open gate. The current-file publication is verified in the linked privacy QA. Preserved source URLs may contain platform IDs; no tag/history rewrite was authorized. The previous anonymized-vote decision does not authorize changes to public incident records.
2. **P1 feedback runtime (`LIVE-FEEDBACK-01`)** — Owner chose to keep this gate open; same-source isolated E2E plus read-only active-route parity does not close it. Authenticated writes through the unidentified PID/DB on 8788 remain unverified. Next evidence must safely identify the active runtime database or use an explicitly isolated authenticated runtime arrangement. Never send synthetic writes to the unknown active database.
3. **P2 startup (`LIVE-STARTUP-01`)** — Task owner/admin must correct the task working directory, preserving executable, script, principal, triggers, and settings; then verify saved action, service health, routes, and an authenticated synthetic lifecycle. Prior Scheduler action returned Access denied and did not change the task.
4. **P2 accessibility/device (`QA-01`)** — Complete native Edge zoom, screen-reader announcement, physical/virtual keyboard, and physical forced-colors checks where equipment is available. Otherwise record explicit residual-risk acceptance with scope, rationale, owner, and customer impact; Xiaofeng must include that disposition in the release recommendation.
5. **Release package and customer decision (`REL-01`)** — Release Manager prepares a compatible new version/release candidate and concise notes without changing frozen v0.1.0, assembles test/privacy/runtime evidence, rollback steps, and versioned Git state, and identifies a customer acceptance contact/check. A customer acceptance and Xiaofeng recommendation are both required before release disposition. Record start/end timestamps only when measured.

## Review result

The sequence is feasible, but the release remains **HOLD**: privacy/history policy, runtime evidence disposition, scheduler permissions, remaining native QA or risk acceptance, and customer acceptance are unresolved. No publication, history rewrite, live service/task change, or production data mutation was made during this review.

## QA and Git evidence

- Focused documentation consistency review: the proposed steps follow the immutable-tag/history-removal constraints in `docs/SELF_HOSTED_DATABASE_PLAN.md`, the isolated-database rule in README/workflow, and the existing canonical gate IDs. Pass.
- No automated tests or browser checks run; this task changed no product behavior.
- `updater-vnext`, branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`; existing shared changes remain uncommitted. This review adds only this QA note and a canonical backlog evidence update; no commit or push.

## Follow-up: first P1 action authorized (2026-09-29)

The owner authorized publication of the sanitized current JSON outputs. The canonical and site mirror were updated together in public database commit [`a216c36`](https://github.com/fengguode/CN_Vehicle_Accident_Database/commit/a216c36e5747b3f0cd69d055a410334dedf6bb89). Post-publication read-only checks passed: both paths resolve to blob `48d15c7`, contain 294 records, preserve IDs/source URLs/fingerprints, and have no populated social author fields. The v0.1.0 tag and its history were left unchanged. This closes the current-file portion of `PRIV-02`; historical exposure remains open, and direct source URLs with platform IDs are preserved to retain provenance. The release remains on HOLD. See the detailed [PRIV-02 publication QA](../../../china-adas-accident-database/docs/qa/2026-09-28-privacy-scan.md#authorized-current-file-publication-and-verification-2026-09-29).

## Follow-up: historical privacy decision and feedback gate state (2026-09-29)

The owner explicitly decided to keep `v0.1.0` immutable and leave the historical privacy gate open. No history or tag rewrite is authorized. This resolves the policy choice while retaining the recorded historical exposure as an unresolved P1 risk.

For `LIVE-FEEDBACK-01`, a fresh read-only probe of port 8788 returned health/root 200, signed-out auth state, and 401 for both feedback endpoints. Served `app.js` and `styles.css` match current source. Fresh exact-source Edge sessions on separate ephemeral services/disposable databases passed both the actual member Feature form submission/list/admin-queue visibility ([submission QA](2026-09-29-feedback-submission-current-source.md)) and admin queue/triage/privacy ([isolated runtime QA](2026-09-29-live-feedback-isolated-runtime-recheck.md)). These sessions do not establish the active process's database identity or authenticated write path. Read-only process-command-line and Scheduled Task inspection returned Access Denied; the known PID only shows as `node` with blank path/start time. No authenticated request was sent to 8788. The owner chose to keep the P1 open. Next acceptance requires safe identification of the active runtime database or a deliberately isolated authenticated runtime arrangement associated with the deployed service state, followed by the required member/admin lifecycle check.

**Focused QA session:** Read the owner's decisions against the immutable-release constraint and cross-checked them with the privacy publication record, current-source lifecycle note, live read-only evidence, and canonical backlog. Consistency check passed; no source, service, task, database, or public data was modified during this follow-up. Active-service authenticated behavior remains explicitly unverified. `updater-vnext` Git status could not be freshly captured in this shell because Git rejected the repository's ownership as an unsafe directory; existing canonical Git snapshot is retained, with no commit or push claimed.

## Follow-up: focused UI closure and Xiaofeng release recheck (2026-09-29)

The primary completed `QA-01-DISABLED-PAGINATION-01` and `QA-01-INVALID-FOCUS-01` after Dennis's source review, Yuzhou's design review, and headed isolated Edge acceptance. The invalid-field relation observation was withdrawn as a test-harness false positive after Dennis identified that `checkValidity()` fired the app's invalid handler during inspection; the corrected passive `validity.valid` check passed. See [pagination QA](2026-09-29-qa01-disabled-pagination.md) and [corrected invalid-focus QA](2026-09-29-qa01-invalid-focus-corrected.md). `npm test` passed 67/67; source/QA scoped `git diff --check` and harness `node --check` passed.

Xiaofeng independently rechecked the release and recommends **HOLD**. Her read-only runtime checks returned `/health` 200, `/api/auth/me` with `user:null`, and `/api/feedback/mine` 401; served `app.js` and `styles.css` match source. My own follow-up confirmed the same results and successful TCP reachability. `Get-NetTCPConnection` returned no row, but that did not establish an outage and should not override the responding HTTP/TCP evidence. No authenticated request or write was sent. The active process/database identity remains unknown, so `LIVE-FEEDBACK-01` stays open. Additional open gates remain historical `PRIV-02` (immutable v0.1.0), `LIVE-STARTUP-01` (scheduler permission), broader native/device QA, customer acceptance/final release recommendation, and cross-repository Git reconciliation.

**QA session:** Independent record/backlog consistency review and direct read-only runtime recheck passed; no live process/task/account/database was changed. `updater-vnext` branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`; changes remain uncommitted and no commit/push was made.
