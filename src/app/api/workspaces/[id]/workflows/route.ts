export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

type Params = {
  id: string;
};

export async function GET(request: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    const { id } = await params;
    const templates = await db.getWorkflowTemplates(id);
    return NextResponse.json(templates);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch workflows' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, stages, fail_targets, is_default, description } = body;

    if (!name || !stages) {
      return NextResponse.json({ error: 'name and stages required' }, { status: 400 });
    }

    const template = await db.createWorkflowTemplate({
      workspace_id: id,
      name,
      description: description || undefined,
      stages,
      fail_targets: fail_targets || {},
      is_default: is_default || false,
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create workflow' }, { status: 500 });
  }
}
