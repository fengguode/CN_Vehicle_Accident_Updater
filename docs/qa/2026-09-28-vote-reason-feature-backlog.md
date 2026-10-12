# Backlog QA: icon voting with optional reasons for SVM segmentation

**Date:** 2026-09-28 (Asia/Shanghai)
**Target:** `updater-vnext`; backlog-only feature definition. No UI, API, database, or model behavior changed.

## Current-state evidence checked

- The README defines votes as “relevant traffic incident” / “not relevant” and says the score is not incident verification, severity, or source credibility.
- `apps/api/server.js` accepts authenticated `POST /api/vote` with fingerprint and vote fields.
- `apps/api/votes-repository.js` stores the current vote per user/report and builds SVM examples from report title and content with an aggregate vote label. Vote reasons are not currently stored or used.
- `src/svm.js` tokenizes with `Intl.Segmenter` and adds character bigrams for contiguous Han text.

## Backlog checks

- Added `VOTE-REASON-01` to the canonical project backlog with status **Not started**, owner roles, scope, acceptance criteria, dependencies, and this evidence link.
- Kept thumb controls semantically tied to the existing relevance labels, with accessible names and selected state required.
- Made the reason optional, required backend persistence, and recorded privacy, vote-change/undo, model-refresh, and evaluation questions.
- Flagged for architecture clarification whether rationales should refine segmentation or enter classifier training. No unsupported claim that rationale text improves SVM performance was made.

## Result

Focused documentation/read-through QA passed. The feature remains unimplemented and not started; dependent implementation requires the listed model and privacy decisions.
