export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const workspaceId = request.nextUrl.searchParams.get('workspace_id') || 'default';
    const q = request.nextUrl.searchParams.get('q') || '';

    const agents = await db.getAgentsExcluding(workspaceId);
    
    // Filter by search query if provided
    if (q) {
      const filtered = agents.filter(a => 
        a.name.toLowerCase().includes(q.toLowerCase()) ||
        (a.description && a.description.toLowerCase().includes(q.toLowerCase()))
      );
      return NextResponse.json(filtered.slice(0, 100));
    }

    return NextResponse.json(agents.slice(0, 100));
  } catch (error) {
    return NextResponse.json({ error: 'Failed to discover agents' }, { status: 500 });
  }
}
