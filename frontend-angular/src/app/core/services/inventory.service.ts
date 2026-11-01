import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

export type WarehouseType = 'raw' | 'finished' | 'general';
export type TransactionType = 'in' | 'out';

export interface InventoryItem {
  id: string;
  name: string;
  name_ar: string | null;
  category: string;
  category_ar: string | null;
  quantity: number;
  min_quantity: number;
  last_purchase_price: number;
  supplier_name: string | null;
  warehouse_type: WarehouseType;
  life_time_percentage: number | null;
  created_at: string;
  updated_at: string;
}

export interface InventoryTransaction {
  id: string;
  item_id: string | null;
  item_name: string | null;
  transaction_type: TransactionType;
  quantity: number;
  requested_by: string | null;
  processed_by: string | null;
  date: string;
}

export interface ItemDto {
  name: string;
  name_ar?: string | null;
  category: string;
  category_ar?: string | null;
  min_quantity: number;
  last_purchase_price: number;
  supplier_name?: string | null;
  warehouse_type: WarehouseType;
}

export interface TransactionDto {
  item_id: string;
  type: TransactionType;
  quantity: number;
  requested_by?: string | null;
  processed_by?: string | null;
}

export interface ListResult<T> { data: T[]; error: string | null; }
export interface ActionResult { success: boolean; error?: string; }

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private readonly supabase = inject(SupabaseService);

  private get db() {
    return this.supabase.getClient();
  }

  async getItems(): Promise<ListResult<InventoryItem>> {
    const { data, error } = await this.db
      .from('inventory_items')
      .select('*')
      .order('name', { ascending: true });
    if (error) return { data: [], error: error.message };
    return { data: (data ?? []) as InventoryItem[], error: null };
  }

  async getTransactions(limit = 100): Promise<ListResult<InventoryTransaction>> {
    const { data, error } = await this.db
      .from('inventory_transactions')
      .select('*')
      .order('date', { ascending: false })
      .limit(limit);
    if (error) return { data: [], error: error.message };
    return { data: (data ?? []) as InventoryTransaction[], error: null };
  }

  async createItem(dto: ItemDto): Promise<ActionResult> {
    // quantity starts at 0; stock is added only through "in" transactions
    const { error } = await this.db.from('inventory_items').insert({ ...dto, quantity: 0 });
    return error ? { success: false, error: error.message } : { success: true };
  }

  async updateItem(id: string, dto: ItemDto): Promise<ActionResult> {
    const { error } = await this.db
      .from('inventory_items')
      .update({ ...dto, updated_at: new Date().toISOString() })
      .eq('id', id);
    return error ? { success: false, error: error.message } : { success: true };
  }

  /** Calls the Postgres function that updates stock and logs the movement atomically. */
  async recordTransaction(dto: TransactionDto): Promise<ActionResult> {
    const { error } = await this.db.rpc('record_inventory_transaction', {
      p_item_id: dto.item_id,
      p_type: dto.type,
      p_quantity: dto.quantity,
      p_requested_by: dto.requested_by ?? null,
      p_processed_by: dto.processed_by ?? null
    });
    return error ? { success: false, error: error.message } : { success: true };
  }
}
