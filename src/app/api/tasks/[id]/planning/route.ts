export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

type Params = {
  id: string;
};

export async function GET(request: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    const { id } = await params;

    const questions = await db.getPlanningQuestionsByTask(id);
    return NextResponse.json(questions);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch planning questions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    const { id } = await params;

    const task = await db.getTask(id);
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Mark task as planning
    await db.updateTask(id, { status: 'planning' });

    // Return session scaffold — agent (Edison) will write questions via planning API
    // Frontend polls /planning/poll for questions as they arrive
    return NextResponse.json({
      sessionKey: `planning-${id}`,
      messages: [],
      isStarted: true,
      task_id: id,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : JSON.stringify(error);
    console.error('[planning] POST error:', msg);
    return NextResponse.json({ error: 'Failed to start planning', detail: msg }, { status: 500 });
  }
}
