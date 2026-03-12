export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dispatchTask } from '@/lib/dispatch';

type Params = {
  id: string;
};

export async function POST(request: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { agent_id, subagent_id, instructions } = body;

    const task = await db.getTask(id);
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    await db.updateTask(id, { status: 'assigned' });

    // Write to dispatch_queue so the watcher picks it up
    const assignedAgentId = task.assigned_agent_id || agent_id;
    if (assignedAgentId) {
      await dispatchTask(id, assignedAgentId, task.workspace_id || 'default', {
        task_title: task.title,
        task_description: task.description || '',
        message: `You have been assigned a task: "${task.title}". ${task.description ? `\n\nDetails: ${task.description}` : ''}`.trim(),
        context: { task_id: id, dispatched_at: new Date().toISOString() },
      }).catch((err) => console.error('[dispatch] Failed to queue:', err));
    }

    return NextResponse.json({ success: true, task_id: id, agent_id });
  } catch (error) {
    const msg = error instanceof Error ? error.message : JSON.stringify(error);
    console.error('[dispatch] Error:', msg);
    return NextResponse.json({ error: 'Failed to dispatch task', detail: msg }, { status: 500 });
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
