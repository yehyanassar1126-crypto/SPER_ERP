-- إضافة حقول استلام المبيعات من المصنع في جدول أوامر البيع
ALTER TABLE sales_workflow_orders ADD COLUMN IF NOT EXISTS receiver_name text;
ALTER TABLE sales_workflow_orders ADD COLUMN IF NOT EXISTS receiver_id_number text;
ALTER TABLE sales_workflow_orders ADD COLUMN IF NOT EXISTS receive_time timestamp with time zone;
ALTER TABLE sales_workflow_orders ADD COLUMN IF NOT EXISTS warehouse_rejection_reason text;

-- تحديث الـ Cache للـ API
NOTIFY pgrst, 'reload schema';
