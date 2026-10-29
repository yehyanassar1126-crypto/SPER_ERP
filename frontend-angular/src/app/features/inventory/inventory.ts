
import { Component, OnInit, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { InventoryService } from '../../core/services/inventory.service';
import { InventoryItem } from '../../core/models/inventory-item.model';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CurrencyPipe],
  templateUrl: './inventory.html',
  styleUrl: './inventory.scss'
})
export class Inventory implements OnInit {
  private readonly inventoryService = inject(InventoryService);

  items: InventoryItem[] = [];
  loading = true;
  errorMessage = '';

  searchTerm = '';
  selectedCategory = 'All';
  selectedStatus = 'All';

  readonly categories: string[] = [
    'All',
    'Maintenance',
    'Workshop',
    'Supplies',
    'Chemicals',
    'Fixed Assets'
  ];

  readonly statuses: string[] = [
    'All',
    'In Stock',
    'Low Stock'
  ];

  async ngOnInit(): Promise<void> {
    await this.loadItems();
  }

  async loadItems(): Promise<void> {
    this.loading = true;
    this.errorMessage = '';

    try {
      this.items = await this.inventoryService.getItems();
    } catch (error: unknown) {
      this.errorMessage =
        error instanceof Error
          ? error.message
          : 'Unable to load inventory items.';
    } finally {
      this.loading = false;
    }
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm = input.value;
  }

  get filteredItems(): InventoryItem[] {
    const search = this.searchTerm.trim().toLowerCase();

    return this.items.filter(item => {
      const matchesSearch =
        item.name.toLowerCase().includes(search) ||
        (item.supplier_name ?? '').toLowerCase().includes(search);

      const matchesCategory =
        this.selectedCategory === 'All' ||
        item.category === this.selectedCategory;

      const matchesStatus =
        this.selectedStatus === 'All' ||
        (this.selectedStatus === 'Low Stock' &&
          this.isLowStock(item)) ||
        (this.selectedStatus === 'In Stock' &&
          !this.isLowStock(item));

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }

  get lowStockCount(): number {
    return this.items.filter(
      item => item.quantity <= item.min_quantity
    ).length;
  }

  get totalQuantity(): number {
    return this.items.reduce(
      (total, item) => total + item.quantity,
      0
    );
  }

  isLowStock(item: InventoryItem): boolean {
    return item.quantity <= item.min_quantity;
  }
}
