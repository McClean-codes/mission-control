import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const { data, error } = await supabase.from('checkpoints').select('*').eq('id', id).single();
    if (error?.code === 'PGRST116') return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const updates: Record<string, any> = {};
    if (body.status !== undefined) updates.status = body.status;
    if (body.summary !== undefined) updates.summary = body.summary;
    if (body.metadata !== undefined) updates.metadata = body.metadata;

    if (!Object.keys(updates).length) return NextResponse.json({ error: 'No updates' }, { status: 400 });

    const { data, error } = await supabase.from('checkpoints').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const { error } = await supabase.from('checkpoints').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
