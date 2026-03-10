export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskId, agentId, workspaceId, payload } = body;

    if (!taskId || !agentId || !workspaceId) {
      return NextResponse.json(
        { error: 'taskId, agentId, and workspaceId required' },
        { status: 400 }
      );
    }

    // Insert into dispatch_queue (using service role key for write access)
    const { data, error } = await supabaseAdmin
      .from('dispatch_queue')
      .insert({
        task_id: taskId,
        agent_id: agentId,
        workspace_id: workspaceId,
        action: 'execute',
        payload: payload || {},
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Failed to dispatch task:', error);
    return NextResponse.json({ error: 'Failed to dispatch task' }, { status: 500 });
  }
}
