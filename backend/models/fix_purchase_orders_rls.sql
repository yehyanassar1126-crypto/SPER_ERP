ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Purchase orders delete policy" ON purchase_orders FOR DELETE USING (true);
