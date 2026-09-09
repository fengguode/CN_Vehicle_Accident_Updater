import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDb } from './db.js';
import { runCollection } from './pipeline.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(root, 'public');
const db = openDb();
const port = Number(process.env.PORT || 8787);

function send(res, status, body, type = 'application/json; charset=utf-8') {
  res.writeHead(status, { 'content-type': type, 'cache-control': 'no-store' }); res.end(body);
}
function json(res, value, status = 200) { send(res, status, JSON.stringify(value), 'application/json; charset=utf-8'); }

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname === '/api/reports' && req.method === 'GET') {
      const clauses = ['1=1']; const values = [];
      for (const field of ['brand', 'cause', 'province', 'road_type', 'severity', 'verification_status']) {
        if (url.searchParams.get(field)) { clauses.push(`${field}=?`); values.push(url.searchParams.get(field)); }
      }
      if (url.searchParams.get('q')) { clauses.push('(title LIKE ? OR content LIKE ?)'); values.push(`%${url.searchParams.get('q')}%`, `%${url.searchParams.get('q')}%`); }
      const rows = db.prepare(`SELECT * FROM reports WHERE ${clauses.join(' AND ')} ORDER BY COALESCE(published_at,collected_at) DESC LIMIT 500`).all(...values);
      return json(res, rows.map((row) => ({ ...row, labels: JSON.parse(row.labels_json), raw_json: undefined, labels_json: undefined })));
    }
    if (url.pathname === '/api/summary' && req.method === 'GET') {
      const total = db.prepare('SELECT COUNT(*) count FROM reports').get().count;
      const grouped = (field) => db.prepare(`SELECT COALESCE(${field},'Unknown') label, COUNT(*) value FROM reports GROUP BY ${field} ORDER BY value DESC LIMIT 20`).all();
      return json(res, { total, unverified: db.prepare("SELECT COUNT(*) count FROM reports WHERE verification_status='unverified'").get().count, brands: grouped('brand'), causes: grouped('cause'), provinces: grouped('province'), roadTypes: grouped('road_type'), severity: grouped('severity'), runs: db.prepare('SELECT * FROM runs ORDER BY id DESC LIMIT 14').all() });
    }
    if (url.pathname === '/api/collect' && req.method === 'POST') return json(res, await runCollection({ db }));
    if (url.pathname.startsWith('/api/reports/') && req.method === 'PATCH') {
      const id = Number(url.pathname.split('/').pop()); let body = '';
      for await (const chunk of req) body += chunk;
      const value = JSON.parse(body); const allowed = ['verification_status', 'review_notes', 'brand', 'cause', 'road_type', 'severity', 'province', 'city', 'event_date'];
      const entries = Object.entries(value).filter(([key]) => allowed.includes(key));
      if (!entries.length) return json(res, { error: 'No editable fields' }, 400);
      db.prepare(`UPDATE reports SET ${entries.map(([key]) => `${key}=?`).join(',')},updated_at=? WHERE id=?`).run(...entries.map(([, v]) => v), new Date().toISOString(), id);
      return json(res, { ok: true });
    }
    const relative = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
    const file = path.resolve(publicDir, relative);
    if (!file.startsWith(publicDir) || !fs.existsSync(file)) return send(res, 404, 'Not found', 'text/plain');
    const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };
    return send(res, 200, fs.readFileSync(file), types[path.extname(file)] || 'application/octet-stream');
  } catch (error) { return json(res, { error: error.message }, 500); }
});

server.listen(port, '127.0.0.1', () => console.log(`ADAS monitor: http://127.0.0.1:${port}`));
process.on('SIGINT', () => { db.close(); server.close(); });
