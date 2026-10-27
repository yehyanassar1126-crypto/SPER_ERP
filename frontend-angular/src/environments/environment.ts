// Supabase configuration
// NOTE: `supabaseKey` / `supabasePublishableKey` is a Supabase client-side publishable key (anon key).
// In Supabase architecture, browser clients communicate directly with PostgREST using this public key.
// It is public by design and visible in HTTP request headers.
// SECURITY IS ENFORCED ON THE DATABASE VIA POSTGRESQL ROW LEVEL SECURITY (RLS) POLICIES.
// NEVER put Supabase `service_role` secret keys in frontend code.

export const environment = {
  production: false,
  supabaseUrl: 'https://ygquwwjbdorofqdnwdrr.supabase.co',
  supabaseKey: 'sb_publishable_bH1jFjG9uoy2i0i5c2jMbw_cFasQnyr',
  supabasePublishableKey: 'sb_publishable_bH1jFjG9uoy2i0i5c2jMbw_cFasQnyr'
};
