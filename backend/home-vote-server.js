import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import voteApi from './github-vote-worker.js';

const backendDir = path.dirname(fileURLToPath(import.meta.url));
const localEnvPath = path.join(backendDir, '..', '.env');
if (fs.existsSync(localEnvPath)) process.loadEnvFile(localEnvPath);
const dbPath = path.resolve(process.env.VOTE_DB_PATH || path.join(backendDir, '..', 'data', 'votes.db'));
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const sqlite = new DatabaseSync(dbPath);
sqlite.exec(fs.readFileSync(path.join(backendDir, 'schema.sql'), 'utf8'));

const DB = {
  prepare(sql) {
    const statement = sqlite.prepare(sql);
    return {
      bind(...values) {
        return {
          async run() { return statement.run(...values); },
          async first() { return statement.get(...values) || null; },
          async all() { return { results: statement.all(...values) }; }
        };
      },
      async all() { return { results: statement.all() }; }
    };
  }
};
const port = Number(process.env.VOTE_PORT || 8790);
const host = process.env.VOTE_HOST || '127.0.0.1';
const publicBase = (process.env.VOTE_PUBLIC_BASE_URL || `http://127.0.0.1:${port}`).replace(/\/+$/, '');
if (process.env.VOTE_PUBLIC_BASE_URL && !publicBase.startsWith('https://')) throw new Error('VOTE_PUBLIC_BASE_URL must use HTTPS');
const env = {
  DB,
  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
  EXPORT_TOKEN: process.env.VOTE_EXPORT_TOKEN,
  FRONTEND_ORIGIN: 'https://fengguode.github.io',
  FRONTEND_URL: 'https://fengguode.github.io/CN_Vehicle_Accident_Database/'
};

const server = http.createServer(async (incoming, outgoing) => {
  try {
    let body = '';
    for await (const chunk of incoming) {
      body += chunk;
      if (body.length > 4096) { outgoing.writeHead(413); outgoing.end(); return; }
    }
    const pathAndQuery = new URL(incoming.url || '/', publicBase);
    const request = new Request(`${publicBase}${pathAndQuery.pathname}${pathAndQuery.search}`, {
      method: incoming.method,
      headers: incoming.headers,
      ...(body ? { body } : {})
    });
    const response = await voteApi.fetch(request, env);
    outgoing.writeHead(response.status, Object.fromEntries(response.headers));
    outgoing.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    console.error('Vote API request failed:', error);
    outgoing.writeHead(500, { 'content-type': 'application/json; charset=utf-8' });
    outgoing.end(JSON.stringify({ error: 'internal_error' }));
  }
});
server.listen(port, host, () => console.log(`Vote API listening on http://${host}:${port}`));
function shutdown() { server.close(() => sqlite.close()); }
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
