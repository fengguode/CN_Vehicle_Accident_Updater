# Hermann app.js test unblock — 2026-09-30

## Finding

The browser bootstrap blocker is not a current-source `app.js` syntax or module defect. `apps/web/app.js` imports `feedback-drafts.js` and `feedback-triage.js`. The shared listener at `127.0.0.1:8788` still returns 404 for both modules, so a browser pointed there cannot complete the module graph. Prior runtime evidence identifies this as a stale in-memory route table; refreshing 8788 remains outside this run because it is the shared scheduled service and prior restart authorization was rejected.

## Isolated test path

At this check, `127.0.0.1:8793/health` returned 200. The shell and all eight UI assets returned 200 and exact byte parity with current workspace source, including `app.js` SHA-256 `df4f730e6511e626ff3ee3c8b3bb0d075c25211f6f459555ab15538f7df6ab94`, `feedback-drafts.js`, and `feedback-triage.js`. The 8793 runtime and synthetic database were previously verified in [isolated environment QA](2026-09-30-live-feedback-isolated-environment.md); this pass performed only GET requests.

Hermann's **Overarching Testing** task completed fresh headed Chrome and Edge bootstrap checks and continued the role-based backlog story sweep on 8793. Both browsers rendered Reports and Account with exact source-matched assets and no page exceptions or failed requests. The protected anonymous routes returned 401. See the story matrix QA for role-flow coverage and remaining gaps. Port 8788, its scheduled task, production accounts, and production database were untouched.

## Result and gate

**Isolated testing is unblocked for Hermann.** The 8788 runtime mismatch remains open under `LIVE-FEEDBACK-01`; do not treat this staging availability check as live release acceptance. Next evidence is Hermann's source-matched browser render and story coverage recorded in the active Overarching Testing task and canonical backlog.

## Rendered browser confirmation (2026-09-30)

A fresh headed Microsoft Edge session via Playwright Core opened the isolated service at `http://127.0.0.1:8793` with a 1280×900 viewport. The page rendered the Reports view; clicking Account displayed the Account form and hid Reports. The ES module graph completed without page exceptions or failed requests. All eight UI assets matched the workspace source exactly, including both modules imported by `app.js`. This pass performed GET-only checks and created no authenticated session or application writes. Results and runner are in [`output/playwright/hermann-appjs-unblock-edge-20260930/`](../../output/playwright/hermann-appjs-unblock-edge-20260930/).

An initial harness assertion used a non-unique `h1` locator and stopped before judging the page; the locator was narrowed to `#heading`, and the complete run passed. This was a harness correction, not a product defect.

The isolated `app.js` bootstrap is now browser-verified and Hermann's broader story sweep can proceed. Live 8788 remains a separate open runtime mismatch with 404 responses for the two imported helper modules.

## Native Edge zoom acceptance (2026-09-30)

- **Target/build:** isolated synthetic service `127.0.0.1:8793`; served app.js SHA-256 `df4f730e6511e626ff3ee3c8b3bb0d075c25211f6f459555ab15538f7df6ab94`; all eight UI assets exact-match workspace source.
- **Browser/zoom:** headed Microsoft Edge 154.0.4258.37, 1280×800 physical viewport. Opened actual `edge://settings/appearance`, selected the visible `200%` item from Edge's Page zoom menu, and confirmed the selected control, DPR 1→2, and CSS viewport 1280×800→640×400; the app retained DPR 2 and `visualViewport.scale=1`.
- **Role views:** synthetic approved member Reports and Account; synthetic admin Feedback queue and expanded triage editor. Root document scroll width equaled client width (632 CSS px); no visible element/control crossed the viewport bounds; editor fields all fit. Screenshots: `member-account-200.png`, `member-reports-200.png`, `admin-queue-200.png`, and `admin-editor-expanded-full-200.png`. The full Account capture is the evidence for the member feedback form and list; the separate `member-feedback-form-200.png` capture was blank and is not relied on. No page or console errors.
- **Metric note:** `document.body.scrollWidth` measured 633px while root `clientWidth` and root `scrollWidth` were 632px. The screenshot has no horizontal scrollbar; the root has no horizontal scroll range; all measured visible bounds fit. This is recorded for independent review rather than treated as an overflow defect.
- **Cleanup/scope:** Edge profile removed; 8793 left running for Hermann; no triage/API writes; port 8788 untouched.
- **Result:** Primary acceptance passed. Dennis independently reviewed the metrics and Hermann accepted the full-page rendered evidence for native zoom horizontal overflow/control visibility. `QA-01-NATIVE-ZOOM-01` is Complete; parent QA-01 remains open for screen-reader, device, and physical forced-colors checks.

## Evidence completeness follow-up (2026-09-30)

Dennis's independent review confirms the native 200% selection is credible and that the 1px `body.scrollWidth` difference is not a demonstrated overflow: root scrollWidth equals root clientWidth, measured element bounds remain within the 640px CSS viewport, and the screenshot shows no horizontal scrollbar. The review notes the matrix is scoped to the specified user flows and controls, not full accessibility certification.

To address Hermann's screenshot/visibility review, reran the headed Edge session with stronger rendered captures: `zoom-setting-200-confirmed.png` visibly shows Edge's Page zoom control set to 200%; `member-reports-200.png` captures Reports; `member-account-200.png` captures the member Account and feedback form/list (the separate `member-feedback-form-200.png` capture was blank and is not relied on); `admin-editor-expanded-full-200.png` shows the triage disclosure open with its status/priority fields, public update, private note, backlog/duplicate fields, and Save button. The source-matched run records the native setting text (`页面缩放 200%`), DPR 2, 640×400 CSS viewport, per-control page positions, root dimensions, and zero application writes. The test harness scrolls to the expanded editor and captures the entire page/card because normal vertical scrolling is expected at 200%.

Current disposition: Dennis found no demonstrated issue in the width measurement, and Hermann accepted the expanded full-page evidence for user-tester acceptance. Normal vertical scrolling is expected at 200%; no clipping or horizontal overflow was found in the tested views. The blank standalone feedback-form capture is excluded; the full Account capture shows the feedback form and list. Remaining QA-01 screen-reader, physical device/keyboard, and physical forced-colors checks are still open.

## Independent fresh isolated Edge startup recheck (2026-09-30)

Hermann performed a fresh headed Microsoft Edge 154 check against current source on a disposable service at `127.0.0.1:8796`, viewport 1280×900. All eight served UI assets matched the worktree; current `apps/web/app.js` SHA-256 was `e64e7aacb3b25b2951e51880a208c7817c7e2b308e9d8c7ceaeeb6a249e5cfb1`. The root shell, CSS, app entry module, and all imported modules including `feedback-drafts.js` and `feedback-triage.js` returned 200. The signed-out access gate rendered with search hidden; Account opened with the login form visible. There were no page errors, console errors, or failed requests. No authentication or application write occurred. The disposable process, database, profile, and runtime directory were removed; ports 8788 and 8793 were untouched. The run did not save separate screenshots or a machine-readable result file.

This independently confirms that the historical app.js bootstrap defect does not reproduce on the tested current-source isolated service. The shared 8788 listener remains a separate live-runtime gate; this recheck did not use it.


## Same-source listener recheck (2026-09-30 14:19 local)

Read-only GETs to `127.0.0.1:8788` returned `/health` 200, `/` 200, and `/app.js` 200, while `/feedback-drafts.js` and `/feedback-triage.js` each returned 404. No authentication, application writes, process/task changes, or restart occurred. This reconfirms the live listener's incomplete module graph; isolated 8793 testing remains a separate current-source path. The shared listener gate remains open pending authorized activation and authenticated acceptance.
