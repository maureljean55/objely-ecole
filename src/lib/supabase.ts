import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// The borne talks to the database as an anonymous visitor and only ever calls the kiosk_* / pair_kiosk functions.
// It has no account and no session: its identity is the token it received when it was paired.
let client: SupabaseClient | null | undefined;

export function getSupabase(): SupabaseClient | null {
  if (client !== undefined) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  client = url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }) : null;
  return client;
}
