import test from 'node:test';
import assert from 'node:assert/strict';
import { classify } from '../src/classifier.js';
import { fingerprint, cleanUrl } from '../src/normalize.js';
import { parseRss } from '../src/rss.js';

test('classifies Chinese ADAS accident text across perspectives', () => {
  const value=classify({title:'广东高速小鹏开启NGP后追尾，乘员轻伤',content:'驾驶员称系统未识别前方障碍物'});
  assert.equal(value.brand,'XPeng'); assert.equal(value.province,'广东'); assert.equal(value.road_type,'highway'); assert.equal(value.severity,'minor_injury'); assert.ok(value.relevance_score>=0.9);
});
test('normalizes tracking URLs for stable duplicate detection',()=>{
  assert.equal(cleanUrl('https://example.com/a?utm_source=x&id=2#top'),'https://example.com/a?id=2');
  assert.equal(fingerprint({url:'https://example.com/a?utm_source=x'}),fingerprint({url:'https://example.com/a'}));
});
test('parses RSS items',()=>{const rows=parseRss('<rss><channel><item><title><![CDATA[辅助驾驶事故]]></title><link>https://e.cn/1</link><description>碰撞</description><pubDate>Mon, 01 Sep 2025 00:00:00 GMT</pubDate></item></channel></rss>');assert.equal(rows.length,1);assert.equal(rows[0].title,'辅助驾驶事故');});
test('classifies Taiwan Volvo ACC rear-impact article wording', () => {
  const value = classify({ title: '沃尔沃ACC辅助驾驶追撞事故', content: '台湾苗栗发生事故，车辆使用辅助驾驶ACC' });
  assert.equal(value.brand, 'Volvo'); assert.equal(value.province, '台湾'); assert.equal(value.cause, 'speed_or_distance'); assert.equal(value.adas_mode, 'active');
});
