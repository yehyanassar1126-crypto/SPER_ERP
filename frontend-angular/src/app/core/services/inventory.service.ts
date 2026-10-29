
import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { InventoryItem } from '../models/inventory-item.model';

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private readonly supabaseService = inject(SupabaseService);

  async getItems(): Promise<InventoryItem[]> {
    if (!this.supabaseService.isConfigured()) {
      throw new Error('Supabase is not configured.');
    }

    const request = this.supabaseService
      .getClient()
      .from('inventory_items')
      .select(
        'id, name, category, quantity, min_quantity, last_purchase_price, supplier_name, created_at, updated_at'
      )
      .order('name', { ascending: true });

    const timeout = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(
          new Error(
            'Loading inventory timed out. Please check your connection and try again.'
          )
        );
      }, 15000);
    });

    const { data, error } = await Promise.race([
      request,
      timeout
    ]);

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as InventoryItem[];
  }
}
