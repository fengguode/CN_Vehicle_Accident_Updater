CREATE TABLE IF NOT EXISTS votes (
  fingerprint TEXT NOT NULL,
  voter_id TEXT NOT NULL,
  vote TEXT NOT NULL CHECK (vote IN ('relevant', 'not_relevant')),
  created_at TEXT NOT NULL,
  PRIMARY KEY (fingerprint, voter_id)
);
CREATE INDEX IF NOT EXISTS votes_fingerprint_idx ON votes(fingerprint);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  github_id TEXT NOT NULL,
  github_login TEXT NOT NULL,
  expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_expires_idx ON sessions(expires_at);
