# Hermann browser story matrix follow-up (2026-09-30 04:24 local)

## Preflight

- Isolated `http://127.0.0.1:8793`: `/health` returned `{ "ok": true, "service": "adas-vnext" }`; `/` returned 200 with the expected product title.
- Fresh headed Chrome 153.0.8010.54 and Edge 154.0.4258.37 bootstrap passed at 1280×900. All seven served UI assets matched workspace bytes. Reports and Account rendered. Anonymous protected endpoints returned 401. Both browsers had zero page exceptions and zero failed requests. Evidence was refreshed at [`bootstrap-results.json`](../../output/playwright/live-feedback-user-story-suite-20260930/bootstrap-results.json).
- Synthetic-only account/session coverage was used; no auth or write to port 8788.

## Follow-up acceptance

- **Member-visible Not planned rationale — PASS:** Fresh headed Chrome logged in as the synthetic pending member, loaded the existing synthetic Issue marked Not planned, and verified the public reason was present in `/api/feedback/mine` and the rendered own-request card. The member response and UI omitted the private admin note and admin identity. Zero page errors. See [`not-planned-member-view-results.json`](../../output/playwright/live-feedback-user-story-suite-20260930/not-planned-member-view-results.json) and screenshot in the same artifact folder.
- **Feedback queue timeout and filter regression — PASS:** Headed Edge 154 held an admin queue GET for 8.2 seconds. Current UI left `aria-busy=false`, replaced the spinner with “The feedback queue took too long to load. Try again”, and exposed one retry control. Releasing the original stale GET did not replace newer filtered results. Changing Status and Type loaded 12 and 5 matching cards respectively, announced the result count, and focused the visible Feedback heading. This run reproduced expected timeout recovery/filter behavior; no new defect. See [`queue-focus-recheck-results.json`](../../output/playwright/live-feedback-user-story-suite-20260930/queue-focus-recheck-results.json).
- A separately written direct Retry-click harness did not reach its route-interception promise and was stopped; it produced no product finding. Prior dedicated timeout/retry acceptance for the final app.js hash is recorded in the canonical backlog and [current queue focus QA](hermann-current-queue-focus-regression.md).

## Story matrix disposition

This closes the Not planned member-view gap called out in the earlier matrix entry. 429 presentation/recovery was already verified in [the dedicated rate-limit QA](hermann-member-feedback-rate-limit.md); the separate zh-CN localization defect `FEEDBACK-I18N-RATELIMIT-01` is Complete after reviewed EN/zh-CN fix and browser regression (see canonical backlog and linked fix QA). Media approve/reject is covered by [the dedicated synthetic candidate QA](hermann-media-review-approve-reject.md); this shared fixture itself has no candidates. Whole-system matrix and native QA-01 acceptance remain In progress. Port 8788 remains a distinct runtime item and was not authenticated, modified, or restarted.

