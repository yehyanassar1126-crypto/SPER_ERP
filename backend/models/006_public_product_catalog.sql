-- ============================================================
-- Public Product Catalog & Customer Registration System
-- ============================================================

-- 1. Product Categories
CREATE TABLE IF NOT EXISTS product_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  slug TEXT UNIQUE,
  description_ar TEXT,
  description_en TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Products
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  slug TEXT UNIQUE,
  code TEXT,
  sku TEXT,
  barcode TEXT,
  category_id UUID REFERENCES product_categories(id),
  material TEXT,
  color TEXT,
  size TEXT,
  length NUMERIC,
  width NUMERIC,
  thickness NUMERIC,
  weight NUMERIC,
  diameter NUMERIC,
  grade TEXT,
  usage_ar TEXT,
  usage_en TEXT,
  technical_specs JSONB,
  packaging TEXT,
  unit TEXT DEFAULT 'Piece',
  moq INTEGER DEFAULT 1,
  tags TEXT[],
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
  is_public BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  description_ar TEXT,
  description_en TEXT,
  
  -- Internal fields (Hidden from public)
  cost NUMERIC(14,2) DEFAULT 0,
  selling_price NUMERIC(14,2) DEFAULT 0,
  profit_margin NUMERIC(5,2) DEFAULT 0,
  min_stock INTEGER DEFAULT 0,
  current_stock INTEGER DEFAULT 0,
  reserved_stock INTEGER DEFAULT 0,
  internal_notes TEXT,
  
  -- Metrics
  views INTEGER DEFAULT 0,
  
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Product Images
CREATE TABLE IF NOT EXISTS product_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  is_main BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0
);

-- 4. Product Documents
CREATE TABLE IF NOT EXISTS product_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  title_ar TEXT,
  title_en TEXT,
  file_url TEXT NOT NULL,
  doc_type TEXT, -- datasheet, certificate, manual
  is_public BOOLEAN DEFAULT false,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Customer Registration Requests (Pending Sales Approval)
CREATE TABLE IF NOT EXISTS customer_registration_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  requested_product_id UUID REFERENCES products(id),
  requested_quantity NUMERIC,
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Quote Requests (Public Form)
CREATE TABLE IF NOT EXISTS quote_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_number TEXT UNIQUE,
  product_id UUID REFERENCES products(id),
  client_id UUID REFERENCES clients(id), -- Only populated if customer is active
  registration_request_id UUID REFERENCES customer_registration_requests(id), -- Link to request
  company_name TEXT,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  quantity NUMERIC NOT NULL,
  unit TEXT,
  required_specs TEXT,
  color TEXT,
  notes TEXT,
  required_delivery_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'quoted', 'rejected', 'converted_to_so')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- VIEWS FOR PUBLIC API (Data Layer for Public Catalog)
-- ============================================================
CREATE OR REPLACE VIEW public_catalog_products AS
SELECT 
  p.id, p.name_ar, p.name_en, p.slug, p.code, p.sku, 
  p.category_id, p.material, p.color, p.size, p.length, p.width, 
  p.thickness, p.weight, p.diameter, p.grade, p.usage_ar, p.usage_en, 
  p.technical_specs, p.packaging, p.unit, p.moq, p.tags, 
  p.is_featured, p.description_ar, p.description_en, p.views,
  c.name_ar as category_name_ar, c.name_en as category_name_en, c.slug as category_slug
FROM products p
LEFT JOIN product_categories c ON p.category_id = c.id
WHERE p.is_public = true AND p.status = 'active';

CREATE OR REPLACE VIEW public_catalog_images AS
SELECT i.id, i.product_id, i.image_url, i.is_main, i.display_order
FROM product_images i
JOIN products p ON i.product_id = p.id
WHERE p.is_public = true AND p.status = 'active';

CREATE OR REPLACE VIEW public_catalog_documents AS
SELECT d.id, d.product_id, d.title_ar, d.title_en, d.file_url, d.doc_type
FROM product_documents d
JOIN products p ON d.product_id = p.id
WHERE p.is_public = true AND d.is_public = true AND p.status = 'active';

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_registration_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public categories select" ON product_categories FOR SELECT USING (true);
CREATE POLICY "Public products select" ON products FOR SELECT USING (is_public = true OR auth.role() = 'authenticated');
CREATE POLICY "Public product images" ON product_images FOR SELECT USING (true);
CREATE POLICY "Public product documents" ON product_documents FOR SELECT USING (is_public = true OR auth.role() = 'authenticated');
CREATE POLICY "Public can insert requests" ON customer_registration_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can insert quotes" ON quote_requests FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated all categories" ON product_categories FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated all products" ON products FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated all images" ON product_images FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated all docs" ON product_documents FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated all reg requests" ON customer_registration_requests FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated all quotes" ON quote_requests FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================
-- MOCK DATA INSERTION (Industrial Plastics & Pelletizing)
-- ============================================================
DO $$
DECLARE
  cat1_id UUID;
  cat2_id UUID;
  cat3_id UUID;
  p1_id UUID;
  p2_id UUID;
  p3_id UUID;
  p4_id UUID;
BEGIN
  -- Insert Categories
  -- Insert Categories one by one to avoid multiple rows returning into one variable
  INSERT INTO product_categories (name_ar, name_en, slug, description_ar) VALUES
  ('منتجات التخريز وحبيبات البلاستيك', 'Plastic Pellets & Granules', 'plastic-pellets', 'حبيبات بلاستيكية مجهزة لإعادة التدوير والصناعة')
  ON CONFLICT (slug) DO UPDATE SET name_en = EXCLUDED.name_en
  RETURNING id INTO cat1_id;

  INSERT INTO product_categories (name_ar, name_en, slug, description_ar) VALUES
  ('عبوات بلاستيكية صناعية', 'Industrial Plastic Containers', 'industrial-containers', 'جراكن وعبوات للتعبئة الكيميائية والصناعية')
  ON CONFLICT (slug) DO UPDATE SET name_en = EXCLUDED.name_en
  RETURNING id INTO cat2_id;

  INSERT INTO product_categories (name_ar, name_en, slug, description_ar) VALUES
  ('أغطية بلاستيكية', 'Plastic Caps & Closures', 'plastic-caps', 'أغطية بلاستيكية بجميع المقاسات')
  ON CONFLICT (slug) DO UPDATE SET name_en = EXCLUDED.name_en
  RETURNING id INTO cat3_id;

  -- Insert Products
  INSERT INTO products (
    name_ar, name_en, slug, code, category_id, material, color, is_public, is_featured,
    description_ar, technical_specs, packaging, moq, cost, selling_price, current_stock
  ) VALUES
  (
    'حبيبات بولي إيثيلين عالي الكثافة (HDPE)', 'HDPE Plastic Granules', 'hdpe-granules-blue', 'GR-HDPE-01', cat1_id, 'HDPE', 'أزرق', true, true,
    'حبيبات بولي إيثيلين معاد تدويرها بجودة عالية، صالحة لاستخدامات حقن البلاستيك وصناعة المواسير.',
    '{"MFI": "0.5 - 1.2 g/10min", "Density": "0.95 g/cm3", "Recycled": true}', 'أجولة 25 كجم', 1000, 25000, 32000, 50000
  ) ON CONFLICT (slug) DO NOTHING RETURNING id INTO p1_id;

  INSERT INTO products (
    name_ar, name_en, slug, code, category_id, material, color, is_public, is_featured,
    description_ar, technical_specs, packaging, moq, cost, selling_price, current_stock
  ) VALUES
  (
    'جركن صناعي سعة 20 لتر', '20L Industrial Jerrycan', 'jerrycan-20l', 'JC-20-W', cat2_id, 'HDPE', 'أبيض', true, true,
    'جركن صناعي مخصص لتعبئة المواد الكيميائية والمنظفات. مصمم لتحمل الضغط والصدمات.',
    '{"Capacity": "20 Liters", "Weight": "900g", "Cap": "Tamper-evident"}', 'بالتات (Pallets)', 500, 35, 55, 12000
  ) ON CONFLICT (slug) DO NOTHING RETURNING id INTO p2_id;

  INSERT INTO products (
    name_ar, name_en, slug, code, category_id, material, color, is_public, is_featured,
    description_ar, technical_specs, packaging, moq, cost, selling_price, current_stock
  ) VALUES
  (
    'حبيبات بولي بروبيلين (PP) أسود', 'PP Black Granules', 'pp-granules-black', 'GR-PP-02', cat1_id, 'PP', 'أسود', true, false,
    'حبيبات بولي بروبيلين متينة لتصنيع الكراسي البلاستيكية والأدوات المنزلية.',
    '{"MFI": "10 - 15 g/10min", "Density": "0.90 g/cm3", "Recycled": true}', 'أجولة 25 كجم / جامبو 1 طن', 1000, 22000, 28000, 100000
  ) ON CONFLICT (slug) DO NOTHING RETURNING id INTO p3_id;

  INSERT INTO products (
    name_ar, name_en, slug, code, category_id, material, color, is_public, is_featured,
    description_ar, technical_specs, packaging, moq, cost, selling_price, current_stock
  ) VALUES
  (
    'غطاء جركن 50 ملي', '50mm Cap', 'cap-50mm', 'CAP-50-R', cat3_id, 'PP', 'أحمر', true, false,
    'غطاء محكم الغلق مزود ببرشام أمان (Tamper-evident) مقاس 50 ملي للعبوات الصناعية.',
    '{"Diameter": "50mm", "Liner": "Foam", "Safety Ring": true}', 'كراتين (1000 قطعة/كرتونة)', 5000, 0.5, 1.2, 500000
  ) ON CONFLICT (slug) DO NOTHING RETURNING id INTO p4_id;

  -- Insert Mock Images
  IF p1_id IS NOT NULL THEN
    INSERT INTO product_images (product_id, image_url, is_main) VALUES (p1_id, 'https://images.unsplash.com/photo-1605556272379-cbdbfdf3f488?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', true);
  END IF;
  IF p2_id IS NOT NULL THEN
    INSERT INTO product_images (product_id, image_url, is_main) VALUES (p2_id, 'https://images.unsplash.com/photo-1620601249767-f3162ccab4e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', true);
  END IF;
  IF p3_id IS NOT NULL THEN
    INSERT INTO product_images (product_id, image_url, is_main) VALUES (p3_id, 'https://images.unsplash.com/photo-1595246140625-573b715d11dc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', true);
  END IF;
  IF p4_id IS NOT NULL THEN
    INSERT INTO product_images (product_id, image_url, is_main) VALUES (p4_id, 'https://images.unsplash.com/photo-1533036814035-71c1b9b21840?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', true);
  END IF;

END $$;
