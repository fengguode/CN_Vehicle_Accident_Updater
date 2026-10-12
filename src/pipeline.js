import path from 'node:path';
import { readJson, rootDir } from './config.js';
import { openDb, beginRun, finishRun, insertReport } from './db.js';
import { collectRss } from './rss.js';
import { inboxFiles, readJsonl } from './importer.js';
import { normalizeReport } from './normalize.js';
import { translateDescription } from './english.js';
import { collectWeiboCli } from './weibo-cli.js';
import { enrichWeiboItems } from './weibo-web.js';
import { scoreSvm } from './svm.js';
import { summarizeWeiboSourceQuality } from './source-quality.js';

export async function runCollection(options = {}) {
  const db = options.db || openDb();
  const ownDb = !options.db;
  const runId = beginRun(db);
  const stats = { fetched: 0, inserted: 0, duplicates: 0, rejected: 0 };
  const errors = [];
  const sourceQuality = {};
  const modelRow = db.prepare('SELECT id,algorithm,weights_json,bias FROM traffic_svm_models ORDER BY id DESC LIMIT 1').get();
  const svm = modelRow ? { algorithm: modelRow.algorithm, weights: JSON.parse(modelRow.weights_json), bias: modelRow.bias } : null;
  const sourceIds = options.sourceIds ? new Set(options.sourceIds) : null;
  const sources = readJson('config/sources.json').sources.filter((source) => source.enabled && (!sourceIds || sourceIds.has(source.id)));
  for (const source of sources) {
    try {
      let items = [];
      let adapterState = null;
      if (source.type === 'rss-search' && !options.importOnly) items = await collectRss(source);
      if (source.type === 'jsonl-inbox') items = inboxFiles(options.inboxDir || path.resolve(rootDir, source.path)).flatMap(readJsonl);
      if (source.type === 'weibo-cli' && !options.importOnly) {
        const prior = db.prepare('SELECT state_json FROM source_state WHERE source_id=?').get(source.id);
        const queryPacks = typeof source.query_packs === 'string' ? readJson(source.query_packs).packs : source.query_packs;
        const result = await collectWeiboCli({ ...source, query_packs: queryPacks }, { state: prior?.state_json ? JSON.parse(prior.state_json) : {} });
        items = result.items; adapterState = JSON.stringify({ cursor: result.nextCursor, overlap_since: result.overlapSince });
      }
      if (source.enrich_weibo_web && items.length) items = (await enrichWeiboItems(items, { maxItems: source.max_enrichments || 5, delayMs: source.enrich_delay_ms, timeoutMs: source.enrich_timeout_ms })).items;
      const quality = source.platform === 'weibo_web_index' ? summarizeWeiboSourceQuality(items) : null;
      stats.fetched += items.length;
      const accepted = [];
      for (const item of items) {
        const report = normalizeReport(item, source);
        const svmScore = scoreSvm(svm, `${report.title} ${report.content}`);
        report.traffic_svm_score = svmScore;
        report.traffic_svm_model_id = modelRow?.id || null;
        const sourceReviewed = source.type === 'jsonl-inbox' && item.reviewed_relevance === true;
        const translated = await translateDescription(`${report.title}. ${report.content}`);
        if (translated) { report.english_description = translated; report.english_description_source = 'configured_translation_endpoint'; }
        if (!report.title || (!sourceReviewed && report.relevance_score < 0.65)) { stats.rejected++; continue; }
        accepted.push(report);
      }
      db.exec('BEGIN IMMEDIATE');
      try {
        let inserted = 0;
        let duplicates = 0;
        for (const report of accepted) {
          if (insertReport(db, report)) inserted++; else duplicates++;
        }
        db.prepare(`INSERT INTO source_state(source_id,last_success_at,last_error,last_item_at,state_json,updated_at)
          VALUES(?,?,?,?,?,?) ON CONFLICT(source_id) DO UPDATE SET last_success_at=excluded.last_success_at,last_error=NULL,last_item_at=excluded.last_item_at,state_json=COALESCE(excluded.state_json,source_state.state_json),updated_at=excluded.updated_at`)
          .run(source.id, new Date().toISOString(), null, items[0]?.published_at || null, adapterState, new Date().toISOString());
        db.exec('COMMIT');
        if (quality) sourceQuality[source.id] = quality;
        stats.inserted += inserted;
        stats.duplicates += duplicates;
      } catch (error) { db.exec('ROLLBACK'); throw error; }
    } catch (error) {
      errors.push({ source: source.id, error: error.message });
      db.prepare(`INSERT INTO source_state(source_id,last_error,updated_at) VALUES(?,?,?)
        ON CONFLICT(source_id) DO UPDATE SET last_error=excluded.last_error,updated_at=excluded.updated_at`)
        .run(source.id, error.message, new Date().toISOString());
    }
  }
  finishRun(db, runId, stats, errors);
  if (ownDb) db.close();
  return { runId, ...stats, errors, source_quality: sourceQuality };
}
