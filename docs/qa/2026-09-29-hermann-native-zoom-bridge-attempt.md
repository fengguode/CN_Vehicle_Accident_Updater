# QA-01 native browser zoom — keyboard and desktop bridge attempt

**Date:** 2026-09-29 (Asia/Shanghai)  
**Variant:** `updater-vnext`, branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`.  
**Scope:** Retry actual Microsoft Edge page zoom at 200% using a browser shortcut and the Windows Computer Use bridge. This session does not close the native zoom gate.

## Setup and source identity

- Headed Microsoft Edge 154.0.4258.37, requested 1280×800 viewport; direct Node Playwright harness and disposable persistent browser profile.
- Isolated same-origin service on `http://127.0.0.1:51313`, `/health` 200, initial `/api/auth/me` user-null. Four served assets (`index.html`, `app.js`, `styles.css`, `navigation.js`) matched current workspace files. Synthetic SQLite only; port 8788 was untouched.
- Tried six `Control+Shift+Equal` browser keyboard chords. The measured page remained at `devicePixelRatio: 1`, `innerWidth: 1280`, `visualViewport.scale: 1`; no native zoom change was confirmed. The harness stopped before sign-in or feedback/admin interaction.

## Desktop bridge attempt and cleanup

- `sky.list_apps()` returned the Edge app identifier `MSEdge` with no targetable Edge window. `sky.list_windows()` returned only the Codex and File Explorer windows.
- An explicit `sky.launch_app({app:'MSEdge'})` attempt failed with `GetCursorPos failed: 拒绝访问。 (0x80070005)`. No further UI input was attempted.
- Harness cleanup passed: isolated service stopped, its health endpoint became unreachable, temporary DB/profile directory removed, isolated port 51313 recorded, and port 8788 untouched. There were no page errors; the test did not reach product views.

## Disposition

Native browser zoom and member/admin rendered behavior at 200% remain **Blocked / unverified**. This is a tooling/access blocker, not evidence of a product failure. Existing effective-width checks remain useful but do not substitute for native zoom. No application source changed. Machine results and harness are in [`results.json`](../../output/playwright/qa01-native-zoom-shortcut-20260929/results.json) and [`run.mjs`](../../output/playwright/qa01-native-zoom-shortcut-20260929/run.mjs). This note and those artifacts are uncommitted with the existing working tree; no commit or push.
