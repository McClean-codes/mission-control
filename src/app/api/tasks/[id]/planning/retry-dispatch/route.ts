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
    const { agent_id, reason } = body;

    if (!agent_id) {
      return NextResponse.json({ error: 'agent_id required' }, { status: 400 });
    }

    // Log the retry dispatch activity
    const activityId = crypto.randomUUID();
    const { error: activityError } = await supabase
      .from('task_activities')
      .insert({
        id: activityId,
        task_id: id,
        activity_type: 'retry_dispatch',
        data: {
          agent_id: agent_id,
          reason: reason || 'Planning iteration retry',
        },
        agent_id: agent_id,
      });

    if (activityError) throw activityError;

    // Keep task in planning stage, mark as needing retry
    const { data, error } = await supabase
      .from('tasks')
      .update({
        status: 'planning',
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      task_id: id,
      agent_id: agent_id,
      activity_id: activityId,
      reason: reason || 'Retrying dispatch',
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to retry dispatch' }, { status: 500 });
  }
}
