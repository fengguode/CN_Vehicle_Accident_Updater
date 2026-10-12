# Signed-out localhost browser recheck 04

**Date:** 2026-09-29 (Asia/Shanghai)
**Target:** `http://127.0.0.1:8788/`
**Browser:** Codex In-app Browser, tab 13; normal desktop viewport (no override)
**Tester:** Primary browser UX pass; no credentials or mutations

## Runtime and safety

- Port 8788 accepted connections; `/health` and `/` returned HTTP 200. `/api/auth/me` returned HTTP 200 with `user:null` and `csrf:null`.
- Ports 8793 and 8794 were unavailable at the time of this pass.
- The running 8788 process/database identity remain unverified. Authenticated/member/admin journeys and registration submission were therefore not attempted.

## Journey checks

| Journey | Observation | Result |
|---|---|---|
| Signed-out Reports | Reports view described reports as public research leads and explicitly required an approved account to view reports; an Open account control was present. | No new defect in this slice. |
| Account login | Account view showed localized sign-in description, username/password inputs, Log in, and invitation registration. | Pass for this view. |
| Chinese localization | Language switch changed navigation, form labels, login copy, and registration controls to Chinese. The browser document title remained `China Traffic Incident Database`. | Reproduced UX-I18N-01. |
| Invitation registration | In Chinese mode, the form displayed username, password, invitation code, and Create account, with no visible explanation or path to request an invitation. | Reproduced UX-REG-01. |

No credentials were entered and no account, invitation, or report data was changed. No distinct new defect was found. The prior findings remain open pending owner decision on the intended invitation request route and a localized title fix.

## QA and Git evidence

Rendered user journey inspected using Codex In-app Browser accessibility snapshots. No browser automation errors were observed during interactions. Only canonical QA/backlog documentation was changed for this session; no app source or running service was changed. `updater-vnext` branch `vnext-home-hosted`, HEAD `daa5b58`; working tree contains pre-existing shared modifications and untracked work; no commit or push. A scoped `git diff --check` passed with line-ending warnings.
