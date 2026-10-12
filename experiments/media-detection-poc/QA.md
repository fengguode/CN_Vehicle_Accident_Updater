# Media-detection POC QA record

## Scope and acceptance checks

Target: isolated `experiments/media-detection-poc/`; no app, updater, report, or database files changed.

- A single HTTPS URL on Weibo or Xiaohongshu can be probed without cookies or redirect-following.
- Explicit video signals return a media candidate and evidence; image preview remains distinct.
- A login wall, missing metadata, network error, or blocked page never becomes “no video.”
- Unsafe source hosts and insecure/credential-bearing media URLs are rejected.
- The detector has no imports from app or database modules and no persistence path.

## Automated checks

Command: `node --test experiments/media-detection-poc/test/detect-media.test.mjs`

Result: 8 focused tests passed. Scenarios covered Weibo/Xiaohongshu host validation, Open Graph video metadata, an HTML video source, image preview versus video, unknown/no-signal semantics, unsafe media URLs, login redirect handling without cookies, and invalid host rejection before fetch.

## Live-source probe

Read-only unauthenticated requests were made directly to official sites; no cookies were sent and redirects were not followed.

- One sanitized Weibo post URL from the public report export: HTTP 302 to `passport.weibo.com`; result is `blocked_or_login_required`, `has_video: null`.
- Official Xiaohongshu Explore page: HTTP 302 on the Xiaohongshu origin; result is not an article-level media observation.
- The sanitized public report export contained 59 Weibo rows and 0 Xiaohongshu rows, so no XHS note URL was available for an article-specific test.

Both pages therefore stop before any media could be inspected. The Playwright CLI invocation was attempted but did not resolve locally; there is no authenticated browser-control tool in this session. Actual rendered-page extraction on both platforms is **blocked pending a headed, authorized browser session and representative post URLs**. No login, CAPTCHA, throttling, or platform restriction was bypassed.

## Findings and limitations

- Standard Open Graph, Twitter player, JSON-LD `VideoObject`, and HTML `<video>/<source>` signals can be extracted by this prototype.
- Current Weibo enrichment only extracts text and has no observed media parser. No checked-in XHS page fixture establishes its current rendered payload schema. This POC intentionally does not guess XHS hydration fields.
- `unknown` is deliberately different from `no_media_confirmed`; generic HTML cannot prove a JavaScript-driven page has no video.
- A returned media candidate is source-provided, but its CDN host, access rights, lifetime, and suitability for direct linking need review before production use. The safest first product behavior remains linking to the original post.
- No current implementation or database was read or changed. The only source sample list came from the sanitized public JSON export.

Overall: isolated detector prototype and offline QA pass; successful real media extraction is **blocked**, not passed.
