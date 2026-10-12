# FEEDBACK-DUPLICATE-LINK-01 implementation QA — 2026-09-30

## Acceptance contract

For a Duplicate disposition, a submitter can identify the primary request from their own feedback card. The UI displays the primary request UUID with a localized label, does not fetch or expose the primary title/content, survives reload, and keeps admin-only notes private. Duplicate disposition still requires a public explanation and valid primary reference. Both Issue and Feature are represented in the workflow.

## Checks run

- `node --check apps/web/app.js` passed.
- Full `npm test` passed: 82/82.
- Headed Microsoft Edge 154.0.4258.37 via cached Playwright Core on an isolated current-source service and synthetic SQLite DB; disposable profile; viewport 390×844. No real account/database and no port 8788 traffic.
- Health/root/app.js and all eight UI assets returned successfully; served bytes matched source for `index.html`, `app.js`, CSS, navigation, report presentation, viewport, `feedback-drafts.js`, and `feedback-triage.js`. Current app.js SHA-256: `3588924d1a795a45e476508caddd53338075946f22ebfad8c3745b7c45040468`.
- Synthetic member Issue linked to synthetic admin Feature as Duplicate. Empty public reason and empty primary reference were blocked before PATCH. Valid duplicate save succeeded. Member card displayed `Duplicate of request #<UUID>` in English and `重复请求对应的主要请求 #<UUID>` in Chinese; after reload the reference and generic public update remained visible. The primary title and private admin notes remained absent from submitter UI/API. Later Complete status and public update persisted after reload.
- Zero browser page errors. The isolated service stopped, its temporary DB/profile were removed, health on the temporary port refused connection afterward, and port 8788 remained untouched.
- The first two harness reruns exposed stale selectors/expectations after changing the fixture from Feature to Issue and after client-side reference validation was added. Those harness issues were corrected; the final run passed. The final runner and structured output/screenshots are in [browser artifacts](../../output/playwright/feedback-duplicate-link-fix-20260930/).

## Independent review

Dennis reviewed the implementation read-only and found no actionable source defect. He confirmed the reference is localized, inserted as text, scoped to the submitter's request, and excludes the primary title/content. His acceptance requested the isolated browser evidence now recorded here. Hermann independently rechecked app.js startup on current source (Edge 154 at 1280×900, all eight assets source-matched, no failed requests/page errors) and passed the focused Duplicate workflow acceptance in Edge 154 at 390×844. His results verify Issue-to-Feature duplicate linkage, English/Chinese UUID label, reload persistence, blank public reason/reference blocked before PATCH, generic public update, hidden primary title/internal notes, and clean browser/service teardown. See [Hermann startup QA](2026-09-30-hermann-appjs-startup-recheck.md), [startup results](../../output/playwright/hermann-appjs-startup-recheck-20260930/results.json), and [independent Duplicate results/screenshots](../../output/playwright/hermann-feedback-duplicate-link-acceptance-20260930/).

## Runtime boundary

This proves the current source/build on an isolated service. The known listener on port 8788 has not been restarted or changed; live activation remains gated because the prior stop/start request was rejected by automatic review pending explicit authorization. Do not treat this isolated run as proof that the live listener serves the current module routes.

## Git state

Repository: `updater-vnext`; branch `vnext-home-hosted`; HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`, ahead 18. This QA record, runner/results/screenshots, source changes, and backlog update are uncommitted in the already-dirty shared tree. No commit or push.
