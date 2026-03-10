export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('agent_heartbeats')
      .select('*')
      .order('last_seen_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch heartbeats' }, { status: 500 });
  }
}
