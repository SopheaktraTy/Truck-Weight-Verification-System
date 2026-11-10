-- =============================================================================
-- TRUCK WEIGHT VERIFICATION SYSTEM (ប្រព័ន្ធផ្ទៀងផ្ទាត់ទម្ងន់រថយន្ត)
-- Initial Schema Migration (Safe to Re-run)
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. COMPANIES TABLE (ក្រុមហ៊ុន)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,       -- 'HB', 'PCAM'
    name VARCHAR(255) NOT NULL,              -- 'Hanuman Beverages', 'PCAM Trading'
    logo_url TEXT,                           -- Supabase Storage URL
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- -----------------------------------------------------------------------------
-- 2. PRODUCTS TABLE (មុខទំនិញ Master Data)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
    name_en VARCHAR(255) NOT NULL,           -- e.g. 'RAM', 'King Kong'
    name_kh VARCHAR(255) NOT NULL,           -- e.g. 'រេម', 'គីងកុង'
    packaging_spec VARCHAR(255) NOT NULL,    -- 'Sleek 250ml x 24 Can', '100 x 120'
    unit VARCHAR(50) NOT NULL,               -- 'កេស' (Case), 'ប៉ាឡែត' (Pallet)
    unit_weight_kg NUMERIC(10, 3) NOT NULL,  -- e.g. 6.650, 6.700, 19.700, 20.200
    image_url TEXT,                          -- Product photo URL
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_products_company_id ON public.products(company_id);

-- -----------------------------------------------------------------------------
-- 3. TRUCK RECORDS TABLE (របាយការណ៍ទម្ងន់រថយន្ត)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.truck_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plate_number VARCHAR(50) NOT NULL,       -- e.g. '3G-2487'
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
    record_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Scale weights (ទម្ងន់ពីជញ្ជីង)
    scale_in_kg NUMERIC(12, 2) NOT NULL DEFAULT 0,    -- ទម្ងន់ឡានចូល (R4)
    scale_out_kg NUMERIC(12, 2) NOT NULL DEFAULT 0,   -- ទម្ងន់ឡានចេញ (R5)
    scale_net_kg NUMERIC(12, 2) NOT NULL DEFAULT 0,   -- សរុបទម្ងន់ពីជញ្ជីង (R6 = R5 - R4)
    
    -- Warehouse calculated cargo weights (ទម្ងន់ទំនិញពីឃ្លាំង)
    warehouse_total_kg NUMERIC(12, 2) NOT NULL DEFAULT 0, -- សរុបទម្ងន់ពីឃ្លាំង (R7 = SUM(I5:I11))
    
    -- Verification metrics (លទ្ធផលផ្ទៀងផ្ទាត់)
    diff_kg NUMERIC(12, 2) NOT NULL DEFAULT 0,            -- គិតជាគីឡូក្រាម (R13 = R6 - R7)
    diff_percent NUMERIC(8, 4) NOT NULL DEFAULT 0,        -- គិតជាភាគរយ (R12 = R13 / R6 * 100)
    status VARCHAR(50) NOT NULL,                          -- 'អនុញ្ញាត' (APPROVED) or 'ត្រួតពិនិត្យ' (INSPECT)
    status_message VARCHAR(255) NOT NULL,                 -- 'លើស X គីឡូ' or 'ខ្វះ (-X) គីឡូ'
    
    -- Metadata & Auditing
    operator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    operator_name VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_truck_records_date ON public.truck_records(record_date);
CREATE INDEX IF NOT EXISTS idx_truck_records_plate ON public.truck_records(plate_number);
CREATE INDEX IF NOT EXISTS idx_truck_records_status ON public.truck_records(status);
CREATE INDEX IF NOT EXISTS idx_truck_records_company ON public.truck_records(company_id);

-- -----------------------------------------------------------------------------
-- 4. TRUCK RECORD ITEMS TABLE (មុខទំនិញលម្អិតក្នុងរថយន្ត)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.truck_record_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    record_id UUID NOT NULL REFERENCES public.truck_records(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity NUMERIC(10, 2) NOT NULL,                     -- ចំនួន (G5:G11)
    unit_weight_kg NUMERIC(10, 3) NOT NULL,               -- ទម្ងន់១កេស Snapshot (C5:C11)
    total_weight_kg NUMERIC(12, 3) NOT NULL,              -- គណនាជាគីឡូ = Qty * UnitWeight (I5:I11)
    total_weight_ton NUMERIC(12, 4) NOT NULL,             -- តោន = total_weight_kg / 1000 (J5:J11)
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_truck_items_record_id ON public.truck_record_items(record_id);

-- -----------------------------------------------------------------------------
-- 5. SYSTEM SETTINGS TABLE (ការកំណត់ប្រព័ន្ធ)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- -----------------------------------------------------------------------------
-- 6. ROW-LEVEL SECURITY (RLS) POLICIES (Safe to re-run)
-- -----------------------------------------------------------------------------
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.truck_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.truck_record_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first so re-running never errors
DROP POLICY IF EXISTS "Public read companies" ON public.companies;
CREATE POLICY "Public read companies" ON public.companies FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read products" ON public.products;
CREATE POLICY "Public read products" ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read settings" ON public.system_settings;
CREATE POLICY "Public read settings" ON public.system_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow read truck records" ON public.truck_records;
CREATE POLICY "Allow read truck records" ON public.truck_records FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert truck records" ON public.truck_records;
CREATE POLICY "Allow insert truck records" ON public.truck_records FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update truck records" ON public.truck_records;
CREATE POLICY "Allow update truck records" ON public.truck_records FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow read truck items" ON public.truck_record_items;
CREATE POLICY "Allow read truck items" ON public.truck_record_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert truck items" ON public.truck_record_items;
CREATE POLICY "Allow insert truck items" ON public.truck_record_items FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update truck items" ON public.truck_record_items;
CREATE POLICY "Allow update truck items" ON public.truck_record_items FOR UPDATE USING (true);
