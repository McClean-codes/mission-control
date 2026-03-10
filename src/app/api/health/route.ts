import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    await db.getWorkspaces()
    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    return NextResponse.json({ status: 'error', message: (error as any).message }, { status: 500 })
  }
}
