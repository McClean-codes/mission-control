export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Fetch all agents from the gateway or discovery service
    // For now, return all available agents from other workspaces
    const workspaceId = request.nextUrl.searchParams.get('workspace_id') || 'default';
    const q = request.nextUrl.searchParams.get('q') || '';

    let query = supabase.from('agents').select('*').neq('workspace_id', workspaceId);

    if (q) {
      query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`);
    }

    const { data, error } = await query.limit(100);

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to discover agents' }, { status: 500 });
  }
}
