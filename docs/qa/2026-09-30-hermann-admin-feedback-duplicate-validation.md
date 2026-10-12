# Hermann admin duplicate-reference validation — 2026-09-30

## Runtime and scope

- Target: isolated current-source `updater-vnext` service on `127.0.0.1:56937`, disposable synthetic member/admin accounts and feedback requests; live port 8788 was untouched.
- Browser: headed Microsoft Edge 154.0.4258.37, viewport 1280×900.
- All six served UI assets matched workspace source. Browser page errors: zero.
- Scenario: synthetic member creates a Feature request; admin selects Duplicate, enters a public explanation, and tries saving without a primary request reference.

## Reproduction and result

DEFECT reproduced. The duplicate reference control was empty, but `required` was false and passive native validity returned valid. Save sent a PATCH; server returned HTTP 400: “Link a primary request before marking this request as a duplicate.” The editor remained open with the field empty, Save enabled and focused. After adding the primary request ID, the next PATCH returned 200 and Duplicate status/public explanation persisted.

This is a client validation gap: selecting Duplicate should make the primary reference required and focus/report the missing value before a request is sent. The member view also omitted both the primary ID and primary title after the valid save; that is a separate existing issue tracked as `FEEDBACK-DUPLICATE-LINK-01`.

## Cleanup and evidence

Disposable data, browser profile and isolated service were removed/stopped. Live 8788 was untouched. See [runner, result and screenshots](../../output/playwright/admin-feedback-duplicate-required-field-20260930/).

## Finding

- `FEEDBACK-TRIAGE-DUPLICATE-VALIDATION-01` remains In progress pending implementation and regression verification.
- Acceptance: choosing Duplicate marks the primary-reference input required; saving empty sends no PATCH, presents a clear localized validation message and focuses the field; valid reference saves successfully; other statuses do not require the field; member linked-request identity is separately verified under `FEEDBACK-DUPLICATE-LINK-01`.
