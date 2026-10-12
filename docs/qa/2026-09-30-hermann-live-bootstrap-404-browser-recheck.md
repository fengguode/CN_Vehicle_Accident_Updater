# Hermann live Chrome and Edge bootstrap recheck — 2026-09-30

## Runtime and scope

- Target: live `http://127.0.0.1:8788/`; `/health` returned HTTP 200 with service `adas-vnext`.
- Browsers: Chrome 153.0.8010.54 and Edge 154.0.4258.37, launched using Playwright Core with separate fresh temporary profiles at 1280×900.
- All six served UI assets matched current workspace source. `app.js` imports `./feedback-drafts.js`; the live route returned 404.
- Fresh browser profiles were signed out. Captured browser requests were GET-only; no authentication, account data, or feedback writes were sent. Temporary profiles were removed after each run.

## User-visible result

Both browsers rendered the static Reports shell with “Loading reports…” indefinitely. The signed-out access notice remained hidden and the search controls visible. Clicking Account left the Reports view visible and the Account view hidden. The browser console recorded the missing-resource 404; no `pageerror` event was raised because module loading failed before app initialization. This confirms `UX-APP-BOOTSTRAP-MODULE-404-01` directly against the live listener, in addition to the earlier isolated reproduction.

See [runner results and Chrome/Edge screenshots](../../output/playwright/live-bootstrap-404-20260930/). No source changes were made. Port 8788 remained healthy; no role journeys could proceed until the missing module route is fixed.
