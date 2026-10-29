import { Component, OnInit, OnDestroy, inject, signal, computed, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService, DashboardOverview, MetricItem } from '../../core/services/dashboard.service';
import { SupabaseService } from '../../core/services/supabase.service';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface DashboardStat {
  label: string;
  value: string;
  note: string;
  icon: string;
  status?: 'connected' | 'not_connected' | 'error' | 'empty';
  link?: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit, OnDestroy {
  private readonly dashboardService = inject(DashboardService);
  private readonly supabaseService = inject(SupabaseService);
  private readonly cdr = inject(ChangeDetectorRef);

  private realtimeChannel: RealtimeChannel | null = null;

  readonly isLoading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);
  readonly metrics = signal<DashboardOverview | null>(null);

  // Alias for compatibility
  readonly loading = this.isLoading;

  readonly stats = computed<DashboardStat[]>(() => {
    const m = this.metrics();
    if (!m) {
      return [
        { label: 'Total Employees', value: '—', note: 'Loading...', icon: '♙', status: 'not_connected' },
        { label: 'Attendance Today', value: '—', note: 'Loading...', icon: '◷', status: 'not_connected', link: '/attendance' },
        { label: 'Pending Requests', value: '—', note: 'Loading...', icon: '▤', status: 'not_connected', link: '/attendance' },
        { label: 'Inventory Items', value: '—', note: 'Loading...', icon: '◈', status: 'not_connected' },
        { label: 'Monthly Payroll', value: '—', note: 'Loading...', icon: '＄', status: 'not_connected', link: '/finance/payroll' },
        { label: 'Financial Treasury', value: '—', note: 'Loading...', icon: '📊', status: 'not_connected', link: '/finance/reports' }
      ];
    }
    return [
      { ...m.totalEmployees },
      { ...m.attendanceToday, link: '/attendance' },
      { ...m.pendingRequests, link: '/attendance' },
      { ...m.inventoryAlerts },
      { ...m.monthlyPayroll, link: '/finance/payroll' },
      { ...m.financialSummary, link: '/finance/reports' }
    ];
  });

  readonly isSupabaseConnected = computed<boolean>(() => {
    return this.metrics()?.isSupabaseConfigured ?? this.supabaseService.isConfigured();
  });

  readonly lastUpdatedText = computed<string>(() => {
    const date = this.metrics()?.lastUpdated;
    if (!date) return 'Not yet fetched';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  });

  async ngOnInit(): Promise<void> {
    await this.loadMetrics();
    this.setupRealtimeSubscription();
  }

  ngOnDestroy(): void {
    if (this.realtimeChannel && this.supabaseService.client) {
      this.supabaseService.client.removeChannel(this.realtimeChannel);
    }
  }

  async loadMetrics(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.cdr.markForCheck();

    try {
      const data = await this.dashboardService.getDashboardMetrics();
      this.metrics.set(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to query dashboard';
      this.errorMessage.set(msg);
    } finally {
      this.isLoading.set(false);
      this.cdr.markForCheck();
    }
  }

  // Alias for backward compatibility
  async loadDashboardData(): Promise<void> {
    return this.loadMetrics();
  }

  private setupRealtimeSubscription(): void {
    try {
      const client = this.supabaseService.getClient();
      if (!client) return;

      this.realtimeChannel = client
        .channel('dashboard-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
          console.log('Realtime change in users -> updating dashboard');
          void this.loadMetrics();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, () => {
          console.log('Realtime change in attendance -> updating dashboard');
          void this.loadMetrics();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'leave_requests' }, () => {
          console.log('Realtime change in leave_requests -> updating dashboard');
          void this.loadMetrics();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_items' }, () => {
          console.log('Realtime change in inventory_items -> updating dashboard');
          void this.loadMetrics();
        })
        .subscribe();
    } catch (err) {
      console.warn('Realtime subscription error (non-fatal):', err);
    }
  }
}
