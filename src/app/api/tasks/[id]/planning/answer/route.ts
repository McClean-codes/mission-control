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
    const { question_id, answer } = body;

    if (!question_id || answer === undefined) {
      return NextResponse.json({ error: 'question_id and answer required' }, { status: 400 });
    }

    const question = await db.updatePlanningQuestion(question_id, { context: answer });
    return NextResponse.json(question);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to answer planning question' }, { status: 500 });
  }
}
