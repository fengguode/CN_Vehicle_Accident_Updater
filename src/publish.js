import fs from 'node:fs';
import path from 'node:path';
import { openDb } from './db.js';

const publicRepo = path.resolve(process.argv[2] || '../china-adas-accident-database');
const outputDir = path.join(publicRepo, 'data');
const siteDir = path.join(publicRepo, 'site');
fs.mkdirSync(outputDir, { recursive: true });
fs.mkdirSync(siteDir, { recursive: true });

const db = openDb();
const rows = db.prepare('SELECT * FROM reports ORDER BY COALESCE(published_at,collected_at) DESC, id DESC').all();
const reports = rows.map((row) => ({
  id: row.id, fingerprint: row.fingerprint, source_url: row.source_url, discovery_url: row.discovery_url, publisher_name: row.publisher_name, source_name: row.source_name,
  platform: row.platform, title: row.title, content: row.content, author: row.author,
  published_at: row.published_at, collected_at: row.collected_at, event_date: row.event_date,
  brand: row.brand, model: row.model, cause: row.cause, cause_confidence: row.cause_confidence,
  adas_mode: row.adas_mode, road_type: row.road_type, severity: row.severity,
  province: row.province, city: row.city, injuries: row.injuries, fatalities: row.fatalities,
  verification_status: row.verification_status, relevance_score: row.relevance_score,
  labels: JSON.parse(row.labels_json || '{}'), review_notes: row.review_notes,
  english_description: row.english_description, english_description_source: row.english_description_source
}));
const generatedAt = new Date().toISOString();
const metadata = { schema_version: '1.1.0', generated_at: generatedAt, record_count: reports.length,
  repository_role: 'Public, sanitized publication of leads discovered by china-adas-accident-methods',
  verification_policy: 'Records are leads unless verification_status is human_verified; inclusion does not establish ADAS causation.',
  source_policy: 'Original URLs and provenance are retained; private data, raw database fields, and collection logs are not published.' };
fs.writeFileSync(path.join(outputDir, 'reports.json'), JSON.stringify(reports, null, 2) + '\n');
fs.writeFileSync(path.join(outputDir, 'metadata.json'), JSON.stringify(metadata, null, 2) + '\n');

function esc(value) { return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c])); }
const cards = reports.map((r) => `<article><time>${esc((r.event_date || r.published_at || '').slice(0, 10))}</time><h2>${esc(r.title)}</h2><p class="english">${esc(r.english_description || '')}</p><p>${esc(r.publisher_name || 'Original URL unresolved')} · ${esc(r.brand)} · ${esc(r.cause)} · ${esc(r.verification_status)}</p>${r.source_url ? `<a href="${esc(r.source_url)}" rel="noreferrer">查看原始来源</a>` : ''}${r.discovery_url ? ` · <a href="${esc(r.discovery_url)}" rel="noreferrer">Discovered via Google News</a>` : ''}</article>`).join('\n');
fs.writeFileSync(path.join(siteDir, 'index.html'), `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>中国 ADAS 事故公开数据库</title><style>body{font:16px system-ui,sans-serif;max-width:960px;margin:2rem auto;padding:0 1rem;color:#17202a;background:#f5f7fa}header,article{background:#fff;border:1px solid #dce3ea;border-radius:12px;padding:1rem 1.25rem;margin:1rem 0}h1{margin:.2rem 0}.eyebrow{color:#637385;letter-spacing:.08em;font-size:.8rem}article h2{font-size:1.05rem}time{color:#637385}a{color:#0b63ce}</style><header><p class="eyebrow">PUBLIC DATASET · ${esc(metadata.generated_at.slice(0,10))}</p><h1>中国 ADAS 事故公开数据库</h1><p>${reports.length} 条公开报道线索。收录不等于事实认定；请查看原始来源与核验状态。</p></header><main>${cards || '<p>暂无公开记录。</p>'}</main></html>\n`);
db.close();
console.log(JSON.stringify({ publicRepo, generatedAt, recordCount: reports.length }, null, 2));
