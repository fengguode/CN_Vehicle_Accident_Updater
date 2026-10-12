# Isolated role UX testing 01 (primary pass complete)

**Date:** 2026-09-29 (Asia/Shanghai)
**Target:** `http://127.0.0.1:8793/`, served from current `updater-vnext/apps/api/server.js`
**Browser:** Codex In-app Browser, tab 15, normal desktop viewport
**Data:** Fresh synthetic SQLite database in a unique OS temp directory; `uxadmin` bootstrapped and `uxmember` registered through the UI. No existing project database was opened.

## Runtime gate

- Ports 8788, 8793, and 8794 were checked first; 8788 was live, 8793 and 8794 were free.
- Started a separate vNext process on 8793 with `ADAS_DB_PATH` pointing to the new temp database. `GET /health`, `/`, `/app.js`, `/navigation.js`, `/styles.css`, and `/favicon.svg` all returned HTTP 200. `GET /api/auth/me` returned user-null before browser login.
- Live 8788 was only probed read-only; no credentials or writes were sent to it.

## Completed browser steps

| Role/step | Observation | Result |
|---|---|---|
| Signed-out landing | Reports described unverified research leads and required an approved account. | Pass for this slice. |
| Synthetic admin login | `uxadmin` signed in and saw Administrator/approved status plus User management and Feedback navigation. | Pass. |
| Admin User management | Admin users list loaded and showed the synthetic administrator's role, database approval, and account status selectors. | Pass for this slice. |
| Invitation creation | Admin's Create invitation action displayed a one-use code with an expiry. | Pass; code kept out of this note. |
| Synthetic member registration | The invitation registered `uxmember`; Account showed Member and pending database approval. | Pass. |
| Pending-member Reports gate | Reports displayed an explicit pending-approval notice and withheld report workspace content. | Pass. |
| Empty feedback validation in English UI | Pending member opened Account with UI language English and submitted the empty request form. Focus moved to Title, but the native required-field message was rendered in Chinese (`请填写此字段。`). | UX-I18N-02 recorded and independently confirmed by Hermann Edge locale QA; no feedback record was created. |

## Remaining work and safety

Admin approval and approved-member access were verified in the continuation below. A clearly synthetic report fixture was added to the isolated database to test member ratings and search; it is explicitly not a real incident and uses example.invalid only. All account mutations so far are confined to this disposable DB. The isolated service was no longer listening on 8793 during final cleanup verification; 8793/8794 refused connections. The verified test directory `ctim-vnext-ux-qa-20260929` was removed from OS temp after closing browser tabs. Live 8788 remained available and untouched. Do not test authenticated actions on live 8788 while its DB identity remains unknown.

**Git state at checkpoint:** `updater-vnext`, branch `vnext-home-hosted`, HEAD `daa5b58`; source changes pre-existed and were not edited. QA/backlog documentation is uncommitted with shared work; no commit or push.

## Continuation results

- Admin User management showed the new member as Member / Pending approval / Active. Changing only database approval to Approved and saving displayed `Changes saved.`; the row refreshed as Approved.
- The admin signed out and the member signed in again. The member account showed approved access; Reports loaded the single synthetic unverified fixture with its summary, source link (`example.invalid`), verification status, and rating controls. The approved member did not see User management or Feedback admin navigation.
- On the synthetic report, the member saved a Relevant traffic incident rating, undid it, saved Not relevant, then changed it to Relevant. Vote counts and ranking score refreshed each time; Undo vote removed the rating, and keyboard focus stayed on the selected rating control after rerender. Search with a nonmatching term produced 0 results and disabled both paging controls; Reset filters restored the fixture. No defect found in these interactions.
- The member submitted one synthetic feedback request; the Account card showed Submitted and the request details. Admin Feedback triage loaded the record. Admin changed it to Under review and saved a public update plus a private note. A fresh member login showed Under review and the public update; the private note was absent.
- A fresh browser check on live 8788 continued to show signed-out `/api/auth/me` and 200 health. Authenticated actions were confined to 8793.

UX-I18N-02 was first observed in this primary CUA session. Independent Hermann Edge QA confirmed the same Chinese native validation message for English UI with both en-US and zh-CN browser contexts, including empty login and feedback forms; no API POST occurred. See [Hermann validation locale QA](2026-09-29-hermann-ux-i18n-02-validation-locale.md). A subsequent live follow-up could not repeat the run because Hermann had no browser control surface and Playwright CLI was unavailable; that limitation does not supersede the earlier recorded independent result. The cause remains an inference from native validation behavior, not a proven OS/browser setting.
- From signed-out Account, invitation registration displayed username/password/code fields; one fabricated invalid invitation attempt created no account and produced the clear error `A valid invitation code is required.`
- In the same English-selected UI, clearing Username and Password and activating Log in produced the same Chinese required-field message and focused Username. Native form validation prevented the login request; this corroborates the language mismatch across Account and Feedback.


**Final cleanup:** Both browser tabs were closed. Follow-up port checks showed 8788 available and healthy while 8793 and 8794 were unavailable. The isolated synthetic database directory was verified as a direct, non-reparse child of the OS temp root and removed.
