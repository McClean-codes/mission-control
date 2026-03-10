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
    const { test_type, test_data, result } = body;

    // Create a test activity
    const activityId = crypto.randomUUID();
    const { data, error } = await supabase
      .from('task_activities')
      .insert({
        id: activityId,
        task_id: id,
        activity_type: 'test',
        data: {
          test_type: test_type || 'manual',
          test_data: test_data || {},
          result: result || 'pending',
        },
      })
      .select()
      .single();

    if (error) throw error;

    // If result is 'passed', optionally transition task status
    if (result === 'passed') {
      await supabase
        .from('tasks')
        .update({ status: 'review' })
        .eq('id', id);
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create test' }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    const { id } = await params;

    const { data, error } = await supabase
      .from('task_activities')
      .select('*')
      .eq('task_id', id)
      .eq('activity_type', 'test')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch tests' }, { status: 500 });
  }
}
