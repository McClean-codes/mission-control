import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const workspaces = await db.getWorkspaces();

    // If stats=true, fetch task counts and agent counts per workspace
    const statsMode = request.nextUrl.searchParams.get('stats') === 'true';

    if (statsMode && workspaces) {
      const enriched = await Promise.all(workspaces.map(async (ws: any) => {
        const [agents, tasks] = await Promise.all([
          db.getAgents(ws.id),
          db.getTasks(ws.id)
        ]);

        const statusCounts: Record<string, number> = {
          pending_dispatch: 0,
          planning: 0,
          inbox: 0,
          assigned: 0,
          in_progress: 0,
          testing: 0,
          review: 0,
          verification: 0,
          done: 0,
          total: 0
        };

        for (const t of tasks || []) {
          if ((t as any).status in statusCounts) {
            statusCounts[(t as any).status]++;
          }
          statusCounts.total++;
        }

        return {
          ...ws,
          taskCounts: statusCounts,
          agentCount: agents?.length || 0
        };
      }));

      return NextResponse.json(enriched);
    }

    return NextResponse.json(workspaces || []);
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, icon } = body;
    if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const workspace = await db.createWorkspace({
      id: crypto.randomUUID(),
      name,
      slug,
      description: description || undefined,
      icon: icon || '📁'
    });

    return NextResponse.json(workspace, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
