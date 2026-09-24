import { loadSvm, scoreSvm } from '../../src/svm.js';

const filterFields = ['brand', 'cause', 'province', 'road_type', 'severity', 'verification_status', 'platform'];
const sortFields = new Set(['date', 'relevance']);

function toPublicReport(row, svmModel) {
  let labels = {};
  try { labels = JSON.parse(row.labels_json || '{}'); } catch {}
  const report = {
    id: row.id,
    fingerprint: row.fingerprint,
    source_url: row.source_url,
    publisher_name: row.publisher_name,
    source_name: row.source_name,
    platform: row.platform,
    title_zh: row.title,
    title_en: row.title_en || row.title,
    content_zh: row.content,
    content_en: row.content_en || '',
    description_en: row.english_description || '',
    author: row.author,
    published_at: row.published_at,
    collected_at: row.collected_at,
    event_date: row.event_date,
    brand: row.brand,
    model: row.model,
    cause: row.cause,
    adas_mode: row.adas_mode,
    road_type: row.road_type,
    severity: row.severity,
    province: row.province,
    city: row.city,
    injuries: row.injuries,
    fatalities: row.fatalities,
    verification_status: row.verification_status,
    relevance_score: row.relevance_score,
    svm_score: svmModel ? scoreSvm(svmModel, `${row.title} ${row.content}`) : null,
    labels,
    review_notes: row.review_notes
  };
  return Object.fromEntries(Object.entries(report).map(([key, value]) => [
    key,
    typeof value === 'string' && key !== 'source_url'
      ? value.replace(/(?<!\d)(?:\+?86[ \t-]?)?1[3-9](?:[ \t-]?\d){9}(?!\d)/g, '[phone redacted]')
        .replace(/(?<!\d)(?:\+?86[ \t-]?)?0\d{2,3}(?:[ \t-]?\d){7,8}(?!\d)/g, '[phone redacted]')
      : value
  ]));
}

function whereFor(params) {
  const clauses = ['1=1'];
  const values = [];
  for (const field of filterFields) {
    const value = String(params.get(field) || '').trim();
    if (value) { clauses.push(`${field}=?`); values.push(value); }
  }
  const query = String(params.get('q') || '').trim();
  if (query) {
    clauses.push('(title LIKE ? OR content LIKE ? OR title_en LIKE ? OR content_en LIKE ? OR source_name LIKE ?)');
    const pattern = `%${query}%`;
    values.push(pattern, pattern, pattern, pattern, pattern);
  }
  return { sql: clauses.join(' AND '), values };
}

export function listReports(db, params) {
  const svmModel = loadSvm();
  const { sql, values } = whereFor(params);
  const page = Math.max(1, Number.parseInt(params.get('page') || '1', 10) || 1);
  const pageSize = Math.min(100, Math.max(1, Number.parseInt(params.get('page_size') || '20', 10) || 20));
  const requestedSort = sortFields.has(params.get('sort')) ? params.get('sort') : 'date';
  const sort = requestedSort === 'relevance' && !svmModel ? 'date' : requestedSort;
  const total = db.prepare(`SELECT COUNT(*) AS total FROM reports WHERE ${sql}`).get(...values).total;
  const columns = `id,fingerprint,source_url,publisher_name,source_name,platform,title,title_en,content,content_en,english_description,author,published_at,collected_at,event_date,brand,model,cause,adas_mode,road_type,severity,province,city,injuries,fatalities,verification_status,relevance_score,labels_json,review_notes`;
  let rows;
  if (sort === 'relevance' && svmModel) {
    rows = db.prepare(`SELECT ${columns} FROM reports WHERE ${sql}`).all(...values)
      .map((row) => toPublicReport(row, svmModel))
      .sort((a, b) => (b.svm_score ?? Number.NEGATIVE_INFINITY) - (a.svm_score ?? Number.NEGATIVE_INFINITY)
        || Date.parse(b.event_date || b.published_at || b.collected_at || '') - Date.parse(a.event_date || a.published_at || a.collected_at || ''));
    return { data: rows.slice((page - 1) * pageSize, page * pageSize), page, page_size: pageSize, total, pages: Math.ceil(total / pageSize), sort };
  }
  rows = db.prepare(`SELECT ${columns} FROM reports WHERE ${sql} ORDER BY COALESCE(event_date,published_at,collected_at) DESC,id DESC LIMIT ? OFFSET ?`)
    .all(...values, pageSize, (page - 1) * pageSize);
  return { data: rows.map((row) => toPublicReport(row, svmModel)), page, page_size: pageSize, total, pages: Math.ceil(total / pageSize), sort };
}

export function getFilterOptions(db) {
  return Object.fromEntries(filterFields.map((field) => [field,
    db.prepare(`SELECT DISTINCT ${field} AS value FROM reports WHERE ${field} IS NOT NULL AND ${field}<>'' ORDER BY ${field}`).all().map((row) => row.value)
  ]));
}

export function getSummary(db) {
  return {
    total: db.prepare('SELECT COUNT(*) AS total FROM reports').get().total,
    unverified: db.prepare("SELECT COUNT(*) AS total FROM reports WHERE verification_status='unverified'").get().total,
    latest_collection: db.prepare('SELECT MAX(finished_at) AS value FROM runs').get().value
  };
}
