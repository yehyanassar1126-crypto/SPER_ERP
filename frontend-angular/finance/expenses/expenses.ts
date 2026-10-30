import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceService, ExpenseRecord, CreateExpenseDto } from '../../../core/services/finance.service';

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './expenses.html',
  styleUrl: './expenses.scss'
})
export class Expenses implements OnInit {
  private readonly financeService = inject(FinanceService);

  readonly isLoading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly expenses = signal<ExpenseRecord[]>([]);

  readonly searchQuery = signal<string>('');
  readonly statusFilter = signal<string>('all');
  readonly isModalOpen = signal<boolean>(false);

  // New claim form state
  newEmployeeName = '';
  newType = 'Travel';
  newAmount: number | null = null;
  newDate = new Date().toISOString().split('T')[0];
  newDescription = '';

  readonly filteredExpenses = computed<ExpenseRecord[]>(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const status = this.statusFilter();

    return this.expenses().filter(e => {
      const matchSearch =
        !query ||
        e.employee_name.toLowerCase().includes(query) ||
        e.description.toLowerCase().includes(query) ||
        e.type.toLowerCase().includes(query);
      const matchStatus = status === 'all' || e.status === status;
      return matchSearch && matchStatus;
    });
  });

  readonly stats = computed(() => {
    const list = this.filteredExpenses();
    const totalAmount = list.reduce((acc, e) => acc + e.amount, 0);
    const pendingCount = list.filter(e => e.status === 'pending').length;
    const approvedAmount = list.filter(e => e.status === 'approved').reduce((acc, e) => acc + e.amount, 0);

    return { totalAmount, pendingCount, approvedAmount, count: list.length };
  });

  ngOnInit(): void {
    void this.loadExpenses();
  }

  async loadExpenses(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      const res = await this.financeService.getExpenses();
      if (res.error) {
        this.errorMessage.set(res.error);
        this.expenses.set([]);
      } else {
        this.expenses.set(res.data);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to query expenses';
      this.errorMessage.set(msg);
    } finally {
      this.isLoading.set(false);
    }
  }

  async setStatus(id: string, newStatus: 'approved' | 'rejected'): Promise<void> {
    this.successMessage.set(null);
    const res = await this.financeService.updateExpenseStatus(id, newStatus);
    if (res.success) {
      this.successMessage.set(`Expense claim ${newStatus} successfully.`);
      void this.loadExpenses();
    } else {
      this.errorMessage.set(res.error || 'Failed to update expense status');
    }
  }

  openModal(): void {
    this.newEmployeeName = '';
    this.newType = 'Travel';
    this.newAmount = null;
    this.newDate = new Date().toISOString().split('T')[0];
    this.newDescription = '';
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
  }

  async submitNewClaim(): Promise<void> {
    if (!this.newEmployeeName.trim() || !this.newAmount || this.newAmount <= 0 || !this.newDescription.trim()) {
      alert('Please fill in all required fields with a valid positive amount.');
      return;
    }

    const payload: CreateExpenseDto = {
      employee_name: this.newEmployeeName.trim(),
      type: this.newType,
      amount: Number(this.newAmount),
      date: this.newDate,
      description: this.newDescription.trim()
    };

    const res = await this.financeService.submitExpense(payload);
    if (res.success) {
      this.closeModal();
      this.successMessage.set('New expense claim submitted for review.');
      void this.loadExpenses();
    } else {
      alert(`Submission failed: ${res.error}`);
    }
  }
}
