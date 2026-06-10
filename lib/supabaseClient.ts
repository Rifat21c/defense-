import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export function isRealSupabaseConfig(url = supabaseUrl, anonKey = supabaseAnonKey) {
  const normalizedUrl = url.trim().toLowerCase();
  const normalizedKey = anonKey.trim().toLowerCase();

  return Boolean(
    normalizedUrl &&
      normalizedKey &&
      normalizedUrl.startsWith("https://") &&
      normalizedUrl.endsWith(".supabase.co") &&
      !normalizedUrl.includes("example.supabase.co") &&
      !normalizedUrl.includes("your_") &&
      !normalizedUrl.includes("placeholder") &&
      !normalizedKey.includes("your_") &&
      !normalizedKey.includes("placeholder"),
  );
}

export const hasSupabaseConfig = isRealSupabaseConfig();

export const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
