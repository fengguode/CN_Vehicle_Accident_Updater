import fs from 'node:fs';
import { openDb } from './db.js';

const columns = ['fingerprint', 'canonical_url', 'source_url', 'discovery_url', 'publisher_name', 'source_name', 'platform', 'external_id', 'title', 'content', 'author', 'published_at', 'collected_at', 'event_date', 'brand', 'model', 'cause', 'cause_confidence', 'adas_mode', 'road_type', 'severity', 'province', 'city', 'injuries', 'fatalities', 'verification_status', 'relevance_score', 'labels_json', 'raw_json', 'duplicate_of', 'review_notes', 'english_description', 'english_description_source', 'created_at', 'updated_at'];

/** Rebuild/update local working state from the sanitized public export. */
export function hydratePublicData(file, db = openDb()) {
  const rows = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!Array.isArray(rows)) throw new TypeError('Public reports JSON must be an array');
  const ownDb = !db;
  const insert = db.prepare(`INSERT INTO reports (id,${columns.join(',')}) VALUES (?,${columns.map(() => '?').join(',')})`);
  const update = db.prepare(`UPDATE reports SET ${columns.map((c) => `${c}=?`).join(',')} WHERE id=?`);
  const byFingerprint = db.prepare('SELECT id FROM reports WHERE fingerprint=?');
  let inserted = 0; let updated = 0;
  db.exec('BEGIN');
  try {
    for (const row of rows) {
      if (!row.id || !row.fingerprint || !row.title) throw new Error(`Invalid public record: ${row.id || '<missing id>'}`);
      const labelsJson = JSON.stringify(row.labels || {});
      const values = [row.fingerprint, row.canonical_url ?? row.source_url ?? null, row.source_url ?? null, row.discovery_url ?? null, row.publisher_name ?? null, row.source_name || 'public dataset', row.platform ?? null, row.external_id ?? null, row.title, row.content || '', row.author ?? null, row.published_at ?? null, row.collected_at || row.published_at || new Date().toISOString(), row.event_date ?? null, row.brand || 'Unknown', row.model ?? null, row.cause || 'unclassified', Number(row.cause_confidence || 0), row.adas_mode || 'unknown', row.road_type || 'unknown', row.severity || 'unknown', row.province ?? null, row.city ?? null, row.injuries ?? null, row.fatalities ?? null, row.verification_status || 'unverified', Number(row.relevance_score || 0), labelsJson, JSON.stringify({ hydrated_from: 'public-data', id: row.id, fingerprint: row.fingerprint }), row.duplicate_of ?? null, row.review_notes ?? null, row.english_description ?? null, row.english_description_source ?? null, row.created_at || row.collected_at || new Date().toISOString(), row.updated_at || row.collected_at || new Date().toISOString()];
      const existing = db.prepare('SELECT id FROM reports WHERE id=?').get(row.id) || byFingerprint.get(row.fingerprint);
      if (existing) { update.run(...values, existing.id); updated++; } else { insert.run(row.id, ...values); inserted++; }
    }
    db.exec('COMMIT');
  } catch (error) { db.exec('ROLLBACK'); throw error; }
  if (ownDb) db.close();
  return { records: rows.length, inserted, updated };
}

if (process.argv[1] && process.argv[1].endsWith('hydrate.js')) {
  const db = openDb();
  console.log(JSON.stringify(hydratePublicData(process.argv[2] || '../china-adas-accident-database/data/reports.json', db), null, 2));
  db.close();
}
