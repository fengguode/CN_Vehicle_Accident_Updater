# Self-hosted ADAS database and web UI

**Status:** vNext implementation started in parallel; production cutover has not started
**Owner:** `CN_Vehicle_Accident_Updater`  
**Release baseline:** v0.1.0 in the Updater and Public Database repositories

## Proposal

Move the active public database UI, report API, votes, and authoritative report store onto the home computer. Keep SQLite as the single source of truth. Serve a small HTML/CSS/JavaScript application from the home computer; the browser loads report data through a paginated JSON API backed by SQLite. The HTML contains only the application shell and never embeds report records.

Use the existing Tailscale Funnel HTTPS hostname to make the application reachable from mobile and desktop browsers. Run one Node service bound to loopback that serves the UI and API on the same origin. Keep GitHub for source code and versioned releases. Stop using GitHub Pages and scheduled GitHub Actions to publish live report content after the home-hosted service passes the cutover checks.

```text
News / authorized Weibo discovery / reviewed imports
                       |
                       v
        Local collector and import pipeline
                       |
                       v
         One SQLite database on the PC
      reports · votes · runs · source state
          SVM model and relevance scores
                       |
                       v
       Same-origin Node UI and JSON API
                       |
                       v
   Tailscale Funnel HTTPS -> public browsers
```

The browser requests report pages and filter options from the API. The server reads them from SQLite and returns only the fields needed by the UI. The database file itself is never served or downloaded by a browser.

## Target design

- **Authoritative storage:** one persistent SQLite file on the home PC. Consolidate the report database and the current vote-server database. Store current user votes, report records, source/run state, and SVM model metadata in that database (or a documented adjacent model artifact if SQLite storage proves impractical).
- **Ingestion:** retain the existing incremental collector and JSONL import format. Each run commits new records and source cursors transactionally, using fingerprints and canonical URLs to avoid duplicates.
- **Application:** extend the existing local dashboard/API to serve the public database UI, report filtering, bilingual display, relevance/date sorting, login, and direct reversible votes. Use server-side pagination and filter/sort queries so the full dataset is not embedded in HTML or fetched as one huge response.
- **Votes and SVM:** preserve the active votes from the current vote API. Train from the current per-user votes stored in SQLite, with ties marked undecided. Save the trained boundary and per-record scores in the same database, and return scores through the API.
- **Login and authorization:** use project-owned usernames and passwords with no third-party identity provider. Registration requires a one-use, expiring invitation created by an existing account. Bootstrap the first administrator locally through a one-time command; administrators can manage accounts, invitations, review, and system operations. Store only password hashes and hashed session/invitation tokens. Use secure same-site cookies, CSRF checks, login throttling, and audit events. Public browsing remains read-only.
- **Network boundary:** bind Node to `127.0.0.1`; let Tailscale Funnel provide public HTTPS. Do not expose the SQLite path, local inbox, logs, exports, `.env`, or arbitrary filesystem paths.
- **GitHub role:** keep the Updater as the code and methods repository. Keep v0.1.0 as the frozen historical snapshot. Retire live database publishing and Pages after cutover. Existing public Git history and the release snapshot remain available unless a separate history-removal request is approved.

## Step-by-step implementation plan

### 1. Baseline and backups

- Record report counts, fingerprints, active vote totals, trained SVM sample count, and current source/run state from both local stores and the public JSON snapshot.
- Make verified, dated backups of both SQLite files and the public JSON snapshot. Keep the backups outside the repository and test that each SQLite backup opens.
- Document the current Tailscale Funnel URL, OAuth callback, scheduled tasks/workflows, ports, and secret names without copying secret values into the repository.

**Done when:** there is a recoverable backup set and a reconciliation manifest with counts and duplicate rules.

### 2. Consolidate report and vote storage

- Add versioned schema migrations to the Updater for a unified database file.
- Migrate reports, review notes, source/run state, and current active GitHub votes. Deduplicate on stable fingerprint and canonical source URL; preserve original source URLs and bilingual text.
- Import vote state idempotently so repeating the migration cannot add duplicate users or votes.
- Move the app and vote API onto one database connection layer; remove the need for a scheduled vote-export/import handoff.

**Done when:** report and vote counts reconcile to the manifest, repeat migration is idempotent, and vote changes/revocations survive restart.

### 3. Make the UI database-backed

- Turn the UI into a report-free application shell served by the local Node service.
- Add API pagination, total counts, filters, sort by event/publication date or SVM score, and language selection. Return English and Chinese fields from SQLite without translating or rewriting records in the browser.
- Add API-backed filter values and community vote state. Keep the current direct vote/change/revoke interaction.
- Keep public JSON export as an optional manual backup only if needed; do not use it as the live UI data source.

**Done when:** browser network responses show report data coming from the database API, the HTML contains no article records, and filtering/sorting/language/voting work on mobile and desktop.

### 4. Secure the unified service

- Add account, invitation, session, and audit tables to the home SQLite database. Implement password hashing, account registration gated by an unexpired one-use code, login/logout, and account status checks.
- Add a one-time local administrator bootstrap command that only works while no administrator exists. Administrators can manage users, invitations, report review, and system actions; existing members can create invitations for new members.
- Require authenticated authorization for all state-changing routes, including votes, collection, report edits, and model operations. Validate same-origin requests, payload sizes, input fields, session expiry, CSRF tokens, and login rate limits.
- Keep password/session secrets out of logs and repository files. Store session and invitation token hashes rather than reusable plaintext tokens.
- Bind only to loopback and serve only known UI files; reject path traversal and requests for database, log, inbox, or environment files.

**Done when:** public users can read reports; signed-in users can vote; unauthorized write attempts are rejected; automated checks show no secrets or local files are exposed.

### 5. Make the home computer reliable

- Register the unified Node service to start at boot and restart after failure using a Windows service manager or a restricted Scheduled Task.
- Schedule collection and SVM refresh locally. Prevent overlapping runs and log concise run outcomes.
- Configure SQLite online backups, retention, disk-space checks, and a documented restore procedure. Run a restore drill before cutover.
- Add a local health endpoint and a remote HTTPS health check. Alert or visibly report when the computer, network, or Funnel is offline.

**Done when:** rebooting the PC restores the site, a failed process restarts, the daily task runs once, and the latest backup restores successfully.

### 6. Dry-run migration and acceptance review

- Load the current 294 public reports and current local records into a staging copy of the unified database; reconcile any overlap by fingerprint and canonical URL.
- Load the current vote export, retrain the SVM, and compare active vote counts and report classifications with the v0.1.0 snapshot.
- Exercise pagination, filters, sorting, language switching, invitation-gated local registration/login, vote/change/revoke, import deduplication, daily collection, and restart recovery.
- Test from an external network and a mobile browser through the Tailscale HTTPS hostname.

**Done when:** counts reconcile, each test flow passes, and the user can browse and vote through the home-hosted URL without relying on GitHub Pages.

### 7. Cut over hosting and retire live GitHub publication

- Point Tailscale Funnel at the unified service and confirm OAuth callback and HTTPS behavior.
- Update repository README and the frozen-site notice with the home-hosted URL and availability expectations.
- Disable the GitHub Pages deployment and the daily workflow that writes report JSON/HTML. Keep source code and v0.1.0 release artifacts; stop publishing new report data to GitHub.
- Verify the public database URL no longer serves the live report UI and that the home host does.

**Done when:** all active reads and writes use the home-hosted service and GitHub Actions cannot overwrite it.

### 8. Operate and review

- Review failed collection runs, backups, disk space, and Funnel health regularly.
- Keep the GitHub release tag immutable; make future application changes through normal commits and new releases.
- Revisit hosting if availability, storage size, or traffic outgrows a single Windows PC and SQLite.

## Cutover and recovery

Keep the existing GitHub Pages v0.1.0 snapshot as a temporary read-only fallback until the new service has passed migration and external-browser checks. If the home service is unavailable during cutover, restore the last verified SQLite backup and restart the service. Re-enable the archived static page only as an explicit fallback; do not let two systems accept votes or edits at the same time.

The release tag remains an immutable copy even after live publication is retired. Removing the already-public report files from Git history would require a separate history rewrite and is outside this migration plan.

## vNext branch progress

The `vnext-home-hosted` branch has an isolated API/UI scaffold on port 8788, a paginated read API backed by SQLite, a report-free browser shell, a public-news updater command limited to news sources, and a social JSONL inbox importer with a versioned record schema. Local username/password accounts with invitation-gated registration, explicit admin approval before database access, self-service password changes, session revocation, member invitations, admin account controls, and a one-time first-administrator bootstrap are implemented and covered by an authentication lifecycle smoke script. Pending users can sign in but cannot read reports, filters, or summaries; approval revocation blocks those APIs immediately while preserving the account session. The branch uses its own worktree database and is not connected to the production Funnel. Production data migration, voting integration, and service recovery remain future phases.

## Risks and decisions

- **Home PC availability:** the site and voting are unavailable when the PC, internet connection, or Funnel is down. Automated restart, backups, and a health check reduce recovery time but do not provide high availability.
- **Single-writer storage:** SQLite suits this single-host workload. Keep writes short and serialize collection/training jobs; revisit if concurrent traffic becomes significant.
- **Public exposure:** Funnel makes the service publicly reachable over HTTPS. Authentication and route-level authorization must be completed before exposing write endpoints.
- **External data limits:** this architecture changes storage and hosting, not social-platform coverage. Collection remains limited by public indexing, permitted access, platform availability, and review.
- **Historical copies:** v0.1.0 and earlier public Git commits remain public. The migration stops future GitHub publication but does not erase already-published history.
