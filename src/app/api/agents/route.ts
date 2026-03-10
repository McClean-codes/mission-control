import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const workspaceId = request.nextUrl.searchParams.get('workspace_id');
    let query = supabase.from('agents').select('*').order('is_master', { ascending: false });
    if (workspaceId) query = query.eq('workspace_id', workspaceId);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.name || !body.role) return NextResponse.json({ error: 'Name and role required' }, { status: 400 });

    const { data, error } = await supabase.from('agents').insert({
      id: crypto.randomUUID(),
      name: body.name,
      role: body.role,
      workspace_id: body.workspace_id || 'default',
      is_master: body.is_master || false
    }).select().single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
