# Signed-out localhost browser recheck 05

**Date:** 2026-09-29 (Asia/Shanghai)
**Target:** `http://127.0.0.1:8788/`
**Browser:** Codex In-app Browser, tab 14; default desktop viewport, no override
**Tester:** Primary browser pass; Hermann's independent browser inventory was empty

## Runtime and safety

- Port 8788 was live; `/health` returned HTTP 200 with `ok:true`; `/` returned HTTP 200; `/api/auth/me` returned HTTP 200 with `user:null`.
- Ports 8793 and 8794 were unavailable. The 8788 process and database identity remain unverified.
- No credentials were entered, no account was created, and no server data was changed. Authenticated/member/admin journeys were not safe to attempt.

## Browser journey

| Step | Observation | Result |
|---|---|---|
| Signed-out landing and Reports | Chinese landing explained reports are unverified research leads; Reports view stated approved login is required and offered Open account. | No new defect. |
| Open Account | Account view showed localized login copy and username/password fields. Opening it focused Username; Tab moved focus to Password. | Focus path worked in this slice. |
| Language switch | Account labels, copy, and controls switched from Chinese to English; focus remained on the language toggle. | Interaction worked. |
| Chinese document title | Initial Chinese rendering and subsequent Chinese mode retained the English document title `China Traffic Incident Database`. | Reproduced UX-I18N-01. |

No new reproducible defect was found. UX-REG-01 invitation guidance was not re-exercised in this pass; it remains open from prior browser evidence. The source was not changed.

## QA and Git evidence

Rendered behavior was inspected through the Codex In-app Browser accessibility tree. Only the canonical backlog and this QA note were updated. `updater-vnext` branch `vnext-home-hosted`, HEAD `daa5b58`; shared working-tree changes were preserved; no commit or push. Focused backlog `git diff --check` passed with the repository's LF-to-CRLF warning.
