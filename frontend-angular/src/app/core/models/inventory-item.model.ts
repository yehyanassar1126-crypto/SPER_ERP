
export type InventoryCategory =
  | 'Maintenance'
  | 'Workshop'
  | 'Supplies'
  | 'Chemicals'
  | 'Fixed Assets';

export interface InventoryItem {
  id: string;
  name: string;
  category: InventoryCategory;
  quantity: number;
  min_quantity: number;
  last_purchase_price: number;
  supplier_name: string | null;
  created_at: string;
  updated_at: string;
}
