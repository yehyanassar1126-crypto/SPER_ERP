import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService, DashboardOverview, MetricItem } from '../../core/services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {
  private readonly dashboardService = inject(DashboardService);

  readonly isLoading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);
  readonly metrics = signal<DashboardOverview | null>(null);

  readonly stats = computed<MetricItem[]>(() => {
    const m = this.metrics();
    if (!m) {
      return [
        { label: 'Total Employees', value: '—', note: 'Loading...', icon: '♙', status: 'not_connected' },
        { label: 'Attendance Today', value: '—', note: 'Loading...', icon: '◷', status: 'not_connected' },
        { label: 'Pending Requests', value: '—', note: 'Loading...', icon: '▤', status: 'not_connected' },
        { label: 'Inventory Items', value: '—', note: 'Loading...', icon: '◈', status: 'not_connected' },
        { label: 'Monthly Payroll', value: '—', note: 'Loading...', icon: '＄', status: 'not_connected' },
        { label: 'Financial Treasury', value: '—', note: 'Loading...', icon: '📊', status: 'not_connected' }
      ];
    }
    return [
      m.totalEmployees,
      m.attendanceToday,
      m.pendingRequests,
      m.inventoryAlerts,
      m.monthlyPayroll,
      m.financialSummary
    ];
  });

  readonly isSupabaseConnected = computed<boolean>(() => {
    return this.metrics()?.isSupabaseConfigured ?? false;
  });

  readonly lastUpdatedText = computed<string>(() => {
    const date = this.metrics()?.lastUpdated;
    if (!date) return 'Not yet fetched';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  });

  ngOnInit(): void {
    void this.loadMetrics();
  }

  async loadMetrics(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      const data = await this.dashboardService.getDashboardMetrics();
      this.metrics.set(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to query dashboard';
      this.errorMessage.set(msg);
    } finally {
      this.isLoading.set(false);
    }
  }
}