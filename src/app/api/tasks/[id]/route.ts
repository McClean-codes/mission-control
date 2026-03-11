export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db, supabaseAdmin } from '@/lib/db';

type Params = {
  id: string;
};

export async function GET(request: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    const { id } = await params;
    const task = await db.getTask(id);

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json(task);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch task' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updates: any = {};
    if (body.status) updates.status = body.status;
    if (body.assigned_agent_id) updates.assigned_agent_id = body.assigned_agent_id;
    if (body.description !== undefined) updates.description = body.description;
    if (body.title) updates.title = body.title;

    const updated = await db.updateTask(id, updates);
    if (!updated) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    const { id } = await params;

    // Cascade delete: remove child rows before deleting task
    if (process.env.DATABASE_PROVIDER === 'supabase') {
      // Delete rows that don't have ON DELETE CASCADE defined
      await supabaseAdmin.from('events').delete().eq('task_id', id);
      await supabaseAdmin.from('conversations').delete().eq('task_id', id);
      await supabaseAdmin.from('openclaw_sessions').delete().eq('task_id', id);
      await supabaseAdmin.from('knowledge_entries').delete().eq('task_id', id);
    }

    // Delete the task (other child tables have ON DELETE CASCADE)
    await db.deleteTask(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
