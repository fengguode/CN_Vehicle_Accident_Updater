# Xiaofeng release readiness recheck — 2026-09-29

## Disposition

**HOLD.** The newly added isolated video and voting UI results do not clear existing P1 privacy, active-runtime, broad QA, or customer acceptance gates. No showstopper was reproduced in the tested synthetic video flows, but the authenticated active-service path is still unverified, so this does not establish that the customer-facing runtime is free of major issues.

## Findings and follow-up status

- **VIDEO-PLAYER-01, P2:** Core linked-thumbnail behavior is implemented and has synthetic Edge coverage for approved-source display and removal; see [thumbnail UI](2026-09-29-video-thumbnail-ui.md) and [targeted follow-up](2026-09-29-video-player-followup.md). Production origins, supported MIME/format policy, and human non-graphic review/removal policy are still unapproved. 320px phone and tablet-width preview acceptance remains to be recorded. Keep real covers fail-closed; the item is not complete for production release.
- **VIDEO-REVIEW-PAGINATION-01:** Later Edge/API evidence closed the 205-row traversal and focus gaps across pending, approved, and rejected queues; see [pagination QA](2026-09-29-video-review-pagination.md). Earlier roundtable notes are historical and have a superseding update.
- **UX-REG-03/04, P2:** The old raw-SQL/untranslated screenshots used pre-fix app bundles. Dennis found a current client error-code propagation defect; Torsten fixed it; current-bundle headed Edge now passes bilingual invalid-invitation and duplicate handling, generic server failure, field/focus retention, and data invariants. Both items are Complete; see [current-bundle registration QA](2026-09-29-hermann-ux-reg-03-04-current-bundle.md) and [audit](2026-09-29-registration-current-source-audit.md).
- **PRIV-02, P1:** The user chose an immutable `v0.1.0` and kept the historical exposure gate open. Do not rewrite history. A release-risk disposition for the exposed historical records is still required before GO.
- **LIVE-FEEDBACK-01, P1:** Port 8788 health and signed-out routes are verified, but effective database identity and authenticated active-service journey are not. Port 8793 remains unverified. Do not write to an unknown active database; obtain accepted sanitized runtime identity/evidence or a user-approved disposition.
- **QA-01 / REL-01, P1:** Native 200% zoom is not verified (Edge retained a seeded preference without changing viewport metrics). Screen-reader, physical/virtual-keyboard, and physical forced-colors coverage remain incomplete. Customer acceptance and Xiaofeng's final GO recommendation are absent. See [native zoom QA](2026-09-29-qa01-native-zoom-pref-attempt.md).
- **LIVE-STARTUP-01, P2:** Scheduler target remains stale pending task-owner/admin authorization and post-change runtime verification; no live task was changed.
- **Release candidate:** Exact release commit/version, refreshed cross-repository Git state, and customer acceptance are not assembled. Broad shared-tree changes remain uncommitted.

## Links to current source of truth

Task status and evidence links are maintained only in the [canonical project backlog](../PROJECT_BACKLOG.md). This note is a release recheck, not a second task list. No live writes, deployment, task-scheduler changes, commit, or push occurred.

## Follow-up after the recheck

The remaining responsive evidence subsequently passed: [VOTE-ICON-01 at 320×844](2026-09-29-vote-icon-ui.md#320844-phone-width-follow-up--2026-09-29) and [VIDEO-PLAYER-01 at 320×844 / 768×1024](2026-09-29-hermann-video-player-width-followup.md). UX-REG-03/04 also closed after current-bundle Edge acceptance. These close the cited UI subchecks; the overall HOLD remains because the P1 privacy-history, live-runtime identity/authenticated journey, native QA/customer acceptance, and release-candidate evidence are still open. Real thumbnail origins and media-review policy remain unapproved.
