import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const checkpoint = await db.getCheckpointById(id);
    if (!checkpoint) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(checkpoint);
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

    const checkpoint = await db.updateCheckpointById(id, updates);
    return NextResponse.json(checkpoint);
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await db.deleteCheckpointById(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
