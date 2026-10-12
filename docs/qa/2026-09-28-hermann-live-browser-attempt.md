# Hermann browser UX QA attempt (2026-09-28)

- **Target:** `updater-vnext` local service at `http://127.0.0.1:8788/`.
- **Target identity/build:** Unverified. The parent agent reports a shell `Invoke-WebRequest` returned HTTP 200 with 11,613 bytes, while `Get-NetTCPConnection` found no local listener on port 8788. The response's app identity, API base, database path, and isolation status were not established.
- **Git:** Parent supplied the latest known snapshot: branch `vnext-home-hosted`, HEAD `3ed34b9`, ahead 16. This agent could not obtain a fresh Git snapshot; its restricted shell could not resolve `git` and the referenced Git executable was inaccessible. No files were changed before this QA note/backlog update.
- **Safety constraints:** No login, registration, account mutation, report API access, or other interaction was attempted. The README requires authentication/account testing against an isolated disposable service/database. The local service's database isolation could not be confirmed.
- **Acceptance checks:** (1) Check that the intended local app is available in a browser; (2) verify app identity and API health before interaction; (3) only exercise account journeys once service/database isolation is confirmed; (4) record evidence-backed UX bugs and leave the broad QA-01 task open while coverage remains.
- **Browser setup/evidence:** The CUA browser selected Chrome successfully, but browser inventory and direct tab navigation each failed with `Unable to load browser request-header policy`. Retrying the inventory produced the same error. Therefore no page DOM, screenshot, app identity, or API state could be inspected.
- **Results:**
  - Local URL responsive according to parent-provided shell evidence: **pass for HTTP availability only**; not an identity or isolation check.
  - Browser opening and visible app identity/API-health verification: **blocked** by CUA request-header-policy error.
  - Signed-out/not-registered, pending, approved member, and admin UX journeys: **blocked**; no interaction was safe or possible before app identity and disposable DB confirmation.
  - Defects: **none reported**. No UI behavior was observed; do not infer defects from the blocker.
- **Disposition:** QA-01 remains In progress. Parent should retry once CUA/browser policy is available and identify the service/database as an isolated disposable instance before any account-mutating flow. No service was started or restarted; no production or live account data was touched.
- **Limitations:** No visual/accessibility/responsive findings; no browser console or API inspection; no account flows or registration tested. This is a blocked attempt, not broad acceptance coverage.
