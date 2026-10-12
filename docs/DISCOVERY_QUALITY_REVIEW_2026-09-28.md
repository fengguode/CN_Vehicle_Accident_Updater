# Discovery quality review — 2026-09-28

**Scope:** read-only review of all six JSONL entries in `data/logs/vnext-daily.jsonl` (Sep 24–27, 2026). This is operational discovery evidence, not incident verification or a source-quality threshold.

## Observed runs

| Finished (local +08) | Public-news fetched / inserted / duplicate / rejected | Public-text enrichment | Social-inbox fetched / inserted / duplicate / rejected | Notes |
|---|---:|---:|---:|---|
| Sep 24 22:59 | No stats recorded; exit code 1 | Not reported | No stats recorded; exit code 0 | Partial/failed public-news run; no error text in row. |
| Sep 24 23:00 | 34 / 0 / 4 / 30 | Not reported | 63 / 0 / 17 / 46 | Separate run about two minutes after previous run. |
| Sep 24 23:04 | 27 / 0 / 2 / 25 | Not reported | 0 / 0 / 0 / 0 | Separate run. |
| Sep 25 08:20 | 33 / 0 / 2 / 31 | Not reported | 0 / 0 / 0 / 0 | Scheduled daily entry in log. |
| Sep 26 08:20 | 14 / 3 / 1 / 10 | 0 for 14 resolved posts | 0 / 0 / 0 / 0 | News feed timestamps were present; median feed ages varied by source from 857.3h to 1,625.3h, and P90 from 857.3h to 2,129.3h. |
| Sep 27 08:20 | 14 / 1 / 3 / 10 | 0 for 14 resolved posts | 0 / 0 / 0 / 0 | Median feed ages varied by source from 881.3h to 1,145.3h, and P90 from 881.3h to 2,110.1h. |

## Interpretation and next measurement

- “Fetched” counts index candidates; it does not mean the original posts were newly published or that the incident was verified.
- Code trace confirms `src/rss.js` maps RSS `<pubDate>` to `published_at`, then resolves the original URL without replacing that timestamp. `src/source-quality.js` calculates `now - item.published_at`; `src/normalize.js` persists it as the report `published_at`. Therefore `feed_age_*` means the age of the Google News RSS item timestamp at processing time. It does not identify the original Weibo post's creation time, incident time, or discovery delay.
- The logs do not include both an original-post timestamp and a first-observed timestamp keyed to each resolved original URL, so they cannot support a discovery-latency claim.
- Existing logs already distinguish fetched, inserted, duplicate, rejected, errors, resolved post count, text enrichment, timestamp coverage, feed age, and median content length for two daily runs. Enrichment was zero in both of those runs.
- The sample is small and includes repeated Sep 24 invocations, so it does not support a numerical quality threshold or a trend claim. Social inbox was empty on the Sep 25–27 daily runs; that does not establish platform coverage.
- For a defensible future discovery-delay measure, retain the resolved original source URL plus its publication timestamp (when available) and first-seen timestamp, and report coverage/missingness separately. Keep source-feed age, resolution, enrichment, insert/duplicate/reject outcomes, and human verification status as distinct measures.

**Disposition:** baseline review completed; quality visibility/threshold design remains open in [the project backlog](PROJECT_BACKLOG.md#active-and-blocked-work), item DATA-01. No thresholds, source claims, or incident verification labels were changed.
