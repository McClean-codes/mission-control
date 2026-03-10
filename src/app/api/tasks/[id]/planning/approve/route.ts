export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

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

    // Update the planning spec with approval
    const { data, error } = await supabase
      .from('planning_specs')
      .update({
        status: 'approved',
        approval_notes: approval_notes || null,
      })
      .eq('id', spec_id)
      .eq('task_id', id)
      .select()
      .single();

    if (error?.code === 'PGRST116') {
      return NextResponse.json({ error: 'Planning spec not found' }, { status: 404 });
    }
    if (error) throw error;

    // Log the approval activity
    const activityId = crypto.randomUUID();
    await supabase
      .from('task_activities')
      .insert({
        id: activityId,
        task_id: id,
        activity_type: 'planning_approved',
        data: {
          spec_id: spec_id,
          approval_notes: approval_notes || null,
        },
      });

    // Transition task to next stage if all approvals complete
    const { data: allSpecs } = await supabase
      .from('planning_specs')
      .select('status')
      .eq('task_id', id);

    const allApproved = allSpecs?.every((s: any) => s.status === 'approved');
    if (allApproved) {
      await supabase
        .from('tasks')
        .update({ status: 'in_progress' })
        .eq('id', id);
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to approve planning spec' }, { status: 500 });
  }
}
