import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDb } from '../../src/db.js';
import { getFilterOptions, getSummary, listReports } from './reports-repository.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../web');
const assets = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/app.js', ['app.js', 'text/javascript; charset=utf-8']],
  ['/styles.css', ['styles.css', 'text/css; charset=utf-8']]
]);
const db = openDb();
const port = Number(process.env.ADAS_VNEXT_PORT || 8788);

function send(res, status, body, contentType = 'application/json; charset=utf-8') {
  res.writeHead(status, { 'content-type': contentType, 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' });
  res.end(body);
}
function json(res, value, status = 200) { send(res, status, JSON.stringify(value)); }

const server = http.createServer((req, res) => {
  try {
    const url = new URL(req.url || '/', 'http://localhost');
    if (req.method === 'GET' && url.pathname === '/health') return json(res, { ok: true, service: 'adas-vnext' });
    if (req.method === 'GET' && url.pathname === '/api/reports') return json(res, listReports(db, url.searchParams));
    if (req.method === 'GET' && url.pathname === '/api/filters') return json(res, getFilterOptions(db));
    if (req.method === 'GET' && url.pathname === '/api/summary') return json(res, getSummary(db));
    if (req.method !== 'GET') return json(res, { error: 'method_not_allowed' }, 405);
    const asset = assets.get(url.pathname);
    if (!asset) return send(res, 404, 'Not found', 'text/plain; charset=utf-8');
    return send(res, 200, fs.readFileSync(path.join(root, asset[0])), asset[1]);
  } catch (error) {
    console.error('vNext request failed:', error.message);
    return json(res, { error: 'internal_error' }, 500);
  }
});

server.listen(port, '127.0.0.1', () => console.log(`ADAS vNext UI/API listening at http://127.0.0.1:${port}`));
function shutdown() { server.close(() => { db.close(); }); }
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
