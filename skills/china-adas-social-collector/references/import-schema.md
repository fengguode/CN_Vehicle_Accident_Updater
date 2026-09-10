# JSONL import schema

Write one JSON object per line. Required fields for browser-collected leads:

```json
{"title":"Original Chinese title or concise post lead","content":"Visible source text","url":"https://weibo.com/...","platform":"weibo","author":"Public account name","published_at":"2026-09-10T09:30:00+08:00","event_date":"2026-09-10","verification_status":"unverified","english_description":"An unverified Weibo post reports a collision in Shanghai and alleges that assisted driving was active.","english_description_source":"human_translation_v1"}
```

Rules:

- `url` must be the direct original source and use HTTPS when available.
- Use `discovery_url` for the search or news-index URL that led to the source.
- Preserve original-language `title` and `content`; do not replace them with English.
- Use ISO 8601 timestamps. Omit unknown optional values rather than guessing.
- Set `platform` to the actual origin, such as `weibo`, `xiaohongshu`, `x`, `news`, or `police`.
- `english_description` must be a neutral summary, not a finding of fault.
- Optional structured fields include `external_id`, `model`, `city`, `province`, `road_type`, `injuries`, and `fatalities` when explicitly supported.
- Never include authentication cookies, session identifiers, private profile data, or full browser HTML.
