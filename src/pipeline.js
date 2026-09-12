import path from 'node:path';
import { readJson, rootDir } from './config.js';
import { openDb, beginRun, finishRun, insertReport } from './db.js';
import { collectRss } from './rss.js';
import { inboxFiles, readJsonl } from './importer.js';
import { normalizeReport } from './normalize.js';
import { translateDescription } from './english.js';
import { collectWeiboCli } from './weibo-cli.js';
import { enrichWeiboItems } from './weibo-web.js';
import { loadSvm, scoreSvm } from './svm.js';

export async function runCollection(options = {}) {
  const db = options.db || openDb();
  const ownDb = !options.db;
  const runId = beginRun(db);
  const stats = { fetched: 0, inserted: 0, duplicates: 0, rejected: 0 };
  const errors = [];
  const svm = loadSvm();
  const sources = readJson('config/sources.json').sources.filter((source) => source.enabled);
  for (const source of sources) {
    try {
      let items = [];
      let adapterState = null;
      if (source.type === 'rss-search' && !options.importOnly) items = await collectRss(source);
      if (source.type === 'jsonl-inbox') items = inboxFiles(path.resolve(rootDir, source.path)).flatMap(readJsonl);
      if (source.type === 'weibo-cli' && !options.importOnly) {
        const prior = db.prepare('SELECT state_json FROM source_state WHERE source_id=?').get(source.id);
        const queryPacks = typeof source.query_packs === 'string' ? readJson(source.query_packs).packs : source.query_packs;
        const result = await collectWeiboCli({ ...source, query_packs: queryPacks }, { state: prior?.state_json ? JSON.parse(prior.state_json) : {} });
        items = result.items; adapterState = JSON.stringify({ cursor: result.nextCursor, overlap_since: result.overlapSince });
      }
      if (source.enrich_weibo_web && items.length) items = (await enrichWeiboItems(items, { maxItems: source.max_enrichments || 5, delayMs: source.enrich_delay_ms, timeoutMs: source.enrich_timeout_ms })).items;
      stats.fetched += items.length;
      for (const item of items) {
        const report = normalizeReport(item, source);
        const svmScore = scoreSvm(svm, `${report.title} ${report.content}`);
        if (svmScore !== null && svmScore < 0) { stats.rejected++; continue; }
        const translated = await translateDescription(`${report.title}. ${report.content}`);
        if (translated) { report.english_description = translated; report.english_description_source = 'configured_translation_endpoint'; }
        if (!report.title || report.relevance_score < 0.55) { stats.rejected++; continue; }
        if (insertReport(db, report)) stats.inserted++; else stats.duplicates++;
      }
      db.prepare(`INSERT INTO source_state(source_id,last_success_at,last_error,last_item_at,state_json,updated_at)
        VALUES(?,?,?,?,?,?) ON CONFLICT(source_id) DO UPDATE SET last_success_at=excluded.last_success_at,last_error=NULL,last_item_at=excluded.last_item_at,state_json=COALESCE(excluded.state_json,source_state.state_json),updated_at=excluded.updated_at`)
        .run(source.id, new Date().toISOString(), null, items[0]?.published_at || null, adapterState, new Date().toISOString());
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
