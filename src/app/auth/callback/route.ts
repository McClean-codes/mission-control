import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(`${origin}/login?error=auth_failed`);
    }

    // Allowlist check
    const allowedEmails = (process.env.ALLOWED_EMAILS || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    if (allowedEmails.length > 0) {
      const { data: { user } } = await supabase.auth.getUser();
      const email = user?.email?.toLowerCase() ?? '';

      if (!allowedEmails.includes(email)) {
        // Sign out the unauthorized user before redirecting
        await supabase.auth.signOut();
        return NextResponse.redirect(`${origin}/login?error=unauthorized`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/`);
}
