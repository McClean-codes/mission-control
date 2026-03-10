import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase.from('workspaces').select('*').order('name');
    if (error) throw error;

    // If stats=true, fetch task counts and agent counts per workspace
    const statsMode = request.nextUrl.searchParams.get('stats') === 'true';

    if (statsMode && data) {
      const enriched = await Promise.all(data.map(async (ws: any) => {
        const [{ count: agentCount }, { data: tasks }] = await Promise.all([
          supabase.from('agents').select('*', { count: 'exact', head: true }).eq('workspace_id', ws.id),
          supabase.from('tasks').select('status').eq('workspace_id', ws.id)
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
          agentCount: agentCount || 0
        };
      }));

      return NextResponse.json(enriched);
    }

    return NextResponse.json(data || []);
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, icon } = body;
    if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });

    const id = crypto.randomUUID();
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const { data, error } = await supabase.from('workspaces').insert({
      id, name, slug, description: description || null, icon: icon || '📁'
    }).select().single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
