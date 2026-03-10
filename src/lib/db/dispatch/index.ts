import { supabaseAdmin } from '../supabase/client';
import type { DispatchQueue, AgentHeartbeat } from '../types';

// ============================================================================
// Dispatch Queue Operations (Supabase-only, Phase 4)
// ============================================================================

export async function insertDispatch(payload: {
  task_id: string;
  agent_id: string;
  workspace_id: string;
  action: string;
  payload?: Record<string, any>;
}): Promise<DispatchQueue> {
  const { data, error } = await supabaseAdmin
    .from('dispatch_queue')
    .insert([{
      ...payload,
      status: 'pending',
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function claimDispatch(id: string, agentId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .rpc('claim_dispatch', {
      p_id: id,
      p_agent_id: agentId,
    });

  if (error) throw error;
  return data as boolean;
}

export async function updateDispatchStatus(
  id: string,
  status: 'running' | 'completed' | 'failed',
  result?: Record<string, any>,
  error?: string
): Promise<DispatchQueue> {
  const updateData: any = { status };
  if (result) updateData.result = result;
  if (error) updateData.error = error;
  if (status === 'completed' || status === 'failed') {
    updateData.completed_at = new Date().toISOString();
  }

  const { data, error: err } = await supabaseAdmin
    .from('dispatch_queue')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (err) throw err;
  return data;
}

export async function getDispatchQueue(
  workspaceId: string,
  limit: number = 100
): Promise<DispatchQueue[]> {
  const { data, error } = await supabaseAdmin
    .from('dispatch_queue')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

// ============================================================================
// Agent Heartbeat Operations (Supabase-only, Phase 4)
// ============================================================================

export async function upsertHeartbeat(
  agentId: string,
  gatewayVersion?: string,
  metadata?: Record<string, any>
): Promise<AgentHeartbeat> {
  const { data, error } = await supabaseAdmin
    .from('agent_heartbeats')
    .upsert({
      agent_id: agentId,
      last_seen_at: new Date().toISOString(),
      gateway_version: gatewayVersion,
      metadata,
    }, { onConflict: 'agent_id' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getHeartbeats(): Promise<AgentHeartbeat[]> {
  // Direct REST fetch to bypass potential read replica lag
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/agent_heartbeats?select=*&order=last_seen_at.desc`;
  const res = await fetch(url, {
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
    },
    cache: 'no-store',
  });

  if (!res.ok) return [];

  const data = await res.json();
  return data;
}

export async function getHeartbeat(agentId: string): Promise<AgentHeartbeat | undefined> {
  const { data, error } = await supabaseAdmin
    .from('agent_heartbeats')
    .select('*')
    .eq('agent_id', agentId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data || undefined;
}
