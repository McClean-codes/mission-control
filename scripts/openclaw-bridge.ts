/**
 * OpenClaw Bridge
 * 
 * Polls the OpenClaw gateway for active sessions and syncs them to Supabase.
 * Detects sub-agent sessions (key format: agent:<parent>:acp:<uuid>) and links them to parent agents.
 */

import { createClient } from '@supabase/supabase-js';

// ============================================================================
// Config
// ============================================================================

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const OPENCLAW_GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL || 'http://localhost:18789';
const POLL_INTERVAL = 5000; // 5 seconds
const AGENT_IDS = process.env.AGENT_IDS ? process.env.AGENT_IDS.split(',').map(a => a.trim()) : ['sherlock', 'edison', 'nikola', 'newton', 'scout'];

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('[bridge] ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(1);
}

// ============================================================================
// Supabase Client
// ============================================================================

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ============================================================================
// Types
// ============================================================================

interface OpenClawSession {
  key: string;
  kind?: string;
  type?: string;
  status?: string;
  created_at?: string;
  [key: string]: any;
}

interface BridgeSession {
  session_type: 'persistent' | 'subagent';
  parent_agent_id: string | null;
  agent_id: string;
  status: 'active' | 'idle';
}

// ============================================================================
// State
// ============================================================================

const seenSessions = new Set<string>();
const agentStatuses = new Map<string, 'working' | 'standby'>();

// ============================================================================
// Core Logic
// ============================================================================

/**
 * Parse a session key to determine if it's a sub-agent session.
 * Sub-agent key format: agent:<parent_name>:acp:<uuid>
 * Returns { isSubagent: boolean, parentName?: string }
 */
function parseSessionKey(key: string): { isSubagent: boolean; parentName?: string } {
  if (key.includes(':acp:')) {
    const parts = key.split(':');
    if (parts[0] === 'agent' && parts.length >= 3) {
      return { isSubagent: true, parentName: parts[1] };
    }
  }
  return { isSubagent: false };
}

/**
 * Fetch active sessions from OpenClaw gateway
 */
async function fetchOpenClawSessions(): Promise<OpenClawSession[]> {
  try {
    const response = await fetch(`${OPENCLAW_GATEWAY_URL}/sessions`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      console.error(`[bridge] ERROR fetching sessions: ${response.status}`);
      return [];
    }

    const data = await response.json();
    // Handle both array and object responses
    if (Array.isArray(data)) {
      return data;
    }
    if (data && typeof data === 'object' && data.sessions && Array.isArray(data.sessions)) {
      return data.sessions;
    }
    console.warn('[bridge] WARNING: Unexpected sessions response shape:', typeof data);
    return [];
  } catch (error) {
    console.error('[bridge] ERROR fetching OpenClaw sessions:', error);
    return [];
  }
}

/**
 * Get all agents from Supabase (for lookup by name -> id mapping)
 */
async function getAgents(): Promise<Record<string, string>> {
  try {
    const { data, error } = await supabase
      .from('agents')
      .select('id, name')
      .in('name', AGENT_IDS);

    if (error) {
      console.error('[bridge] ERROR fetching agents:', error);
      return {};
    }

    const map: Record<string, string> = {};
    for (const agent of data || []) {
      map[agent.name] = agent.id;
    }
    return map;
  } catch (error) {
    console.error('[bridge] ERROR in getAgents:', error);
    return {};
  }
}

/**
 * Upsert a session to openclaw_sessions table
 */
async function upsertSession(
  sessionKey: string,
  agentId: string,
  parentAgentId: string | null,
  sessionType: 'persistent' | 'subagent'
): Promise<void> {
  try {
    const { error } = await supabase
      .from('openclaw_sessions')
      .upsert(
        {
          openclaw_session_id: sessionKey,
          agent_id: agentId,
          parent_agent_id: parentAgentId,
          session_type: sessionType,
          status: 'active',
          channel: null,
          task_id: null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'openclaw_session_id' }
      );

    if (error) {
      console.error(`[bridge] ERROR upserting session ${sessionKey}:`, error);
    }
  } catch (error) {
    console.error(`[bridge] ERROR in upsertSession:`, error);
  }
}

/**
 * Mark sessions as completed if they're no longer in the active list
 */
async function markCompletedSessions(activeSessions: Set<string>): Promise<void> {
  try {
    const { error } = await supabase
      .from('openclaw_sessions')
      .update({
        status: 'completed',
        ended_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('status', 'active')
      .not('openclaw_session_id', 'in', `(${Array.from(activeSessions).map(s => `'${s}'`).join(',')})`);

    if (error && error.code !== 'PGRST100') {
      // PGRST100 is likely "no rows" which is fine
      console.error('[bridge] ERROR marking completed sessions:', error);
    }
  } catch (error) {
    console.error('[bridge] ERROR in markCompletedSessions:', error);
  }
}

/**
 * Update agent status in agents table
 */
async function updateAgentStatus(agentId: string, status: 'working' | 'standby'): Promise<void> {
  try {
    const { error } = await supabase
      .from('agents')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', agentId);

    if (error) {
      console.error(`[bridge] ERROR updating agent status for ${agentId}:`, error);
    }
  } catch (error) {
    console.error(`[bridge] ERROR in updateAgentStatus:`, error);
  }
}

/**
 * Main polling loop
 */
async function poll(): Promise<void> {
  try {
    const sessions = await fetchOpenClawSessions();
    const agents = await getAgents();
    const currentActiveSessions = new Set<string>();
    const activeAgents = new Set<string>();

    for (const session of sessions) {
      const sessionKey = session.key || '';
      if (!sessionKey) continue;

      currentActiveSessions.add(sessionKey);

      const { isSubagent, parentName } = parseSessionKey(sessionKey);

      if (isSubagent && parentName) {
        // Sub-agent session
        const parentAgentId = agents[parentName];
        if (parentAgentId) {
          const agentId = agents[sessionKey.split(':')[1]]; // Try to get agent ID from key, fallback to parent
          const subagentName = sessionKey.split(':')[1];
          const actualAgentId = agents[subagentName] || parentAgentId;

          await upsertSession(sessionKey, actualAgentId, parentAgentId, 'subagent');
          activeAgents.add(parentAgentId);

          const oldStatus = agentStatuses.get(parentAgentId);
          if (oldStatus !== 'working') {
            console.log(`[bridge] ${parentName}: ${oldStatus || 'standby'} → working`);
            agentStatuses.set(parentAgentId, 'working');
            await updateAgentStatus(parentAgentId, 'working');
          }
        }
      } else {
        // Persistent agent session
        const agentName = sessionKey.split(':')[0] || sessionKey;
        const agentId = agents[agentName];

        if (agentId) {
          await upsertSession(sessionKey, agentId, null, 'persistent');
          activeAgents.add(agentId);

          const oldStatus = agentStatuses.get(agentId);
          if (oldStatus !== 'working') {
            console.log(`[bridge] ${agentName}: ${oldStatus || 'standby'} → working`);
            agentStatuses.set(agentId, 'working');
            await updateAgentStatus(agentId, 'working');
          }
        }
      }

      if (!seenSessions.has(sessionKey)) {
        seenSessions.add(sessionKey);
        console.log(`[bridge] Session opened: ${sessionKey}`);
      }
    }

    // Mark sessions as completed if no longer active
    if (seenSessions.size > 0) {
      await markCompletedSessions(currentActiveSessions);
    }

    // Update agents not in active sessions to standby
    const agentStatusEntries = Array.from(agentStatuses.entries());
    for (const [agentId, status] of agentStatusEntries) {
      if (status === 'working' && !activeAgents.has(agentId)) {
        console.log(`[bridge] Agent ${agentId}: working → standby`);
        agentStatuses.set(agentId, 'standby');
        await updateAgentStatus(agentId, 'standby');
      }
    }

    // Cleanup seen sessions that are no longer active
    for (const sessionKey of Array.from(seenSessions)) {
      if (!currentActiveSessions.has(sessionKey)) {
        seenSessions.delete(sessionKey);
        console.log(`[bridge] Session closed: ${sessionKey}`);
      }
    }
  } catch (error) {
    console.error('[bridge] ERROR in poll:', error);
  }
}

// ============================================================================
// Startup & Shutdown
// ============================================================================

async function start(): Promise<void> {
  console.log(`[bridge] Starting OpenClaw bridge`);
  console.log(`[bridge] Gateway URL: ${OPENCLAW_GATEWAY_URL}`);
  console.log(`[bridge] Agents: ${AGENT_IDS.join(', ')}`);
  console.log(`[bridge] Poll interval: ${POLL_INTERVAL}ms`);

  // Initial poll
  await poll();

  // Set up interval
  const intervalId = setInterval(poll, POLL_INTERVAL);

  // Handle graceful shutdown
  const handleShutdown = () => {
    console.log('[bridge] Shutting down...');
    clearInterval(intervalId);
    process.exit(0);
  };

  process.on('SIGTERM', handleShutdown);
  process.on('SIGINT', handleShutdown);
}

start().catch((error) => {
  console.error('[bridge] FATAL ERROR:', error);
  process.exit(1);
});
