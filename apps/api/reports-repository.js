const filterFields = ['brand', 'cause', 'province', 'road_type', 'severity', 'verification_status', 'platform'];
const sortFields = new Set(['date', 'relevance']);

function toPublicReport(row, allowedThumbnailOrigins) {
  let labels = {};
  try { labels = JSON.parse(row.labels_json || '{}'); } catch {}
  labels.community_votes = { relevant: row.traffic_relevant_votes, not_relevant: row.traffic_not_relevant_votes };
  labels.community_relevance = row.traffic_relevant_votes === row.traffic_not_relevant_votes
    ? 'undecided' : (row.traffic_relevant_votes > row.traffic_not_relevant_votes ? 'supported' : 'rejected');
  const report = {
    id: row.id,
    fingerprint: row.fingerprint,
    source_url: row.source_url,
    publisher_name: row.publisher_name,
    source_name: row.source_name,
    platform: row.platform,
    title_zh: row.title,
    title_en: row.title_en || row.title,
    title_zh_short: row.title_zh_short || '',
    title_en_short: row.title_en_short || '',
    content_zh: row.content,
    content_en: row.content_en || '',
    summary_zh: row.summary_zh || '',
    summary_en: row.summary_en || '',
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
    svm_score: row.traffic_svm_score,
    ranking_score: row.ranking_score,
    labels,
    review_notes: row.review_notes
  };
  if (row.video_status === 'present') {
    const thumbnail = safeHttpsUrl(row.video_thumbnail_url);
    const source = safeHttpsUrl(row.source_url);
    const reviewApproved = row.media_review_status === 'approved';
    const thumbnailAllowed = thumbnail && allowedThumbnailOrigins.has(thumbnail.origin);
    report.media = {
      video_status: 'present',
      thumbnail_url: reviewApproved && thumbnailAllowed && source ? thumbnail.href : null
    };
  }
  return Object.fromEntries(Object.entries(report).map(([key, value]) => [
    key,
    typeof value === 'string' && key !== 'source_url'
      ? value.replace(/(?<!\d)(?:\+?86[ \t-]?)?1[3-9](?:[ \t-]?\d){9}(?!\d)/g, '[phone redacted]')
        .replace(/(?<!\d)(?:\+?86[ \t-]?)?0\d{2,3}(?:[ \t-]?\d){7,8}(?!\d)/g, '[phone redacted]')
      : value
  ]));
}

function safeHttpsUrl(value) {
  if (typeof value !== 'string' || !value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password) return null;
    return url;
  } catch { return null; }
}

function configuredThumbnailOrigins(value = process.env.VIDEO_THUMBNAIL_ALLOWED_ORIGINS || '') {
  const origins = new Set();
  for (const entry of value.split(',').map((part) => part.trim()).filter(Boolean)) {
    try {
      const url = new URL(entry);
      if (url.protocol === 'https:' && !url.username && !url.password && url.origin === entry && url.pathname === '/' && !url.search && !url.hash) origins.add(url.origin);
    } catch {}
  }
  return origins;
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
  const { sql, values } = whereFor(params);
  const page = Math.max(1, Number.parseInt(params.get('page') || '1', 10) || 1);
  const pageSize = Math.min(100, Math.max(1, Number.parseInt(params.get('page_size') || '20', 10) || 20));
  const requestedSort = sortFields.has(params.get('sort')) ? params.get('sort') : 'date';
  const sort = requestedSort;
  const total = db.prepare(`SELECT COUNT(*) AS total FROM reports WHERE ${sql}`).get(...values).total;
  const columns = `reports.id,reports.fingerprint,source_url,publisher_name,source_name,platform,title,title_en,title_zh_short,title_en_short,content,content_en,summary_zh,summary_en,english_description,author,published_at,collected_at,event_date,brand,model,cause,adas_mode,road_type,severity,province,city,injuries,fatalities,verification_status,relevance_score,traffic_svm_score,labels_json,review_notes,video_status,video_thumbnail_url,media_review_status`;
  // Three prior votes keep one rating from overwhelming the model. As votes
  // accumulate, the shared community judgment becomes the dominant signal.
  const modelPrior = '(CASE WHEN traffic_svm_score IS NULL THEN 0.5 ELSE 0.5 + traffic_svm_score / (2.0 * (1.0 + ABS(traffic_svm_score))) END)';
  const ranking = `(COALESCE(votes.relevant,0) + 3.0 * ${modelPrior}) / (COALESCE(votes.relevant,0) + COALESCE(votes.not_relevant,0) + 3.0)`;
  const order = sort === 'relevance'
    ? 'ranking_score DESC,COALESCE(event_date,published_at,collected_at) DESC,reports.id DESC'
    : 'COALESCE(event_date,published_at,collected_at) DESC,reports.id DESC';
  const rows = db.prepare(`SELECT ${columns},${ranking} AS ranking_score,
    COALESCE(votes.relevant,0) AS traffic_relevant_votes,
    COALESCE(votes.not_relevant,0) AS traffic_not_relevant_votes FROM reports
    LEFT JOIN (SELECT fingerprint,SUM(vote='relevant') AS relevant,SUM(vote='not_relevant') AS not_relevant
      FROM traffic_votes GROUP BY fingerprint) AS votes ON votes.fingerprint=reports.fingerprint
    WHERE ${sql} ORDER BY ${order} LIMIT ? OFFSET ?`)
    .all(...values, pageSize, (page - 1) * pageSize);
  const allowedOrigins = configuredThumbnailOrigins();
  return { data: rows.map((row) => toPublicReport(row, allowedOrigins)), page, page_size: pageSize, total, pages: Math.ceil(total / pageSize), sort };
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
