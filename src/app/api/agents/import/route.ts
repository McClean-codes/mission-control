export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workspace_id, agent_ids } = body;

    if (!workspace_id || !agent_ids || !Array.isArray(agent_ids)) {
      return NextResponse.json({ error: 'workspace_id and agent_ids array required' }, { status: 400 });
    }

    // Get available agents and filter by IDs
    const availableAgents = await db.getAgentsExcluding(workspace_id);
    const agentsToImport = availableAgents.filter(a => agent_ids.includes(a.id));

    // Create imported agents in the target workspace
    const imported = agentsToImport.map((agent) => ({
      id: `${agent.id}-imported-${Date.now()}`,
      ...agent,
      workspace_id: workspace_id,
      source: 'imported',
    }));

    const created = await Promise.all(imported.map(a => db.createAgent(a)));
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to import agents' }, { status: 500 });
  }
}
