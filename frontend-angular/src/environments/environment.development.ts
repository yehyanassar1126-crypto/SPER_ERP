// Environment configuration for local development
// NOTE: `supabasePublishableKey` / `supabaseKey` is a public client-side key for PostgREST routing.
// Sensitive operations and Row-Level Security policies are enforced at the PostgreSQL database layer.
// NEVER put Supabase `service_role` secret keys in this file or any frontend code.

export const environment = {
  production: false,
  supabaseUrl: 'https://ygquwwjbdorofqdnwdrr.supabase.co',
  supabaseKey: 'sb_publishable_bH1jFjG9uoy2i0i5c2jMbw_cFasQnyr',
  supabasePublishableKey: 'sb_publishable_bH1jFjG9uoy2i0i5c2jMbw_cFasQnyr',
  supabaseAnonKey: 'sb_publishable_bH1jFjG9uoy2i0i5c2jMbw_cFasQnyr'
};
