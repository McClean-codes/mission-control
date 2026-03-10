export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

type Params = {
  id: string;
};

export async function GET(request: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    const { id } = await params;

    const roles = await db.getTaskRoles(id);
    return NextResponse.json(roles);
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

    const taskRole = await db.createTaskRole({
      task_id: id,
      role,
      agent_id: agent_id || null,
      status: status || 'unassigned',
    });

    return NextResponse.json(taskRole, { status: 201 });
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

    const taskRole = await db.updateTaskRole(roleId, updates);
    return NextResponse.json(taskRole);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
  }
}
