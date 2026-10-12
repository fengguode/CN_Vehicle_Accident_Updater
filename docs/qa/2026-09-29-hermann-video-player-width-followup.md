# VIDEO-PLAYER-01 phone/tablet preview-width follow-up

**Date:** 2026-09-29 (Asia/Shanghai)  
**Target:** Isolated `updater-vnext` service at `http://127.0.0.1:58467`; no live service.  
**Browser:** Microsoft Edge 154.0.4258.37, headed Playwright API, fresh disposable profile; responsive viewports 320×844 and 768×1024.  
**Fixture:** One synthetic approved video cover and synthetic HTTPS source. Only the synthetic allowlist origin `https://covers.qa.invalid` was configured; Playwright intercepted and fulfilled the image locally. No real origins or accounts were used.

## Preflight/source identity

Isolated `/health` returned 200. The served UI assets matched their source before interactions. `app.js` SHA-256 was `3e47741844e6329e6a089b553ccafa8a5144c7b8cda1c1ee6970757ba6367450`; `styles.css` SHA-256 was `a8b4940018d81333226db42bf7507c57af51b6cdc1e120ced4fb660a36e06423`.

## Results

- **320×844 phone:** approved preview rendered at 279×209.25px, ratio 1.3333 (4:3). Geometry before and after the delayed synthetic image response was identical. Image used `object-fit: contain`. Link targeted the exact source URL, used `_blank` and `rel="noopener noreferrer"`, and exposed “Open original source”. Keyboard focus was visible with a 3px solid outline.
- **768×1024 tablet:** preview rendered at 222.33×125.05px, ratio 1.7780 (16:9). The same source destination and safe new-tab attributes were present; focus remained visible.
- **Image failure fallback:** synthetic 404 removed the preview link and displayed an image-role placeholder named “Video preview unavailable”. The tablet 16:9 preview geometry remained stable.
- Both viewport checks found matching document/body client and scroll widths and no nested overflow. No page errors or unexpected external requests occurred.

## Cleanup and evidence

The isolated service was stopped; test database and Edge profile were removed; live ports 8788/8793 were untouched. Results, runner, `run.log`, and screenshots are in [the separate output folder](../../output/playwright/video-player-preview-widths-20260929/). This supplements the earlier 390px/1280px acceptance and does not authorize production media origins or media-safety policy.
