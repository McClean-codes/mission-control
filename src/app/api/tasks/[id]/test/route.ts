export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

type Params = {
  id: string;
};

export async function POST(request: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { test_type, test_data, result } = body;

    const activity = await db.createActivity({
      task_id: id,
      action: 'test',
      details: {
        test_type: test_type || 'manual',
        test_data: test_data || {},
        result: result || 'pending',
      },
    });

    if (result === 'passed') {
      await db.updateTask(id, { status: 'review' });
    }

    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create test' }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    const { id } = await params;

    const activities = await db.getActivities(id);
    const testActivities = activities.filter((a: any) => a.action === 'test');
    return NextResponse.json(testActivities);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch tests' }, { status: 500 });
  }
}
