-- =============================================================================
-- TRUCK WEIGHT VERIFICATION SYSTEM
-- Migration: Authentication, RBAC (Admin/Operator Roles), RLS & Historic Snapshots
-- Safe to re-run
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. USER PROFILES & ROLES TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    role VARCHAR(50) NOT NULL DEFAULT 'operator' CHECK (role IN ('admin', 'operator', 'viewer')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Helper function: Check if current authenticated user is an Admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Helper function: Get role of current authenticated user
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1),
    'viewer'
  );
$$;

-- -----------------------------------------------------------------------------
-- 2. AUTOMATIC PROFILE CREATION TRIGGER (OAuth / Google / Email)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_count INT;
    assigned_role VARCHAR(50);
BEGIN
    -- Check predefined admin emails or first user
    IF LOWER(NEW.email) IN ('pheaktra.st67@gmail.com', 'lynasem99@gmail.com') THEN
        assigned_role := 'admin';
    ELSE
        SELECT COUNT(*) INTO user_count FROM public.profiles;
        IF user_count = 0 THEN
            assigned_role := 'admin';
        ELSE
            assigned_role := 'operator';
        END IF;
    END IF;

    INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'name',
            split_part(NEW.email, '@', 1)
        ),
        COALESCE(
            NEW.raw_user_meta_data->>'avatar_url',
            NEW.raw_user_meta_data->>'picture'
        ),
        assigned_role
    )
    ON CONFLICT (id) DO UPDATE
    SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
        avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
        updated_at = timezone('utc'::text, now());

    RETURN NEW;
END;
$$;

-- Drop existing trigger if any and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill existing auth.users into public.profiles if they aren't already there
INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
SELECT 
    id, 
    email,
    COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', split_part(email, '@', 1)),
    COALESCE(raw_user_meta_data->>'avatar_url', raw_user_meta_data->>'picture'),
    'admin' -- grant initial existing users admin
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 3. ENHANCE TRUCK RECORDS (Retention, Tolerance & Audit)
-- -----------------------------------------------------------------------------
ALTER TABLE public.truck_records
    ADD COLUMN IF NOT EXISTS tolerance_percent NUMERIC(5, 2) NOT NULL DEFAULT 0.40,
    ADD COLUMN IF NOT EXISTS driver_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255),
    ADD COLUMN IF NOT EXISTS updated_by_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- -----------------------------------------------------------------------------
-- 4. ENHANCE TRUCK RECORD ITEMS (Historical Master Data Snapshots)
-- -----------------------------------------------------------------------------
-- Ensure historic weighing records retain exact product details even if Master Data changes later
ALTER TABLE public.truck_record_items
    ADD COLUMN IF NOT EXISTS product_name_kh VARCHAR(255),
    ADD COLUMN IF NOT EXISTS product_name_en VARCHAR(255),
    ADD COLUMN IF NOT EXISTS packaging_spec VARCHAR(255),
    ADD COLUMN IF NOT EXISTS unit VARCHAR(50),
    ADD COLUMN IF NOT EXISTS image_url TEXT;

-- If product_id foreign key constraint is RESTRICT, allow SET NULL or keep cascade safe
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'truck_record_items_product_id_fkey'
    ) THEN
        ALTER TABLE public.truck_record_items 
            DROP CONSTRAINT truck_record_items_product_id_fkey;
        
        ALTER TABLE public.truck_record_items 
            ADD CONSTRAINT truck_record_items_product_id_fkey 
            FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 5. ROW-LEVEL SECURITY (RLS) POLICIES
-- -----------------------------------------------------------------------------

-- A. PROFILES TABLE RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read profiles" ON public.profiles;
CREATE POLICY "Allow read profiles" ON public.profiles
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own basic profile" ON public.profiles;
CREATE POLICY "Users can update own basic profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles" ON public.profiles
    FOR ALL USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- B. COMPANIES TABLE RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to companies" ON public.companies;
DROP POLICY IF EXISTS "Public read companies" ON public.companies;
DROP POLICY IF EXISTS "Admin full access on companies" ON public.companies;

CREATE POLICY "Public read companies" ON public.companies
    FOR SELECT USING (true);

CREATE POLICY "Admin full access on companies" ON public.companies
    FOR ALL
    TO authenticated
    USING (public.is_admin() OR auth.role() = 'authenticated')
    WITH CHECK (public.is_admin() OR auth.role() = 'authenticated');

-- C. PRODUCTS TABLE RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to products" ON public.products;
DROP POLICY IF EXISTS "Public read products" ON public.products;
DROP POLICY IF EXISTS "Admin full access on products" ON public.products;

CREATE POLICY "Public read products" ON public.products
    FOR SELECT USING (true);

CREATE POLICY "Admin full access on products" ON public.products
    FOR ALL
    TO authenticated
    USING (public.is_admin() OR auth.role() = 'authenticated')
    WITH CHECK (public.is_admin() OR auth.role() = 'authenticated');

-- D. TRUCK RECORDS TABLE RLS
ALTER TABLE public.truck_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read truck records" ON public.truck_records;
DROP POLICY IF EXISTS "Allow insert truck records" ON public.truck_records;
DROP POLICY IF EXISTS "Allow update truck records" ON public.truck_records;
DROP POLICY IF EXISTS "Allow delete truck records" ON public.truck_records;
DROP POLICY IF EXISTS "Admin update truck records" ON public.truck_records;
DROP POLICY IF EXISTS "Admin delete truck records" ON public.truck_records;

-- Read: Everyone (authenticated & anon for reports)
CREATE POLICY "Allow read truck records" ON public.truck_records
    FOR SELECT USING (true);

-- Insert: Any authenticated user (or anon if fallback mode enabled)
CREATE POLICY "Allow insert truck records" ON public.truck_records
    FOR INSERT WITH CHECK (true);

-- Update: Admin only
CREATE POLICY "Admin update truck records" ON public.truck_records
    FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Delete: Admin only
CREATE POLICY "Admin delete truck records" ON public.truck_records
    FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- E. TRUCK RECORD ITEMS TABLE RLS
ALTER TABLE public.truck_record_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read truck items" ON public.truck_record_items;
DROP POLICY IF EXISTS "Allow insert truck items" ON public.truck_record_items;
DROP POLICY IF EXISTS "Allow update truck items" ON public.truck_record_items;
DROP POLICY IF EXISTS "Allow delete truck items" ON public.truck_record_items;
DROP POLICY IF EXISTS "Admin update truck items" ON public.truck_record_items;
DROP POLICY IF EXISTS "Admin delete truck items" ON public.truck_record_items;

CREATE POLICY "Allow read truck items" ON public.truck_record_items
    FOR SELECT USING (true);

CREATE POLICY "Allow insert truck items" ON public.truck_record_items
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin update truck items" ON public.truck_record_items
    FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Admin delete truck items" ON public.truck_record_items
    FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- 6. ADMIN UTILITY PROCEDURE (To promote an email to Admin)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_user_as_admin(target_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    found_id UUID;
BEGIN
    SELECT id INTO found_id FROM auth.users WHERE email = target_email LIMIT 1;
    IF found_id IS NULL THEN
        RETURN 'Error: User with email ' || target_email || ' not found in auth.users';
    END IF;

    INSERT INTO public.profiles (id, email, role)
    VALUES (found_id, target_email, 'admin')
    ON CONFLICT (id) DO UPDATE SET role = 'admin', updated_at = now();

    RETURN 'Success: ' || target_email || ' is now an Admin!';
END;
$$;
