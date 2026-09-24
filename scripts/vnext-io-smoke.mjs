import assert from 'node:assert/strict';

const base = process.env.ADAS_TEST_BASE_URL || 'http://127.0.0.1:8789';
const password = process.env.ADAS_TEST_ADMIN_PASSWORD;
if (!password) throw new Error('Set ADAS_TEST_ADMIN_PASSWORD for a disposable staging account.');
const jar = {};

async function request(route, method = 'GET', body, expected = 200) {
  const headers = { accept: 'application/json' };
  if (body !== undefined) headers['content-type'] = 'application/json';
  if (Object.keys(jar).length) headers.cookie = Object.entries(jar).map(([key, value]) => `${key}=${value}`).join('; ');
  if (method !== 'GET' && jar.adas_csrf) headers['x-csrf-token'] = jar.adas_csrf;
  const response = await fetch(new URL(route, base), { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  for (const cookie of response.headers.getSetCookie()) {
    const [name, value] = cookie.split(';', 1)[0].split('=');
    jar[name] = value;
  }
  const result = await response.json();
  assert.equal(response.status, expected, `${method} ${route}: ${response.status} ${result.error || ''}`);
  return result;
}

await request('/api/reports', 'GET', undefined, 401);
const login = await request('/api/auth/login', 'POST', { username: 'admin', password });
assert.equal(login.user.approved, true);
const summary = await request('/api/summary');
assert.equal(summary.total, 294);
const filters = await request('/api/filters');
assert.ok(filters.brand.length > 0);
const first = await request('/api/reports?page=1&page_size=20&sort=date');
const second = await request('/api/reports?page=2&page_size=20&sort=date');
const relevance = await request('/api/reports?page=1&page_size=20&sort=relevance');
assert.equal(first.total, 294);
assert.equal(first.data.length, 20);
assert.equal(second.data.length, 20);
assert.notEqual(first.data[0].fingerprint, second.data[0].fingerprint);
assert.equal(relevance.sort, 'relevance');
assert.ok(first.data[0].summary_zh && first.data[0].summary_en);
assert.ok(first.data[0].title_zh_short && first.data[0].title_en_short);
assert.ok(Number.isFinite(relevance.data[0].svm_score));
assert.equal(first.data[0].raw_json, undefined);

const fingerprint = first.data[0].fingerprint;
const baselineVotes = first.data[0].labels.community_votes;
try {
  const saved = await request('/api/vote', 'POST', { fingerprint, vote: 'relevant' });
  assert.equal(saved.vote, 'relevant');
  assert.ok(saved.model_id);
  assert.ok((await request('/api/my-votes')).data.some((vote) => vote.fingerprint === fingerprint && vote.vote === 'relevant'));
  const changed = await request('/api/vote', 'POST', { fingerprint, vote: 'not_relevant' });
  assert.equal(changed.vote, 'not_relevant');
  assert.notEqual(changed.model_id, saved.model_id);
  const votedReport = (await request('/api/reports?page=1&page_size=20&sort=date')).data[0];
  assert.equal(votedReport.labels.community_votes.not_relevant, baselineVotes.not_relevant + 1);
} finally {
  await request(`/api/vote/${fingerprint}`, 'DELETE');
}
assert.ok(!(await request('/api/my-votes')).data.some((vote) => vote.fingerprint === fingerprint));
const restored = (await request('/api/reports?page=1&page_size=20&sort=date')).data[0];
assert.deepEqual(restored.labels.community_votes, baselineVotes);
console.log(JSON.stringify({ ok: true, reports: summary.total, pages: [first.page, second.page], filters: filters.brand.length, vote_change_revoke: true }));
