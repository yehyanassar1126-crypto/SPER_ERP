-- Add DELETE policy for logistics_movements
DROP POLICY IF EXISTS "logistics_movements_delete" ON logistics_movements;
CREATE POLICY "logistics_movements_delete" ON logistics_movements FOR DELETE USING (true);
