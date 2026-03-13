-- Add parent_agent_id column to openclaw_sessions
ALTER TABLE openclaw_sessions
  ADD COLUMN IF NOT EXISTS parent_agent_id TEXT REFERENCES agents(id);

CREATE INDEX IF NOT EXISTS idx_openclaw_sessions_parent
  ON openclaw_sessions(parent_agent_id);
