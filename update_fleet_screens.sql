-- ==========================================
-- تحديث جداول الأسطول - شاشات الصيانة والحوادث
-- Fleet Module: Maintenance & Incidents Update
-- نفذ هذا الملف في Supabase SQL Editor
-- ==========================================

-- =====================
-- 1. تحديث جدول الصيانة (fleet_maintenance)
-- إضافة الأعمدة الجديدة اللي بتستخدمها الشاشة
-- =====================
ALTER TABLE IF EXISTS fleet_maintenance ADD COLUMN IF NOT EXISTS vehicle_plate VARCHAR(50);
ALTER TABLE IF EXISTS fleet_maintenance ADD COLUMN IF NOT EXISTS type VARCHAR(100);
ALTER TABLE IF EXISTS fleet_maintenance ADD COLUMN IF NOT EXISTS date DATE;
ALTER TABLE IF EXISTS fleet_maintenance ADD COLUMN IF NOT EXISTS odometer DECIMAL(10,2) DEFAULT 0;
ALTER TABLE IF EXISTS fleet_maintenance ADD COLUMN IF NOT EXISTS description TEXT;

-- تحديث الـ CHECK constraint للحالة عشان تتوافق مع الشاشة الجديدة
ALTER TABLE IF EXISTS fleet_maintenance DROP CONSTRAINT IF EXISTS fleet_maintenance_status_check;
ALTER TABLE IF EXISTS fleet_maintenance ALTER COLUMN status SET DEFAULT 'مكتمل';
ALTER TABLE IF EXISTS fleet_maintenance ADD CONSTRAINT fleet_maintenance_status_check 
  CHECK (status IN ('مكتمل', 'قيد التنفيذ', 'مفتوح', 'جاري العمل', 'مغلق'));

-- =====================
-- 2. تحديث جدول الحوادث والمخالفات (fleet_incidents)
-- إضافة الأعمدة الجديدة اللي بتستخدمها الشاشة
-- =====================
ALTER TABLE IF EXISTS fleet_incidents ADD COLUMN IF NOT EXISTS driver_name VARCHAR(255);
ALTER TABLE IF EXISTS fleet_incidents ADD COLUMN IF NOT EXISTS vehicle_plate VARCHAR(50);
ALTER TABLE IF EXISTS fleet_incidents ADD COLUMN IF NOT EXISTS type VARCHAR(50);
ALTER TABLE IF EXISTS fleet_incidents ADD COLUMN IF NOT EXISTS date DATE;
ALTER TABLE IF EXISTS fleet_incidents ADD COLUMN IF NOT EXISTS fine_amount DECIMAL(15,2) DEFAULT 0;
ALTER TABLE IF EXISTS fleet_incidents ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'معلق';
ALTER TABLE IF EXISTS fleet_incidents ADD COLUMN IF NOT EXISTS description TEXT;

-- حذف الـ constraint القديم وإضافة واحد جديد
ALTER TABLE IF EXISTS fleet_incidents DROP CONSTRAINT IF EXISTS fleet_incidents_incident_type_check;

-- =====================
-- 3. RLS Policies (صلاحيات)
-- =====================

-- تفعيل RLS
ALTER TABLE fleet_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE fleet_incidents ENABLE ROW LEVEL SECURITY;

-- سياسة القراءة - الكل يقدر يقرأ
DROP POLICY IF EXISTS "fleet_maintenance_read" ON fleet_maintenance;
CREATE POLICY "fleet_maintenance_read" ON fleet_maintenance FOR SELECT USING (true);

DROP POLICY IF EXISTS "fleet_incidents_read" ON fleet_incidents;
CREATE POLICY "fleet_incidents_read" ON fleet_incidents FOR SELECT USING (true);

-- سياسة الإضافة - الكل يقدر يضيف
DROP POLICY IF EXISTS "fleet_maintenance_insert" ON fleet_maintenance;
CREATE POLICY "fleet_maintenance_insert" ON fleet_maintenance FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "fleet_incidents_insert" ON fleet_incidents;
CREATE POLICY "fleet_incidents_insert" ON fleet_incidents FOR INSERT WITH CHECK (true);

-- سياسة التعديل
DROP POLICY IF EXISTS "fleet_maintenance_update" ON fleet_maintenance;
CREATE POLICY "fleet_maintenance_update" ON fleet_maintenance FOR UPDATE USING (true);

DROP POLICY IF EXISTS "fleet_incidents_update" ON fleet_incidents;
CREATE POLICY "fleet_incidents_update" ON fleet_incidents FOR UPDATE USING (true);

-- سياسة الحذف
DROP POLICY IF EXISTS "fleet_maintenance_delete" ON fleet_maintenance;
CREATE POLICY "fleet_maintenance_delete" ON fleet_maintenance FOR DELETE USING (true);

DROP POLICY IF EXISTS "fleet_incidents_delete" ON fleet_incidents;
CREATE POLICY "fleet_incidents_delete" ON fleet_incidents FOR DELETE USING (true);

-- ==========================================
-- تم! شغل الملف ده في Supabase SQL Editor
-- ==========================================
