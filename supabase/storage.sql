-- =============================================================================
-- TRUCK WEIGHT VERIFICATION SYSTEM
-- Supabase Storage Configuration (Safe to Re-run)
-- =============================================================================

-- 1. Create the public storage bucket for inventory assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('inventory-assets', 'inventory-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Public Read Inventory Assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload Inventory Assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update Inventory Assets" ON storage.objects;

-- 3. Allow public access to view images
CREATE POLICY "Public Read Inventory Assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'inventory-assets');

-- 4. Allow authenticated/anon users to upload new images
CREATE POLICY "Authenticated Upload Inventory Assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'inventory-assets');

-- 5. Allow users to update/replace images
CREATE POLICY "Authenticated Update Inventory Assets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'inventory-assets');
