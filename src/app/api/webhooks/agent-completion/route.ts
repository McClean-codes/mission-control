export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { task_id, agent_id, status, result, metadata } = body;

    if (!task_id || !agent_id) {
      return NextResponse.json({ error: 'task_id and agent_id required' }, { status: 400 });
    }

    // Update task status
    const taskStatus = status || 'done';
    const { error: taskError } = await supabase
      .from('tasks')
      .update({ status: taskStatus })
      .eq('id', task_id);

    if (taskError) throw taskError;

    // Log the completion activity
    const activityId = crypto.randomUUID();
    const { error: activityError } = await supabase
      .from('task_activities')
      .insert({
        id: activityId,
        task_id: task_id,
        activity_type: 'completion',
        data: {
          agent_id: agent_id,
          status: taskStatus,
          result: result || null,
          metadata: metadata || {},
        },
        agent_id: agent_id,
      });

    if (activityError) throw activityError;

    // Create event record
    const eventId = crypto.randomUUID();
    const { error: eventError } = await supabase
      .from('events')
      .insert({
        id: eventId,
        workspace_id: 'default',
        event_type: 'task_completed',
        status: 'archived',
        data: {
          task_id: task_id,
          agent_id: agent_id,
          status: taskStatus,
        },
      });

    if (eventError) throw eventError;

    return NextResponse.json({
      success: true,
      task_id: task_id,
      status: taskStatus,
      activity_id: activityId,
      event_id: eventId,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process completion webhook' }, { status: 500 });
  }
}
