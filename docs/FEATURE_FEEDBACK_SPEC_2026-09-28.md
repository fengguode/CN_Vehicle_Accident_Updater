# Authenticated issue and feature requests

**Status:** Initial implementation in progress; policy gates remain open.  
**Owner:** Feng (product decisions); primary integrates; System Architect proposal reviewed 2026-09-28.  
**Target:** `updater-vnext`.

## Goal

Let an authenticated user report an issue or request a feature, review their own submissions, and see clear status updates. Every submission must receive a recorded triage disposition. Accepted engineering work is promoted into the single canonical [`PROJECT_BACKLOG.md`](PROJECT_BACKLOG.md), with a link back to its source request. Request intake is not itself a product commitment.

## User stories and acceptance criteria

1. **Submit a request.** A signed-in user selects `Issue` or `Feature`, enters a concise title and description, and optionally gives reproduction/context details. The service validates bounded lengths, stores a stable ID, and confirms receipt. No attachments or automatic environment dumps in the first release.
2. **Track submissions.** A user sees only their own requests with ID, type, submitted/updated time, status, latest public update, and (when accepted) canonical backlog ID. Listing or guessing another request ID never discloses its existence or contents.
3. **Triage requests.** An approved administrator can filter a queue and set disposition/status, priority, a user-visible update, and (when accepted) one or more canonical backlog IDs. Admin-only working notes are not returned by submitter endpoints.
4. **Record history.** Every submission and triage change records actor and timestamp. The administrator history view displays the event actor and timestamp; status transitions and public updates are auditable. Submitter history shows only permitted public events and never admin actor identities or internal notes. Duplicate requests link to a primary request.
5. **Connect accepted work.** Admin triage decides which requests enter the canonical project backlog. Promoted work receives an ordinary stable backlog ID, owner, priority, dependencies, acceptance evidence, and Git state. The app never writes to repository Markdown or promises delivery automatically.

## Proposed request lifecycle

- `Submitted` — received and awaiting triage.
- `Under review` — triage started.
- Clarification requests remain `Under review`; an administrator uses the public update field to ask for missing details. The first version has no submitter-reply status or comment flow. Existing `Needs information` records remain visibly marked as legacy and must be moved to `Under review` with a public update when next triaged; history is preserved.
- `Added to backlog` — accepted for engineering consideration and linked to a canonical ID; this is not a release or delivery promise.
- `In progress` / `Complete` / `Blocked` — progress copied into the request by an authorized administrator when the linked backlog item changes.
- `Not planned` — decision and user-visible reason recorded.
- `Duplicate` — linked to a primary request with a visible explanation.

The owner adopted weekly internal triage, Feng retains final scope/priority authority, and no submitter response-time promise is made. `Needs information` is retired; details are requested through public updates while status remains `Under review`. Other allowed-transition details remain under FEEDBACK-TRIAGE. The canonical engineering status remains `Not started`, `In progress`, `Blocked`, or `Complete` in `PROJECT_BACKLOG.md`; request status is a communication view and must not become a second work tracker. `Added to backlog` means accepted for consideration, not delivery commitment. No response-time promise is shown.

## Proposed triage-to-backlog procedure

1. An administrator reviews the queue during the weekly project status review (owner-adopted internal cadence; not a submitter response-time promise).
2. Every request reviewed receives a disposition and a requester-visible explanation when declined or marked duplicate. Requests waiting for review remain `Submitted`.
3. Only accepted work becomes a new canonical backlog task. The task must include the source request UUID, owner, priority, dependencies, acceptance evidence, and Git state. The feedback record stores the canonical ID; accepted work does not automatically promise release or delivery.
4. As canonical work changes state, an administrator updates the requester-visible feedback status. The canonical Markdown backlog remains the engineering source of truth; the app does not write repository files.
5. Keep `FEEDBACK-TRIAGE` in the shared backlog until a weekly triage cycle is recorded and requests can be traced through disposition and accepted canonical task links.

## Proposed permission and privacy rules

- Confirmed visibility (owner, 2026-09-28): submitter and authorized administrators only; other users cannot browse requests.
- Confirmed eligibility (owner wording, 2026-09-29): any active signed-in user, including a pending account, may submit. This satisfies “logged-in user”; approval remains required for report/database access and admin triage.
- Writes require a valid active session and CSRF protection. Admin triage requires approved administrator role.
- The original wording is rendered as text. Bound request body and field lengths; validate type/status/priority/reference IDs; rate-limit submissions.
- Collect no passwords, session tokens, attachments, raw database output, or automatic environment data. Warn users not to include sensitive or graphic material.
- Do not publish requests into report JSON or public pages. Keep public submitter updates separate from admin-only notes.
- Confirmed retention rule (owner, 2026-09-29): account disable remains reversible; an administrator may separately and irreversibly anonymize a disabled account while retaining feedback requests and audit history under the anonymous identity. Report-relevance votes remain until an administrator separately deletes them; issue/feature feedback history and legacy ADAS votes are outside that action.

## Suggested implementation breakdown

| ID | Work | Acceptance evidence |
|---|---|---|
| FEEDBACK-01 | Agree requirements and access/status policy. | Owner decisions recorded; stories and transition rules are implementation-ready. |
| FEEDBACK-02 | Add SQLite request/event storage, authenticated create/list APIs, and the user Account request form/list. | Isolated tests cover schema migration, bounds, CSRF, ownership, persistence, status/history rendering, and auth expiry. |
| FEEDBACK-03 | Add admin-only triage queue and status/update/backlog-link actions. | Isolated tests prove non-admin denial, valid transitions, public/private field separation, audit history, and stable backlog IDs. |
| FEEDBACK-04 | End-to-end QA, accessibility, security review, and backlog handoff procedure. | User Tester and Reviewer pass the complete request lifecycle in a disposable service/database; every new request is dispositioned; linked accepted work is in the canonical backlog. |

## Decisions and assumptions

Feng's requirement establishes issue and feature intake, own-list visibility, and status updates. The owner confirmed that the submitter and administrators may see a request; other users may not. On 2026-09-29, the user requirement "logged-in user" was resolved as any active signed-in account, including pending accounts; this is a confirmed eligibility rule, not an assumption. Approval remains required for report/database access and administrator triage. The owner adopted weekly internal triage, retained final project scope/priority authority, no response-time promise, and `Added to backlog` as consideration rather than delivery commitment. `Needs information` is retired and clarification is requested with a public update while the request remains `Under review`; legacy rows are preserved and must be transitioned with a public update. The owner confirmed reversible disable followed by separate, irreversible admin anonymization. Request content, status, feedback events, and audit history stay linked to the anonymous identity. Report relevance votes remain until a separate admin-confirmed delete removes them and their rating receipts, then rebuilds the current community relevance model/scores. Historical ADAS `review_votes` and feedback records are not deleted by that action. Editing/withdrawal was not requested and is excluded from v1; canonical backlog IDs must refer to existing tasks and do not promise delivery. The implementation does not mutate production services or data.

Other decisions to confirm or explicitly adopt as initial-version defaults:

- **Confirmed 2026-09-29:** pending but authenticated active accounts can submit, matching the owner's “logged-in user” requirement.
- **Owner-adopted 2026-09-29:** weekly internal administrator triage; Feng retains final scope/priority authority; no submitter response-time promise.
- **Owner-confirmed 2026-09-29:** `Added to backlog` means accepted for consideration, not a delivery commitment (documented in the README and current UI).
- **Owner-confirmed 2026-09-29:** disabling remains reversible; after disabling, administrators can irreversibly anonymize the account while retaining feedback/audit rows. An administrator may separately delete that anonymized account's report relevance votes.
- Private notes remain administrator-only and are never included in submitter-visible updates. The owner confirmed administrators may access requests and submitter identity.
- Categories/priority fields, duplicate workflow, and whether backlog status mirrors manually or through an explicitly maintained update.
- Notifications, attachments, comments, and integrations are excluded from the first version unless requested.

## Existing system fit

The vNext API already has signed-in, approved-member, and admin guards in `apps/api/server.js`; account data and other service state live in SQLite. The architectural recommendation is separate `feedback_requests` and append-only `feedback_events` tables, with foreign keys and indexes by submitter/status/update time. Suggested API: `POST /api/feedback`, `GET /api/feedback/mine`, `GET /api/admin/feedback`, and `PATCH /api/admin/feedback/:id`. The API sketch is not an approved contract until FEEDBACK-01 decisions are settled.

## 2026-09-29 implementation and contract review

The core intake/list/triage workflow is implemented and its isolated lifecycle is recorded under FEEDBACK-02/03/04. The README and current UI allow any active signed-in user, including a pending user, to submit, matching the owner's wording “logged in”; eligibility is confirmed and no longer requires an owner decision. The implementation links accepted work to existing canonical backlog IDs and never writes repository Markdown automatically.

The weekly internal project review is owner-adopted; Feng retains final scope/priority authority, admins conduct triage, no response-time promise is made, and `Added to backlog` is consideration only. `Needs information` is retired; staff request missing details through public updates while status remains `Under review`. Existing rows retain the legacy label and history until transitioned with a public update. Account anonymization and vote deletion are implemented as separate admin actions; isolated API and Edge acceptance evidence is tracked under FEEDBACK-PRIVACY-01. FEEDBACK-TRIAGE remains open until the operating loop is demonstrated and accepted work links to canonical tasks.

The current append-only event records capture the triage action, actor, timestamp, resulting status, and public update. They do not preserve before/after values for priority, backlog IDs, duplicate target, or internal notes. The existing requirement explicitly needs actor/time for each triage action and an auditable status/public-update history; whether it also requires value-level audit for those other fields is a contract decision for FEEDBACK-TRIAGE, not an assertion that the tested status history is broken.

**FEEDBACK-VALIDATION-01 contract (adopted 2026-09-29):** A submitted request has a title of 5–120 UTF-16 code units, a description of 10–4000 UTF-16 code units, and optional context of 0–2000 UTF-16 code units. These values match the first-party form and are enforced authoritatively by the API. The server trims all three text fields before checking required/minimum/maximum lengths and persists the trimmed values; the form trims the controls before native constraint validation and submission so whitespace-only or whitespace-padded values receive the same required/minimum treatment. JavaScript `String.length` and HTML `minlength`/`maxlength` use UTF-16 code units, including supplementary characters. Request-body size and submission-rate limits remain separate API protections. See [canonical backlog item](PROJECT_BACKLOG.md#active-and-blocked-work) and its linked QA evidence.
