# Hermann localhost browser readiness check — 2026-09-30

## Target and health

- Target: `http://127.0.0.1:8788/` (identified by health response as `adas-vnext`).
- Health: `GET /health` returned `{"ok":true,"service":"adas-vnext"}`; `GET /` returned HTTP 200.
- Repository/source and database binding for authenticated accounts remains unknown. No authenticated requests or writes were attempted.

## Browser readiness

- Browser bridge: `cua.getState()` failed with “Unable to load browser request-header policy”; it returned no browser inventory.
- Playwright skill wrapper: unavailable in this Windows shell because `bash` is not installed.
- Bounded fallback: `npx --yes --package @playwright/cli playwright-cli open http://127.0.0.1:8788/ --headed` yielded no browser output; subsequent `snapshot` remained pending without output and was interrupted. No rendered page evidence was obtained.
- Per the readiness gate, no role journey was started. Signed-out, member, and admin UX remain unverified in this run; live server was not modified.

## Disposition

No new product finding. Browser bridge/CLI readiness is the blocker for rendered UX acceptance in this pass. Reattempt on a future scheduled run if the browser bridge or CLI can launch normally.
## Follow-up — browser connection recovered

On 2026-09-30, explicit browser selection (`cua.getBrowser({ id: "edge" })` / `{ id: "chrome" }`) successfully opened localhost in Edge and Chrome despite the inventory failure. Edge rendered the signed-out gate; Chrome rendered an already-authenticated administrator session. No authenticated requests or writes were made because its database binding is unknown. See [Chrome/Edge recovery QA](2026-09-30-hermann-chrome-edge-browser-bridge-recovery.md). Treat the inventory failure above as a tooling-path issue, not unavailability of installed browsers.
