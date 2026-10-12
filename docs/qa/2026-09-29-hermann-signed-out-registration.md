# Hermann signed-out and registration browser QA

**Date:** 2026-09-29 (Asia/Shanghai)
**Target:** isolated `updater-vnext` service at `http://127.0.0.1:8793/`
**Source:** `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`
**Data:** disposable `%TEMP%\ctim-hermann-browserqa-20260929-02\qa.sqlite`; synthetic `qa-admin` and `qa-member` only.
**Browser/runtime:** Codex In-app Browser; version and configurable viewport unavailable. Same-origin `GET /` rendered the expected application and `GET /health` returned `{"ok":true,"service":"adas-vnext"}`. The service used disposable DB data; localhost:8788 was not used for role or account actions because its process/database identity was unverified.

## Session results

- Signed-out Reports access was gated behind approved-account sign-in, with no synthetic report exposed.
- Keyboard traversal reached Login; Return opened Account. Keyboard activation of “Register with invitation” exposed username/password/invitation-code fields.
- English/Chinese language toggle worked by keyboard.
- Synthetic invitation registration created `qa-member` and signed the account in as Pending.
- Pending Account showed no admin navigation; Reports displayed the administrator-approval waiting message and withheld the report workspace.
- Synthetic admin User management showed the new member as Pending. Changing the approval selector and saving by keyboard displayed “Changes saved.”
- A fresh member login showed Member/Approved; the approved Reports view exposed the single synthetic report and its unverified status/provenance.

**Result:** Pass for this focused rendered-browser slice; no new defect reproduced. Actions used only the isolated synthetic service and database. No source files changed. This record does not cover unregistered malformed-input handling, broader responsive behavior, or native screen-reader/device/zoom checks.

## Git state and QA disposition

`updater-vnext`, branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`, ahead 18. This QA note and the canonical backlog update are uncommitted alongside pre-existing shared work; no commit or push was made.
