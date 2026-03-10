import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const workspaceId = request.nextUrl.searchParams.get('workspace_id') || 'default';
    const agents = await db.getAgents(workspaceId);
    return NextResponse.json(agents || []);
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.name || !body.role) return NextResponse.json({ error: 'Name and role required' }, { status: 400 });

    const agent = await db.createAgent({
      id: crypto.randomUUID(),
      name: body.name,
      role: body.role,
      avatar_emoji: body.avatar_emoji || '🤖',
      status: 'standby',
      is_master: body.is_master || false,
      workspace_id: body.workspace_id || 'default',
      source: 'manual'
    });

    return NextResponse.json(agent, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
