CREATE TABLE IF NOT EXISTS public.legal_issues (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  reported_by uuid REFERENCES public.users(id),
  reported_name text,
  status text DEFAULT 'open',
  assigned_to text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Turn on RLS
ALTER TABLE public.legal_issues ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Allow all access to legal_issues" ON public.legal_issues FOR ALL USING (true);
