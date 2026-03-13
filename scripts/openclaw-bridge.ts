/**
 * OpenClaw Bridge
 * 
 * Polls the OpenClaw gateway for active sessions and syncs them to Supabase.
 * Detects sub-agent sessions (key format: agent:main:subagent:<uuid>) and links them to parent agents.
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
 * Real sub-agent key format: agent:main:subagent:<uuid>
 * Returns { isSubagent: boolean }
 */
function parseSessionKey(key: string): { isSubagent: boolean } {
  // Real format: agent:main:subagent:<uuid>
  if (key.includes(':subagent:')) {
    return { isSubagent: true };
  }
  return { isSubagent: false };
}

/**
 * Fetch active sessions by reading the OpenClaw sessions file directly.
 * The gateway does not expose a REST /sessions endpoint — sessions live in
 * a local JSON file on disk.
 */
async function fetchOpenClawSessions(): Promise<OpenClawSession[]> {
  // Resolve sessions file path: $HOME/.openclaw/agents/main/sessions/sessions.json
  const homedir = process.env.HOME || '/home/randolph';
  const sessionsFile = `${homedir}/.openclaw/agents/main/sessions/sessions.json`;

  try {
    const { readFile } = await import('fs/promises');
    const raw = await readFile(sessionsFile, 'utf8');
    const data = JSON.parse(raw);

    // The file is an object keyed by session key (not an array)
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      return Object.entries(data).map(([key, val]: [string, any]) => ({
        key,
        ...(typeof val === 'object' && val !== null ? val : {}),
      }));
    }
    // Fallback: array format
    if (Array.isArray(data)) {
      return data;
    }
    console.warn('[bridge] WARNING: Unexpected sessions file shape');
    return [];
  } catch (error) {
    console.error('[bridge] ERROR reading sessions file:', error);
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
    const activeSessionIds = Array.from(activeSessions);
    
    // Get all active sessions from DB
    const { data: existingSessions, error: fetchError } = await supabase
      .from('openclaw_sessions')
      .select('id, openclaw_session_id')
      .eq('status', 'active');

    if (fetchError) {
      console.error('[bridge] ERROR fetching active sessions:', fetchError);
      return;
    }

    // Find sessions to mark as completed (exist in DB but not in current gateway poll)
    const sessionsToComplete = (existingSessions || []).filter(
      (session: any) => !activeSessionIds.includes(session.openclaw_session_id)
    );

    if (sessionsToComplete.length === 0) {
      return; // Nothing to update
    }

    // Mark them as completed
    const { error } = await supabase
      .from('openclaw_sessions')
      .update({
        status: 'completed',
        ended_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .in('id', sessionsToComplete.map((s: any) => s.id));

    if (error) {
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

      const { isSubagent } = parseSessionKey(sessionKey);

      if (isSubagent) {
        // Sub-agent session: key format is agent:main:subagent:<uuid>
        // The session's label may encode which agent spawned it (e.g. "test-subagent-1").
        // Since parent name is not in the key, we use the session label to look up
        // the parent agent, falling back to the first configured agent (primary).
        const sessionLabel: string = (session as any).label || '';
        
        // Try to match label prefix to a known agent name (e.g. "sherlock-subagent-1" → sherlock)
        let parentAgentId: string | null = null;
        let parentName = 'unknown';
        for (const agentName of AGENT_IDS) {
          if (sessionLabel.toLowerCase().startsWith(agentName.toLowerCase())) {
            parentAgentId = agents[agentName] || null;
            parentName = agentName;
            break;
          }
        }

        // Fallback: assign to the first agent in AGENT_IDS (primary agent)
        if (!parentAgentId && AGENT_IDS.length > 0) {
          parentName = AGENT_IDS[0];
          parentAgentId = agents[AGENT_IDS[0]] || null;
        }

        if (parentAgentId) {
          // Use parent agent id for the sub-agent record (no dedicated MC agent for subagents)
          await upsertSession(sessionKey, parentAgentId, parentAgentId, 'subagent');
          activeAgents.add(parentAgentId);

          const oldStatus = agentStatuses.get(parentAgentId);
          if (oldStatus !== 'working') {
            console.log(`[bridge] ${parentName}: ${oldStatus || 'standby'} → working (subagent spawned)`);
            agentStatuses.set(parentAgentId, 'working');
            await updateAgentStatus(parentAgentId, 'working');
          }
        }
      } else {
        // Persistent agent session: key format is agent:main:discord:... or agent:main:main etc.
        // Extract agent name from AGENT_IDS by checking if session belongs to a known agent workspace.
        // All sessions on this host are under "main" agent workspace.
        // We match against AGENT_IDS by looking at channel/label or skip non-agent sessions.
        const sessionLabel: string = (session as any).label || '';
        let agentId: string | null = null;
        let agentName = '';

        for (const name of AGENT_IDS) {
          if (sessionLabel.toLowerCase().includes(name.toLowerCase()) || 
              sessionKey.includes(`:${name.toLowerCase()}:`)) {
            agentId = agents[name] || null;
            agentName = name;
            break;
          }
        }

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
    // Guard: only mark completed if we have active sessions to compare against
    // (avoids marking all sessions as complete on an empty gateway poll)
    if (seenSessions.size > 0 && currentActiveSessions.size > 0) {
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
