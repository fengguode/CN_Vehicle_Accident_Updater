import fs from 'node:fs';
import { openDb } from './db.js';

const file = process.argv[2] || '../china-adas-accident-database/data/votes.json';
let votes = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : [];
if (process.env.GITHUB_TOKEN) {
  const response = await fetch('https://api.github.com/repos/fengguode/CN_Vehicle_Accident_Database/issues?state=all&per_page=100', { headers: { authorization: `Bearer ${process.env.GITHUB_TOKEN}`, accept: 'application/vnd.github+json', 'user-agent': 'CN-ADAS-Updater' } });
  if (response.ok) {
    const issues = await response.json();
    const issueVotes = issues.map(issue => { const body = String(issue.body || ''); const fingerprint = body.match(/fingerprint:\s*([a-f0-9]{64})/i)?.[1]; const vote = body.match(/vote:\s*(relevant|not_relevant)/i)?.[1]; return fingerprint && vote ? { fingerprint, vote, voter_id: `github-issue-${issue.number}`, created_at: issue.created_at } : null; }).filter(Boolean);
    votes = [...votes, ...issueVotes];
  }
}
const db = openDb();
const insert = db.prepare('INSERT INTO review_votes(fingerprint,vote,voter_id,created_at) VALUES(?,?,?,?) ON CONFLICT(fingerprint,voter_id) DO UPDATE SET vote=excluded.vote,created_at=excluded.created_at');
let accepted = 0;
for (const vote of Array.isArray(votes) ? votes : []) {
  if (!vote?.fingerprint || !['relevant', 'not_relevant'].includes(vote.vote) || !vote.voter_id) continue;
  insert.run(String(vote.fingerprint), vote.vote, String(vote.voter_id), vote.created_at || new Date().toISOString());
  accepted += 1;
}
const rows = db.prepare(`SELECT fingerprint, SUM(vote='relevant') relevant, SUM(vote='not_relevant') not_relevant FROM review_votes GROUP BY fingerprint`).all();
const update = db.prepare('UPDATE reports SET labels_json=?, review_notes=?, updated_at=? WHERE fingerprint=?');
for (const row of rows) {
  const report = db.prepare('SELECT labels_json FROM reports WHERE fingerprint=?').get(row.fingerprint);
  if (!report) continue;
  const labels = JSON.parse(report.labels_json || '{}');
  const relevant = Number(row.relevant || 0); const notRelevant = Number(row.not_relevant || 0);
  labels.community_relevance = relevant === notRelevant ? 'undecided' : (relevant > notRelevant ? 'supported' : 'rejected');
  labels.community_votes = { relevant, not_relevant: notRelevant };
  update.run(JSON.stringify(labels), `Community review votes: ${relevant} relevant, ${notRelevant} not relevant.`, new Date().toISOString(), row.fingerprint);
}
db.close();
console.log(JSON.stringify({ received: Array.isArray(votes) ? votes.length : 0, accepted, aggregates: rows.length }));
