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
      .from('task_deliverables')
      .select('*')
      .eq('task_id', id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch deliverables' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, description, status, url } = body;

    if (!title) {
      return NextResponse.json({ error: 'title required' }, { status: 400 });
    }

    const deliverableId = crypto.randomUUID();
    const { data, error } = await supabase
      .from('task_deliverables')
      .insert({
        id: deliverableId,
        task_id: id,
        title,
        description: description || null,
        status: status || 'pending',
        url: url || null,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create deliverable' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    const body = await request.json();
    const { id: deliverableId, status, url, description } = body;

    if (!deliverableId) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }

    const updates: any = {};
    if (status) updates.status = status;
    if (url) updates.url = url;
    if (description !== undefined) updates.description = description;

    const { data, error } = await supabase
      .from('task_deliverables')
      .update(updates)
      .eq('id', deliverableId)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update deliverable' }, { status: 500 });
  }
}
