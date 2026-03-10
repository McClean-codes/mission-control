export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
export async function GET(r: NextRequest) { return NextResponse.json({}); }
export async function POST(r: NextRequest) { return NextResponse.json({}); }
export async function PATCH(r: NextRequest) { return NextResponse.json({}); }
