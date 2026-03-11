#!/usr/bin/env tsx
/**
 * Dispatch Watcher - Standalone process that claims and executes tasks from Supabase
 * 
 * This script:
 * 1. Subscribes to dispatch_queue via Supabase Realtime
 * 2. Claims pending tasks atomically via claim_dispatch() RPC
 * 3. Executes tasks via local OpenClaw Gateway HTTP API
 * 4. Writes results back to dispatch_queue
 * 5. Sends periodic heartbeats for all agents
 */

import { createClient } from '@supabase/supabase-js';

// Environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENCLAW_GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL || 'http://localhost:18789';
const OPENCLAW_HOOK_TOKEN = process.env.OPENCLAW_HOOK_TOKEN;
const AGENT_IDS = (process.env.AGENT_IDS || 'sherlock,edison,nikola,newton,scout').split(',').map(id => id.trim());

// Validate required env vars
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('[watcher] Missing required env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

console.log('[watcher] Initializing dispatch watcher');
console.log('[watcher] Agents:', AGENT_IDS);
console.log('[watcher] OpenClaw Gateway:', OPENCLAW_GATEWAY_URL);

// Create Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface DispatchRow {
  id: string;
  task_id: string;
  agent_id: string;
  workspace_id: string;
  action: string;
  payload: Record<string, any>;
  status: string;
}

interface AgentHeartbeat {
  agent_id: string;
  last_seen_at: string;
  gateway_version: string | null;
  metadata: Record<string, any>;
}

let isRunning = true;
let heartbeatInterval: NodeJS.Timeout | null = null;
let resubscribeTimeout: NodeJS.Timeout | null = null;
let reconnectAttempts = 0;
const maxReconnectAttempts = 10;
let reconnectDelay = 1000; // Start at 1s, exponential backoff

/**
 * Claim and execute a dispatched task
 */
async function claimAndDispatch(row: DispatchRow): Promise<void> {
  try {
    console.log(`[watcher] Processing dispatch: ${row.id}`);

    // Attempt atomic claim via RPC
    const { data: claimed, error: claimError } = await supabase.rpc('claim_dispatch', {
      p_id: row.id,
      p_agent_id: row.agent_id,
    });

    if (claimError || !claimed) {
      console.log(`[watcher] Skipping ${row.id} — already claimed by another process`);
      return;
    }

    console.log(`[watcher] Claimed: ${row.id}`);

    // Update status to running
    await supabase
      .from('dispatch_queue')
      .update({ status: 'running' })
      .eq('id', row.id);

    // Execute via OpenClaw Gateway
    console.log(`[watcher] Dispatching to ${row.agent_id}...`);
    const dispatchResult = await dispatchToOpenClaw(row.agent_id, row.payload);

    // Update with result
    const { error: updateError } = await supabase
      .from('dispatch_queue')
      .update({
        status: 'completed',
        result: dispatchResult,
        completed_at: new Date().toISOString(),
      })
      .eq('id', row.id);

    if (updateError) {
      console.error(`[watcher] Failed to update dispatch ${row.id}:`, updateError);
    } else {
      console.log(`[watcher] Completed: ${row.id}`);
    }
  } catch (error) {
    console.error(`[watcher] Error processing ${row.id}:`, error);

    // Update with failure
    const { error: updateError } = await supabase
      .from('dispatch_queue')
      .update({
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        completed_at: new Date().toISOString(),
      })
      .eq('id', row.id);

    if (updateError) {
      console.error(`[watcher] Failed to mark ${row.id} as failed:`, updateError);
    }
  }
}

/**
 * Dispatch to OpenClaw via /hooks/agent endpoint
 */
async function dispatchToOpenClaw(agentId: string, payload: Record<string, any>): Promise<Record<string, any>> {
  if (!OPENCLAW_HOOK_TOKEN) {
    throw new Error('OPENCLAW_HOOK_TOKEN is not set in environment');
  }

  const message = typeof payload.message === 'string'
    ? payload.message
    : JSON.stringify(payload);

  const response = await fetch(`${OPENCLAW_GATEWAY_URL}/hooks/agent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENCLAW_HOOK_TOKEN}`,
    },
    body: JSON.stringify({
      message,
      agentId,
      wakeMode: 'now',
    }),
  });

  if (!response.ok) {
    throw new Error(`/hooks/agent failed: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();
  if (!result.ok) {
    throw new Error(`/hooks/agent error: ${JSON.stringify(result)}`);
  }

  console.log(`[watcher] Dispatched to agent=${agentId} runId=${result.runId}`);
  return result;
}

/**
 * Send heartbeats for all agents
 */
async function sendHeartbeats(): Promise<void> {
  const heartbeats: AgentHeartbeat[] = AGENT_IDS.map(agentId => ({
    agent_id: agentId,
    last_seen_at: new Date().toISOString(),
    gateway_version: null,
    metadata: { status: 'online' },
  }));

  const { error } = await supabase
    .from('agent_heartbeats')
    .upsert(heartbeats, { onConflict: 'agent_id' });

  if (error) {
    console.error('[watcher] Failed to send heartbeats:', error);
  } else {
    console.log('[watcher] Heartbeats sent for', AGENT_IDS.length, 'agents');
  }
}

/**
 * Subscribe to dispatch_queue changes
 */
function subscribe(): void {
  console.log('[watcher] Subscribing to dispatch_queue...');

  const agentFilter = AGENT_IDS.map(id => `agent_id=eq.${id}`).join(',');
  
  supabase
    .channel('dispatch-queue-watcher')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'dispatch_queue',
        filter: `status=eq.pending`,
      },
      (payload: any) => {
        if (payload.new && AGENT_IDS.includes(payload.new.agent_id)) {
          console.log('[watcher] New dispatch received:', payload.new.id);
          claimAndDispatch(payload.new).catch(err => {
            console.error('[watcher] Unhandled error in claimAndDispatch:', err);
          });
        }
      }
    )
    .subscribe((status) => {
      console.log('[watcher] Subscription status:', status);
      if (status === 'SUBSCRIBED') {
        reconnectAttempts = 0;
        reconnectDelay = 1000;
        console.log('[watcher] Successfully subscribed to dispatch_queue');
      }
    });
}

/**
 * Attempt to resubscribe with exponential backoff
 */
function scheduleResubscribe(): void {
  if (!isRunning || reconnectAttempts >= maxReconnectAttempts) {
    if (reconnectAttempts >= maxReconnectAttempts) {
      console.error('[watcher] Max reconnect attempts reached, exiting');
      process.exit(1);
    }
    return;
  }

  reconnectAttempts++;
  console.log(
    `[watcher] Reconnection attempt ${reconnectAttempts}/${maxReconnectAttempts} in ${reconnectDelay}ms...`
  );

  if (resubscribeTimeout) clearTimeout(resubscribeTimeout);
  resubscribeTimeout = setTimeout(() => {
    subscribe();
    reconnectDelay = Math.min(reconnectDelay * 2, 30000); // Cap at 30s
  }, reconnectDelay);
}

/**
 * Start heartbeat loop
 */
function startHeartbeatLoop(): void {
  if (heartbeatInterval) clearInterval(heartbeatInterval);

  // Send heartbeat immediately, then every 30 seconds
  sendHeartbeats().catch(err => {
    console.error('[watcher] Error sending initial heartbeat:', err);
  });

  heartbeatInterval = setInterval(() => {
    if (isRunning) {
      sendHeartbeats().catch(err => {
        console.error('[watcher] Error sending heartbeat:', err);
      });
    }
  }, 30000);
}

/**
 * Graceful shutdown
 */
async function shutdown(): Promise<void> {
  console.log('[watcher] Shutting down gracefully...');
  isRunning = false;

  // Clear intervals and timeouts
  if (heartbeatInterval) clearInterval(heartbeatInterval);
  if (resubscribeTimeout) clearTimeout(resubscribeTimeout);

  // Send final heartbeat with offline status
  try {
    const offlineHeartbeats: AgentHeartbeat[] = AGENT_IDS.map(agentId => ({
      agent_id: agentId,
      last_seen_at: new Date().toISOString(),
      gateway_version: null,
      metadata: { status: 'offline' },
    }));

    await supabase
      .from('agent_heartbeats')
      .upsert(offlineHeartbeats, { onConflict: 'agent_id' });

    console.log('[watcher] Final heartbeat sent with offline status');
  } catch (error) {
    console.error('[watcher] Error sending final heartbeat:', error);
  }

  console.log('[watcher] Shutdown complete');
  process.exit(0);
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  console.log('[watcher] Starting dispatch watcher');

  // Handle graceful shutdown
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  // Start heartbeat loop
  startHeartbeatLoop();

  // Subscribe to dispatch queue
  subscribe();
}

// Run
main().catch(error => {
  console.error('[watcher] Fatal error:', error);
  process.exit(1);
});
