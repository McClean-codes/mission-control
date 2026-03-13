'use client';

import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const handleLogin = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: 'https://hq.mcclean.codes/auth/callback' },
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-mc-bg">
      <div className="flex flex-col items-center gap-6 p-10 rounded-xl border border-mc-border bg-mc-bg-secondary">
        <h1 className="text-3xl font-bold text-mc-text">Mission Control</h1>
        <button
          onClick={handleLogin}
          className="px-6 py-3 bg-mc-accent text-mc-bg rounded hover:bg-mc-accent/90 font-medium flex items-center gap-2 transition-colors"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
