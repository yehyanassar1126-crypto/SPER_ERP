import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  InventoryService,
  InventoryItem,
  InventoryTransaction,
  ItemDto,
  TransactionType,
  WarehouseType
} from '../../core/services/inventory.service';

type Tab = 'items' | 'movements' | 'low';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventory.html',
  styleUrl: './inventory.scss'
})
export class Inventory implements OnInit {
  private readonly service = inject(InventoryService);

  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  readonly items = signal<InventoryItem[]>([]);
  readonly transactions = signal<InventoryTransaction[]>([]);

  readonly tab = signal<Tab>('items');
  readonly searchQuery = signal('');
  readonly warehouseFilter = signal<'all' | WarehouseType>('all');
  readonly categoryFilter = signal('all');

  readonly warehouses: WarehouseType[] = ['raw', 'finished', 'general'];

  // Item modal state
  readonly itemModalOpen = signal(false);
  editingId: string | null = null;
  form: ItemDto = this.emptyForm();

  // Movement modal state
  readonly txModalOpen = signal(false);
  txItemId = '';
  txType: TransactionType = 'in';
  txQuantity: number | null = null;
  txRequestedBy = '';
  txProcessedBy = '';
  readonly isSaving = signal(false);

  readonly categories = computed(() =>
    Array.from(new Set(this.items().map(i => this.normalizeCategory(i.category)))).sort()
  );

  readonly filteredItems = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const wh = this.warehouseFilter();
    const cat = this.categoryFilter();
    return this.items().filter(i => {
      const matchSearch =
        !q ||
        i.name.toLowerCase().includes(q) ||
        (i.name_ar ?? '').toLowerCase().includes(q) ||
        (i.supplier_name ?? '').toLowerCase().includes(q);
      const matchWh = wh === 'all' || i.warehouse_type === wh;
      const matchCat = cat === 'all' || this.normalizeCategory(i.category) === cat;
      return matchSearch && matchWh && matchCat;
    });
  });

  readonly lowStockItems = computed(() => this.items().filter(i => this.isLow(i)));

  readonly stats = computed(() => {
    const all = this.items();
    const totalValue = all.reduce((sum, i) => sum + i.quantity * (i.last_purchase_price || 0), 0);
    return {
      count: all.length,
      totalValue,
      lowCount: this.lowStockItems().length
    };
  });

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      const [items, tx] = await Promise.all([this.service.getItems(), this.service.getTransactions()]);
      if (items.error) this.errorMessage.set(items.error);
      else if (tx.error) this.errorMessage.set(tx.error);
      this.items.set(items.data);
      this.transactions.set(tx.data);
    } catch (err: unknown) {
      this.errorMessage.set(err instanceof Error ? err.message : 'Failed to load inventory');
    } finally {
      this.isLoading.set(false);
    }
  }

  isLow(i: InventoryItem): boolean {
    return i.quantity <= i.min_quantity;
  }

  /** "Finished Good" and "Finished Goods" are the same category in the data. */
  normalizeCategory(c: string | null): string {
    const v = (c ?? '').trim();
    return v.toLowerCase() === 'finished good' ? 'Finished Goods' : v;
  }

  /** Suggested reorder quantity: bring stock back to twice the minimum. */
  suggestedReorder(i: InventoryItem): number {
    return Math.max(i.min_quantity * 2 - i.quantity, 0);
  }

  // ---------- Item modal ----------
  private emptyForm(): ItemDto {
    return {
      name: '', name_ar: '', category: '', category_ar: '',
      min_quantity: 2, last_purchase_price: 0, supplier_name: '', warehouse_type: 'raw'
    };
  }

  openNewItem(): void {
    this.editingId = null;
    this.form = this.emptyForm();
    this.itemModalOpen.set(true);
  }

  openEditItem(i: InventoryItem): void {
    this.editingId = i.id;
    this.form = {
      name: i.name, name_ar: i.name_ar, category: i.category, category_ar: i.category_ar,
      min_quantity: i.min_quantity, last_purchase_price: i.last_purchase_price,
      supplier_name: i.supplier_name, warehouse_type: i.warehouse_type
    };
    this.itemModalOpen.set(true);
  }

  async saveItem(): Promise<void> {
    if (!this.form.name.trim() || !this.form.category.trim() || this.form.min_quantity < 0) {
      this.errorMessage.set('Name and category are required, and the minimum cannot be negative.');
      return;
    }
    this.isSaving.set(true);
    const dto: ItemDto = {
      ...this.form,
      name: this.form.name.trim(),
      category: this.form.category.trim(),
      name_ar: this.form.name_ar?.trim() || null,
      category_ar: this.form.category_ar?.trim() || null,
      supplier_name: this.form.supplier_name?.trim() || null
    };
    const res = this.editingId
      ? await this.service.updateItem(this.editingId, dto)
      : await this.service.createItem(dto);
    this.isSaving.set(false);
    if (res.success) {
      this.itemModalOpen.set(false);
      this.errorMessage.set(null);
      this.successMessage.set(this.editingId ? 'Item updated.' : 'Item added.');
      void this.load();
    } else {
      this.errorMessage.set(res.error ?? 'Could not save the item.');
    }
  }

  // ---------- Movement modal ----------
  openMovement(item?: InventoryItem, type: TransactionType = 'in'): void {
    this.txItemId = item?.id ?? '';
    this.txType = type;
    this.txQuantity = null;
    this.txRequestedBy = '';
    this.txProcessedBy = '';
    this.txModalOpen.set(true);
  }

  get selectedItem(): InventoryItem | undefined {
    return this.items().find(i => i.id === this.txItemId);
  }

  async saveMovement(): Promise<void> {
    const qty = Number(this.txQuantity);
    if (!this.txItemId || !Number.isInteger(qty) || qty <= 0) {
      this.errorMessage.set('Choose an item and enter a whole quantity greater than zero.');
      return;
    }
    const item = this.selectedItem;
    if (this.txType === 'out' && item && qty > item.quantity) {
      this.errorMessage.set(`Only ${item.quantity} in stock for ${item.name}.`);
      return;
    }
    this.isSaving.set(true);
    const res = await this.service.recordTransaction({
      item_id: this.txItemId,
      type: this.txType,
      quantity: qty,
      requested_by: this.txRequestedBy.trim() || null,
      processed_by: this.txProcessedBy.trim() || null
    });
    this.isSaving.set(false);
    if (res.success) {
      this.txModalOpen.set(false);
      this.errorMessage.set(null);
      this.successMessage.set(this.txType === 'in' ? 'Stock received.' : 'Stock issued.');
      void this.load();
    } else {
      this.errorMessage.set(res.error ?? 'Could not record the movement.');
    }
  }

  closeModals(): void {
    this.itemModalOpen.set(false);
    this.txModalOpen.set(false);
  }
}
