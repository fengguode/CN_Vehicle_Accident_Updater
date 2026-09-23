import fs from 'node:fs';
import { openDb } from './db.js';
import { clearSvm, saveSvm, trainSvm } from './svm.js';

const file = process.argv[2] || '../china-adas-accident-database/data/votes.json';
const api = (process.env.VOTE_API_URL || '').replace(/\/+$/, '');
let votes;
if (api) {
  if (!process.env.VOTE_EXPORT_TOKEN) throw new Error('VOTE_EXPORT_TOKEN is required when VOTE_API_URL is configured');
  const response = await fetch(`${api}/api/votes/export`, { headers: { authorization: `Bearer ${process.env.VOTE_EXPORT_TOKEN}` } });
  if (!response.ok) throw new Error(`Vote export failed: HTTP ${response.status}`);
  votes = await response.json();
  if (!Array.isArray(votes)) throw new Error('Vote export must be an array');
} else {
  votes = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : [];
}
const db = openDb();
if (api) db.prepare("DELETE FROM review_votes WHERE voter_id LIKE 'github:%' OR voter_id LIKE 'github-issue-%'").run();
const insert = db.prepare('INSERT INTO review_votes(fingerprint,vote,voter_id,created_at) VALUES(?,?,?,?) ON CONFLICT(fingerprint,voter_id) DO UPDATE SET vote=excluded.vote,created_at=excluded.created_at');
let accepted = 0;
for (const vote of Array.isArray(votes) ? votes : []) {
  if (!/^[a-f0-9]{64}$/.test(vote?.fingerprint || '') || !['relevant', 'not_relevant'].includes(vote.vote) || !vote.voter_id) continue;
  insert.run(String(vote.fingerprint), vote.vote, String(vote.voter_id), vote.created_at || new Date().toISOString());
  accepted += 1;
}
const rows = db.prepare(`SELECT fingerprint, SUM(vote='relevant') relevant, SUM(vote='not_relevant') not_relevant FROM review_votes GROUP BY fingerprint`).all();
const counts = new Map(rows.map(row => [row.fingerprint, row]));
const update = db.prepare('UPDATE reports SET labels_json=?, review_notes=?, updated_at=? WHERE fingerprint=?');
for (const report of db.prepare('SELECT fingerprint,labels_json,review_notes FROM reports').all()) {
  const row = counts.get(report.fingerprint);
  const labels = JSON.parse(report.labels_json || '{}');
  const relevant = Number(row?.relevant || 0); const notRelevant = Number(row?.not_relevant || 0);
  labels.community_relevance = relevant === notRelevant ? 'undecided' : (relevant > notRelevant ? 'supported' : 'rejected');
  labels.community_votes = { relevant, not_relevant: notRelevant };
  const notes = /^Community review votes:/.test(report.review_notes || '') ? `Community review votes: ${relevant} relevant, ${notRelevant} not relevant.` : report.review_notes;
  update.run(JSON.stringify(labels), notes, new Date().toISOString(), report.fingerprint);
}
const samples = db.prepare(`SELECT r.title, r.content, CASE WHEN SUM(v.vote='relevant') > SUM(v.vote='not_relevant') THEN 1 ELSE -1 END label FROM reports r JOIN review_votes v ON v.fingerprint=r.fingerprint GROUP BY r.fingerprint HAVING SUM(v.vote='relevant') <> SUM(v.vote='not_relevant')`).all().map(row => ({ text: `${row.title} ${row.content}`, label: row.label }));
const model = trainSvm(samples); if (model) saveSvm(model); else clearSvm();
db.close();
console.log(JSON.stringify({ received: Array.isArray(votes) ? votes.length : 0, accepted, aggregates: rows.length, svm_samples: model?.samples || 0, svm_trained: Boolean(model) }));
