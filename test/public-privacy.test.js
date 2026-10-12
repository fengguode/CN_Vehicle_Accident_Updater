import test from 'node:test';
import assert from 'node:assert/strict';
import { redactPublicText, sanitizePublicRecord } from '../src/public-privacy.js';

test('redacts social attribution prefixes, account mentions, and phone numbers from narrative text', () => {
  const value = redactPublicText('c private_display_name: Reported crash @person123; call 13800138000; email me@example.com.');
  assert.equal(value, 'Reported crash [account redacted]; call [phone redacted]; email [email redacted].');
  assert.doesNotMatch(value, /private_display_name|@person123|13800138000|me@example.com/);
});

test('redacts national ID and plate-shaped identifiers from narrative text', () => {
  assert.equal(redactPublicText('ID 11010519491231002X, plate 京A12345.'), 'ID [ID redacted], plate [license plate redacted].');
});

test('keeps reviewed public-agency mentions but removes unknown account mentions', () => {
  assert.equal(redactPublicText('Police @湖南高速警察四支队 reviewed it; @private_person posted it; @HunanPersonal is unknown.'), 'Police @湖南高速警察四支队 reviewed it; [account redacted] posted it; [account redacted] is unknown.');
  assert.equal(redactPublicText('Notation @N is not a full account handle.'), 'Notation @N is not a full account handle.');
});

test('sanitizes social author fields while preserving exact source provenance', () => {
  const record = sanitizePublicRecord({
    id: 232,
    platform: 'weibo',
    author: 'private_display_name',
    title: 'Driver assistance crash @person123',
    source_url: 'https://weibo.com/u/12345/status/abc',
    discovery_url: 'https://news.google.com/rss/articles/xyz',
    fingerprint: 'stable-fingerprint'
  });

  assert.equal(record.author, null);
  assert.equal(record.title, 'Driver assistance crash [account redacted]');
  assert.equal(record.source_url, 'https://weibo.com/u/12345/status/abc');
  assert.equal(record.discovery_url, 'https://news.google.com/rss/articles/xyz');
  assert.equal(record.fingerprint, 'stable-fingerprint');
});

test('keeps non-social author provenance and reviewed public-agency handles', () => {
  const record = sanitizePublicRecord({ platform: 'news_index', author: 'News Desk', content: 'Police report @agency confirmed.', labels: { note: 'Reviewed by @private_person', references: ['Source account @another_person', 'https://publisher.example/story'] } });
  assert.equal(record.author, 'News Desk');
  assert.equal(record.content, 'Police report [account redacted] confirmed.');
  assert.equal(record.labels.note, 'Reviewed by [account redacted]');
  assert.deepEqual(record.labels.references, ['Source account [account redacted]', 'https://publisher.example/story']);
});
