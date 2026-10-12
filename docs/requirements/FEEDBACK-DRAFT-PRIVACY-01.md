# FEEDBACK-DRAFT-PRIVACY-01 — Member feedback draft identity isolation

**Status:** In progress.  
**Priority:** P2, user-data privacy finding.  
**Canonical backlog ID:** `FEEDBACK-PRIVACY-DRAFT-01`.  
**Scope:** Unsaved Issue/Feature form state in the `updater-vnext` browser UI.  
**Evidence:** Hermann reproduced Member A's unsent Feature title, description, and context appearing in Member B's form after same-tab logout/login. No request was sent. Same-account recovery was also observed. See [reproduction QA](../qa/2026-09-30-hermann-member-feedback-unsent-draft-privacy.md).

## Requirement

An unsent feedback draft belongs to the immutable account ID that entered it. A member may return to their own draft after navigating between views or logging out and back into the same account in the same tab. Another account must never see, submit, or receive the prior account's text through the shared form.

## Behavior

- Keep drafts in volatile, per-tab memory keyed by immutable account ID. Do not use `localStorage`, `sessionStorage`, cookies, a server endpoint, or cross-tab draft synchronization. A content-free same-origin auth-change signal may notify other tabs to lock and revalidate; it must not carry identity IDs or draft content.
- On logout, confirmed identity loss/change, or session refresh to a different account, clear the prior account's values from the form DOM before rendering any other account's controls. Restore a draft only for the confirmed matching account ID; otherwise show default/blank fields.
- Because same-origin session cookies are shared by tabs, synchronously snapshot and blank the member form when its document becomes hidden. Broadcast a content-free auth-change signal after login, registration, and logout; a receiving tab immediately locks account-owned content and revalidates `/api/auth/me`. When a hidden tab becomes visible, revalidate before revealing account-owned content or restoring a draft. Keep account-specific content hidden during that check; restore only the confirmed matching account. Visibility and periodic refresh remain fallbacks if broadcast is unavailable.
- The same account's role or approval changes do not change draft ownership. A successful in-flight submission from that same immutable account must still receive its success acknowledgement and refresh its own request list after a role/approval change; responses from another identity must be suppressed. If the user edits a newer draft while an earlier submission is pending, the earlier success must not clear or reset those newer edits.
- On every ordinary identity transition, reset field values and validation presentation (custom validity, `aria-invalid`, `aria-describedby`, and generated error nodes) before restoring the confirmed account's draft.
- Reloading or closing the tab may discard drafts. A late auth, feedback-list, or feedback-submit result from a previous identity must not reveal, overwrite, reset, or announce content in the current identity's form.
- Clear the submitting account's cached draft after a confirmed successful submit. Preserve it on an error for that same account; this does not promise a retry is safe after an ambiguous response.
- Draft contents must not be included in logs, status/live-region announcements, URLs, or another account's accessibility tree.

## Acceptance checks

1. Member A enters Type/title/description/context, logs out, and the form DOM no longer contains A's values before signed-out controls are shown.
2. A logs in again in the same tab and sees only A's exact draft. View navigation preserves it.
3. A logs out and B logs in; B sees default/blank fields and no A text in visible or hidden DOM/accessibility content. If B has a separate draft in that tab, only B's values restore.
4. Same-ID role/approval changes and same-account session recovery preserve the correct draft; a different ID never restores it.
5. Switching away from a tab synchronously removes the draft from its form DOM. A content-free same-origin auth broadcast locks other tabs after login/logout/registration; on return, account-specific content stays hidden until an auth refresh confirms the identity. Visibility and periodic refresh cover unavailable broadcasts.
6. Held auth/list/POST responses from the former identity cannot mutate the new identity's fields, status, receipt, or own-request list. A successful submit clears only the exact submitted draft; a same-identity failure retains it. A same-immutable-ID success after role/approval change is acknowledged and refreshes that account's own list. If newer text was entered while the response was held, it remains intact after the old request succeeds.
7. `/feedback-drafts.js` is served from the same origin with a JavaScript MIME type so the app's required module loads successfully.
8. English and Chinese views retain associated labels and visible keyboard focus; identity changes clear stale custom validity and inline errors. No draft content is announced in status text. Reload/new tab does not restore drafts.

## Design and risk disposition

Feng's requirements review and Yuzhou's design review agree that no additional owner decision is needed: keep recovery tab-local and volatile, because the README does not promise persistence and feedback context may contain sensitive information. Durable draft recovery is out of scope and would need a separate retention/privacy decision. The existing `FEEDBACK-IDEMPOTENCY-01` report independently reproduces duplicate creation after a committed POST response is lost. It remains a separate task and is not a blocker for identity isolation; this item must not imply that ambiguous retries are safe.

## Implementation handoff

Torsten owns the bounded UI change; primary integrates; Dennis independently reviews; Hermann performs source-matched isolated Edge regression using disposable accounts/database. Live service and real user data remain untouched. Record implementation, review, browser QA, and Git state in the canonical backlog before completion.
