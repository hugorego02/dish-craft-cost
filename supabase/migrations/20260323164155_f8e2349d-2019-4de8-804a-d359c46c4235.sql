
-- Ingredients table
CREATE TABLE public.ingredients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  price NUMERIC NOT NULL DEFAULT 0,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'kg',
  supplier TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Yield factors table
CREATE TABLE public.yield_factors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ingredient_id UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
  raw_weight NUMERIC NOT NULL DEFAULT 0,
  cooked_weight NUMERIC NOT NULL DEFAULT 0,
  factor NUMERIC NOT NULL DEFAULT 1,
  method TEXT,
  notes TEXT
);

-- Food components table
CREATE TABLE public.components (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  ingredient_id UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
  yield_factor_id UUID REFERENCES public.yield_factors(id) ON DELETE SET NULL,
  served_weight NUMERIC NOT NULL DEFAULT 0,
  food_group TEXT NOT NULL DEFAULT 'extra',
  notes TEXT
);

-- Plate sizes table
CREATE TABLE public.plate_sizes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  total_weight NUMERIC NOT NULL DEFAULT 0,
  groups JSONB NOT NULL DEFAULT '[]'::jsonb,
  active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT
);

-- Plates table
CREATE TABLE public.plates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  plate_size_id UUID NOT NULL REFERENCES public.plate_sizes(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'standard',
  components JSONB NOT NULL DEFAULT '[]'::jsonb,
  extra_cost_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  manual_price NUMERIC,
  pricing_method TEXT NOT NULL DEFAULT 'manual',
  markup_or_margin NUMERIC,
  notes TEXT,
  active BOOLEAN NOT NULL DEFAULT true
);

-- Extra costs table
CREATE TABLE public.extra_costs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  value NUMERIC NOT NULL DEFAULT 0,
  apply_per TEXT NOT NULL DEFAULT 'plate',
  category TEXT NOT NULL DEFAULT '',
  notes TEXT
);

-- Disable RLS for now (no auth)
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yield_factors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plate_sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extra_costs ENABLE ROW LEVEL SECURITY;

-- Public access policies (no auth)
CREATE POLICY "Public access" ON public.ingredients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON public.yield_factors FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON public.components FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON public.plate_sizes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON public.plates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON public.extra_costs FOR ALL USING (true) WITH CHECK (true);
