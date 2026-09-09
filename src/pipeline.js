import path from 'node:path';
import { readJson, rootDir } from './config.js';
import { openDb, beginRun, finishRun, insertReport } from './db.js';
import { collectRss } from './rss.js';
import { inboxFiles, readJsonl } from './importer.js';
import { normalizeReport } from './normalize.js';
import { translateDescription } from './english.js';

export async function runCollection(options = {}) {
  const db = options.db || openDb();
  const ownDb = !options.db;
  const runId = beginRun(db);
  const stats = { fetched: 0, inserted: 0, duplicates: 0, rejected: 0 };
  const errors = [];
  const sources = readJson('config/sources.json').sources.filter((source) => source.enabled);
  for (const source of sources) {
    try {
      let items = [];
      if (source.type === 'rss-search' && !options.importOnly) items = await collectRss(source);
      if (source.type === 'jsonl-inbox') items = inboxFiles(path.resolve(rootDir, source.path)).flatMap(readJsonl);
      stats.fetched += items.length;
      for (const item of items) {
        const report = normalizeReport(item, source);
        const translated = await translateDescription(`${report.title}. ${report.content}`);
        if (translated) { report.english_description = translated; report.english_description_source = 'configured_translation_endpoint'; }
        if (!report.title || report.relevance_score < 0.55) { stats.rejected++; continue; }
        if (insertReport(db, report)) stats.inserted++; else stats.duplicates++;
      }
      db.prepare(`INSERT INTO source_state(source_id,last_success_at,last_error,last_item_at,updated_at)
        VALUES(?,?,?,?,?) ON CONFLICT(source_id) DO UPDATE SET last_success_at=excluded.last_success_at,last_error=NULL,last_item_at=excluded.last_item_at,updated_at=excluded.updated_at`)
        .run(source.id, new Date().toISOString(), null, items[0]?.published_at || null, new Date().toISOString());
    } catch (error) {
      errors.push({ source: source.id, error: error.message });
      db.prepare(`INSERT INTO source_state(source_id,last_error,updated_at) VALUES(?,?,?)
        ON CONFLICT(source_id) DO UPDATE SET last_error=excluded.last_error,updated_at=excluded.updated_at`)
        .run(source.id, error.message, new Date().toISOString());
    }
  }
  finishRun(db, runId, stats, errors);
  if (ownDb) db.close();
  return { runId, ...stats, errors };
}
