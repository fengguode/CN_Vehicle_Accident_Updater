# Hermann current-bundle feedback network and stale-editor acceptance — 2026-09-30

## Target and preflight

- Variant `updater-vnext`, branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`.
- Current bundle: `apps/web/app.js` SHA-256 `d1446ee96d06ac1054e0c073319507f27cf00b39ac62036d5206eea9a2e675fc`.
- Isolated service `apps/api/server.js`, unique temporary SQLite DB, synthetic approved member/admin users, fresh disposable Edge profile. Main run used ephemeral `127.0.0.1:57614`; member-history privacy follow-up used `127.0.0.1:58265`. Neither run touched live port 8788.
- Microsoft Edge 154.0.4258.37, headed Playwright, 1280×900 CSS px. All eight UI assets were HTTP 200 and byte-equal to current source in both runs.

## Acceptance result — PASS

`FEEDBACK-I18N-NETWORK-01`:
- Aborted the member's POST in English and zh-CN. Each displayed the localized unknown-result message; the title, description, and context remained; success styling/card creation did not occur; Submit remained enabled and focused.
- Retrying each request returned HTTP 201, cleared the form, displayed the localized receipt, and created exactly one own-list card.

`FEEDBACK-TRIAGE-STALE-EDITOR-01`:
- Two-tab stale non-overlap and same-field submissions returned HTTP 409 with unchanged DB row/event snapshots. The app rebased the dirty fields over latest status/priority, retained same-field text, focused a polite `role=status` notice, and required explicit retry. User-triggered retries returned HTTP 200.
- Private-only updates recorded empty event announcements, so existing public messages were not repeated.
- On the exact current app.js hash, a separate submitter session confirmed member history contains each announcement once and no private admin note in the API or rendered card.

No JavaScript page errors or unexpected failed requests were observed. Two expected POST aborts (`net::ERR_FAILED`) are recorded for the network-failure tests. Service processes stopped and disposable DBs/profiles were removed.

## Runtime boundary and limits

Current-source assets rendered and behaved as expected in isolation. Live port 8788 was not requested during these runs. Separate prior read-only evidence records `/feedback-drafts.js` and `/feedback-triage.js` 404 on 8788; that live-runtime mismatch remains open pending authorized activation and verification. Responsive/mobile and native assistive-technology acceptance were not part of this pass.

## Evidence

- Main combined run: [results.json](../../output/playwright/hermann-network-stale-current-bundle-acceptance-20260930/results.json)
- Current-bundle submitter history/privacy follow-up: [triage-privacy-followup-results.json](../../output/playwright/hermann-network-stale-current-bundle-acceptance-20260930/triage-privacy-followup-results.json)
- Screenshots in the artifact folder: `english-network-failure-retains-draft.png`, `chinese-network-failure-retains-draft.png`, `chinese-network-retry-one-card.png`, `non-overlap-conflict-rebased.png`, `same-field-conflict-keeps-local-draft.png`, and `member-history-private-note-hidden-current-bundle.png`.
