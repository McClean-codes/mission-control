CREATE TABLE IF NOT EXISTS scribe_channel_watch (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id BIGINT NOT NULL UNIQUE,
  guild_id BIGINT,
  status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('inactive', 'active', 'paused')),

  first_run_at TIMESTAMPTZ,
  first_message_id_in_channel BIGINT,
  initial_scan_complete_at TIMESTAMPTZ,
  total_messages_on_first_load INT,

  last_run_at TIMESTAMPTZ,
  last_message_id_captured BIGINT,
  next_before_id BIGINT,
  messages_captured_since_last_run INT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_scribe_status ON scribe_channel_watch(status);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_scribe_channel_watch_updated_at ON scribe_channel_watch;
CREATE TRIGGER update_scribe_channel_watch_updated_at
  BEFORE UPDATE ON scribe_channel_watch
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
