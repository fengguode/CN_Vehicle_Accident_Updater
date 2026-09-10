import { readJson } from './config.js';
import { openDb, beginRun, finishRun, insertReport } from './db.js';
import { collectRss } from './rss.js';
import { normalizeReport } from './normalize.js';

export function buildWeiboQueryUrl(pack, accidents) {
  const adas = pack.adas_terms.map((term) => `"${term}"`).join(' OR ');
  const brands = pack.brand_terms?.length ? ` (${pack.brand_terms.map((term) => `"${term}"`).join(' OR ')})` : '';
  const query = `site:weibo.com (${adas}) (${accidents.map((term) => `"${term}"`).join(' OR ')})${brands}`;
  return `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=zh-CN&gl=CN&ceid=CN:zh-Hans`;
}

export async function runWeiboWebBackfill(options = {}) {
  const db = options.db || openDb(); const ownDb = !options.db; const runId = beginRun(db);
  const config = options.config || readJson('config/weibo-web-query-packs.json'); const maxResults = Math.max(1, Math.min(Number(options.maxResults || 50), 50));
  const stats = { fetched: 0, inserted: 0, duplicates: 0, rejected: 0, packs: 0 }; const seen = new Set(); const rows = [];
  try {
    for (const pack of config.packs) {
      if (rows.length >= maxResults) break;
      const source = { id: `weibo-web-backfill-${pack.name}`, name: `Google News Weibo backfill: ${pack.name}`, type: 'rss-search', platform: 'weibo_web_index', url: buildWeiboQueryUrl(pack, config.accident_terms), keyword_groups: [pack.adas_terms, config.accident_terms], max_resolve_candidates: Math.min(10, maxResults - rows.length), resolve_concurrency: 2, resolve_timeout_ms: 8000, require_resolved: true, allowed_hosts: ['weibo.com'] };
      const found = options.collect ? await options.collect(source) : await collectRss(source);
      stats.packs++; stats.fetched += found.length;
      for (const row of found) { if (row.source_url && !seen.has(row.source_url)) { seen.add(row.source_url); rows.push(row); } }
    }
    rows.sort((a, b) => new Date(b.published_at || 0) - new Date(a.published_at || 0));
    for (const item of rows.slice(0, maxResults)) {
      const report = normalizeReport(item, { name: item.source_name, platform: 'weibo_web_index' });
      if (!report.title || report.relevance_score < 0.55 || !report.source_url || report.source_url.includes('news.google.com')) { stats.rejected++; continue; }
      if (insertReport(db, report)) stats.inserted++; else stats.duplicates++;
    }
    finishRun(db, runId, stats, []);
  } catch (error) { finishRun(db, runId, stats, [{ error: error.message }]); throw error; }
  if (ownDb) db.close(); return { runId, ...stats, resolvedUnique: rows.length };
}
