# Vote icon and rationale scope reconciliation — 2026-09-30

## QA session

- **Target:** `updater-vnext` project backlog and current web vote controls.
- **Read:** project README, canonical `VOTE-ICON-01` and `VOTE-REASON-01` rows, the existing [icon UI acceptance](2026-09-29-vote-icon-ui.md), and [rationale feature brief](2026-09-28-vote-reason-feature-backlog.md).
- **Source check:** `apps/web/app.js` creates the current relevance vote controls as icon buttons with accessible names and `aria-pressed`; the source contains thumb icon SVG generation. Existing Edge 154 QA covers English/Chinese, save/change semantics, focus, 320px mobile width, and forced-colors differentiation.
- **Finding:** the owner's earlier thumb-up/down request is implemented and independently accepted under `VOTE-ICON-01`. The remaining `VOTE-REASON-01` scope is a separate optional-rationale feature plus a proposed SVM segmentation/evaluation use. It must not be reported as an unfinished icon-button change.
- **Open contract:** no vote rationale is currently stored or used. Before adding it, the project owner/System Architect must decide rationale purpose (tokenization/segmentation versus classifier training), visibility/access, retention/deletion, how vote changes/undo handle a reason, and model-refresh behavior. Any model claim needs held-out evaluation against the existing baseline. Keep raw reasons private from public reports and exports.
- **Result:** backlog-only clarification passed read-through. No application behavior, schema, model, or user data changed. Scoped `git diff --check -- docs/PROJECT_BACKLOG.md` passed.

## Disposition

`VOTE-ICON-01` remains Complete. `VOTE-REASON-01` remains Not started until the rationale/model contract is decided; it is not required to finish the already requested icon UI.
