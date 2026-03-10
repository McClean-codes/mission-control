export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

type Params = {
  id: string;
};

export async function POST(request: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { agent_id, instructions, context } = body;

    if (!agent_id) {
      return NextResponse.json({ error: 'agent_id required' }, { status: 400 });
    }

    // Create an OpenClaw session record for the subagent
    const sessionId = crypto.randomUUID();
    const { data: session, error: sessionError } = await supabase
      .from('openclaw_sessions')
      .insert({
        id: sessionId,
        workspace_id: 'default',
        agent_id: agent_id,
        session_type: 'subagent',
        status: 'active',
        metadata: {
          task_id: id,
          instructions: instructions || null,
          context: context || {},
        },
      })
      .select()
      .single();

    if (sessionError) throw sessionError;

    // Log the subagent spawn as an activity
    const activityId = crypto.randomUUID();
    await supabase
      .from('task_activities')
      .insert({
        id: activityId,
        task_id: id,
        activity_type: 'subagent_spawned',
        data: {
          agent_id: agent_id,
          session_id: sessionId,
          instructions: instructions || null,
        },
        agent_id: agent_id,
      });

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to spawn subagent' }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    const { id } = await params;

    // Get all subagent sessions for this task
    const { data, error } = await supabase
      .from('task_activities')
      .select('*')
      .eq('task_id', id)
      .eq('activity_type', 'subagent_spawned')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch subagent history' }, { status: 500 });
  }
}
