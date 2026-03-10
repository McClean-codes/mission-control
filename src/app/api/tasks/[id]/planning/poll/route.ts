export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

type Params = {
  id: string;
};

export async function GET(request: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    const { id } = await params;

    const task = await db.getTask(id);
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const questions = await db.getPlanningQuestionsByTask(id);
    const specs = await db.getPlanningSpecsByTask(id);

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
