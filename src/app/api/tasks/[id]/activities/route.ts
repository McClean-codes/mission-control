export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

type Params = {
  id: string;
};

export async function GET(request: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    const { id } = await params;
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '100');

    const { data, error } = await supabase
      .from('task_activities')
      .select('*')
      .eq('task_id', id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { activity_type, data, agent_id } = body;

    if (!activity_type) {
      return NextResponse.json({ error: 'activity_type required' }, { status: 400 });
    }

    const activityId = crypto.randomUUID();
    const { data: result, error } = await supabase
      .from('task_activities')
      .insert({
        id: activityId,
        task_id: id,
        activity_type,
        data: data || {},
        agent_id: agent_id || null,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create activity' }, { status: 500 });
  }
}
