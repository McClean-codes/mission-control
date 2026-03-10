export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

type Params = {
  id: string;
};

export async function GET(request: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    const { id } = await params;

    const { data, error } = await supabase
      .from('task_roles')
      .select('*')
      .eq('task_id', id)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { role, agent_id, status } = body;

    if (!role) {
      return NextResponse.json({ error: 'role required' }, { status: 400 });
    }

    const roleId = crypto.randomUUID();
    const { data, error } = await supabase
      .from('task_roles')
      .insert({
        id: roleId,
        task_id: id,
        role,
        agent_id: agent_id || null,
        status: status || 'unassigned',
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create role' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    const body = await request.json();
    const { id: roleId, agent_id, status } = body;

    if (!roleId) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }

    const updates: any = {};
    if (agent_id !== undefined) updates.agent_id = agent_id;
    if (status) updates.status = status;

    const { data, error } = await supabase
      .from('task_roles')
      .update(updates)
      .eq('id', roleId)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
  }
}
