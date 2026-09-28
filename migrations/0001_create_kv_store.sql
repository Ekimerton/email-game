-- D1 Migration: Create kv_store table for strongly consistent key-value persistence
CREATE TABLE IF NOT EXISTS kv_store (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_kv_store_updated_at ON kv_store(updated_at);
