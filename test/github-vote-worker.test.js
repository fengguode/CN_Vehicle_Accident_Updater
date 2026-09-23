import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../backend/github-vote-worker.js';

test('authenticated vote can be changed and revoked, and export reflects current state', async () => {
  const sessions = new Map();
  const votes = new Map();
  const env = {
    FRONTEND_ORIGIN: 'https://fengguode.github.io',
    FRONTEND_URL: 'https://fengguode.github.io/CN_Vehicle_Accident_Database/',
    GITHUB_CLIENT_ID: 'test-client', GITHUB_CLIENT_SECRET: 'test-secret', EXPORT_TOKEN: 'export-secret',
    DB: { prepare(sql) { return { bind(...args) { return {
      async run() {
        if (sql.startsWith('INSERT INTO sessions')) sessions.set(args[0], { github_id: args[1], github_login: args[2], expires_at: args[3] });
        if (sql.startsWith('INSERT INTO votes')) votes.set(`${args[0]}:${args[1]}`, { fingerprint: args[0], voter_id: args[1], vote: args[2], created_at: args[3] });
        if (sql.startsWith('DELETE FROM votes')) votes.delete(`${args[0]}:${args[1]}`);
        if (sql.startsWith('DELETE FROM sessions')) sessions.delete(args[0]);
      },
      async first() { const row = sessions.get(args[0]); return row && row.expires_at > args[1] ? row : null; },
      async all() { return { results: [...votes.values()].filter(row => !args.length || row.voter_id === args[0]) }; }
    }; }, async all() {
      if (sql.includes('GROUP BY fingerprint')) {
        const totals = new Map();
        for (const row of votes.values()) {
          const item = totals.get(row.fingerprint) || { fingerprint: row.fingerprint, relevant: 0, not_relevant: 0 };
          item[row.vote] += 1;
          totals.set(row.fingerprint, item);
        }
        return { results: [...totals.values()] };
      }
      return { results: [...votes.values()] };
    } }; } }
  };
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async url => {
    if (String(url).includes('access_token')) return Response.json({ access_token: 'test-github-token' });
    if (String(url).includes('/user')) return Response.json({ id: 42, login: 'testuser' });
    throw new Error('unexpected fetch');
  };
  try {
    const start = await worker.fetch(new Request('https://vote.example/auth/github/start'), env);
    assert.equal(start.status, 302);
    const state = new URL(start.headers.get('location')).searchParams.get('state');
    const callback = await worker.fetch(new Request(`https://vote.example/auth/github/callback?code=abc&state=${state}`, { headers: { cookie: `adas_oauth_state=${state}` } }), env);
    assert.equal(callback.status, 302);
    const token = new URL(callback.headers.get('location')).hash.slice('#session='.length);
    assert.equal(token.length, 64);
    const fingerprint = 'a'.repeat(64);
    const call = (path, method = 'GET', body) => worker.fetch(new Request(`https://vote.example${path}`, { method, headers: { authorization: `Bearer ${token}`, origin: env.FRONTEND_ORIGIN, ...(body ? { 'content-type': 'application/json' } : {}) }, body: body && JSON.stringify(body) }), env);
    assert.equal((await call('/api/vote', 'POST', { fingerprint, vote: 'relevant' })).status, 200);
    assert.equal((await call('/api/vote', 'POST', { fingerprint, vote: 'not_relevant' })).status, 200);
    assert.deepEqual((await (await call('/api/my-votes')).json()).votes.map(({ vote }) => vote), ['not_relevant']);
    assert.equal((await (await call('/api/votes/summary')).json()).totals[0].not_relevant, 1);
    assert.equal((await call(`/api/vote/${fingerprint}`, 'DELETE')).status, 200);
    assert.deepEqual((await (await call('/api/my-votes')).json()).votes, []);
    const exportResponse = await worker.fetch(new Request('https://vote.example/api/votes/export', { headers: { authorization: 'Bearer export-secret' } }), env);
    assert.deepEqual(await exportResponse.json(), []);
  } finally { globalThis.fetch = originalFetch; }
});
