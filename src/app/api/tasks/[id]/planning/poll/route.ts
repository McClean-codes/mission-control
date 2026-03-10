export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

type Params = {
  id: string;
};

export async function GET(request: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    const { id } = await params;

    // Get the current task status
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('status, created_at')
      .eq('id', id)
      .single();

    if (taskError?.code === 'PGRST116') {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    if (taskError) throw taskError;

    // Get planning questions (unanswered)
    const { data: questions, error: qError } = await supabase
      .from('planning_questions')
      .select('*')
      .eq('task_id', id)
      .eq('answered', false);

    if (qError) throw qError;

    // Get planning specs (not approved)
    const { data: specs, error: sError } = await supabase
      .from('planning_specs')
      .select('*')
      .eq('task_id', id)
      .not('status', 'eq', 'approved');

    if (sError) throw sError;

    const pendingCount = (questions?.length || 0) + (specs?.length || 0);
    const isComplete = pendingCount === 0;

    return NextResponse.json({
      task_id: id,
      task_status: task?.status,
      pending_questions: questions || [],
      pending_specs: specs || [],
      pending_count: pendingCount,
      is_complete: isComplete,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to poll planning status' }, { status: 500 });
  }
}
