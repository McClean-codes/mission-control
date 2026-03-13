import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/db/supabase/client';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const taskId = params.id;
  const formData = await req.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  const allowedTypes = ['image/png', 'image/jpeg', 'image/jfif', 'image/pjpeg'];
  if (
    !allowedTypes.includes(file.type) &&
    !file.name.match(/\.(png|jpe?g|jfif)$/i)
  ) {
    return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
  }

  const timestamp = Date.now();
  const storagePath = `tasks/${taskId}/${timestamp}-${file.name}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from('task-images')
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: { publicUrl } } = supabase.storage
    .from('task-images')
    .getPublicUrl(storagePath);

  const { data, error: dbError } = await supabase
    .from('task_images')
    .insert({
      task_id: taskId,
      storage_path: storagePath,
      url: publicUrl,
      filename: file.name,
    })
    .select()
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { data, error } = await supabase
    .from('task_images')
    .select('id, url, filename, created_at')
    .eq('task_id', params.id)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json([], { status: 200 });
  }

  return NextResponse.json(data || []);
}
