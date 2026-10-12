import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeWeiboSourceQuality } from '../src/source-quality.js';

test('Weibo source metrics distinguish feed age, enrichment, and unknown timestamps', () => {
  const quality = summarizeWeiboSourceQuality([
    { published_at: '2026-09-25T09:00:00Z', content: 'short' },
    { published_at: '2026-09-25T07:00:00Z', content: 'longer public text', enrichment_source: 'weibo_public_html' },
    { published_at: '2026-09-26T00:00:00Z', content: 'future date ignored' },
    { content: '' }
  ], new Date('2026-09-25T10:00:00Z'));
  assert.deepEqual(quality, {
    resolved_posts: 4,
    public_text_enriched: 1,
    feed_timestamped: 2,
    feed_age_median_hours: 2,
    feed_age_p90_hours: 2.8,
    content_chars_median: 11.5
  });
});

test('empty Weibo feed reports unknown age instead of zero delay', () => {
  const quality = summarizeWeiboSourceQuality([], new Date('2026-09-25T10:00:00Z'));
  assert.equal(quality.feed_age_median_hours, null);
  assert.equal(quality.content_chars_median, null);
});
