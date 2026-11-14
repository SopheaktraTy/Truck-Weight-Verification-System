-- ============================================================================
-- FIX PERMISSIONS: Companies, Products & Image Storage in Supabase
-- Run this in your Supabase Dashboard -> SQL Editor -> Click 'Run'
-- ============================================================================

-- 1. Ensure Full Access (SELECT, INSERT, UPDATE, DELETE) for 'companies'
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to companies" ON public.companies;
DROP POLICY IF EXISTS "Allow public read-only on companies" ON public.companies;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.companies;
DROP POLICY IF EXISTS "Enable all access for all users" ON public.companies;

CREATE POLICY "Allow all access to companies" ON public.companies
  FOR ALL
  TO public, anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 2. Ensure Full Access (SELECT, INSERT, UPDATE, DELETE) for 'products'
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to products" ON public.products;
DROP POLICY IF EXISTS "Allow public read-only on products" ON public.products;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.products;
DROP POLICY IF EXISTS "Enable all access for all users" ON public.products;

CREATE POLICY "Allow all access to products" ON public.products
  FOR ALL
  TO public, anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 3. Ensure 'inventory-assets' storage bucket is Public and permits uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('inventory-assets', 'inventory-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Allow public uploads to inventory-assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read of inventory-assets" ON storage.objects;

CREATE POLICY "Allow public all on inventory-assets" ON storage.objects
  FOR ALL
  TO public, anon, authenticated
  USING (bucket_id = 'inventory-assets')
  WITH CHECK (bucket_id = 'inventory-assets');
