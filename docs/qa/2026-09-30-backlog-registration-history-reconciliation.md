# QA session: backlog history and owner-decision reconciliation

**Date:** 2026-09-30 (Asia/Shanghai)  
**Scope:** Documentation-only consistency check in `docs/PROJECT_BACKLOG.md`; also checked the latest owner answer against the existing VIDEO-PLAYER-01 requirements and QA records. No application behavior changed.  
**Acceptance:** Completed UX-REG-03/04 rows remain authoritative; prior failing observations remain available as historical evidence but are clearly marked superseded and link to passing current-bundle evidence.

## Checks and result

- Reviewed the UX-REG-03/04 summary, detailed completed rows, and historical supplements in the canonical backlog.
- Confirmed the summary and both detailed rows record `Complete` and link to `qa/2026-09-29-hermann-ux-reg-03-04-current-bundle.md`.
- Marked the two stale narrative supplements as historical/superseded and linked each directly to the passing current-bundle QA, preserving original reproduction details and artifacts.
- Confirmed no other UX-REG-03/04 paragraph presents them as open/current; references in the release row describe both as Complete.
- Confirmed the owner's answer (“yes”) means use only an original-platform-supplied cover and show a neutral placeholder when none is supplied; the requirements blueprint and synthetic QA already encode that behavior. Recorded the re-confirmation in the canonical backlog. Production origins, format/size limits, and human review/removal policy remain undefined, so the real-cover gate stays fail-closed.
- `git diff --check -- docs/PROJECT_BACKLOG.md docs/qa/2026-09-30-backlog-registration-history-reconciliation.md` passed with no whitespace errors.

**Result:** Pass. This resolves backlog wording ambiguity and records the clarified owner decision. It is not a new product QA run and does not change any release gate.

**Git state:** Branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`; shared working tree contains many unrelated changes. This session changed only the canonical backlog and this QA record; no commit or push.
