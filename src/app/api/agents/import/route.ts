export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workspace_id, agent_ids } = body;

    if (!workspace_id || !agent_ids || !Array.isArray(agent_ids)) {
      return NextResponse.json({ error: 'workspace_id and agent_ids array required' }, { status: 400 });
    }

    // Fetch the agents to import
    const { data: agentsToImport, error: fetchError } = await supabase
      .from('agents')
      .select('*')
      .in('id', agent_ids);

    if (fetchError) throw fetchError;

    // Insert imported agents into the workspace (with new IDs to avoid conflicts)
    const imported = (agentsToImport || []).map((agent: any) => ({
      id: `${agent.id}-imported-${Date.now()}`,
      ...agent,
      workspace_id: workspace_id,
      source: 'imported',
    }));

    const { data, error } = await supabase
      .from('agents')
      .insert(imported)
      .select();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to import agents' }, { status: 500 });
  }
}
