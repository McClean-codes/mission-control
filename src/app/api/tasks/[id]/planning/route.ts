export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

type Params = {
  id: string;
};

export async function GET(request: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    const { id } = await params;

    // Get planning questions for this task
    const { data, error } = await supabase
      .from('planning_questions')
      .select('*')
      .eq('task_id', id)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch planning questions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { question, options, required } = body;

    if (!question) {
      return NextResponse.json({ error: 'question required' }, { status: 400 });
    }

    const questionId = crypto.randomUUID();
    const { data, error } = await supabase
      .from('planning_questions')
      .insert({
        id: questionId,
        task_id: id,
        question,
        options: options || [],
        answer: null,
        required: required || false,
        answered: false,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create planning question' }, { status: 500 });
  }
}
