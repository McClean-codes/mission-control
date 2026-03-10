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
    const { agent_id, subagent_id, instructions } = body;

    // Fetch the task
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();

    if (taskError?.code === 'PGRST116') {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    if (taskError) throw taskError;

    // Create an activity log entry for the dispatch
    const activityId = crypto.randomUUID();
    const { error: activityError } = await supabase
      .from('task_activities')
      .insert({
        id: activityId,
        task_id: id,
        activity_type: 'dispatch',
        data: {
          agent_id: agent_id || null,
          subagent_id: subagent_id || null,
          instructions: instructions || null,
        },
        agent_id: agent_id || null,
      });

    if (activityError) throw activityError;

    // Update task status if needed
    const { error: updateError } = await supabase
      .from('tasks')
      .update({ status: 'assigned' })
      .eq('id', id);

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      task_id: id,
      agent_id,
      subagent_id,
      activity_id: activityId,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to dispatch task' }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    const { id } = await params;

    // Get dispatch-related activities for this task
    const { data, error } = await supabase
      .from('task_activities')
      .select('*')
      .eq('task_id', id)
      .eq('activity_type', 'dispatch')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch dispatch history' }, { status: 500 });
  }
}
