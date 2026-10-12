import test from 'node:test';
import assert from 'node:assert/strict';
import { projectReportCard } from '../apps/web/report-presentation.js';

test('report cards provide concise bilingual metadata without deriving media from provenance URLs', () => {
  const report = {
    title: '中文标题', title_en_short: 'Short English title', content_zh: 'Long source report text',
    summary_en: 'Concise summary', source_url: 'https://weibo.com/status/123', platform: 'weibo',
    province: '浙江', verification_status: 'unverified', image_url: 'https://example.com/photo.jpg'
  };
  const english = projectReportCard(report, 'en');
  assert.equal(english.title, 'Short English title');
  assert.equal(english.summary, 'Concise summary');
  assert.equal(english.source, '');
  assert.equal(english.platform, 'weibo');
  assert.equal(english.location, '浙江');
  assert.equal(english.status, 'unverified');
  assert.equal(english.media, null);
  const chinese = projectReportCard(report, 'zh');
  assert.equal(chinese.title, '中文标题');
  assert.equal(chinese.summary, 'Long source report text');
  assert.equal(chinese.media, null);
});

test('missing fields have a stable explicit unverified state and no invented title or media', () => {
  const card = projectReportCard({ source_url: 'https://social.example/post/1' });
  assert.equal(card.title, 'Untitled report');
  assert.equal(card.status, 'unverified');
  assert.equal(card.media, null);
  assert.equal(card.source, '');
});

test('video preview uses only an explicit approved API thumbnail and the HTTPS source URL', () => {
  const report = {
    source_url: 'https://weibo.com/status/123',
    media: { video_status: 'present', thumbnail_url: 'https://img.weibo.com/cover.jpg' }
  };
  assert.deepEqual(projectReportCard(report).media, {
    thumbnail: 'https://img.weibo.com/cover.jpg', source: 'https://weibo.com/status/123'
  });
  assert.equal(projectReportCard({ ...report, source_url: 'http://weibo.com/status/123' }).media.source, null);
  assert.equal(projectReportCard({ ...report, media: { ...report.media, thumbnail_url: 'javascript:alert(1)' } }).media.thumbnail, null);
  assert.equal(projectReportCard({ ...report, media: { video_status: 'unknown', thumbnail_url: report.media.thumbnail_url } }).media, null);
});
