# China ADAS Accident Methods / 中国 ADAS 事故观察方法库

This is the central implementation repository. It owns China-market discovery feeds, authorized-import handling, normalization, deduplication, classification, review workflow, and the SQLite working database. The companion `china-adas-accident-database` repository is a separate public publication and never receives this repository's raw database, logs, or secrets.

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

## Publish the public repository

After collection or review, publish a sanitized JSON snapshot and static HTML page into the sibling public repository:

```powershell
npm run publish -- ..\china-adas-accident-database
# equivalent Windows helper:
.\scripts\publish-public.ps1
```

The publisher uses an explicit allow-list of fields, writes `data/reports.json`, `data/metadata.json`, and `site/index.html`, and leaves this working repository unchanged apart from its own database. Review the public repository's diff before committing or hosting it.
