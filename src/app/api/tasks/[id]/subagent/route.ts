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
    const { agent_id, instructions, context } = body;

    if (!agent_id) {
      return NextResponse.json({ error: 'agent_id required' }, { status: 400 });
    }

    const session = await db.createOpenClawSession({
      workspace_id: 'default',
      agent_id: agent_id,
      session_type: 'subagent',
      status: 'active',
      metadata: {
        task_id: id,
        instructions: instructions || null,
        context: context || {},
      },
    });

    await db.createActivity({
      task_id: id,
      agent_id: agent_id,
      action: 'subagent_spawned',
      details: {
        agent_id: agent_id,
        session_id: session.id,
        instructions: instructions || null,
      },
    });

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to spawn subagent' }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    const { id } = await params;

    const activities = await db.getActivities(id);
    const subagentActivities = activities.filter((a: any) => a.action === 'subagent_spawned');
    return NextResponse.json(subagentActivities);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch subagent history' }, { status: 500 });
  }
}
