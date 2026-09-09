import { openDb } from './db.js';
import { resolvePublicSource, isGoogleNewsWrapper } from './provenance.js';
import { englishDescription, ENGLISH_DESCRIPTION_SOURCE, translateDescription } from './english.js';

export function needsResolution(row) {
  return isGoogleNewsWrapper(row.source_url);
}

export async function backfillReports(options = {}) {
  const db = options.db || openDb();
  const ownDb = !options.db;
  const rows = db.prepare('SELECT * FROM reports ORDER BY id').all();
  let resolved = 0; let attempted = 0; let described = 0;
  for (const row of rows) {
    let sourceUrl = row.source_url;
    let discoveryUrl = row.discovery_url;
    if (needsResolution(row)) {
      attempted++;
      const result = options.offline ? { source_url: sourceUrl, discovery_url: discoveryUrl || sourceUrl, resolved: false } : await resolvePublicSource(discoveryUrl || sourceUrl, options);
      discoveryUrl = result.discovery_url || discoveryUrl || sourceUrl;
      if (result.resolved && result.source_url !== sourceUrl) { sourceUrl = result.source_url; resolved++; }
    }
    const fallback = englishDescription(row);
    const description = await translateDescription(`${row.title}. ${row.content || ''}`) || fallback;
    if (description !== row.english_description) described++;
    db.prepare(`UPDATE reports SET source_url=?, canonical_url=?, discovery_url=?, english_description=?, english_description_source=?, updated_at=? WHERE id=?`)
      .run(sourceUrl, sourceUrl, discoveryUrl, description, row.english_description_source || (description !== fallback ? 'configured_translation_endpoint' : ENGLISH_DESCRIPTION_SOURCE), new Date().toISOString(), row.id);
  }
  if (ownDb) db.close();
  return { records: rows.length, attempted, resolved, described };
}

if (process.argv[1]?.endsWith('backfill.js')) {
  const db = openDb();
  console.log(JSON.stringify(await backfillReports({ db, offline: process.argv.includes('--offline') }), null, 2));
  db.close();
}
