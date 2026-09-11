CREATE TABLE IF NOT EXISTS votes (
  fingerprint TEXT NOT NULL,
  voter_id TEXT NOT NULL,
  vote TEXT NOT NULL CHECK (vote IN ('relevant', 'not_relevant')),
  created_at TEXT NOT NULL,
  PRIMARY KEY (fingerprint, voter_id)
);
CREATE INDEX IF NOT EXISTS votes_fingerprint_idx ON votes(fingerprint);
