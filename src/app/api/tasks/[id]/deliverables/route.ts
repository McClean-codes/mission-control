export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

type Params = {
  id: string;
};

export async function GET(request: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    const { id } = await params;

    const deliverables = await db.getDeliverables(id);
    return NextResponse.json(deliverables);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch deliverables' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, status, url } = body;

    if (!name) {
      return NextResponse.json({ error: 'name required' }, { status: 400 });
    }

    const deliverable = await db.createDeliverable({
      task_id: id,
      name,
      description: description || undefined,
      status: (status || 'pending') as 'pending' | 'in_progress' | 'completed' | 'rejected',
      url: url || undefined,
    });

    return NextResponse.json(deliverable, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create deliverable' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    const body = await request.json();
    const { id: deliverableId, ...updates } = body;

    if (!deliverableId) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }

    const deliverable = await db.updateDeliverable(deliverableId, updates);
    return NextResponse.json(deliverable);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update deliverable' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }

    await db.deleteDeliverable(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete deliverable' }, { status: 500 });
  }
}
