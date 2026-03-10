export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

type Params = {
  id: string;
};

export async function POST(request: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { agent_id, subagent_id, instructions } = body;

    const task = await db.getTask(id);
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const activity = await db.createActivity({
      task_id: id,
      agent_id: agent_id || undefined,
      action: 'dispatch',
      details: {
        agent_id: agent_id || null,
        subagent_id: subagent_id || null,
        instructions: instructions || null,
      },
    });

    await db.updateTask(id, { status: 'assigned' });

    return NextResponse.json({
      success: true,
      task_id: id,
      agent_id,
      subagent_id,
      activity_id: activity.id,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to dispatch task' }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    const { id } = await params;

    const activities = await db.getActivities(id);
    const dispatchActivities = activities.filter((a: any) => a.action === 'dispatch');
    return NextResponse.json(dispatchActivities);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch dispatch history' }, { status: 500 });
  }
}
