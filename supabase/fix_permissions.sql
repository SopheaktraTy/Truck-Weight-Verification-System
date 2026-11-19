-- ============================================================================
-- FULL FIX PERMISSIONS: Companies, Products, Truck Records, Items & Storage
-- Run this in your Supabase Dashboard -> SQL Editor -> Click 'Run'
-- ============================================================================

-- 1. COMPANIES (Full CRUD for anon & authenticated)
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to companies" ON public.companies;
DROP POLICY IF EXISTS "Allow public read-only on companies" ON public.companies;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.companies;
DROP POLICY IF EXISTS "Enable all access for all users" ON public.companies;
DROP POLICY IF EXISTS "Public read companies" ON public.companies;
DROP POLICY IF EXISTS "Admin full access on companies" ON public.companies;

CREATE POLICY "Allow all access to companies" ON public.companies
  FOR ALL
  TO public, anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 2. PRODUCTS (Full CRUD for anon & authenticated)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to products" ON public.products;
DROP POLICY IF EXISTS "Allow public read-only on products" ON public.products;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.products;
DROP POLICY IF EXISTS "Enable all access for all users" ON public.products;
DROP POLICY IF EXISTS "Public read products" ON public.products;
DROP POLICY IF EXISTS "Admin full access on products" ON public.products;

CREATE POLICY "Allow all access to products" ON public.products
  FOR ALL
  TO public, anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 3. TRUCK RECORDS (Full CRUD for anon & authenticated)
ALTER TABLE public.truck_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read truck records" ON public.truck_records;
DROP POLICY IF EXISTS "Allow insert truck records" ON public.truck_records;
DROP POLICY IF EXISTS "Allow update truck records" ON public.truck_records;
DROP POLICY IF EXISTS "Allow delete truck records" ON public.truck_records;
DROP POLICY IF EXISTS "Admin update truck records" ON public.truck_records;
DROP POLICY IF EXISTS "Admin delete truck records" ON public.truck_records;
DROP POLICY IF EXISTS "Allow all access to truck records" ON public.truck_records;

CREATE POLICY "Allow all access to truck records" ON public.truck_records
  FOR ALL
  TO public, anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 4. TRUCK RECORD ITEMS (Full CRUD for anon & authenticated)
ALTER TABLE public.truck_record_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read truck items" ON public.truck_record_items;
DROP POLICY IF EXISTS "Allow insert truck items" ON public.truck_record_items;
DROP POLICY IF EXISTS "Allow update truck items" ON public.truck_record_items;
DROP POLICY IF EXISTS "Allow delete truck items" ON public.truck_record_items;
DROP POLICY IF EXISTS "Admin update truck items" ON public.truck_record_items;
DROP POLICY IF EXISTS "Admin delete truck items" ON public.truck_record_items;
DROP POLICY IF EXISTS "Allow all access to truck items" ON public.truck_record_items;

CREATE POLICY "Allow all access to truck items" ON public.truck_record_items
  FOR ALL
  TO public, anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 5. PROFILES (Full access)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own basic profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

CREATE POLICY "Allow all access to profiles" ON public.profiles
  FOR ALL
  TO public, anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 6. Grant Admin role to predefined admin emails in public.profiles
INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', split_part(email, '@', 1)),
    'admin'
FROM auth.users
WHERE LOWER(email) IN ('pheaktra.st67@gmail.com', 'lynasem99@gmail.com')
ON CONFLICT (id) DO UPDATE SET role = 'admin';

UPDATE public.profiles
SET role = 'admin'
WHERE LOWER(email) IN ('pheaktra.st67@gmail.com', 'lynasem99@gmail.com');

-- 7. Ensure 'inventory-assets' storage bucket is Public and permits all uploads/deletes
INSERT INTO storage.buckets (id, name, public)
VALUES ('inventory-assets', 'inventory-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Allow public uploads to inventory-assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read of inventory-assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow public all on inventory-assets" ON storage.objects;

CREATE POLICY "Allow public all on inventory-assets" ON storage.objects
  FOR ALL
  TO public, anon, authenticated
  USING (bucket_id = 'inventory-assets')
  WITH CHECK (bucket_id = 'inventory-assets');
