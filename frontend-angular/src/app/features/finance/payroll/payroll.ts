import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceService, PayrollRecord } from '../../../core/services/finance.service';

@Component({
  selector: 'app-payroll',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './payroll.html',
  styleUrl: './payroll.scss'
})
export class Payroll implements OnInit {
  private readonly financeService = inject(FinanceService);

  readonly isLoading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly records = signal<PayrollRecord[]>([]);

  readonly searchQuery = signal<string>('');
  readonly selectedMonth = signal<string>('all');
  readonly selectedStatus = signal<string>('all');

  readonly availableMonths = computed<string[]>(() => {
    const list = this.records().map(r => r.month).filter(Boolean);
    return Array.from(new Set(list)).sort().reverse();
  });

  readonly filteredRecords = computed<PayrollRecord[]>(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const month = this.selectedMonth();
    const status = this.selectedStatus();

    return this.records().filter(r => {
      const matchSearch = !query || r.employee_name.toLowerCase().includes(query) || (r.department?.toLowerCase() || '').includes(query);
      const matchMonth = month === 'all' || r.month === month;
      const matchStatus = status === 'all' || r.status === status;
      return matchSearch && matchMonth && matchStatus;
    });
  });

  readonly stats = computed(() => {
    const list = this.filteredRecords();
    const totalNet = list.reduce((acc, r) => acc + r.net_salary, 0);
    const processingCount = list.filter(r => r.status === 'processing').length;
    const releasedCount = list.filter(r => r.status === 'funds_released').length;
    const paidCount = list.filter(r => r.status === 'paid').length;

    return { totalNet, processingCount, releasedCount, paidCount, count: list.length };
  });

  ngOnInit(): void {
    void this.loadPayroll();
  }

  async loadPayroll(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      const res = await this.financeService.getPayrollRecords();
      if (res.error) {
        this.errorMessage.set(res.error);
        this.records.set([]);
      } else {
        this.records.set(res.data);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to query payroll';
      this.errorMessage.set(msg);
    } finally {
      this.isLoading.set(false);
    }
  }

  async markPaid(id: string): Promise<void> {
    this.successMessage.set(null);
    const res = await this.financeService.updatePayrollStatus(id, 'paid');
    if (res.success) {
      this.successMessage.set('Salary marked as paid successfully.');
      void this.loadPayroll();
    } else {
      this.errorMessage.set(res.error || 'Failed to update salary status');
    }
  }

  async releaseFunds(id: string): Promise<void> {
    this.successMessage.set(null);
    const res = await this.financeService.updatePayrollStatus(id, 'funds_released');
    if (res.success) {
      this.successMessage.set('Funds released to HR for disbursement.');
      void this.loadPayroll();
    } else {
      this.errorMessage.set(res.error || 'Failed to release funds');
    }
  }

  async bulkRelease(): Promise<void> {
    const month = this.selectedMonth();
    if (month === 'all') {
      alert('Please select a specific month from the dropdown first.');
      return;
    }
    const res = await this.financeService.releaseAllFundsForMonth(month);
    if (res.success) {
      this.successMessage.set(`Successfully released funds for ${res.count} employee payroll slip(s).`);
      void this.loadPayroll();
    } else {
      this.errorMessage.set(res.error || 'Bulk release failed');
    }
  }
}
