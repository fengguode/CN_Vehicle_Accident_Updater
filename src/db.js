import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { dbPath, ensureDirectories } from './config.js';

export function openDb(file = dbPath) {
  ensureDirectories();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;');
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
  `);
  for (const statement of [
    'ALTER TABLE reports ADD COLUMN discovery_url TEXT',
    'ALTER TABLE reports ADD COLUMN english_description TEXT',
    "ALTER TABLE reports ADD COLUMN english_description_source TEXT"
    , 'ALTER TABLE reports ADD COLUMN title_en TEXT'
    , 'ALTER TABLE reports ADD COLUMN content_en TEXT'
    , 'ALTER TABLE reports ADD COLUMN publisher_name TEXT'
    , 'ALTER TABLE source_state ADD COLUMN state_json TEXT'
  ]) { try { db.exec(statement); } catch (error) { if (!/duplicate column name/i.test(error.message)) throw error; } }
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
  const keys = Object.keys(report);
  const sql = `INSERT INTO reports (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')}) ON CONFLICT(fingerprint) DO NOTHING`;
  return db.prepare(sql).run(...keys.map((key) => report[key])).changes === 1;
}
