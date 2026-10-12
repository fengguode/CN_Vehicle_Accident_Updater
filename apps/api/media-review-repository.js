function validHttpsUrl(value) {
  if (typeof value !== 'string' || !value) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password;
  } catch { return false; }
}

function configuredThumbnailOrigins(value = process.env.VIDEO_THUMBNAIL_ALLOWED_ORIGINS || '') {
  const origins = new Set();
  for (const entry of value.split(',').map((part) => part.trim()).filter(Boolean)) {
    try {
      const url = new URL(entry);
      if (url.protocol === 'https:' && !url.username && !url.password && url.origin === entry && url.pathname === '/' && !url.search && !url.hash)
        origins.add(url.origin);
    } catch {}
  }
  return origins;
}

function publicCandidate(row) {
  return {
    report_id: row.id,
    fingerprint: row.fingerprint,
    title: row.title,
    source_url: row.source_url,
    source_name: row.source_name,
    platform: row.platform,
    verification_status: row.verification_status,
    video_thumbnail_url: row.video_thumbnail_url,
    media_review_status: row.media_review_status,
    media_reviewed_by: row.media_reviewed_by,
    media_reviewed_at: row.media_reviewed_at
  };
}

export function listMediaCandidates(db, { status = 'pending', limit = 100, cursor } = {}) {
  if (!['pending', 'approved', 'rejected'].includes(status)) throw new Error('Invalid media review status.');
  const parsedLimit = Number(limit);
  if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) throw new Error('Limit must be an integer from 1 to 100.');
  let parsedCursor = null;
  if (cursor !== undefined && cursor !== null && cursor !== '') {
    const rawCursor = String(cursor);
    parsedCursor = Number(rawCursor);
    if (!/^\d+$/.test(rawCursor) || !Number.isSafeInteger(parsedCursor) || parsedCursor < 1 || String(parsedCursor) !== rawCursor)
      throw new Error('Cursor must be a positive report ID.');
  }
  const origins = configuredThumbnailOrigins();
  const query = `SELECT id,fingerprint,title,source_url,source_name,platform,verification_status,video_thumbnail_url,
      media_review_status,media_reviewed_by,media_reviewed_at
    FROM reports WHERE video_status='present' AND media_review_status=? ${parsedCursor === null ? '' : 'AND id < ?'}
    ORDER BY id DESC LIMIT ?`;
  const rows = parsedCursor === null
    ? db.prepare(query).all(status, parsedLimit + 1)
    : db.prepare(query).all(status, parsedCursor, parsedLimit + 1);
  const hasMore = rows.length > parsedLimit;
  const page = rows.slice(0, parsedLimit);
  const data = page.map((row) => {
      const candidate = publicCandidate(row);
      let origin = null;
      try {
        const url = new URL(row.video_thumbnail_url);
        if (url.protocol === 'https:' && !url.username && !url.password) origin = url.origin;
      } catch {}
      const allowed = origin && origins.has(origin);
      if (!allowed) candidate.video_thumbnail_url = null;
      candidate.thumbnail_policy_blocked = Boolean(row.video_thumbnail_url && !allowed);
      return candidate;
    });
  return { data, next_cursor: hasMore ? String(page[page.length - 1].id) : null };
}

export function reviewMediaCandidate(db, reportId, actorId, action) {
  if (!Number.isSafeInteger(reportId) || reportId < 1) throw new Error('Invalid report ID.');
  if (!['approve', 'reject', 'remove'].includes(action)) throw new Error('Invalid media review action.');
  const report = db.prepare(`SELECT id,video_status,video_thumbnail_url,media_review_status,media_reviewed_by,media_reviewed_at
    FROM reports WHERE id=?`).get(reportId);
  if (!report || report.video_status !== 'present') return null;
  if (action === 'approve') {
    if (!validHttpsUrl(report.video_thumbnail_url)) throw new Error('Approval requires a valid HTTPS thumbnail URL.');
    const origin = new URL(report.video_thumbnail_url).origin;
    if (!configuredThumbnailOrigins().has(origin)) throw new Error('Thumbnail origin is not enabled for review.');
  }
  const before = {
    video_status: report.video_status,
    thumbnail_url: report.video_thumbnail_url,
    review_status: report.media_review_status,
    reviewed_by: report.media_reviewed_by,
    reviewed_at: report.media_reviewed_at
  };
  const now = new Date().toISOString();
  const after = {
    video_status: 'present',
    thumbnail_url: action === 'remove' ? null : report.video_thumbnail_url,
    review_status: action === 'approve' ? 'approved' : 'rejected',
    reviewed_by: String(actorId),
    reviewed_at: now
  };
  db.exec('BEGIN IMMEDIATE');
  try {
    db.prepare(`UPDATE reports SET video_thumbnail_url=?,media_review_status=?,media_reviewed_by=?,media_reviewed_at=? WHERE id=?`)
      .run(after.thumbnail_url, after.review_status, after.reviewed_by, after.reviewed_at, reportId);
    db.prepare(`INSERT INTO media_review_events(report_id,actor_id,action,old_state,new_state,created_at) VALUES(?,?,?,?,?,?)`)
      .run(reportId, actorId, action, JSON.stringify(before), JSON.stringify(after), now);
    db.exec('COMMIT');
  } catch (error) { db.exec('ROLLBACK'); throw error; }
  return { report_id: reportId, action, ...after };
}

export function listMediaReviewEvents(db, reportId) {
  if (!Number.isSafeInteger(reportId) || reportId < 1) throw new Error('Invalid report ID.');
  return db.prepare(`SELECT e.id,e.report_id,e.actor_id,e.action,e.old_state,e.new_state,e.created_at
    FROM media_review_events e WHERE e.report_id=? ORDER BY e.id`).all(reportId);
}
