CREATE TABLE public.customers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  phone text DEFAULT NULL,
  email text DEFAULT NULL,
  address text DEFAULT NULL,
  dietary_restrictions text[] DEFAULT '{}',
  preferences text[] DEFAULT '{}',
  notes text DEFAULT NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public access" ON public.customers FOR ALL TO public USING (true) WITH CHECK (true);