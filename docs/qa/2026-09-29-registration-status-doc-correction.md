# Registration retest status documentation check

**Date:** 2026-09-29 (Asia/Shanghai)  
**Owner:** Primary; Xiaofeng raised the stale-status finding  
**Scope:** QA-01 registration double-submit and recovery evidence in the account-form QA note, roundtable, and canonical backlog.

## Check and correction

Xiaofeng's release recheck found that the roundtable still described registration recovery as untested after Hermann's same-session Edge 154 pass. The account-form QA note already preserves the 2026-09-28 result as historical and adds a superseding 2026-09-29 result. The roundtable checkpoint now identifies its date and links directly to that superseding evidence. The canonical QA-01 row already records the Edge pass and remains `In progress` for the unrelated native accessibility/device gaps.

## Verification

- Cross-read the account-form QA, Edge lifecycle QA, roundtable checkpoint, and QA-01 backlog row; all now distinguish the earlier failed harness from the later passing Edge run.
- Confirmed no product source, test result, runtime state, or release status was changed by this documentation correction.
- Independent Dennis review and Hermann QA recheck confirmed the historical checkpoint is clearly superseded, the QA-01 status is consistent, and the reviewed relative links resolve. Both also confirmed the revised Git-path wording accurately distinguishes unchecked/inaccessible locations from a missing executable; Git checks remain outstanding.
- PowerShell read-through check of the four affected Markdown files found no missing relative links. Two-space trailing markers occur on Markdown hard-break lines in the QA notes.
- Initial `git diff --check`/`git status` attempts in the non-elevated shell could not run because Git was not resolvable there. A narrowly scoped elevated read-only check later succeeded: `git diff --check` exited 0 (only existing LF/CRLF normalization warnings), branch `vnext-home-hosted` remains ahead 18 at `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`, and the correction QA file is untracked while the roundtable and backlog are modified. No commit or push was made.

**Disposition:** documentation inconsistency corrected, peer review and content/link read-through passed, and Git diff/status evidence recorded. DOC-03 is complete. QA-01 remains open for the separately listed native accessibility/device work; release remains on HOLD for its open P1 gates and customer acceptance.
