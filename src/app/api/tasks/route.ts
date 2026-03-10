export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const workspaceId = request.nextUrl.searchParams.get('workspace_id');
    const status = request.nextUrl.searchParams.get('status');
    const assigned_to = request.nextUrl.searchParams.get('assigned_to');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '100');
    const offset = parseInt(request.nextUrl.searchParams.get('offset') || '0');

    let query = supabase.from('tasks').select('*').order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    if (workspaceId) query = query.eq('workspace_id', workspaceId);
    if (status) query = query.eq('status', status);
    if (assigned_to) query = query.eq('assigned_to', assigned_to);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workspace_id, title, description, status, assigned_to, workflow_template_id } = body;

    if (!workspace_id || !title) {
      return NextResponse.json({ error: 'workspace_id and title required' }, { status: 400 });
    }

    const id = crypto.randomUUID();
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        id,
        workspace_id,
        title,
        description: description || null,
        status: status || 'inbox',
        assigned_to: assigned_to || null,
        workflow_template_id: workflow_template_id || null,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, assigned_to, description, title } = body;

    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }

    const updates: any = {};
    if (status) updates.status = status;
    if (assigned_to) updates.assigned_to = assigned_to;
    if (description !== undefined) updates.description = description;
    if (title) updates.title = title;

    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }

    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
