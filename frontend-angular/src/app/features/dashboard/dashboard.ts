
import { Component, OnInit, inject } from '@angular/core';
import { SupabaseService } from '../../core/services/supabase.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {
  private supabaseService = inject(SupabaseService);

  loading = true;
  errorMessage = '';

  stats = [
    { label: 'Total Employees', value: '—', note: 'Loading...', icon: '♙' },
    { label: 'Attendance Today', value: '—', note: 'Loading...', icon: '◷' },
    { label: 'Pending Requests', value: '—', note: 'Loading...', icon: '▤' },
    { label: 'Inventory Items', value: '—', note: 'Not connected yet', icon: '◈' }
  ];

  async ngOnInit(): Promise<void> {
    await this.loadDashboardData();
  }

  private async loadDashboardData(): Promise<void> {
    this.loading = true;
    this.errorMessage = '';

    const supabase = this.supabaseService.client;
    console.log('Dashboard loading started');
    const today = new Date().toLocaleDateString('en-CA');

    const [
      usersResult,
      attendanceResult,
      leavesResult
    ] = await Promise.all(
        
      [
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
        .eq('status', 'pending')
    ]);
    console.log('Users result:', usersResult);
    console.log('Attendance result:', attendanceResult);
    console.log('Leaves result:', leavesResult);

    const firstError =
      usersResult.error ??
      attendanceResult.error ??
      leavesResult.error;

    if (firstError) {
      this.errorMessage = firstError.message;
      console.error('Dashboard query error:', firstError);
      this.loading = false;
      return;
    }

    this.stats = [
      {
        label: 'Total Employees',
        value: String(usersResult.count ?? 0),
        note: 'Users in the database',
        icon: '♙'
      },
      {
        label: 'Attendance Today',
        value: String(attendanceResult.count ?? 0),
        note: 'Attendance records for today',
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
        value: '—',
        note: 'Not connected yet',
        icon: '◈'
      }
    ];

    this.loading = false;
  }
}
