export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const sessionType = request.nextUrl.searchParams.get('session_type');
    const status = request.nextUrl.searchParams.get('status');
    const agentId = request.nextUrl.searchParams.get('agent_id');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '100');

    let query = supabase.from('openclaw_sessions').select('*').order('created_at', { ascending: false }).limit(limit);

    if (sessionType) query = query.eq('session_type', sessionType);
    if (status) query = query.eq('status', status);
    if (agentId) query = query.eq('agent_id', agentId);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workspace_id, agent_id, session_type, metadata } = body;

    if (!workspace_id || !agent_id || !session_type) {
      return NextResponse.json({ error: 'workspace_id, agent_id, and session_type required' }, { status: 400 });
    }

    const sessionId = crypto.randomUUID();
    const { data, error } = await supabase
      .from('openclaw_sessions')
      .insert({
        id: sessionId,
        workspace_id,
        agent_id,
        session_type,
        status: 'active',
        metadata: metadata || {},
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}
