import { createClient } from '@supabase/supabase-js';

const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL;
let supabaseUrl = rawSupabaseUrl;
try {
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    supabaseUrl = `${window.location.origin}/supabase`;
  }
} catch (_) {}
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase = isConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null as any;

export const handleSupabaseError = (error: any, message: string) => {
  if (error) {
    console.error(`[Supabase Error] ${message}:`, error.message);
    return true;
  }
  return false;
};
