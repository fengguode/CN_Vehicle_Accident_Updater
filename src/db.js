import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { dbPath, ensureDirectories } from './config.js';

export function openDb(file = dbPath) {
  ensureDirectories();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;');
  migrate(db);
  recoverStaleRuns(db);
  return db;
}

export function recoverStaleRuns(db, maxAgeMs = 5 * 60 * 1000) {
  const cutoff = new Date(Date.now() - maxAgeMs).toISOString();
  return db.prepare("UPDATE runs SET status='aborted', finished_at=?, errors=? WHERE status='running' AND started_at < ?")
    .run(new Date().toISOString(), JSON.stringify([{ error: 'stale run recovered at database startup' }]), cutoff).changes;
}

export function migrate(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS runs (
      id INTEGER PRIMARY KEY,
      started_at TEXT NOT NULL,
      finished_at TEXT,
      status TEXT NOT NULL DEFAULT 'running',
      fetched INTEGER NOT NULL DEFAULT 0,
      inserted INTEGER NOT NULL DEFAULT 0,
      duplicates INTEGER NOT NULL DEFAULT 0,
      rejected INTEGER NOT NULL DEFAULT 0,
      errors TEXT
    );
    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY,
      fingerprint TEXT NOT NULL UNIQUE,
      canonical_url TEXT,
      source_url TEXT,
      source_name TEXT NOT NULL,
      platform TEXT,
      external_id TEXT,
      title TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      author TEXT,
      published_at TEXT,
      collected_at TEXT NOT NULL,
      event_date TEXT,
      brand TEXT NOT NULL DEFAULT 'Unknown',
      model TEXT,
      cause TEXT NOT NULL DEFAULT 'unclassified',
      cause_confidence REAL NOT NULL DEFAULT 0,
      adas_mode TEXT NOT NULL DEFAULT 'unknown',
      road_type TEXT NOT NULL DEFAULT 'unknown',
      severity TEXT NOT NULL DEFAULT 'unknown',
      province TEXT,
      city TEXT,
      injuries INTEGER,
      fatalities INTEGER,
      verification_status TEXT NOT NULL DEFAULT 'unverified',
      relevance_score REAL NOT NULL DEFAULT 0,
      labels_json TEXT NOT NULL DEFAULT '{}',
      raw_json TEXT NOT NULL,
      duplicate_of INTEGER REFERENCES reports(id),
      review_notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_reports_published ON reports(published_at DESC);
    CREATE INDEX IF NOT EXISTS idx_reports_brand ON reports(brand);
    CREATE INDEX IF NOT EXISTS idx_reports_province ON reports(province);
    CREATE INDEX IF NOT EXISTS idx_reports_review ON reports(verification_status);
    CREATE TABLE IF NOT EXISTS source_state (
      source_id TEXT PRIMARY KEY,
      last_success_at TEXT,
      last_error TEXT,
      last_item_at TEXT,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS review_votes (
      id INTEGER PRIMARY KEY,
      fingerprint TEXT NOT NULL,
      vote TEXT NOT NULL CHECK (vote IN ('relevant','not_relevant')),
      voter_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE (fingerprint, voter_id)
    );
    CREATE TABLE IF NOT EXISTS svm_models (
      id INTEGER PRIMARY KEY, trained_at TEXT NOT NULL,
      algorithm TEXT NOT NULL, samples INTEGER NOT NULL,
      weights_json TEXT NOT NULL, bias REAL NOT NULL
    );
    CREATE TABLE IF NOT EXISTS traffic_votes (
      fingerprint TEXT NOT NULL REFERENCES reports(fingerprint),
      user_id INTEGER NOT NULL REFERENCES users(id),
      vote TEXT NOT NULL CHECK (vote IN ('relevant','not_relevant')),
      created_at TEXT NOT NULL,
      PRIMARY KEY (fingerprint, user_id)
    );
    CREATE TABLE IF NOT EXISTS traffic_rating_receipts (
      fingerprint TEXT NOT NULL REFERENCES reports(fingerprint),
      user_id INTEGER NOT NULL REFERENCES users(id),
      first_received_at TEXT NOT NULL,
      PRIMARY KEY (fingerprint, user_id)
    );
    CREATE TABLE IF NOT EXISTS traffic_svm_models (
      id INTEGER PRIMARY KEY, trained_at TEXT NOT NULL,
      algorithm TEXT NOT NULL, samples INTEGER NOT NULL,
      weights_json TEXT NOT NULL, bias REAL NOT NULL
    );
    CREATE TABLE IF NOT EXISTS traffic_svm_state (
      id INTEGER PRIMARY KEY CHECK (id=1),
      pending_new_ratings INTEGER NOT NULL DEFAULT 0 CHECK (pending_new_ratings >= 0),
      refresh_requested INTEGER NOT NULL DEFAULT 0 CHECK (refresh_requested IN (0,1)),
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS feedback_requests (
      id TEXT PRIMARY KEY,
      submitter_id INTEGER NOT NULL REFERENCES users(id),
      type TEXT NOT NULL CHECK(type IN ('Issue','Feature')),
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      context TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL CHECK(status IN ('Submitted','Under review','Needs information','Added to backlog','In progress','Complete','Blocked','Not planned','Duplicate')) DEFAULT 'Submitted',
      priority TEXT CHECK(priority IS NULL OR priority IN ('low','normal','high','urgent')),
      public_update TEXT NOT NULL DEFAULT '',
      internal_notes TEXT NOT NULL DEFAULT '',
      backlog_ids TEXT NOT NULL DEFAULT '[]',
      duplicate_of TEXT REFERENCES feedback_requests(id),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_feedback_submitter_updated ON feedback_requests(submitter_id, updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_feedback_status_updated ON feedback_requests(status, updated_at DESC);
    CREATE TABLE IF NOT EXISTS feedback_events (
      id INTEGER PRIMARY KEY,
      request_id TEXT NOT NULL REFERENCES feedback_requests(id),
      actor_id INTEGER NOT NULL REFERENCES users(id),
      action TEXT NOT NULL,
      status TEXT NOT NULL,
      public_update TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_feedback_events_request ON feedback_events(request_id, id);
    CREATE TRIGGER IF NOT EXISTS feedback_events_no_update BEFORE UPDATE ON feedback_events BEGIN SELECT RAISE(ABORT, 'feedback events are append-only'); END;
    CREATE TRIGGER IF NOT EXISTS feedback_events_no_delete BEFORE DELETE ON feedback_events BEGIN SELECT RAISE(ABORT, 'feedback events are append-only'); END;
  `);
  for (const statement of [
    'ALTER TABLE reports ADD COLUMN discovery_url TEXT',
    'ALTER TABLE reports ADD COLUMN english_description TEXT',
    "ALTER TABLE reports ADD COLUMN english_description_source TEXT"
    , 'ALTER TABLE reports ADD COLUMN title_en TEXT'
    , 'ALTER TABLE reports ADD COLUMN content_en TEXT'
    , 'ALTER TABLE reports ADD COLUMN title_zh_short TEXT'
    , 'ALTER TABLE reports ADD COLUMN title_en_short TEXT'
    , 'ALTER TABLE reports ADD COLUMN summary_zh TEXT'
    , 'ALTER TABLE reports ADD COLUMN summary_en TEXT'
    , 'ALTER TABLE reports ADD COLUMN svm_score REAL'
    , 'ALTER TABLE reports ADD COLUMN svm_model_id INTEGER'
    , 'ALTER TABLE reports ADD COLUMN publisher_name TEXT'
    , 'ALTER TABLE reports ADD COLUMN traffic_svm_score REAL'
    , 'ALTER TABLE reports ADD COLUMN traffic_svm_model_id INTEGER'
    , "ALTER TABLE reports ADD COLUMN video_status TEXT NOT NULL DEFAULT 'unknown' CHECK(video_status IN ('present','absent','unknown'))"
    , 'ALTER TABLE reports ADD COLUMN video_thumbnail_url TEXT'
    , "ALTER TABLE reports ADD COLUMN media_review_status TEXT NOT NULL DEFAULT 'pending' CHECK(media_review_status IN ('pending','approved','rejected'))"
    , 'ALTER TABLE reports ADD COLUMN media_reviewed_by TEXT'
    , 'ALTER TABLE reports ADD COLUMN media_reviewed_at TEXT'
    , 'ALTER TABLE source_state ADD COLUMN state_json TEXT'
  ]) { try { db.exec(statement); } catch (error) { if (!/duplicate column name/i.test(error.message)) throw error; } }
  db.prepare('INSERT OR IGNORE INTO schema_migrations(version,applied_at) VALUES(1,?)').run(new Date().toISOString());
  db.prepare('INSERT OR IGNORE INTO schema_migrations(version,applied_at) VALUES(3,?)').run(new Date().toISOString());
  db.prepare('INSERT OR IGNORE INTO schema_migrations(version,applied_at) VALUES(4,?)').run(new Date().toISOString());
  db.prepare('INSERT OR IGNORE INTO schema_migrations(version,applied_at) VALUES(5,?)').run(new Date().toISOString());
  db.prepare('INSERT OR IGNORE INTO traffic_svm_state(id,updated_at) VALUES(1,?)').run(new Date().toISOString());
  db.prepare('INSERT OR IGNORE INTO schema_migrations(version,applied_at) VALUES(6,?)').run(new Date().toISOString());
  db.prepare('INSERT OR IGNORE INTO schema_migrations(version,applied_at) VALUES(7,?)').run(new Date().toISOString());
  db.prepare('INSERT OR IGNORE INTO schema_migrations(version,applied_at) VALUES(8,?)').run(new Date().toISOString());
  db.prepare('INSERT OR IGNORE INTO schema_migrations(version,applied_at) VALUES(10,?)').run(new Date().toISOString());
  db.exec(`
    CREATE TABLE IF NOT EXISTS media_review_events (
      id INTEGER PRIMARY KEY,
      report_id INTEGER NOT NULL REFERENCES reports(id),
      actor_id INTEGER NOT NULL REFERENCES users(id),
      action TEXT NOT NULL CHECK(action IN ('approve','reject','remove')),
      old_state TEXT NOT NULL,
      new_state TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_media_review_events_report ON media_review_events(report_id,id);
    CREATE TRIGGER IF NOT EXISTS media_review_events_no_update BEFORE UPDATE ON media_review_events BEGIN SELECT RAISE(ABORT, 'media review events are append-only'); END;
    CREATE TRIGGER IF NOT EXISTS media_review_events_no_delete BEFORE DELETE ON media_review_events BEGIN SELECT RAISE(ABORT, 'media review events are append-only'); END;
  `);
  db.prepare('INSERT OR IGNORE INTO schema_migrations(version,applied_at) VALUES(11,?)').run(new Date().toISOString());
  db.exec(`
    CREATE TABLE IF NOT EXISTS feedback_submission_keys (
      submitter_id INTEGER NOT NULL REFERENCES users(id),
      idempotency_key TEXT NOT NULL,
      request_id TEXT NOT NULL UNIQUE REFERENCES feedback_requests(id),
      created_at TEXT NOT NULL,
      PRIMARY KEY (submitter_id, idempotency_key)
    );
  `);
  db.prepare('INSERT OR IGNORE INTO schema_migrations(version,applied_at) VALUES(12,?)').run(new Date().toISOString());
  try { db.exec('ALTER TABLE feedback_requests ADD COLUMN triage_version INTEGER NOT NULL DEFAULT 1 CHECK(triage_version > 0)'); }
  catch (error) { if (!/duplicate column name/i.test(error.message)) throw error; }
  db.prepare('INSERT OR IGNORE INTO schema_migrations(version,applied_at) VALUES(13,?)').run(new Date().toISOString());
}

export function beginRun(db) {
  const now = new Date().toISOString();
  return Number(db.prepare('INSERT INTO runs(started_at) VALUES (?)').run(now).lastInsertRowid);
}

export function finishRun(db, id, stats, errors = []) {
  db.prepare(`UPDATE runs SET finished_at=?, status=?, fetched=?, inserted=?, duplicates=?, rejected=?, errors=? WHERE id=?`)
    .run(new Date().toISOString(), errors.length ? 'partial' : 'success', stats.fetched, stats.inserted, stats.duplicates, stats.rejected, errors.length ? JSON.stringify(errors) : null, id);
}

export function insertReport(db, report) {
  if (report.canonical_url && db.prepare('SELECT 1 FROM reports WHERE canonical_url=? LIMIT 1').get(report.canonical_url)) return false;
  const keys = Object.keys(report);
  const sql = `INSERT INTO reports (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')}) ON CONFLICT(fingerprint) DO NOTHING`;
  return db.prepare(sql).run(...keys.map((key) => report[key])).changes === 1;
}
