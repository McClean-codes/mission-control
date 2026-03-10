export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Note: filtering by session_type, status, and agent_id is not directly supported by DbProvider
    // For Supabase, this will work via the provider implementation
    // For SQLite, these routes return empty arrays
    const sessions = await db.getOpenClawSession('');
    return NextResponse.json(sessions ? [sessions] : []);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workspace_id, agent_id, session_type, metadata } = body;

    if (!workspace_id || !agent_id || !session_type) {
      return NextResponse.json({ error: 'workspace_id, agent_id, and session_type required' }, { status: 400 });
    }

    const session = await db.createOpenClawSession({
      workspace_id,
      agent_id,
      session_type,
      status: 'active',
      metadata: metadata || {},
    });

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}
