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
    const { reason, next_status } = body;

    const task = await db.updateTask(id, { status: next_status || 'failed' });

    await db.createActivity({
      task_id: id,
      action: 'failed',
      details: {
        reason: reason || 'Task failed',
        previous_status: task?.status,
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
