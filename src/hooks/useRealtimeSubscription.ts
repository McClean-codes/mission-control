'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/db';

type RealtimeCallback = (payload: any) => void;

/**
 * Hook to subscribe to Supabase Realtime changes.
 * Automatically no-ops when DATABASE_PROVIDER is not 'supabase'.
 *
 * @param table - Table name to subscribe to
 * @param filter - Optional filter string (e.g., "workspace_id=eq.123")
 * @param callback - Function called when changes occur
 */
export function useRealtimeSubscription(
  table: string,
  filter: string | undefined,
  callback: RealtimeCallback
) {
  const isSupabaseMode = process.env.NEXT_PUBLIC_DATABASE_PROVIDER === 'supabase';

  useEffect(() => {
    if (!isSupabaseMode) {
      return; // no-op in SQLite mode
    }

    const channel = supabase
      .channel(`realtime-${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table, filter }, callback)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, filter, callback, isSupabaseMode]);
}
