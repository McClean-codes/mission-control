import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Supabase mode: check Supabase connectivity instead of local WS gateway
  if (process.env.DATABASE_PROVIDER === 'supabase') {
    try {
      const { error } = await supabaseAdmin
        .from('agents')
        .select('id')
        .limit(1);

      if (error) throw error;

      return NextResponse.json({ connected: true, mode: 'supabase' });
    } catch (err: any) {
      return NextResponse.json({
        connected: false,
        mode: 'supabase',
        error: err?.message || 'Supabase connection failed',
      });
    }
  }

  // SQLite/local mode: original gateway WS check
  try {
    const { getOpenClawClient } = await import('@/lib/openclaw/client');
    const client = getOpenClawClient();

    if (!client.isConnected()) {
      try {
        await client.connect();
      } catch {
        return NextResponse.json({
          connected: false,
          mode: 'local',
          error: 'Failed to connect to OpenClaw Gateway',
          gateway_url: process.env.OPENCLAW_GATEWAY_URL || 'ws://127.0.0.1:18789',
        });
      }
    }

    const sessions = await client.listSessions();
    return NextResponse.json({
      connected: true,
      mode: 'local',
      sessions_count: sessions.length,
      gateway_url: process.env.OPENCLAW_GATEWAY_URL || 'ws://127.0.0.1:18789',
    });
  } catch (err: any) {
    return NextResponse.json({
      connected: false,
      mode: 'local',
      error: err?.message || 'Gateway error',
    });
  }
}
