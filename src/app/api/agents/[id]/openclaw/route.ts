export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

type Params = {
  id: string;
};

export async function GET(request: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    const { id } = await params;

    // Get the agent's OpenClaw session
    const { data, error } = await supabase
      .from('openclaw_sessions')
      .select('*')
      .eq('agent_id', id)
      .eq('session_type', 'master')
      .single();

    if (error?.code === 'PGRST116') {
      return NextResponse.json({ session: null });
    }
    if (error) throw error;

    return NextResponse.json(data);
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

    // Create or update OpenClaw session
    const sessionId = crypto.randomUUID();
    const { data, error } = await supabase
      .from('openclaw_sessions')
      .upsert({
        id: sessionId,
        agent_id: id,
        session_type: 'master',
        workspace_id: 'default',
        status: 'active',
        metadata: {
          session_key,
          gateway_url,
        },
      }, { onConflict: 'agent_id' })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create OpenClaw session' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    const { id } = await params;

    // Delete the agent's OpenClaw session
    const { error } = await supabase
      .from('openclaw_sessions')
      .delete()
      .eq('agent_id', id)
      .eq('session_type', 'master');

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to disconnect OpenClaw session' }, { status: 500 });
  }
}
