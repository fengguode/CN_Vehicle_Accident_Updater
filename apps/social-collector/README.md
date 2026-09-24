# Social collector boundary

This component handles interactive or platform-specific social discovery separately from the scheduled public-news updater. It must not open the application database or call database SQL directly. Its output is one JSON object per line following `record.schema.json`, written to `data/inbox/` for the normal import pipeline. The isolated importer checks the required title, allowed platform, HTTPS source URL, and rejects top-level cookie, token, password, session, and raw-HTML fields.

The collector may use an explicitly authorized browser session or platform export. Keep browser profiles and cookies outside this repository and never include them in JSONL records. Preserve the original post URL and Chinese text; English title/content are separate fields. New records remain `unverified` unless a human verification process supports a different status.

Run the isolated importer with `npm run vnext:import-social`. It processes only the `manual-platform-exports` inbox source. The public-feed updater runs with `npm run vnext:update-public` and is configured separately in `public-sources.json`; it does not invoke social-platform search or browser enrichment.
