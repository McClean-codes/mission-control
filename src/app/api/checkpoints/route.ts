import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const agentId = request.nextUrl.searchParams.get('agent_id');
    const status = request.nextUrl.searchParams.get('status');

    let query = supabase.from('checkpoints').select('*').order('updated_at', { ascending: false });

    if (agentId) query = query.eq('agent_id', agentId);
    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Failed to fetch checkpoints:', error);
    return NextResponse.json({ error: 'Failed to fetch checkpoints' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agent_id, status, task_id, summary, metadata } = body;

    if (!agent_id || !status) {
      return NextResponse.json({ error: 'agent_id and status required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('checkpoints')
      .insert({
        agent_id,
        status,
        task_id: task_id || null,
        summary: summary || null,
        metadata: metadata || null
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Failed to create checkpoint:', error);
    return NextResponse.json({ error: 'Failed to create checkpoint' }, { status: 500 });
  }
}
