import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FinanceService, FinancialReportSummary, ExpenseCategoryBreakdown } from '../../../core/services/finance.service';

@Component({
  selector: 'app-financial-reports',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reports.html',
  styleUrl: './reports.scss'
})
export class FinancialReports implements OnInit {
  private readonly financeService = inject(FinanceService);

  readonly isLoading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);
  readonly summary = signal<FinancialReportSummary | null>(null);
  readonly expenseBreakdown = signal<ExpenseCategoryBreakdown[]>([]);

  ngOnInit(): void {
    void this.loadReports();
  }

  async loadReports(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      const [sum, breakdown] = await Promise.all([
        this.financeService.getFinancialReportSummary(),
        this.financeService.getExpenseBreakdown()
      ]);
      this.summary.set(sum);
      this.expenseBreakdown.set(breakdown);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to query financial statements';
      this.errorMessage.set(msg);
    } finally {
      this.isLoading.set(false);
    }
  }
}
