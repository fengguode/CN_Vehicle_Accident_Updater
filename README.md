# China ADAS Accident Methods / 中国 ADAS 事故观察方法库

This is the central implementation repository at https://github.com/fengguode/CN_Vehicle_Accident_Updater. It owns China-market discovery feeds, authorized-import handling, normalization, deduplication, classification, review workflow, and the SQLite working database. The companion [public database](https://github.com/fengguode/CN_Vehicle_Accident_Database) is a separate publication and never receives this repository's raw database, logs, or secrets.

A local, auditable research system for collecting public reports of ADAS-related road incidents in mainland China, incrementally updating them each day, and labeling them from multiple perspectives.

## What it does

- Incrementally ingests public RSS/search results and authorized platform exports. Google News is the enabled fallback discovery index; optional Bing social-domain queries are included but disabled because availability varies by network/region.
- Keeps the original URL, source, author, publication time, raw record, and collection time.
- Deduplicates by canonical URL or a stable title/date fingerprint.
- Labels brand, likely cause, ADAS engagement claim, province, road context, and severity.
- Separates `unverified` reports from human-verified records. A report appearing here is **not** a finding that ADAS caused an accident.
- Provides a local filterable dashboard and JSON exports.

No system can guarantee collection of “all” social-media posts. Platform login walls, API limits, deletions, private groups, censorship, and ambiguous language create measurable gaps. This project does not bypass platform access controls; add official/authorized API adapters or exports for higher coverage.

## Quick start

Requires Node.js 22.5 or newer (Node 24 recommended). No package install is required.

```powershell
npm run init
npm run collect
npm run serve
```

Open <http://127.0.0.1:8787>. The default public discovery feed requires internet access. If it is unavailable, the run is recorded as `partial` instead of corrupting prior data.

## Import platform exports

Place one or more `.jsonl` files in `data/inbox/`, one JSON object per line. See `data/inbox/example.jsonl.template`. Supported core fields:

| Field | Meaning |
|---|---|
| `title`, `content` | Original report text |
| `url` | Original post/report URL |
| `platform`, `author`, `external_id` | Provenance |
| `published_at`, `event_date` | ISO 8601 timestamps |
| `verification_status` | Usually `unverified`; set only after review |
| `model`, `city`, `injuries`, `fatalities` | Optional structured facts |

Run `npm run import`. Re-importing the same URL is safe and counted as a duplicate.

## Daily update on Windows

Test the update script first:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\daily-update.ps1
```

Then register an 08:00 daily task from an elevated PowerShell prompt:

```powershell
.\scripts\register-daily-task.ps1 -At '08:00'
```

Daily logs go to `data/logs/`; JSON snapshots go to `data/exports/`. Scheduling is deliberately an explicit user action because it modifies Windows Task Scheduler.

## Review protocol

1. Treat every new item as a lead, not a confirmed accident.
2. Confirm that an accident occurred in China and that the report explicitly relates it to an ADAS feature or claim.
3. Preserve the original post and add corroboration from police, regulators, emergency services, the manufacturer, or reputable reporting.
4. Distinguish “ADAS was active,” “someone claimed it was active,” and “status unknown.”
5. Do not infer causation from temporal association. Correct automatic labels in the dashboard/API and add review notes.
6. Avoid publishing personal data, graphic imagery, license plates, or unsupported blame.

## API

- `GET /api/reports` — filters: `q`, `brand`, `cause`, `province`, `road_type`, `severity`, `verification_status`
- `GET /api/summary` — dashboard counts and last 14 runs
- `POST /api/collect` — run incremental collection
- `PATCH /api/reports/:id` — correct review fields

## Extending coverage

Add discovery feeds in `config/sources.json`. For authorized APIs, implement a collector returning the same fields as the JSONL format, then route it in `src/pipeline.js`. Keep API keys in `.env` (never in the source configuration). Platform-specific adapters should honor terms, rate limits, retention rules, and deletion requests.

The keyword taxonomy is in `config/taxonomy.json`; changes apply to newly ingested items. For historical relabeling, add a reviewed migration rather than silently rewriting past classifications.

## Commands

```text
npm run init      Create/migrate the SQLite database
npm run collect   Fetch enabled sources and import the inbox
npm run import    Import the inbox without network requests
npm run serve     Start the local dashboard
npm run stats     Print record and run counts
npm run export    Write a dated JSON snapshot
npm test          Run unit tests
```

`npm run hydrate -- path\to\reports.json` reconstructs or updates local SQLite state from a public `data/reports.json` export. Stable IDs, labels, review fields, and provenance are preserved; internal `raw_json` is replaced by a safe hydration marker rather than importing hidden source data.

`npm run backfill` resolves public Google News wrapper URLs one at a time with a short delay, preserves each wrapper in `discovery_url`, and fills conservative `machine_heuristic_v1` English descriptions. Use `npm run backfill -- --offline` to generate descriptions without network requests. Resolution only follows publicly available redirects/metadata and never bypasses login or access controls.

### Optional Weibo CLI adapter

The feature-flagged `weibo-cli` source is disabled until the official `@weibo-ai/weibo-cli` installation is authenticated and its service/trial is active. Its validated default action is `search statuses/limited --q <query> --type 1 --count 10..50 --sort time --dup 1 --antispam 1 --starttime <unix-seconds> --endtime <unix-seconds> --output json`; override it only with `WEIBO_CLI_ARGS_JSON` or `source.args` using `{query}`, `{since}`, `{since_epoch}`, `{end_epoch}`, `{cursor}`, and `{limit}` placeholders. Configure `WEIBO_CLI_PATH` when the executable is not on `PATH`, or set `WEIBO_CLI_JS` to the CLI's `dist/index.js` entrypoint for Windows no-shell execution. Use `WEIBO_CLI_TOKEN` or `WEIBO_CLI_REFRESH_TOKEN` for unattended auth. Run the configured capability probe first, then enable the source in `config/sources.json`. Query packs require ADAS and incident terms; query text rejects braces and Chinese quote characters, the adapter uses a 48-hour overlap, caps count at 10–50, and stores a cursor in SQLite source state. Never commit tokens or user-specific paths; use environment secrets or the scheduler's secret store.

The enabled `google-news-weibo-web` source is a no-cost web-index discovery path, not a Weibo scraper. It queries Google News RSS for `site:weibo.com`, prefilters for at least one ADAS term and one incident term, resolves at most 20 public wrappers, and accepts only successfully resolved `weibo.com` subdomains. Unresolved wrappers are discarded for this source; resolved records retain the Google discovery URL separately. It does not fetch Weibo pages directly, bypass login, or override robots restrictions.

Resolved Weibo links can optionally receive conservative article/status enrichment before classification. Set `WEIBO_WEB_COOKIE_FILE` (preferred) or `WEIBO_WEB_COOKIE` only from an authorized session; credentials are sent solely to allowed `*.weibo.com` hosts, never logged or stored in records, and `.secrets/` is ignored. Enrichment is capped at five items per run with a one-second delay, stops on visitor/login walls, CAPTCHA, 401/403/429, redirects, or timeouts, and otherwise leaves the discovery record unchanged. For scheduled GitHub Actions, consider a short-lived `WEIBO_WEB_COOKIE` secret only if account policy permits; a local cookie file is safer and no database-repository workflow change is made by this adapter.

RSS resolution is bounded to 20 candidates per enabled feed, up to four concurrent public requests, and an 8-second resolution timeout by default. Google News wrappers that cannot resolve are discarded for every RSS source, so the primary `source_url` never remains an unresolved Google wrapper. A process interrupted during collection is recovered as an `aborted` run on the next database startup.

## Publish the public repository

After collection or review, publish a sanitized JSON snapshot and static HTML page into the sibling public repository:

```powershell
npm run publish -- ..\china-adas-accident-database
# equivalent Windows helper:
.\scripts\publish-public.ps1
```

The publisher uses an explicit allow-list of fields, writes `data/reports.json`, `data/metadata.json`, and `site/index.html`, and leaves this working repository unchanged apart from its own database. Review the public repository's diff before committing or hosting it.
