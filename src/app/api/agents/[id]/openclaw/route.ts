export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

type Params = {
  id: string;
};

export async function GET(request: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    const { id } = await params;

    const session = await db.getOpenClawSession(id);
    return NextResponse.json({ session: session || null });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch OpenClaw session' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { session_key, gateway_url } = body;

    if (!session_key || !gateway_url) {
      return NextResponse.json({ error: 'session_key and gateway_url required' }, { status: 400 });
    }

    const session = await db.createOpenClawSession({
      agent_id: id,
      session_type: 'master',
      workspace_id: 'default',
      status: 'active',
      metadata: {
        session_key,
        gateway_url,
      },
    });

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create OpenClaw session' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    const { id } = await params;

    await db.deleteOpenClawSession(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to disconnect OpenClaw session' }, { status: 500 });
  }
}
