import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const workspaceId = request.nextUrl.searchParams.get('workspace_id') || '';
    const status = request.nextUrl.searchParams.get('status');

    const checkpoints = await db.getCheckpoints(workspaceId, status || undefined);
    return NextResponse.json(checkpoints);
  } catch (error) {
    console.error('Failed to fetch checkpoints:', error);
    return NextResponse.json({ error: 'Failed to fetch checkpoints' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agent_id, status, summary, metadata } = body;

    if (!agent_id || !status) {
      return NextResponse.json({ error: 'agent_id and status required' }, { status: 400 });
    }

    const checkpoint = await db.createCheckpoint({
      agent_id,
      status,
      summary: summary || undefined,
      metadata: metadata || undefined,
    });

    return NextResponse.json(checkpoint, { status: 201 });
  } catch (error) {
    console.error('Failed to create checkpoint:', error);
    return NextResponse.json({ error: 'Failed to create checkpoint' }, { status: 500 });
  }
}
