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
    const { reason, next_status } = body;

    // Update task status to failed
    const { data, error } = await supabase
      .from('tasks')
      .update({
        status: next_status || 'failed',
      })
      .eq('id', id)
      .select()
      .single();

    if (error?.code === 'PGRST116') {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    if (error) throw error;

    // Log the failure activity
    const activityId = crypto.randomUUID();
    await supabase
      .from('task_activities')
      .insert({
        id: activityId,
        task_id: id,
        activity_type: 'failed',
        data: {
          reason: reason || 'Task failed',
          previous_status: data?.status,
        },
      });

    return NextResponse.json({
      success: true,
      task_id: id,
      status: next_status || 'failed',
      reason: reason || 'Task marked as failed',
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to mark task as failed' }, { status: 500 });
  }
}
