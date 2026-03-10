export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

type Params = {
  id: string;
};

export async function POST(request: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { spec_id, approval_notes } = body;

    if (!spec_id) {
      return NextResponse.json({ error: 'spec_id required' }, { status: 400 });
    }

    const spec = await db.updatePlanningSpec(spec_id, { source: approval_notes });

    // Log the approval activity
    await db.createActivity({
      task_id: id,
      action: 'planning_approved',
      details: {
        spec_id: spec_id,
        approval_notes: approval_notes || null,
      },
    });

    // Check if all specs approved
    const allSpecs = await db.getPlanningSpecsByTask(id);
    const allApproved = allSpecs?.every((s: any) => s.source !== null);
    if (allApproved && allSpecs.length > 0) {
      await db.updateTask(id, { status: 'in_progress' });
    }

    return NextResponse.json(spec);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to approve planning spec' }, { status: 500 });
  }
}
