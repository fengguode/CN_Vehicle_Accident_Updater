---
name: china-adas-social-collector
description: Collect and normalize publicly reported ADAS-related road-incident leads in mainland China from Weibo, Xiaohongshu, X, and public web indexes. Use for direct-source discovery, authenticated read-only browser collection, English summaries, evidence review, deduplication, and import into CN_Vehicle_Accident_Updater; do not use for engagement, posting, or bypassing platform controls.
---

# China ADAS Social Collector

Produce auditable incident leads whose primary link points to the original post or article. Treat every result as an allegation until corroborated.

## Choose the collection path

- Prefer public RSS/search indexes for unattended daily discovery.
- Use the official `playwright` skill for browser collection when a platform requires rendering or an authorized login. Keep the browser headed while the user signs in; never request, type, expose, or persist the user's password.
- Use a platform export when browser automation is unavailable or prohibited.
- Stop on CAPTCHA, rate limiting, repeated access-denied responses, or a platform instruction that automation is not allowed. Do not evade these controls.

## Collection workflow

1. Read [references/query-and-evidence.md](references/query-and-evidence.md) before gathering a new batch.
2. Search several ADAS/incident/brand combinations instead of relying on one broad query. Work newest-first and paginate only while results remain relevant.
3. Open each candidate and retain the direct canonical post URL. A Google/Bing result may be stored as `discovery_url`, never as the primary `url` when the original is accessible.
4. Confirm the text explicitly describes a road incident in mainland China and mentions an ADAS feature, assisted-driving state, or an involved claim. Exclude generic product announcements, simulations, overseas events, and reposts without incident details.
5. Capture only information needed for public-interest incident research. Do not publish phone numbers, exact home addresses, license plates, faces, or unrelated personal data.
6. Write UTF-8 JSONL matching [references/import-schema.md](references/import-schema.md) into `data/inbox/`. Default `verification_status` to `unverified`.
7. Run `npm run import`, inspect duplicate/rejection counts, then run `npm test` and `npm run stats`. Publish only after reviewing the public-repository diff.

## English descriptions

Write one or two neutral sentences that identify what was reported, where available, and why ADAS is relevant. Attribute uncertain claims (for example, “The author alleges…”). Do not translate speculation into fact, infer causation, or call an item confirmed without corroboration.

## Batch completion

For a requested target such as 50 incidents, report separately: direct unique candidates inspected, qualifying records imported, duplicates, rejected/non-qualifying items, and access barriers. A target is a search objective, not permission to lower evidence standards or bypass controls.

## Repository boundary

Keep collector logic, query packs, tests, and this skill in `CN_Vehicle_Accident_Updater`. Publish only sanitized JSON and the rendered static site to `CN_Vehicle_Accident_Database`; never copy cookies, raw browser state, SQLite files, logs, or private review material there.
