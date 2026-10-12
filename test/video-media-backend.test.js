import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { normalizeReport } from '../src/normalize.js';
import { openDb, insertReport } from '../src/db.js';
import { listReports } from '../apps/api/reports-repository.js';
import { validateSocialItem } from '../apps/social-collector/import-inbox.js';

function fixture(overrides = {}) {
  return {
    title: 'Test report', url: 'https://weibo.com/post/123', platform: 'weibo',
    content: 'Public report', ...overrides
  };
}

function reportRows(db) {
  return db.prepare('SELECT * FROM reports ORDER BY id').all();
}

test('social import schema and validation require explicit video state for HTTPS platform cover', () => {
  const schema = JSON.parse(fs.readFileSync(new URL('../apps/social-collector/record.schema.json', import.meta.url)));
  assert.deepEqual(schema.properties.video_status.enum, ['present', 'absent', 'unknown']);
  assert.equal('media_review_status' in schema.properties, false);
  assert.equal('media_reviewed_by' in schema.properties, false);
  assert.equal('media_reviewed_at' in schema.properties, false);
  validateSocialItem(fixture({ video_status: 'present', video_thumbnail_url: 'https://cdn.weibo.com/covers/123.jpg', media_review_status: 'approved' }));
  validateSocialItem(fixture());
  assert.throws(() => validateSocialItem(fixture({ video_status: 'maybe' })), /video_status/);
  assert.throws(() => validateSocialItem(fixture({ video_status: 'present', video_thumbnail_url: 'http://cdn.weibo.com/a.jpg' })), /HTTPS URL/);
  assert.throws(() => validateSocialItem(fixture({ video_status: 'absent', video_thumbnail_url: 'https://cdn.weibo.com/a.jpg' })), /video_status present/);
});

test('normalization defaults legacy media to unknown and ignores imported approval assertions', () => {
  const legacy = normalizeReport(fixture({ image_url: 'https://cdn.example/photo.jpg' }));
  assert.equal(legacy.video_status, 'unknown');
  assert.equal(legacy.video_thumbnail_url, null);
  assert.equal(legacy.media_review_status, 'pending');
  assert.equal(legacy.media_reviewed_by, null);
  assert.equal(legacy.media_reviewed_at, null);

  const imported = normalizeReport(fixture({
    video_status: 'present', video_thumbnail_url: 'https://cdn.weibo.com/covers/123.jpg',
    media_review_status: 'approved', media_reviewed_by: 'attacker', media_reviewed_at: '2026-01-01T00:00:00Z'
  }));
  assert.equal(imported.video_status, 'present');
  assert.equal(imported.video_thumbnail_url, 'https://cdn.weibo.com/covers/123.jpg');
  assert.equal(imported.media_review_status, 'pending');
  assert.equal(imported.media_reviewed_by, null);
  assert.equal(imported.media_reviewed_at, null);
  assert.equal(normalizeReport(fixture({ video_status: 'absent' })).video_status, 'absent');
  assert.equal(normalizeReport(fixture({ video_status: 'present', video_thumbnail_url: 'javascript:alert(1)' })).video_thumbnail_url, null);
});

test('SQLite migration persists explicit media with pending default and preserves fingerprint dedup semantics', () => {
  const db = openDb(':memory:');
  try {
    db.prepare(`INSERT INTO reports(fingerprint,title,content,source_name,collected_at,raw_json,created_at,updated_at)
      VALUES('legacy-fingerprint','Legacy row','','test','2026-09-29T00:00:00.000Z','{}','2026-09-29T00:00:00.000Z','2026-09-29T00:00:00.000Z')`).run();
    const report = normalizeReport(fixture({ video_status: 'present', video_thumbnail_url: 'https://cdn.weibo.com/covers/123.jpg' }));
    assert.equal(insertReport(db, report), true);
    assert.equal(insertReport(db, { ...report, video_thumbnail_url: 'https://cdn.weibo.com/covers/changed.jpg' }), false);
    const stored = reportRows(db).find((row) => row.fingerprint === report.fingerprint);
    assert.equal(stored.video_status, 'present');
    assert.equal(stored.video_thumbnail_url, 'https://cdn.weibo.com/covers/123.jpg');
    assert.equal(stored.media_review_status, 'pending');
    assert.equal(stored.media_reviewed_by, null);
    assert.equal(stored.media_reviewed_at, null);
    const legacy = reportRows(db).find((row) => row.fingerprint === 'legacy-fingerprint');
    assert.equal(legacy.video_status, 'unknown');
    assert.equal(legacy.video_thumbnail_url, null);
    assert.equal(legacy.media_review_status, 'pending');
    assert.equal(db.prepare('SELECT version FROM schema_migrations WHERE version=10').get()?.version, 10);
  } finally { db.close(); }
});

test('reports API hides unreviewed/rejected covers, enforces exact configured origin and HTTPS source, and never exposes importer data', () => {
  const db = openDb(':memory:');
  const originalAllowlist = process.env.VIDEO_THUMBNAIL_ALLOWED_ORIGINS;
  try {
    const inputs = [
      fixture({ url: 'https://weibo.com/post/pending', title: 'Pending', video_status: 'present', video_thumbnail_url: 'https://cdn.weibo.com/covers/pending.jpg' }),
      fixture({ url: 'https://weibo.com/post/approved', title: 'Approved', video_status: 'present', video_thumbnail_url: 'https://cdn.weibo.com/covers/approved.jpg' }),
      fixture({ url: 'https://weibo.com/post/rejected', title: 'Rejected', video_status: 'present', video_thumbnail_url: 'https://cdn.weibo.com/covers/rejected.jpg' }),
      fixture({ url: 'https://weibo.com/post/unlisted', title: 'Unlisted', video_status: 'present', video_thumbnail_url: 'https://evil.weibo.com/covers/unlisted.jpg' }),
      fixture({ url: 'https://weibo.com/post/no-video', title: 'No video' }),
      fixture({ url: 'http://weibo.com/post/insecure-source', title: 'Insecure source', video_status: 'present', video_thumbnail_url: 'https://cdn.weibo.com/covers/insecure.jpg' })
    ];
    for (const input of inputs) insertReport(db, normalizeReport({ ...input, secret_internal: 'do-not-expose' }));
    db.prepare("UPDATE reports SET media_review_status='approved',media_reviewed_by='admin-1',media_reviewed_at='2026-09-29T00:00:00.000Z' WHERE title='Approved'").run();
    db.prepare("UPDATE reports SET media_review_status='rejected' WHERE title='Rejected'").run();
    db.prepare("UPDATE reports SET media_review_status='approved' WHERE title='Unlisted'").run();
    db.prepare("UPDATE reports SET media_review_status='approved' WHERE title='Insecure source'").run();

    const params = new URLSearchParams();
    process.env.VIDEO_THUMBNAIL_ALLOWED_ORIGINS = '';
    let listed = listReports(db, params).data;
    assert.equal(listed.find((row) => row.title_zh === 'Approved').media.thumbnail_url, null);
    assert.equal('media' in listed.find((row) => row.title_zh === 'No video'), false);
    assert.ok(listed.every((row) => !('raw_json' in row) && !('media_review_status' in row) && !('media_reviewed_by' in row)));

    process.env.VIDEO_THUMBNAIL_ALLOWED_ORIGINS = 'https://cdn.weibo.com';
    listed = listReports(db, params).data;
    assert.equal(listed.find((row) => row.title_zh === 'Approved').media.thumbnail_url, 'https://cdn.weibo.com/covers/approved.jpg');
    assert.equal(listed.find((row) => row.title_zh === 'Pending').media.thumbnail_url, null);
    assert.equal(listed.find((row) => row.title_zh === 'Rejected').media.thumbnail_url, null);
    assert.equal(listed.find((row) => row.title_zh === 'Unlisted').media.thumbnail_url, null);
    assert.equal(listed.find((row) => row.title_zh === 'Insecure source').media.thumbnail_url, null);
    assert.equal('media_review_status' in listed.find((row) => row.title_zh === 'Approved'), false);

    process.env.VIDEO_THUMBNAIL_ALLOWED_ORIGINS = 'https://cdn.weibo.com/path';
    listed = listReports(db, params).data;
    assert.equal(listed.find((row) => row.title_zh === 'Approved').media.thumbnail_url, null);
  } finally {
    if (originalAllowlist === undefined) delete process.env.VIDEO_THUMBNAIL_ALLOWED_ORIGINS;
    else process.env.VIDEO_THUMBNAIL_ALLOWED_ORIGINS = originalAllowlist;
    db.close();
  }
});
