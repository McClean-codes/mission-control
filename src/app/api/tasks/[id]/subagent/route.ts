export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db, supabaseAdmin } from '@/lib/db';

type Params = {
  id: string;
};

export async function POST(request: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { agent_id, parent_agent_id, instructions, context } = body;

    if (!agent_id) {
      return NextResponse.json({ error: 'agent_id required' }, { status: 400 });
    }

    const session = await db.createOpenClawSession({
      workspace_id: 'default',
      agent_id: agent_id,
      parent_agent_id: parent_agent_id || null,
      session_type: 'subagent',
      status: 'active',
      task_id: id,
      metadata: {
        instructions: instructions || null,
        context: context || {},
      },
    });

    await db.createActivity({
      task_id: id,
      agent_id: agent_id,
      action: 'subagent_spawned',
      details: {
        agent_id: agent_id,
        session_id: session.id,
        instructions: instructions || null,
      },
    });

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to spawn subagent' }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    const { id } = await params;

    const { data, error } = await supabaseAdmin
      .from('openclaw_sessions')
      .select(`
        *,
        agent:agents!openclaw_sessions_agent_id_fkey(name, avatar_emoji),
        parent:agents!openclaw_sessions_parent_agent_id_fkey(name, avatar_emoji)
      `)
      .eq('task_id', id)
      .eq('session_type', 'subagent')
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json([], { status: 200 });

    const sessions = (data || []).map((s: any) => ({
      ...s,
      agent_name: s.agent?.name || null,
      agent_avatar_emoji: s.agent?.avatar_emoji || null,
      parent_agent_name: s.parent?.name || null,
    }));

    return NextResponse.json(sessions);
  } catch (error) {
    return NextResponse.json([], { status: 200 });
  }
}
