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
    const body = await request.json();
    const { question, context, category } = body;

    if (!question) {
      return NextResponse.json({ error: 'question required' }, { status: 400 });
    }

    const q = await db.createPlanningQuestion({
      question,
      context: context || undefined,
      category: category || undefined,
    });

    return NextResponse.json(q, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create planning question' }, { status: 500 });
  }
}
