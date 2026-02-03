
import { createClient } from '@supabase/supabase-js';

// NOTA: In un'app di produzione reale, queste variabili dovrebbero stare in un file .env.
// Per questo ambiente demo, le utilizziamo direttamente come fallback.
const PROVIDED_URL = 'https://cokyqhfxvvmrtkmlgcjm.supabase.co';
const PROVIDED_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNva3lxaGZ4dnZtcnRrbWxnY2ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMTMwMjQsImV4cCI6MjA4NTY4OTAyNH0.dN9w6CBfNjDRR02l8iiMMi0S_MiAVTJNwg1Ah-K10QA';

// Helper sicuro per recuperare variabili d'ambiente.
// Prova in ordine: `import.meta.env`, `process.env`, e variazioni con prefisso `VITE_`.
const readEnv = (key: string, fallback: string) => {
  // import.meta.env (Vite) — controlla sia la chiave diretta che la versione con VITE_ prefix
  try {
    const ime = (import.meta as any)?.env;
    if (ime) {
      if (ime[key]) return ime[key];
      const viteKey = `VITE_${key}`;
      if (ime[viteKey]) return ime[viteKey];
    }
  } catch (_) {}

  // process.env (node / define mappings)
  try {
    if (typeof process !== 'undefined' && process.env) {
      if ((process.env as any)[key]) return (process.env as any)[key];
      const viteKey = `VITE_${key}`;
      if ((process.env as any)[viteKey]) return (process.env as any)[viteKey];
    }
  } catch (_) {}

  // globalThis fallback (in case an env shim is injected)
  try {
    const g = (globalThis as any).__env || (globalThis as any).ENV || (globalThis as any).process?.env;
    if (g) {
      if (g[key]) return g[key];
      const viteKey = `VITE_${key}`;
      if (g[viteKey]) return g[viteKey];
    }
  } catch (_) {}

  return fallback;
};

const supabaseUrl = readEnv('SUPABASE_URL', PROVIDED_URL);
const supabaseAnonKey = readEnv('SUPABASE_ANON_KEY', PROVIDED_KEY);

// Verifichiamo se la configurazione è presente
export const isConfigured = !!(supabaseUrl && supabaseAnonKey);

// Inizializziamo il client solo se abbiamo le chiavi, altrimenti esportiamo null
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
