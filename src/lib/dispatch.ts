import { supabase } from '@/lib/db/supabase/client';

export interface DispatchPayload {
  task_title?: string;
  task_description?: string;
  spec?: string;
  assigned_role?: string;
  context?: Record<string, any>;
  [key: string]: any;
}

export type AgentStatus = 'online' | 'stale' | 'offline';

/**
 * Dispatch a task to an agent via Supabase dispatch_queue.
 * This should be called from a server-side API route only (uses service role).
 */
export async function dispatchTask(
  taskId: string,
  agentId: string,
  workspaceId: string,
  payload: DispatchPayload
) {
  const { data, error } = await supabase
    .from('dispatch_queue')
    .insert({
      task_id: taskId,
      agent_id: agentId,
      workspace_id: workspaceId,
      action: 'execute',
      payload: payload,
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Subscribe to dispatch queue changes for a workspace.
 * Returns unsubscribe function.
 * No-op (returns empty unsubscribe) in SQLite mode.
 */
export function subscribeDispatch(
  workspaceId: string,
  callback: (status: 'pending' | 'claimed' | 'running' | 'completed' | 'failed' | 'cancelled', row: any) => void
) {
  // No-op in SQLite mode
  if (process.env.NEXT_PUBLIC_DATABASE_PROVIDER !== 'supabase') {
    return () => {}; // empty unsubscribe function
  }

  const channel = supabase
    .channel(`dispatch:${workspaceId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'dispatch_queue',
        filter: `workspace_id=eq.${workspaceId}`,
      },
      (payload: any) => {
        if (payload.new && 'status' in payload.new) {
          callback(payload.new.status, payload.new);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to agent heartbeats for live status updates.
 * Returns unsubscribe function.
 * No-op (returns empty unsubscribe) in SQLite mode.
 */
export function subscribeHeartbeats(
  callback: (agentId: string, row: any) => void
) {
  // No-op in SQLite mode
  if (process.env.NEXT_PUBLIC_DATABASE_PROVIDER !== 'supabase') {
    return () => {}; // empty unsubscribe function
  }

  const channel = supabase
    .channel('agent-heartbeats')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'agent_heartbeats',
      },
      (payload: any) => {
        if (payload.new && 'agent_id' in payload.new) {
          callback(payload.new.agent_id, payload.new);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Get agent status based on last_seen_at timestamp.
 * - online: < 60 seconds ago
 * - stale: 60–300 seconds ago
 * - offline: > 300 seconds ago or never seen
 */
export function getAgentStatus(lastSeenAt: string | null | undefined): AgentStatus {
  if (!lastSeenAt) return 'offline';

  const now = new Date();
  const lastSeen = new Date(lastSeenAt);
  const diffSeconds = (now.getTime() - lastSeen.getTime()) / 1000;

  if (diffSeconds < 60) return 'online';
  if (diffSeconds < 300) return 'stale';
  return 'offline';
}

/**
 * Get a readable status label for an agent.
 */
export function getAgentStatusLabel(status: AgentStatus): { emoji: string; text: string; color: string } {
  const statuses = {
    online: { emoji: '🟢', text: 'Online', color: 'text-green-600' },
    stale: { emoji: '🟡', text: 'Stale', color: 'text-yellow-600' },
    offline: { emoji: '🔴', text: 'Offline', color: 'text-red-600' },
  };
  return statuses[status];
}
