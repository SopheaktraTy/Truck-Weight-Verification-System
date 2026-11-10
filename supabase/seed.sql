-- =============================================================================
-- TRUCK WEIGHT VERIFICATION SYSTEM
-- Seed Master Data (Companies, Products from Excel Source sheet, Settings)
-- =============================================================================

-- 1. Insert Companies
INSERT INTO public.companies (code, name, logo_url, description)
VALUES 
  ('HB', 'Hanuman Beverages', 'https://images.unsplash.com/photo-1543083477-4f785aeafaa9?w=300&auto=format&fit=crop&q=80', 'Hanuman Beverages Co., Ltd.'),
  ('PCAM', 'PCAM Trading', 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=300&auto=format&fit=crop&q=80', 'PCAM Trading International')
ON CONFLICT (code) DO UPDATE 
SET name = EXCLUDED.name,
    logo_url = EXCLUDED.logo_url;

-- 2. Insert Products for HB (Hanuman Beverages)
WITH hb AS (SELECT id FROM public.companies WHERE code = 'HB' LIMIT 1)
INSERT INTO public.products (company_id, name_en, name_kh, packaging_spec, unit, unit_weight_kg, image_url, display_order)
VALUES
  ((SELECT id FROM hb), 'King Kong', 'គីងកុង', 'Sleek 250ml x 24 Can', 'កេស', 6.650, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300&auto=format&fit=crop&q=80', 1),
  ((SELECT id FROM hb), 'King Kong Ice', 'គីងកុងអាយស៏', 'Sleek 250ml x 24 Can', 'កេស', 6.500, 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=300&auto=format&fit=crop&q=80', 2),
  ((SELECT id FROM hb), 'Plastic Pallet Hanuman', 'ប៉ាឡែតជ័រ ហនុមាន', '100 x 120', 'ប៉ាឡែត', 19.700, 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=300&auto=format&fit=crop&q=80', 3);

-- 3. Insert Products for PCAM
WITH pcam AS (SELECT id FROM public.companies WHERE code = 'PCAM' LIMIT 1)
INSERT INTO public.products (company_id, name_en, name_kh, packaging_spec, unit, unit_weight_kg, image_url, display_order)
VALUES
  ((SELECT id FROM pcam), 'RAM', 'រេម', 'Sleek 250ml x 24 Can', 'កេស', 6.700, 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=300&auto=format&fit=crop&q=80', 1),
  ((SELECT id FROM pcam), 'RAM ICE', 'រេមអាយស៏', 'Slim 250ml x 24 Can', 'កេស', 6.700, 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=300&auto=format&fit=crop&q=80', 2),
  ((SELECT id FROM pcam), 'XTREME', 'អិចស្រ្ទីម', 'Slim 250ml x 24 Can', 'កេស', 6.500, 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=300&auto=format&fit=crop&q=80', 3),
  ((SELECT id FROM pcam), 'Plastic Pallet PCAM', 'ប៉ាឡែតជ័រ ភីខេម', '100 x 120', 'ប៉ាឡែត', 20.200, 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=300&auto=format&fit=crop&q=80', 4);

-- 4. Insert System Settings
INSERT INTO public.system_settings (key, value, description)
VALUES 
  ('weight_tolerance_percent', '0.40'::jsonb, 'Standard scale weight discrepancy threshold in percentage (+/- 0.4%)'),
  ('default_company', '"PCAM"'::jsonb, 'Default company pre-selected on weigh-in screen'),
  ('notification_enabled', 'true'::jsonb, 'Toggle whether webhook alerts are dispatched to n8n')
ON CONFLICT (key) DO UPDATE 
SET value = EXCLUDED.value;
