// Supabase configuration
// NOTE: `supabaseKey` / `supabasePublishableKey` / `supabaseAnonKey` is a Supabase client-side publishable key.
// Browser clients communicate directly with PostgREST using this public key.
// SECURITY IS ENFORCED ON THE DATABASE VIA POSTGRESQL ROW LEVEL SECURITY (RLS) POLICIES.
// NEVER put Supabase `service_role` secret keys in frontend code.

export interface Environment {
  production: boolean;
  supabaseUrl: string;
  supabaseKey: string;
  supabasePublishableKey: string;
  supabaseAnonKey: string;
}

const DEFAULT_SUPABASE_URL = 'https://ygquwwjbdorofqdnwdrr.supabase.co';
const DEFAULT_SUPABASE_KEY = 'sb_publishable_bH1jFjG9uoy2i0i5c2jMbw_cFasQnyr';

export const environment: Environment = {
  production: false,
  supabaseUrl: (typeof window !== 'undefined' && (window as any).__ENV?.SUPABASE_URL) || DEFAULT_SUPABASE_URL,
  supabaseKey: (typeof window !== 'undefined' && (window as any).__ENV?.SUPABASE_KEY) || (typeof window !== 'undefined' && (window as any).__ENV?.SUPABASE_ANON_KEY) || DEFAULT_SUPABASE_KEY,
  supabasePublishableKey: (typeof window !== 'undefined' && (window as any).__ENV?.SUPABASE_KEY) || (typeof window !== 'undefined' && (window as any).__ENV?.SUPABASE_ANON_KEY) || DEFAULT_SUPABASE_KEY,
  supabaseAnonKey: (typeof window !== 'undefined' && (window as any).__ENV?.SUPABASE_KEY) || (typeof window !== 'undefined' && (window as any).__ENV?.SUPABASE_ANON_KEY) || DEFAULT_SUPABASE_KEY
};
