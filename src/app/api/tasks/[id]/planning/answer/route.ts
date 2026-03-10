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
    const { question_id, answer } = body;

    if (!question_id || answer === undefined) {
      return NextResponse.json({ error: 'question_id and answer required' }, { status: 400 });
    }

    // Update the planning question with the answer
    const { data, error } = await supabase
      .from('planning_questions')
      .update({
        answer: answer,
        answered: true,
      })
      .eq('id', question_id)
      .eq('task_id', id)
      .select()
      .single();

    if (error?.code === 'PGRST116') {
      return NextResponse.json({ error: 'Planning question not found' }, { status: 404 });
    }
    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to answer planning question' }, { status: 500 });
  }
}
