
-- Orders table
CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  order_date timestamp with time zone NOT NULL DEFAULT now(),
  delivery_date timestamp with time zone,
  status text NOT NULL DEFAULT 'pending',
  payment_method text,
  discount numeric NOT NULL DEFAULT 0,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Order items table
CREATE TABLE public.order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  plate_id uuid REFERENCES public.plates(id) ON DELETE SET NULL,
  plate_name text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  notes text
);

-- RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public access" ON public.orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON public.order_items FOR ALL USING (true) WITH CHECK (true);
