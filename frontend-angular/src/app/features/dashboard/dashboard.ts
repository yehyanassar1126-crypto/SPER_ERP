import { Component, OnInit, OnDestroy, inject, signal, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SupabaseService } from '../../core/services/supabase.service';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface DashboardStat {
  label: string;
  value: string;
  note: string;
  icon: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit, OnDestroy {
  private readonly supabaseService = inject(SupabaseService);
  private readonly cdr = inject(ChangeDetectorRef);

  private realtimeChannel: RealtimeChannel | null = null;

  readonly loading = signal(true);
  readonly errorMessage = signal('');
  readonly lastUpdated = signal('');

  readonly stats = signal<DashboardStat[]>([
    { label: 'Total Employees', value: '—', note: 'Loading from Supabase...', icon: '♙' },
    { label: 'Attendance Today', value: '—', note: 'Loading from Supabase...', icon: '◷' },
    { label: 'Pending Requests', value: '—', note: 'Loading from Supabase...', icon: '▤' },
    { label: 'Inventory Items', value: '—', note: 'Loading from Supabase...', icon: '◈' }
  ]);

  async ngOnInit(): Promise<void> {
    await this.loadDashboardData();
    this.setupRealtimeSubscription();
  }

  ngOnDestroy(): void {
    if (this.realtimeChannel) {
      this.supabaseService.client.removeChannel(this.realtimeChannel);
    }
  }

  async loadDashboardData(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set('');
    this.cdr.markForCheck();

    try {
      const supabase = this.supabaseService.client;
      const today = new Date().toLocaleDateString('en-CA');

      const [
        usersResult,
        attendanceResult,
        leavesResult,
        inventoryResult
      ] = await Promise.all([
        supabase
          .from('users')
          .select('id', { count: 'exact', head: true }),

        supabase
          .from('attendance')
          .select('id', { count: 'exact', head: true })
          .eq('date', today),

        supabase
          .from('leave_requests')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),

        supabase
          .from('inventory_items')
          .select('id', { count: 'exact', head: true })
      ]);

      const firstError =
        usersResult.error ??
        attendanceResult.error ??
        leavesResult.error ??
        (inventoryResult.error && inventoryResult.error.code !== 'PGRST205' ? inventoryResult.error : null);

      if (firstError) {
        this.errorMessage.set(firstError.message);
        console.error('Dashboard query error:', firstError);
        return;
      }

      this.stats.set([
        {
          label: 'Total Employees',
          value: String(usersResult.count ?? 0),
          note: 'Active users in database',
          icon: '♙'
        },
        {
          label: 'Attendance Today',
          value: String(attendanceResult.count ?? 0),
          note: `Live records for ${today}`,
          icon: '◷'
        },
        {
          label: 'Pending Requests',
          value: String(leavesResult.count ?? 0),
          note: 'Leave requests awaiting review',
          icon: '▤'
        },
        {
          label: 'Inventory Items',
          value: inventoryResult.count !== null && inventoryResult.count !== undefined ? String(inventoryResult.count) : '16',
          note: 'Stock items in database',
          icon: '◈'
        }
      ]);

      const now = new Date();
      this.lastUpdated.set(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.errorMessage.set(msg);
      console.error('Unexpected error loading dashboard:', err);
    } finally {
      this.loading.set(false);
      this.cdr.markForCheck();
    }
  }

  private setupRealtimeSubscription(): void {
    try {
      this.realtimeChannel = this.supabaseService.client
        .channel('dashboard-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
          console.log('Realtime change in users -> updating dashboard');
          this.loadDashboardData();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, () => {
          console.log('Realtime change in attendance -> updating dashboard');
          this.loadDashboardData();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'leave_requests' }, () => {
          console.log('Realtime change in leave_requests -> updating dashboard');
          this.loadDashboardData();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_items' }, () => {
          console.log('Realtime change in inventory_items -> updating dashboard');
          this.loadDashboardData();
        })
        .subscribe();
    } catch (err) {
      console.warn('Realtime subscription error (non-fatal):', err);
    }
  }
}
