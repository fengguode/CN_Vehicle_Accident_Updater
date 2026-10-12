# VOTE-ICON-01 isolated UI acceptance — 2026-09-29

## Acceptance scope

Replace the two visible vote labels with recognizable icon buttons while retaining the established relevance values, accessible EN/ZH names, `aria-pressed` state, visible keyboard focus, focus restoration, mobile targets, and vote submission behavior. Check Windows forced-colors distinction and ensure the UI remains within the viewport.

## Result

Headed Microsoft Edge 154.0.4258.37 on an isolated synthetic service and database passed at 1280×800 and 390×844. Served `app.js` and `styles.css` matched source: app SHA-256 `3e47741844e6329e6a089b553ccafa8a5144c7b8cda1c1ee6970757ba6367450`; CSS SHA-256 `a8b4940018d81333226db42bf7507c57af51b6cdc1e120ced4fb660a36e06423`.

- English labels were “Relevant traffic incident” and “Not relevant”; Chinese labels were “相关交通事故” and “不相关”. Each button had one decorative inline SVG and no visible text label.
- Both controls measured 44×44px. Save and change vote posted the existing `relevant` / `not_relevant` values, updated `aria-pressed`, and restored focus to the selected vote button.
- Keyboard focus showed a 3px outline. Phone viewport had no horizontal document overflow.
- In forced-colors mode the selected control used a 4px double system-color border and the unselected control a 2px solid border; both stayed 44×44px and focus remained visible. The border pattern distinguishes state when forced-color background/text mapping collapses the fill contrast.
- No external requests or page errors occurred. Synthetic service, database, and browser profile were removed; live 8788 was untouched.

## Evidence and remaining scope

Machine results, repeatable runner, and screenshots: [`output/playwright/vote-icon-ui-20260929/`](../../output/playwright/vote-icon-ui-20260929/). Focused tests passed 6/6 and `npm test` passed 73/73; `node --check` and scoped `git diff --check` passed. Dennis's independent source review of the exact hashes above found no actionable issue. The 320px follow-up below completes the responsive-width acceptance. Prior report-vote save/change/undo regression is documented in [Hermann vote QA](2026-09-29-hermann-report-vote-aae.md).

## 320×844 phone-width follow-up — 2026-09-29

A fresh isolated synthetic Edge 154.0.4258.37 run at 320×844 completed against the exact same app and CSS hashes listed above. Served/source parity matched before interaction. Both English and Chinese vote buttons measured exactly 44×44px and exposed the expected localized accessible names. Initial `aria-pressed` state was false/false; selecting Relevant then Not relevant updated the pair to true/false then false/true, including after switching the UI to Chinese. Keyboard focus was visible with a 3px solid outline and the control remained within the viewport. Document, body, and nested overflow checks found no horizontal overflow; no page errors or external requests occurred. The only writes were the two expected votes in the disposable fixture.

Machine results and screenshots: [`results-320.json`](../../output/playwright/vote-icon-ui-20260929/results-320.json), [`phone-320-en.png`](../../output/playwright/vote-icon-ui-20260929/phone-320-en.png), and [`phone-320-zh-selected.png`](../../output/playwright/vote-icon-ui-20260929/phone-320-zh-selected.png). The isolated service, SQLite DB, and profile were removed; live ports 8788/8793 were untouched.
