-- Mission Control Phase 4: Dispatch Queue & Agent Heartbeats
-- Supabase message bus for task dispatch and agent liveness

-- ============================================================================
-- DISPATCH QUEUE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS dispatch_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL REFERENCES agents(id),
  workspace_id TEXT NOT NULL REFERENCES workspaces(id),
  action TEXT NOT NULL DEFAULT 'execute' CHECK (action IN ('execute', 'cancel', 'retry')),
  payload JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'claimed', 'running', 'completed', 'failed', 'cancelled')),
  result JSONB,
  error TEXT,
  claimed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for dispatch queries
CREATE INDEX IF NOT EXISTS idx_dispatch_agent_status ON dispatch_queue(agent_id, status);
CREATE INDEX IF NOT EXISTS idx_dispatch_task ON dispatch_queue(task_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_pending ON dispatch_queue(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_dispatch_workspace ON dispatch_queue(workspace_id);

-- ============================================================================
-- AGENT HEARTBEATS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS agent_heartbeats (
  agent_id TEXT PRIMARY KEY REFERENCES agents(id),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  gateway_version TEXT,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_heartbeats_last_seen ON agent_heartbeats(last_seen_at);

-- ============================================================================
-- CLAIM_DISPATCH FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION claim_dispatch(p_id UUID, p_agent_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE affected INT;
BEGIN
  UPDATE dispatch_queue
  SET status = 'claimed', claimed_at = now(), updated_at = now()
  WHERE id = p_id AND agent_id = p_agent_id AND status = 'pending';
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected > 0;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- UPDATED_AT TRIGGER FOR DISPATCH_QUEUE
-- ============================================================================

DROP TRIGGER IF EXISTS update_dispatch_queue_updated_at ON dispatch_queue;
CREATE TRIGGER update_dispatch_queue_updated_at
  BEFORE UPDATE ON dispatch_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- DISPATCH_TO_EVENT TRIGGER FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION dispatch_to_event()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('claimed', 'completed', 'failed') AND
     (OLD.status IS NULL OR OLD.status != NEW.status) THEN
    INSERT INTO events (id, type, agent_id, task_id, message, metadata)
    VALUES (
      gen_random_uuid()::text,
      'dispatch_' || NEW.status,
      NEW.agent_id,
      NEW.task_id,
      CASE NEW.status
        WHEN 'claimed' THEN 'Agent claimed task'
        WHEN 'completed' THEN 'Agent completed task'
        WHEN 'failed' THEN 'Agent failed: ' || COALESCE(NEW.error, 'unknown')
      END,
      jsonb_build_object(
        'dispatch_id', NEW.id::text,
        'action', NEW.action,
        'result', NEW.result,
        'error', NEW.error
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on dispatch_queue AFTER UPDATE
DROP TRIGGER IF EXISTS trg_dispatch_event ON dispatch_queue;
CREATE TRIGGER trg_dispatch_event
  AFTER UPDATE ON dispatch_queue
  FOR EACH ROW
  EXECUTE FUNCTION dispatch_to_event();

-- ============================================================================
-- ROW LEVEL SECURITY (dispatch_queue)
-- ============================================================================

ALTER TABLE dispatch_queue ENABLE ROW LEVEL SECURITY;

-- Anon can insert (dispatch) and read dispatch status
CREATE POLICY "dispatch_insert" ON dispatch_queue
  FOR INSERT WITH CHECK (true);

CREATE POLICY "dispatch_read" ON dispatch_queue
  FOR SELECT USING (true);

-- Only service_role can UPDATE (claim, complete, fail)
-- No anon UPDATE policy — prevents browser from modifying dispatch rows

-- ============================================================================
-- ROW LEVEL SECURITY (agent_heartbeats)
-- ============================================================================

ALTER TABLE agent_heartbeats DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- REALTIME PUBLICATIONS
-- ============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE dispatch_queue;
ALTER PUBLICATION supabase_realtime ADD TABLE agent_heartbeats;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
