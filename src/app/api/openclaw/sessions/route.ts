export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db, supabaseAdmin } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabaseAdmin
      .from('openclaw_sessions')
      .select(`
        *,
        agent:agents!openclaw_sessions_agent_id_fkey(name, avatar_emoji),
        parent:agents!openclaw_sessions_parent_agent_id_fkey(name, avatar_emoji)
      `)
      .eq('session_type', 'subagent')
      .eq('status', 'active')
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workspace_id, agent_id, session_type, metadata } = body;

    if (!workspace_id || !agent_id || !session_type) {
      return NextResponse.json({ error: 'workspace_id, agent_id, and session_type required' }, { status: 400 });
    }

    const session = await db.createOpenClawSession({
      workspace_id,
      agent_id,
      session_type,
      status: 'active',
      metadata: metadata || {},
    });

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}
