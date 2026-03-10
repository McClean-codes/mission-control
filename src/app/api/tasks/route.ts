export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const workspaceId = request.nextUrl.searchParams.get('workspace_id') || 'default';
    const status = request.nextUrl.searchParams.get('status');
    const assigned_agent_id = request.nextUrl.searchParams.get('assigned_to');

    const filters = {
      ...(status && { status }),
      ...(assigned_agent_id && { assigned_agent_id }),
    };

    const tasks = await db.getTasks(workspaceId, filters);
    return NextResponse.json(tasks || []);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workspace_id, title, description, status, assigned_agent_id, workflow_template_id } = body;

    if (!workspace_id || !title) {
      return NextResponse.json({ error: 'workspace_id and title required' }, { status: 400 });
    }

    const task = await db.createTask({
      id: crypto.randomUUID(),
      workspace_id,
      title,
      description: description || undefined,
      status: status || 'inbox',
      priority: 'normal',
      assigned_agent_id: assigned_agent_id || undefined,
      workflow_template_id: workflow_template_id || undefined,
      business_id: 'default',
      planning_complete: false,
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const taskId = request.nextUrl.searchParams.get('id');
    if (!taskId) return NextResponse.json({ error: 'Task ID required' }, { status: 400 });
    
    await db.deleteTask(taskId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
