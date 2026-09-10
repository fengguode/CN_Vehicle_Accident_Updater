# Query and evidence protocol

## Query construction

Combine at least one term from each relevant group:

- ADAS: `辅助驾驶`, `智能驾驶`, `自动驾驶`, `智驾`, `NOA`, `NGP`, `ACC`, `AEB`
- Incident: `事故`, `碰撞`, `追尾`, `撞车`, `失控`, `伤亡`, `险情`
- Optional brands: `特斯拉`, `小鹏`, `理想`, `比亚迪`, `蔚来`, `问界`, `华为`, `鸿蒙智行`, `沃尔沃`, `吉利`, `极氪`

Use multiple narrow searches, record the collection time, and process newest results first. Include Chinese aliases and feature names only when they improve precision.

## Minimum evidence

A qualifying lead needs:

- a direct, stable URL to the original post or article;
- enough visible text to establish an actual road incident in mainland China;
- an explicit ADAS/assisted-driving mention or claim;
- a publication timestamp when exposed by the source; and
- source platform and author/account name when publicly visible.

Save a search-engine wrapper only as `discovery_url`. If the original cannot be opened, omit the record rather than presenting the wrapper as the source.

## Review labels

- `unverified`: default for social posts and single-source reporting.
- `corroborated`: supported by an independent authoritative or reputable source.
- `verified`: use only under the project's documented human-review standard.

Separate “ADAS active,” “author claims ADAS was active,” and “ADAS state unknown.” Never infer technical cause from the crash description alone.

## Stop conditions

Pause the platform source on CAPTCHA, account lock warning, HTTP 401/403/429, repeated login redirects, or visible automation restrictions. Preserve already collected public records and report the barrier; do not rotate identities, spoof devices, or solve/bypass challenges.
