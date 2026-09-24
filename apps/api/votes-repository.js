import { trainSvm, scoreSvm } from '../../src/svm.js';
import { auditAuth } from './auth.js';

const voterId = (userId) => `local:${userId}`;
const validFingerprint = (value) => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);

function rebuildInsideTransaction(db) {
  const aggregates = db.prepare(`SELECT fingerprint,
    SUM(vote='relevant') AS relevant, SUM(vote='not_relevant') AS not_relevant
    FROM review_votes GROUP BY fingerprint`).all();
  const byFingerprint = new Map(aggregates.map((row) => [row.fingerprint, row]));
  const rows = db.prepare('SELECT fingerprint,title,content,labels_json FROM reports').all();
  const samples = rows.flatMap((row) => {
    const votes = byFingerprint.get(row.fingerprint);
    if (!votes || votes.relevant === votes.not_relevant) return [];
    return [{ text: `${row.title} ${row.content}`, label: votes.relevant > votes.not_relevant ? 1 : -1 }];
  });
  const model = trainSvm(samples);
  let modelId = null;
  if (model) {
    modelId = Number(db.prepare('INSERT INTO svm_models(trained_at,algorithm,samples,weights_json,bias) VALUES(?,?,?,?,?)')
      .run(model.trained_at, model.algorithm, model.samples, JSON.stringify(model.weights), model.bias).lastInsertRowid);
  }
  const update = db.prepare('UPDATE reports SET labels_json=?,svm_score=?,svm_model_id=?,updated_at=? WHERE fingerprint=?');
  const now = new Date().toISOString();
  for (const row of rows) {
    const counts = byFingerprint.get(row.fingerprint);
    const relevant = Number(counts?.relevant || 0);
    const notRelevant = Number(counts?.not_relevant || 0);
    let labels;
    try { labels = JSON.parse(row.labels_json || '{}'); } catch { labels = {}; }
    labels.community_relevance = relevant === notRelevant ? 'undecided' : (relevant > notRelevant ? 'supported' : 'rejected');
    labels.community_votes = { relevant, not_relevant: notRelevant };
    update.run(JSON.stringify(labels), model ? scoreSvm(model, `${row.title} ${row.content}`) : null, modelId, now, row.fingerprint);
  }
  return { model_id: modelId, samples: model?.samples || 0, aggregates: aggregates.length };
}

function transaction(db, action) {
  db.exec('BEGIN IMMEDIATE');
  try { const result = action(); db.exec('COMMIT'); return result; }
  catch (error) { db.exec('ROLLBACK'); throw error; }
}

export function refreshVotesAndSvm(db) { return transaction(db, () => rebuildInsideTransaction(db)); }

export function myVotes(db, userId) {
  return db.prepare('SELECT fingerprint,vote,created_at FROM review_votes WHERE voter_id=? ORDER BY created_at DESC').all(voterId(userId));
}

export function saveVote(db, userId, fingerprint, vote) {
  if (!validFingerprint(fingerprint) || !['relevant', 'not_relevant'].includes(vote)) throw new Error('Invalid fingerprint or vote.');
  if (!db.prepare('SELECT 1 FROM reports WHERE fingerprint=?').get(fingerprint)) throw new Error('Report not found.');
  return transaction(db, () => {
    db.prepare(`INSERT INTO review_votes(fingerprint,voter_id,vote,created_at) VALUES(?,?,?,?)
      ON CONFLICT(fingerprint,voter_id) DO UPDATE SET vote=excluded.vote,created_at=excluded.created_at`)
      .run(fingerprint, voterId(userId), vote, new Date().toISOString());
    auditAuth(db, userId, 'save_vote', fingerprint);
    return { vote, ...rebuildInsideTransaction(db) };
  });
}

export function revokeVote(db, userId, fingerprint) {
  if (!validFingerprint(fingerprint)) throw new Error('Invalid fingerprint.');
  return transaction(db, () => {
    const deleted = db.prepare('DELETE FROM review_votes WHERE fingerprint=? AND voter_id=?').run(fingerprint, voterId(userId)).changes > 0;
    if (deleted) {
      auditAuth(db, userId, 'revoke_vote', fingerprint);
      return { revoked: true, ...rebuildInsideTransaction(db) };
    }
    return { revoked: false };
  });
}
