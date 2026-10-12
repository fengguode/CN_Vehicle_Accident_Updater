import assert from 'node:assert/strict';
import test from 'node:test';
import { scoreSvm, SVM_ALGORITHM, vectorize } from '../src/svm.js';

test('vectorization includes meaningful terms from later article paragraphs', () => {
  const titleAndLead = '某地发生交通事故，车辆随后停靠路边。';
  const fullArticle = `${titleAndLead}\n\n目击者补充称，车辆的制动系统突然失灵，现场正在调查。`;
  const prefix = vectorize(titleAndLead);
  const complete = vectorize(fullArticle);

  assert.ok(Object.keys(complete).some((token) => !Object.hasOwn(prefix, token)));
  const brakingTerms = Object.keys(complete).filter((token) => /制动|突然|失灵/u.test(token));
  assert.ok(brakingTerms.length > 0, `expected a later-paragraph term in ${Object.keys(complete).join(', ')}`);
});

test('vectorization processes content after the former four-character token boundary', () => {
  const content = `${'普通新闻内容。'.repeat(20)}\n\n独特尾段关键词新能源车高速领航辅助系统突然退出`;
  const vector = vectorize(content);

  assert.ok(Object.keys(vector).some((token) => token.includes('领航') || token.includes('辅助')));
  assert.ok(Object.values(vector).every(Number.isFinite));
});

test('sublinear term frequency and L2 normalization limit long-body dominance', () => {
  const vector = vectorize(`${'accident '.repeat(100)} rareword`);
  assert.ok(Math.abs(Math.hypot(...Object.values(vector)) - 1) < 1e-10);
  assert.ok(vector.accident / vector.rareword < 6);
});

test('scoring rejects weights trained with the old feature representation', () => {
  assert.equal(scoreSvm({ algorithm: 'linear_svm_pegasos_v1', weights: { accident: 1 }, bias: 0 }, 'accident'), null);
  assert.equal(scoreSvm({ algorithm: SVM_ALGORITHM, weights: { accident: 1 }, bias: 0 }, 'accident'), 1);
});
