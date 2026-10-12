# Feedback actor history UI QA

**Date:** 2026-09-29 (Asia/Shanghai)  
**Target:** `updater-vnext`, current `vnext-home-hosted` checkout.  
**Backlog:** `FEEDBACK-AUDIT-UI-01`; canonical status remains [`PROJECT_BACKLOG.md`](../PROJECT_BACKLOG.md).  
**Requirements:** [Authenticated request spec](../FEATURE_FEEDBACK_SPEC_2026-09-28.md), history criterion 4.  
**Session type:** Isolated service, synthetic accounts, and Edge UI acceptance. No live account, database, process, task, or public artifact was changed.

## Roundtable decision

Dennis found that the admin Feedback API preserved and returned each event actor, while the normal admin history view omitted that name. Feng confirmed API recording met the original literal requirement, and separated visible UI attribution from the still-open decision about before/after snapshots for other triage fields. Yuzhou recommended showing the actor in ordinary admin history, with separate localized labels for submission and triage. Xiaofeng assessed the omission as a non-showstopper P2 auditability gap. The primary adopted the UI criterion and retained broader value-level audit scope under `FEEDBACK-TRIAGE`.

## Environment

- Source: `apps/api/server.js`, `apps/web/app.js`, `src/db.js`.
- Isolated service: `http://127.0.0.1:18878`; `/health` returned `200 {"ok":true,"service":"adas-vnext"}`.
- Database: `output/playwright/feedback-audit-ui-20260929/feedback.sqlite`, containing only synthetic test records.
- Browser: Microsoft Edge `154.0.4258.37`, launched by cached Playwright Node API through `node_repl` using the installed `msedge.exe` path. Browser contexts were headless; this verifies Edge rendering and interaction but not a visible desktop window.
- Viewports: admin 1280×800 and 390×844 CSS px; submitter 390×844 CSS px.
- Browser artifacts: [sanitized result JSON](../../output/playwright/feedback-audit-ui-20260929/edge-results.json), [English admin screenshot](../../output/playwright/feedback-audit-ui-20260929/admin-en-1280x800.png), [Chinese admin screenshot](../../output/playwright/feedback-audit-ui-20260929/admin-zh-1280x800.png), [narrow admin screenshot](../../output/playwright/feedback-audit-ui-20260929/admin-zh-390x844.png), and [submitter screenshot](../../output/playwright/feedback-audit-ui-20260929/member-390x844.png).

## Acceptance checks

- Admin reviewer could see the synthetic request and the two event actors: `Submitted by: qa_feedback_submitter` and `Updated by: qa_feedback_actor`, each with its timestamp, status, and public text. The submitted event displays the localized receipt message rather than repeating the raw action name.
- After switching to Chinese, both actor labels, the submission receipt, and status labels localized correctly while usernames and ISO timestamps remained intact.
- The submitter's own Account view displayed the public update and status. It showed no actor names, internal note, or Feedback admin navigation. `GET /api/feedback/mine` also omitted actor and `internal_notes` fields.
- A route-intercepted legacy admin response with `actor` removed still rendered its timestamp, status, and public update without errors.
- At 390×844, both admin and submitter views had no horizontal overflow; the actor label remained visible in the admin history.
- Browser console errors: none. Full browser assertion results are in the linked JSON artifact.
- Hermann independently re-ran the focused Edge 154 check with separate synthetic admin/member contexts. He confirmed English and Chinese actor/time rows, public/private separation, hidden member admin navigation, no console/page errors, and no overflow at 390×844. He found no defect. His scope does not establish active-service authenticated writes, persistence-after-refresh, cross-submitter privacy beyond prior `FEEDBACK-04`, or native assistive-technology behavior.
- Dennis's final source review found no actionable issue: admin-only labels use safe text nodes, English/Chinese coverage is present, absent actor values are tolerated, member history remains public-only, and private notes stay in the admin-only card section.
- `npm test`: 66 passed, 0 failed. `node --check apps/web/app.js` passed. `git diff --check` exited 0; Git emitted line-ending normalization warnings for pre-existing modified working-tree files.

## Browser setup notes and limits

The Windows Computer Use bridge could launch Edge but stopped state capture because it could not determine the current browser URL with sufficient confidence. Playwright CLI initially hit `EPERM` writing its default daemon profile under `%LOCALAPPDATA%`; redirecting the daemon path into the workspace allowed Edge processes to start, but that headed CLI session never registered and was stopped. Its fresh disposable profile and daemon folder remain under `output/playwright/edge-session-20260929`; no credentials were entered. The Windows process inventory returned access denied, so the profile was retained rather than removed. The cached Playwright Node API then rendered the isolated localhost application successfully in Edge. A Google navigation returned `ERR_NETWORK_ACCESS_DENIED` under the restricted network. No existing Edge profile or tabs were changed.

The UI result is a focused pass for admin actor attribution, localization, submitter privacy, and narrow-width rendering. It is not a full release acceptance result; the separate release gates remain open.

## Git state

`updater-vnext`, branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`. Product and QA changes are uncommitted alongside pre-existing shared work. No commit or push.
