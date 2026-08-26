import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(url && anonKey && url.startsWith('http'));

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, anonKey!)
  : null;

if (!isSupabaseConfigured) {
  console.info(
    '[Verge] Supabase not configured — using local India seed data. ' +
      'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in client/.env.local to enable the real backend.'
  );
}
