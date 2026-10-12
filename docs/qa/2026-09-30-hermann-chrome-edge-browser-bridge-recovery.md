# Hermann Chrome and Edge browser bridge recovery — 2026-09-30

## Cause and working path

- The failing call was browser inventory (`cua.getState()`), which returned an error loading the browser request-header policy. This did not mean Chrome or Edge were unavailable.
- Resetting the CUA session did not fix inventory. Directly selecting known browser IDs did work: `cua.getBrowser({ id: "edge" })` and `cua.getBrowser({ id: "chrome" })`.
- The in-app browser also opened localhost when selected directly by URL, but it was not needed after Edge and Chrome connected.

## Browser renderability check

- Target: `http://127.0.0.1:8788/`; health returned `{"ok":true,"service":"adas-vnext"}` and `/` returned HTTP 200.
- Edge extension browser: page rendered the signed-out Reports gate, with Reports/Account navigation, login control, and “Sign in with an approved account to view reports.” Viewport measured 921×872 CSS px.
- Chrome extension browser: page rendered the product at 1920×945 CSS px, but it was already authenticated and exposed administrator navigation and report data. The browser profile/database binding is unidentified.
- No buttons were clicked and no authenticated API requests or writes were made. Browser tabs opened for this check were closed. Live service state was not changed.

## Result and safe next step

Browser readiness is restored using explicit browser selection. Signed-out rendered readiness passed in Edge. Chrome rendering is confirmed, but admin/member journeys in the live Chrome profile are not safe to continue until its backing database is verified disposable or explicitly isolated. Run role journeys against a fresh isolated service/database instead. The earlier browser-readiness notes should be read with this recovery addendum: their inventory failure was a tooling-path issue, not proof that installed browsers were unavailable.
