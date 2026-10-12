import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('scheduled index sources keep their configured Weibo boundary and omit Xiaohongshu', () => {
  const sources = JSON.parse(fs.readFileSync(new URL('../config/sources.json', import.meta.url))).sources;
  const scheduled = JSON.parse(fs.readFileSync(new URL('../apps/updater/public-sources.json', import.meta.url))).source_ids;
  const byId = new Map(sources.map((source) => [source.id, source]));
  assert.ok(scheduled.length > 0);
  for (const id of scheduled) {
    const source = byId.get(id);
    assert.ok(source?.enabled, `${id} must be enabled`);
    assert.equal(source.platform, 'weibo_web_index');
    assert.equal(source.require_resolved, true);
    assert.ok(source.allowed_hosts.length > 0);
    if (source.platform === 'weibo_web_index') {
      assert.deepEqual(source.allowed_hosts, ['weibo.com']);
      assert.equal(source.enrich_weibo_web, true);
    }
  }
  assert.equal(sources.some((source) => source.enabled && source.platform === 'news_index'), false);
  assert.equal(byId.get('manual-platform-exports')?.enabled, true);
  assert.equal(byId.has('google-news-xiaohongshu-traffic'), false);
  assert.equal(scheduled.some((id) => id.includes('xiaohongshu')), false);
  const schema = JSON.parse(fs.readFileSync(new URL('../apps/social-collector/record.schema.json', import.meta.url)));
  assert.ok(schema.properties.platform.enum.includes('xiaohongshu'));
});
