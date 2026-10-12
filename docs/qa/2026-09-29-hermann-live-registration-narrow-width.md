# Hermann live invitation registration narrow-width check — 2026-09-29

## Session

- Target: live `updater-vnext` at `http://127.0.0.1:8788`; `/health` 200.
- Browser: headed Microsoft Edge via cached Playwright Core, fresh temporary profile; viewport widths 320, 240, and 220 CSS px at 800px height.
- Scope: signed-out Account → invitation registration; measure document/body width and username, password, invitation field, guidance, and button bounds at and around the explicit 240px CSS breakpoint.

## Results

PASS at all three widths. The document and body never exceeded the viewport (320/320, 225/240, 205/220 CSS px); all form fields, buttons, and invitation guidance were visible and within the viewport. Invitation remained required. No horizontal overflow, browser errors, or non-GET requests. Temporary browser profile removed. No new defect found.

## Artifacts

- Runner: `../output/playwright/live-registration-narrow-20260929/run.mjs`
- Results: `../output/playwright/live-registration-narrow-20260929/result.json`
- Screenshots: `../output/playwright/live-registration-narrow-20260929/registration-320px.png`, `registration-240px.png`, and `registration-220px.png`
