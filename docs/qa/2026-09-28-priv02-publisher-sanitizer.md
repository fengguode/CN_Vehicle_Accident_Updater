# PRIV-02 QA: public publisher privacy sanitizer

**Date:** 2026-09-28. **Scope:** `china-adas-accident-methods` publisher code and disposable output destination only. No public-repository artifact, production database, commit, push, or deployment was changed.

## Acceptance and evidence

| Check | Result | Evidence |
|---|---|---|
| Remove source-platform social author values from public records | Pass | Isolated export of the current 294-row SQLite dataset emitted `author: null` for all 59 `weibo` / `weibo_web_index` records. |
| Remove embedded `c <display-name>:` attribution prefix | Pass | No matching prefix remained in exported report narratives. The source URL and discovery URL fields are exempt from text redaction and retained exactly. |
| Redact unreviewed @account mentions, while retaining reviewed public-agency references | Pass | Zero unreviewed account mentions remained across public narrative fields; four records retained their reviewed agency reference. QA output did not print candidate account values. |
| Remove tested personal contact and vehicle identifiers | Pass | No matches remained for common mobile/landline patterns, 18-digit national-ID pattern, email pattern, or mainland plate shape in tested public narrative fields. Synthetic unit cases verify each redaction. |
| Generate valid public JSON and HTML with stable dataset count | Pass | Publisher ran against the current local SQLite source but wrote only to a unique `%TEMP%\ctim-priv02-verified-*` destination; output contained 294 rows and generated `site/index.html`. The exact temp directory was removed after validation. |
| Unit and syntax checks | Pass | `npm test` 34/34; `node --check src/public-privacy.js`; `node --check src/publish.js`; `git diff --check`. |

The new rules live in `src/public-privacy.js`; `src/publish.js` applies them to every string field except stable fingerprints and exact source/discovery URLs. Unknown @handles are replaced with a generic marker. A short allowlist preserves the reviewed public agency/institution references observed in the current dataset. All social authors are omitted from public output; publisher, platform, direct URLs, discovery provenance, fingerprints, dates, incident facts, and verification status are retained.

## Independent review and current-snapshot remediation

Dennis's independent review found no actionable code issue. He traced the allow-listed report fields, confirmed that current candidate individual handles are redacted while reviewed institutional references are retained, and ran `node --test test/public-privacy.test.js` (5/5). The primary then expanded the last test to exercise recursive sanitization in a nested object and array while preserving a source URL; the full methods suite passes 34/34 after that update, and Dennis was asked to confirm the final coverage.

After review, the primary applied the sanitizer to the already-dirty local public JSON mirrors and matching HTML card fields only. A preservation check confirmed byte-identical input mirrors before transformation; the transformation uses the shared sanitizer and rewrites only those three files, retaining record order, other fields, page-level markup, and source/discovery links. Post-change verification passed: 294 records/cards; 59 social-author fields cleared; both JSON mirrors byte-identical; all 294 HTML cards' title/summary attributes and visible title/summary match JSON; zero unreviewed account mentions, attribution prefixes, or tested mobile/landline/national-ID/email/plate patterns. `git diff --check` passed in both methods and public-database repositories. The browser was unavailable, so no rendered visual result is claimed.

## Remaining acceptance

- Local Git history contains account-level identifiers in reachable JSON and HTML versions. Current snapshot cleanup and future sanitization do not remove historical Git objects. No history rewrite, force-push, remote action, commit, or publication was performed. Owner review and explicit authorization are required before any history rewrite or push.
- Pattern scans cannot establish the absence of every possible personal identifier. Row-level review of other identity-like values and historical generated pages remains part of PRIV-02.

**Disposition:** Current local outputs and the future publisher path pass the documented focused privacy checks. PRIV-02 remains **In progress** because reachable history retains identifiers and a remote-state/release decision is outstanding.


Dennis re-reviewed the final test file after the coverage update. The nested labels.note and labels.references string-array assertions close the previously reported test gap; focused tests pass 5/5, with no actionable finding. Arrays containing objects and nested URL/fingerprint exceptions remain unasserted directly (manual recursive-path check passed).
