# Hermann QA session — user report: feedback queue stuck loading

**Date:** 2026-09-29 (Asia/Shanghai)  
**Owner:** Primary agent; Hermann browser UX tester  
**Target:** `updater-vnext`, browser context `http://127.0.0.1:8793/#intro`  
**Outcome:** Record and safely triage the owner's report that no feedback can be created during a Feedback session and the queue remains at “Loading feedback queue.”

## Acceptance checks

1. Check whether the reported browser target is reachable and can render before attempting UI acceptance.
2. Probe only read-only routes on the available local service; do not submit feedback or otherwise mutate the live service/database.
3. Record whether an authenticated UI reproduction was possible and link the finding in the canonical backlog.

## Session evidence

- The owner reports that creating feedback failed and the Feedback queue stayed loading. This is recorded as a user-reported symptom; no screenshot, request trace, authenticated session, or exact reproduction sequence was supplied in this report.
- Browser bridge setup remains unavailable in this environment (request-header policy load failure; prior 8793 tab lookup failed). This session used PowerShell HTTP/TCP probes instead; no controlled browser rendered the target.
- `127.0.0.1:8793`: TCP connection refused; `/health` could not connect. Rendered UI and authenticated API behavior on that port are unverified.
- `127.0.0.1:8788`: `/health` returned 200; `/api/auth/me` returned `{"user":null,"csrf":null}`; unauthenticated `/api/feedback/mine` and `/api/admin/feedback` each returned 401, as expected. This proves service reachability only; it does not reproduce the authenticated report.
- No authenticated requests, feedback submissions, queue loads with credentials, or database writes were sent to either service.
- Earlier isolated, source-matched Edge sessions verified successful synthetic member submission and admin queue loading. Those do not establish the state of the owner's reported runtime.

## Result and follow-up

The reported defect is **unverified**, not closed and not confirmed as an application defect. Since the supplied browser target is currently unavailable and the healthy service is signed out, the reproduction gate could not be completed. Keep `LIVE-FEEDBACK-01` In progress. Resume authenticated UI reproduction when the intended server/session is available, using safe runtime/database identity or an isolated runtime tied to the deployed state before writes.

No source changes, tests, live mutations, service restarts, or cleanup actions were performed. QA is limited to the read-only reachability/status probes above.
