# QA session: Playwright browser preflight

**Date:** 2026-09-27 (Asia/Shanghai)
**Target:** Browser tooling preflight for `updater-vnext`; no application code or project dependencies changed.
**Environment:** Windows, Node.js v24.14.0, npm 11.9.0. The terminal Playwright CLI was run through `npm exec --yes --package=@playwright/cli -- playwright-cli ...`. npm package fetching required the approved network-enabled command because the restricted shell could not reach npm's registry. The existing local vNext endpoint at `http://127.0.0.1:8788/` was inspected read-only while signed out.

## Acceptance checks and results

| Check | Result | Evidence |
| --- | --- | --- |
| Browser CLI starts a real browser and can navigate/snapshot a page. | **Pass** | `playwright-cli open about:blank` started a browser; `snapshot` returned a page snapshot. |
| Browser CLI can navigate to the local vNext UI and expose its rendered/accessibility state. | **Pass** | Opened `http://127.0.0.1:8788/`; title was `China Traffic Incident Database`. Snapshot showed main navigation, a “Reported incident leads” heading, the lead-not-confirmation note, and signed-out approved-account prompt. Session snapshot was emitted under `.playwright-cli/`. |
| Browser extension connector can enumerate and control an existing tab. | **Blocked** | `cua.listBrowsers()` found Chrome once, but `cua.getState()`/`cua.listTabs()` failed with `Unable to load browser request-header policy`. The in-app browser was unavailable. The CLI route is an operational workaround; this does not repair the connector. |

## Findings and disposition

- The signed-out UI emitted a 404 for `/favicon.ico`. The browser also logged its password-form username advisory. These are UI follow-ups; this preflight did not change app assets or forms.
- The browser session was closed after inspection. No login, account, data, or UI state changes were made.
- To launch future browser automation from this repository, use the Playwright skill's command, for example:

  ```powershell
  npm exec --yes --package=@playwright/cli -- playwright-cli --session ctim-ui open http://127.0.0.1:8788/
  npm exec --yes --package=@playwright/cli -- playwright-cli --session ctim-ui snapshot
  ```

  If package resolution hangs in the restricted shell, run the same command through the environment's approved network-enabled execution path. Use a disposable test service/database before exercising login, votes, or account flows. The CLI UI surface is confirmed usable; the Chrome extension connector remains blocked by its request-header-policy loader.

## Limitations

This was an access/tool preflight, not the full project User Tester acceptance pass. It did not exercise desktop/mobile layouts, keyboard login, roles, reports, filters, details, or voting. The existing service was viewed only in its signed-out state. No automated app tests were run.
