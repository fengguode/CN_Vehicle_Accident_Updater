# QA session: UI-ACCEPT-04 favicon recheck

**Date:** 2026-09-28 (Asia/Shanghai)  
**Target:** `updater-vnext`, current local service `http://127.0.0.1:8788/`; source revision not verified.  
**Tester:** Independent User Tester. Read-only checks only; no application files, accounts, or data changed.

## Acceptance criteria

1. The UI shell references or otherwise serves a site icon at `/favicon.ico`.
2. A browser request for the icon returns a successful image response, avoiding a missing-resource error on page load.
3. Visually rendered tab/app icon behavior is confirmed in a real browser before claiming visual acceptance.

## Environment and methods

Windows PowerShell made read-only GET requests to the existing loopback service. The exact check was:

```powershell
Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:8788/favicon.ico' -TimeoutSec 5
```

For comparison, `/` was requested on the same host. Source inspection read `apps/web/index.html` and found no favicon link in its `<head>`. `cua.getState()` returned `apps: []`, `browsers: []`, and `errors: ["Browsers: Error: Unable to load browser request-header policy. Retry the browser command."]`; the tool then raised the same error with message `Unable to load browser request-header policy`. A visual browser check was therefore unavailable. This session did not request any remote host or authenticated API.

## Scenario results

| Scenario | Expected | Actual | Status |
|---|---|---|---|
| UI root is served | Shell returns successfully | `/` returned HTTP 200, `text/html; charset=utf-8`, 7,824 bytes. | PASS (transport only) |
| Favicon path exists | `/favicon.ico` returns a successful image response | HTTP 404, `text/plain; charset=utf-8`, no response body. | FAIL / confirmed |
| Fallback common icon paths | Available icon path can be used if ICO is absent | `/favicon.png` and `/apple-touch-icon.png` also returned HTTP 404. | FAIL / confirmed |
| Shell declares an icon | HTML includes an explicit icon link | `apps/web/index.html` head has stylesheet and module-script links, but no favicon link. | FAIL / source inspection |
| Browser tab rendering and console request | Site icon is visible; no favicon 404 in page network/console | CUA reported no browser and request-header-policy error above; no rendered browser check was possible. | BLOCKED |

## Finding and disposition

**UI-ACCEPT-04 — Confirmed, unresolved.** Direct request evidence reproduces the known missing-icon condition on the current local service: `GET /favicon.ico` returns 404, and the current shell does not declare an icon resource. A browser typically requests this path for a tab icon; the observable endpoint is a missing-resource response. I could not visually verify whether the tab displays a generic fallback icon. Impact is limited to browser chrome/failed static request; no report content or core UI action is affected. The primary should retain this finding in the canonical backlog until a successful icon response and browser check are recorded.

This is confirmation of the existing `UI-ACCEPT-04` backlog issue first seen during the Sep 27 browser pass, not a new distinct issue. No app code was changed. The fix and post-fix regression remain untested and open.

## Primary follow-up: post-restart Edge rendering

On 2026-09-28 the primary restarted the registered vNext service after confirming the current source tests passed. From visible Microsoft Edge 154, the active page loaded `http://127.0.0.1:8788/`, read the `<link rel="icon" href="/favicon.svg">`, fetched the legacy `/favicon.ico` route, decoded the SVG as an image, and reported natural dimensions 150×150. Direct GETs to both `/favicon.svg` and `/favicon.ico` returned HTTP 200 with `image/svg+xml`. The tab's document title was `China Traffic Incident Database`; the Edge user agent ended in `Edg/154.0.0.0`. Result: rendered icon acceptance passes. This later service observation supersedes the historical 404 above; the earlier report remains the reproduction record. See [Edge runtime recheck](2026-09-28-edge-feedback-runtime-recheck.md).

Primary QA update: the service is active; the registered task's old working-directory path remains a separate P2 follow-up (`LIVE-STARTUP-01`). No account or report data was read or changed in the favicon check.
