CREATE TABLE IF NOT EXISTS results (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  country TEXT,
  offer_type TEXT,
  verdict TEXT NOT NULL,
  score INTEGER NOT NULL,
  headline TEXT NOT NULL,
  summary TEXT NOT NULL,
  payload JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS results_created_at_idx ON results (created_at DESC);
