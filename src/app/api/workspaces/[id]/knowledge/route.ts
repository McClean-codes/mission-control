export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

type Params = {
  id: string;
};

export async function GET(request: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    const { id } = await params;
    const q = request.nextUrl.searchParams.get('q') || '';
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '100');

    let query = supabase
      .from('knowledge_entries')
      .select('*')
      .eq('workspace_id', id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (q) {
      query = query.or(`title.ilike.%${q}%,content.ilike.%${q}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch knowledge entries' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, content, category, tags } = body;

    if (!title || !content) {
      return NextResponse.json({ error: 'title and content required' }, { status: 400 });
    }

    const entryId = crypto.randomUUID();
    const { data, error } = await supabase
      .from('knowledge_entries')
      .insert({
        id: entryId,
        workspace_id: id,
        title,
        content,
        category: category || null,
        tags: tags || [],
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create knowledge entry' }, { status: 500 });
  }
}
