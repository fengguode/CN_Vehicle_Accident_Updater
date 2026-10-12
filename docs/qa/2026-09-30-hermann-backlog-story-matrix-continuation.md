# Hermann backlog-based browser story matrix continuation (2026-09-30)

## Target and provenance

- **Service:** `http://127.0.0.1:8793`, healthy isolated current-source `adas-vnext`; health returned 200. Synthetic-only DB/credentials per [isolated environment setup](2026-09-30-live-feedback-isolated-environment.md) were used. No request authenticated, mutated, or restarted port 8788; no scheduled task/production data was touched.
- **Browsers:** headed Playwright Core; Chrome 153.0.8010.54 and Edge 154.0.4258.37. Fresh bootstrap at 1280×900. Follow-on report test at 320×800; existing feedback continuation tested member/pending layouts at 390×844 and 320×800.
- **Bootstrap parity:** `/`, `/health`, and all seven served UI files (`app.js`, `navigation.js`, `feedback-drafts.js`, `feedback-triage.js`, `viewport.js`, `report-presentation.js`, `styles.css`) returned 200. Each served asset was byte-identical to its workspace source. Both browsers rendered the Reports shell/heading, Account navigation opened, and there were zero page exceptions or failed requests. The anonymous protected report, own-feedback, and admin-feedback endpoints returned 401.
- Machine evidence: [`output/playwright/live-feedback-user-story-suite-20260930/`](../../output/playwright/live-feedback-user-story-suite-20260930/), especially `bootstrap-results.json`, `member-report-stories-results.json`, `account-invitation-approval-results.json`, `media-review-role-filter-results.json`, and `submitter-privacy-results.json`.

## Story matrix

| User story / surface | Browser evidence | Result |
|---|---|---|
| Signed-out visitor understands the research-lead scope and is gated from restricted data | Chrome + Edge shell; heading and research lead statement rendered; Account opens; Feedback/admin nav hidden; protected APIs 401 | Pass |
| Pending invitee registers and waits for report approval | Chrome: invalid invitation produced a clear 400 message; a synthetic valid invitation registered one member (201); feedback remained available, admin navigation stayed hidden, and report/filter/summary APIs returned 403 | Pass |
| Administrator approves a pending member | Chrome admin User management row displayed pending approval; UI save returned 200 and announced “Changes saved.” | Pass |
| Newly approved member accesses the research workspace | Fresh login returned 200; three report cards loaded; admin navigation remained hidden | Pass |
| Member reviews records as unverified leads and retains provenance | Three cards and “3 reports · 3 unverified”; details exposed the unverified status and HTTPS source link | Pass |
| Member searches, filters, resets, and changes sort/language | Exact-title search produced one card; unmatched search exposed empty state/reset; reset restored all three; unverified filter and relevance/date sort worked; English/Chinese toggle changed heading/lang and returned | Pass |
| Member saves, changes, and removes a relevance vote | Through rendered controls: relevant POST 200 and selected state; change to not relevant POST 200; undo DELETE 200 removed the current vote. Synthetic DB returned to its prior no-vote state for that report | Pass |
| Approved/pending submitter tracks feedback and admin triages lifecycle | Prior [feedback continuation QA](2026-09-30-hermann-feedback-lifecycle-continuation.md): submitter isolation, public updates, hidden internal notes/admin identities, backlog link, duplicate link; admin type/status filters and Submitted→Under review→In progress→Complete/Added to backlog/Duplicate/Not planned. Both browsers, synthetic DB | Pass with noted gaps below |
| Member cannot access media moderation | Edge member media-review nav hidden and protected endpoint returned 403 | Pass |
| Admin media queue status filters | Edge admin selected Pending/Approved/Rejected; each returned a consistent empty state, 0 cards, and 200 API response | Pass for empty states only; no candidate existed to test approve/reject actions in this fixture. Earlier dedicated approve/reject evidence is linked from the canonical backlog. |
| Responsive layout and runtime JavaScript | This pass: no horizontal overflow at 320px member width; zero page exceptions. Feedback continuation: 320px pending, 390px approved, and 320px admin checks | Pass for sampled widths |

## Open story acceptance and limits

- HTTP 429 recovery is covered by the dedicated [rate-limit QA](2026-09-30-hermann-member-feedback-rate-limit.md): the polite error is visible, the draft remains, Submit is enabled/focused, and the request list remains available. The separate confirmed `FEEDBACK-I18N-RATELIMIT-01` finding is that the English 429 message is not localized in zh-CN; it remains In progress and was not retested in this run.
- The original continuation missed the member-visible Not planned rationale because of a harness logout/session navigation issue. A fresh headed Chrome session now verifies that the member sees the public reason/status while private notes and the admin identity remain hidden; see the [follow-up QA](2026-09-30-hermann-story-matrix-follow-up.md).
- Native accessibility acceptance remains open under `QA-01`: native 200% zoom, screen reader behavior, physical/mobile keyboard device, and physical forced-colors checks. Automated viewport-width checks do not replace them.
- Media approve/reject could not run on this three-report fixture because its moderation queue was empty; the dedicated synthetic-candidate [approve/reject QA](2026-09-30-hermann-media-review-approve-reject.md) passes.
- This pass covers browser-facing account, report, rating, feedback, and moderation stories. It does not claim completion of collector/import/model/backfill stories or whole-product acceptance. Use the existing backlog/spec links and dedicated QA records for those areas.
- The source/current isolated bootstrap blocker is resolved on 8793. The active 8788 runtime is a separate unresolved readiness item and was not authenticated or modified. Keep `LIVE-FEEDBACK-01` and `QA-01` In progress until their remaining acceptance gates are recorded.

## QA review

Reviewed the browser JSON for role, status, HTTP result, asset parity, page exception, vote-restoration, and responsive evidence. `bootstrap-results.json`, `member-report-stories-results.json`, `account-invitation-approval-results.json`, and `media-review-role-filter-results.json` report PASS; `submitter-privacy-results.json` reports PASS for the earlier feedback continuation. No new product defect was confirmed in this pass.


