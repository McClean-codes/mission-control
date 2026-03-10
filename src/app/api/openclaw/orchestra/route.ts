export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get all active agents and their OpenClaw sessions for orchestration
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select('*')
      .eq('status', 'working')
      .limit(100);

    if (agentsError) throw agentsError;

    // Get active sessions for these agents
    const agentIds = agents?.map((a: any) => a.id) || [];
    const { data: sessions, error: sessionsError } = await supabase
      .from('openclaw_sessions')
      .select('*')
      .in('agent_id', agentIds)
      .eq('status', 'active');

    if (sessionsError) throw sessionsError;

    return NextResponse.json({
      agents: agents || [],
      sessions: sessions || [],
      active_count: sessions?.length || 0,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch orchestra status' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, task_id, agent_id } = body;

    if (!action) {
      return NextResponse.json({ error: 'action required' }, { status: 400 });
    }

    // Log the orchestration action
    const eventId = crypto.randomUUID();
    const { data, error } = await supabase
      .from('events')
      .insert({
        id: eventId,
        workspace_id: 'default',
        event_type: 'orchestration',
        status: 'active',
        data: {
          action,
          task_id: task_id || null,
          agent_id: agent_id || null,
        },
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to post orchestra action' }, { status: 500 });
  }
}
