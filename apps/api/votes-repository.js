import { trainSvm, scoreSvm } from '../../src/svm.js';
import { auditAuth } from './auth.js';

const validFingerprint = (value) => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);

function rebuildInsideTransaction(db) {
  const aggregates = db.prepare(`SELECT fingerprint,
    SUM(vote='relevant') AS relevant, SUM(vote='not_relevant') AS not_relevant
    FROM traffic_votes GROUP BY fingerprint`).all();
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
    modelId = Number(db.prepare('INSERT INTO traffic_svm_models(trained_at,algorithm,samples,weights_json,bias) VALUES(?,?,?,?,?)')
      .run(model.trained_at, model.algorithm, model.samples, JSON.stringify(model.weights), model.bias).lastInsertRowid);
  }
  const update = db.prepare('UPDATE reports SET labels_json=?,traffic_svm_score=?,traffic_svm_model_id=?,updated_at=? WHERE fingerprint=?');
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

function refreshState(db) {
  return db.prepare('SELECT pending_new_ratings,refresh_requested FROM traffic_svm_state WHERE id=1').get();
}

function refreshIfDue(db) {
  const state = refreshState(db);
  if (!state || (!state.refresh_requested && state.pending_new_ratings < 100)) return null;
  return transaction(db, () => {
    // Recheck under the write lock so concurrent rating requests cannot lose a
    // threshold increment or publish a model built from a stale vote snapshot.
    const current = refreshState(db);
    if (!current || (!current.refresh_requested && current.pending_new_ratings < 100)) return null;
    const result = rebuildInsideTransaction(db);
    db.prepare('UPDATE traffic_svm_state SET pending_new_ratings=0,refresh_requested=0,updated_at=? WHERE id=1')
      .run(new Date().toISOString());
    return result;
  });
}

// Internal backend hook. The request is durable and remains set if a model
// build fails, so the next rating or explicit retry can complete the refresh.
export function requestSvmRefresh(db) {
  transaction(db, () => db.prepare('UPDATE traffic_svm_state SET refresh_requested=1,updated_at=? WHERE id=1')
    .run(new Date().toISOString()));
  return refreshIfDue(db);
}

export function retryPendingSvmRefresh(db) { return refreshIfDue(db); }

export function myVotes(db, userId) {
  return db.prepare('SELECT fingerprint,vote,created_at FROM traffic_votes WHERE user_id=? ORDER BY created_at DESC').all(userId);
}

export function saveVote(db, userId, fingerprint, vote) {
  if (!validFingerprint(fingerprint) || !['relevant', 'not_relevant'].includes(vote)) throw new Error('Invalid fingerprint or vote.');
  if (!db.prepare('SELECT 1 FROM reports WHERE fingerprint=?').get(fingerprint)) throw new Error('Report not found.');
  const newlyAccepted = transaction(db, () => {
    const inserted = db.prepare(`INSERT INTO traffic_votes(fingerprint,user_id,vote,created_at) VALUES(?,?,?,?)
      ON CONFLICT(fingerprint,user_id) DO NOTHING`)
      .run(fingerprint, userId, vote, new Date().toISOString()).changes === 1;
    let countedNewRating = false;
    if (!inserted) {
      db.prepare('UPDATE traffic_votes SET vote=?,created_at=? WHERE fingerprint=? AND user_id=?')
        .run(vote, new Date().toISOString(), fingerprint, userId);
    } else {
      countedNewRating = db.prepare(`INSERT INTO traffic_rating_receipts(fingerprint,user_id,first_received_at)
        VALUES(?,?,?) ON CONFLICT(fingerprint,user_id) DO NOTHING`)
        .run(fingerprint, userId, new Date().toISOString()).changes === 1;
      if (countedNewRating) {
        db.prepare('UPDATE traffic_svm_state SET pending_new_ratings=pending_new_ratings+1,updated_at=? WHERE id=1')
          .run(new Date().toISOString());
      }
    }
    auditAuth(db, userId, 'save_vote', fingerprint);
    return { inserted, countedNewRating };
  });
  let refresh = null;
  let refresh_error = null;
  try { refresh = refreshIfDue(db); }
  catch (error) { refresh_error = error.message; }
  return { vote, newly_accepted: newlyAccepted.inserted, counted_new_rating: newlyAccepted.countedNewRating,
    pending_new_ratings: refreshState(db)?.pending_new_ratings ?? 0,
    ...(refresh || {}), ...(refresh_error ? { refresh_error } : {}) };
}

export function revokeVote(db, userId, fingerprint) {
  if (!validFingerprint(fingerprint)) throw new Error('Invalid fingerprint.');
  return transaction(db, () => {
    const deleted = db.prepare('DELETE FROM traffic_votes WHERE fingerprint=? AND user_id=?').run(fingerprint, userId).changes > 0;
    if (deleted) {
      auditAuth(db, userId, 'revoke_vote', fingerprint);
      return { revoked: true };
    }
    return { revoked: false };
  });
}

export function deleteAnonymizedUserVotes(db, userId, actorId) {
  return transaction(db, () => {
    const user = db.prepare('SELECT anonymized FROM users WHERE id=?').get(userId);
    if (!user) return null;
    if (!user.anonymized) throw new Error('Votes can only be deleted for an anonymized account.');
    const count = db.prepare('SELECT COUNT(*) AS n FROM traffic_votes WHERE user_id=?').get(userId).n;
    db.prepare('DELETE FROM traffic_votes WHERE user_id=?').run(userId);
    db.prepare('DELETE FROM traffic_rating_receipts WHERE user_id=?').run(userId);
    auditAuth(db, actorId, 'delete_anonymized_user_votes', JSON.stringify({ user_id: userId, count }));
    if (count) {
      rebuildInsideTransaction(db);
      db.prepare('UPDATE traffic_svm_state SET pending_new_ratings=0,refresh_requested=0,updated_at=? WHERE id=1')
        .run(new Date().toISOString());
    }
    return { deleted: count };
  });
}
