export interface Environment {
  production: boolean;
  supabaseUrl: string;
  supabaseAnonKey: string;
}

export const environment: Environment = {
  production: true,
  supabaseUrl: (typeof window !== 'undefined' && (window as any).__ENV?.SUPABASE_URL) || '',
  supabaseAnonKey: (typeof window !== 'undefined' && (window as any).__ENV?.SUPABASE_ANON_KEY) || ''
};
