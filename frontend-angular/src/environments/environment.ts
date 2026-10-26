// Environment configuration for production
// NOTE: `supabasePublishableKey` is a Supabase client-side publishable key (anon key).
// In Supabase architecture, browser clients communicate directly with PostgREST using this public key.
// It is public by design and visible in HTTP request headers.
// SECURITY IS ENFORCED ON THE DATABASE VIA POSTGRESQL ROW LEVEL SECURITY (RLS) POLICIES, NOT BY HIDING THIS KEY.
// NEVER put Supabase `service_role` secret keys in this file or any frontend code.

export const environment = {
  production: true,
  supabaseUrl: 'https://ygquwwjbdorofqdnwdrr.supabase.co',
  supabasePublishableKey: 'sb_publishable_bH1jFjG9uoy2i0i5c2jMbw_cFasQnyr'
};
