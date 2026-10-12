# Hermann isolated feedback lifecycle continuation QA (2026-09-30 03:24 local)

## Target and safety

- Target: `http://127.0.0.1:8793`, current-source `adas-vnext` isolated service. `/health`, `/`, and `/app.js` returned HTTP 200 before browser use. Synthetic SQLite database and synthetic-only admin/pending/approved-member credentials were verified in read-only inspection. Port 8788, its scheduled task, real accounts/data, and the production database were not touched.
- Browsers: headed Playwright Core controlling Chrome 153.0.8010.54 and Edge 154.0.4258.37. Desktop viewport 1280×900; responsive pending-member 320×800 and approved-member 390×844.
- Detailed browser scripts, JSON, and screenshots are in [`output/playwright/live-feedback-user-story-suite-20260930/`](../../output/playwright/live-feedback-user-story-suite-20260930/).

## Verified behavior

- Signed-out: app shell and Account navigation rendered in both browsers; `/api/reports`, `/api/feedback/mine`, and `/api/admin/feedback` returned 401; feedback/admin navigation was hidden.
- Pending member: could submit an Issue (HTTP 201), see own feedback form/list, could not access report/filter/summary/admin APIs (403), and could not access admin navigation. Submitted Issue was visible in admin queue with submitter attribution and timestamp.
- Approved member: reports and own feedback APIs returned 200; admin queue returned 403; Issue/Feature form rendered. A simulated failed POST retained the draft and left retry enabled. Chrome retry then created exactly one request (201).
- Admin: user-management view and feedback queue rendered; queue showed attribution and timestamps. Type filter returned only the selected type. In Chrome, synthetic Issue triage moved through Under review → In progress → Complete with public updates, Added to backlog with `FEEDBACK-04`, Duplicate with primary request link, and Under review after retry. A synthetic Edge Issue was set to Not planned with a public rationale. All PATCH requests returned 200; status filter displayed the Not planned request.
- Submitter privacy and lifecycle: in both browsers, approved member history showed Added to backlog and canonical ID, Duplicate and primary link, and retry status. Pending member saw the completed issue and public progress update. Submitters did not see private admin notes or admin identities; each member saw no other submitter's requests.
- 320px pending-member and 390px approved-member viewports had matching document/body client and scroll widths. Zero browser page errors in both browsers.

## Interrupted harness attempts and limits

- The initial all-in-one suite stopped on its own stale assertion that the issue filter must contain exactly two rows; the shared disposable DB had five Issue rows. A separate browser continuation confirmed the filter contained only Issue rows (five); Feature filter contained only Feature rows (eleven). This is a harness assumption failure, not a product finding.
- A later Edge submission returned HTTP 429 after repeated synthetic submissions by the shared test member. Rate limiting is expected by the feedback spec; this run did not evaluate user-facing recovery for HTTP 429, so that error state remains unverified rather than a confirmed defect.
- The admin lifecycle continuation completed triage but its first screenshot destination was malformed by Windows URL path joining; a later read-only pass verified member privacy/lifecycle in both browsers and saved responsive screenshots. The Not planned submitter-view follow-up had a harness navigation/session issue after calling a non-UI logout route. The administrator's Not planned disposition, public rationale, and status filter were verified; that particular member-visible reason/private-note boundary was not re-verified in this continuation (other member privacy checks passed).
- Existing feedback requests were submitted only into the explicitly synthetic isolated DB. It remains running for the project's follow-up; no cleanup was performed because it is the shared isolated test instance.

## Outcome

This completes the feedback acceptance paths exercised in this continuation, except the explicit 429 user-facing recovery and member-visible Not planned verification noted above. It does not claim whole-system/all-feature coverage, and it does not validate the stale active 8788 process. Keep `LIVE-FEEDBACK-01` In progress until live runtime readiness and broader user-story coverage are completed.
