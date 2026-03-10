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
    const { agent_id, reason } = body;

    if (!agent_id) {
      return NextResponse.json({ error: 'agent_id required' }, { status: 400 });
    }

    const activity = await db.createActivity({
      task_id: id,
      agent_id: agent_id,
      action: 'retry_dispatch',
      details: {
        reason: reason || 'Planning iteration retry',
      },
    });

    const task = await db.updateTask(id, { status: 'planning' });

    return NextResponse.json({
      success: true,
      task_id: id,
      agent_id: agent_id,
      activity_id: activity.id,
      reason: reason || 'Retrying dispatch',
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to retry dispatch' }, { status: 500 });
  }
}
