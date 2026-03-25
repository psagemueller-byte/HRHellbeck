import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Client-side Supabase client (uses anon key, respects RLS)
export const supabase: SupabaseClient | null =
  isValidUrl(supabaseUrl) && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

// Server-side Supabase client (uses service role key, bypasses RLS)
// Only use in API routes / server actions
export const supabaseAdmin: SupabaseClient | null =
  isValidUrl(supabaseUrl) && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

export const STORAGE_BUCKET = "uploads";
