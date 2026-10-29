import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface MetricItem {
  label: string;
  value: string;
  note: string;
  icon: string;
  status: 'connected' | 'not_connected' | 'error' | 'empty';
  detail?: string;
}

export interface DashboardOverview {
  totalEmployees: MetricItem;
  attendanceToday: MetricItem;
  pendingRequests: MetricItem;
  inventoryAlerts: MetricItem;
  monthlyPayroll: MetricItem;
  financialSummary: MetricItem;
  isSupabaseConfigured: boolean;
  statusMessage: string;
  lastUpdated: Date | null;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly supabase = inject(SupabaseService);

  /**
   * Fetches all real-time dashboard metrics using individual fault-tolerant queries.
   * Gracefully handles unconfigured Supabase, missing tables, and RLS permission boundaries.
   */
  public async getDashboardMetrics(): Promise<DashboardOverview> {
    const isConfigured = this.supabase.isConfigured();
    const client = this.supabase.getClient();

    if (!isConfigured || !client) {
      return this.buildUnconfiguredState(this.supabase.getStatusMessage());
    }

    const [
      employeesRes,
      attendanceRes,
      pendingRequestsRes,
      inventoryRes,
      payrollRes,
      financialRes
    ] = await Promise.allSettled([
      this.fetchActiveEmployees(client),
      this.fetchAttendanceToday(client),
      this.fetchPendingRequests(client),
      this.fetchInventoryAlerts(client),
      this.fetchMonthlyPayroll(client),
      this.fetchFinancialSummary(client)
    ]);

    return {
      totalEmployees:
        employeesRes.status === 'fulfilled' ? employeesRes.value : this.errorMetric('Total Employees', '♙'),
      attendanceToday:
        attendanceRes.status === 'fulfilled' ? attendanceRes.value : this.errorMetric('Attendance Today', '◷'),
      pendingRequests:
        pendingRequestsRes.status === 'fulfilled' ? pendingRequestsRes.value : this.errorMetric('Pending Requests', '▤'),
      inventoryAlerts:
        inventoryRes.status === 'fulfilled' ? inventoryRes.value : this.errorMetric('Inventory Items', '◈'),
      monthlyPayroll:
        payrollRes.status === 'fulfilled' ? payrollRes.value : this.errorMetric('Monthly Payroll', '＄'),
      financialSummary:
        financialRes.status === 'fulfilled' ? financialRes.value : this.errorMetric('Financial Overview', '📊'),
      isSupabaseConfigured: true,
      statusMessage: 'Live database connection active',
      lastUpdated: new Date()
    };
  }

  private async fetchActiveEmployees(client: any): Promise<MetricItem> {
    try {
      const { data, count, error } = await client
        .from('users')
        .select('id, status', { count: 'exact' });

      if (error) {
        return {
          label: 'Total Employees',
          value: 'Not connected',
          note: `Error loading users: ${error.message || 'Access denied'}`,
          icon: '♙',
          status: 'error'
        };
      }

      const rows: Array<{ id: string; status?: string }> = data || [];
      const total = count ?? rows.length;
      const activeCount = rows.filter(u => !u.status || u.status === 'active').length;

      return {
        label: 'Total Employees',
        value: total.toString(),
        note: `${activeCount} active in system`,
        icon: '♙',
        status: total > 0 ? 'connected' : 'empty'
      };
    } catch {
      return {
        label: 'Total Employees',
        value: 'Not connected',
        note: 'Unable to query users table',
        icon: '♙',
        status: 'not_connected'
      };
    }
  }

  private async fetchAttendanceToday(client: any): Promise<MetricItem> {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const { data, error } = await client
        .from('attendance')
        .select('id, status')
        .eq('date', todayStr);

      if (error) {
        return {
          label: 'Attendance Today',
          value: 'Not connected',
          note: error.message || 'Table unavailable',
          icon: '◷',
          status: 'error'
        };
      }

      const records: Array<{ id: string; status?: string }> = data || [];
      const presentCount = records.filter(
        a => a.status === 'present' || a.status === 'checked_in'
      ).length;

      return {
        label: 'Attendance Today',
        value: presentCount.toString(),
        note: records.length > 0 ? `${records.length} logs recorded today` : 'No check-ins yet today',
        icon: '◷',
        status: 'connected'
      };
    } catch {
      return {
        label: 'Attendance Today',
        value: 'Not connected',
        note: 'Unable to query attendance table',
        icon: '◷',
        status: 'not_connected'
      };
    }
  }

  private async fetchPendingRequests(client: any): Promise<MetricItem> {
    try {
      let pendingLeaves = 0;
      let pendingExpenses = 0;
      let pendingLoans = 0;
      let tablesConnected = 0;

      const [leavesRes, expensesRes, loansRes] = await Promise.allSettled([
        client.from('leave_requests').select('id', { count: 'exact', head: true }).in('status', ['pending', 'pending_manager', 'pending_hr']),
        client.from('expenses').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        client.from('loans').select('id', { count: 'exact', head: true }).eq('status', 'pending')
      ]);

      if (leavesRes.status === 'fulfilled' && !leavesRes.value.error) {
        pendingLeaves = leavesRes.value.count || 0;
        tablesConnected++;
      }
      if (expensesRes.status === 'fulfilled' && !expensesRes.value.error) {
        pendingExpenses = expensesRes.value.count || 0;
        tablesConnected++;
      }
      if (loansRes.status === 'fulfilled' && !loansRes.value.error) {
        pendingLoans = loansRes.value.count || 0;
        tablesConnected++;
      }

      if (tablesConnected === 0) {
        return {
          label: 'Pending Requests',
          value: 'Not connected',
          note: 'Request tables not accessible',
          icon: '▤',
          status: 'not_connected'
        };
      }

      const totalPending = pendingLeaves + pendingExpenses + pendingLoans;
      return {
        label: 'Pending Requests',
        value: totalPending.toString(),
        note: `${pendingLeaves} leaves, ${pendingExpenses} expenses, ${pendingLoans} loans`,
        icon: '▤',
        status: 'connected'
      };
    } catch {
      return {
        label: 'Pending Requests',
        value: 'Not connected',
        note: 'Unable to query workflow requests',
        icon: '▤',
        status: 'not_connected'
      };
    }
  }

  private async fetchInventoryAlerts(client: any): Promise<MetricItem> {
    try {
      const { data, count, error } = await client
        .from('inventory_items')
        .select('id, quantity, min_quantity', { count: 'exact' });

      if (error) {
        return {
          label: 'Inventory Items',
          value: 'Not connected',
          note: error.message || 'Inventory table unavailable',
          icon: '◈',
          status: 'error'
        };
      }

      const items: Array<{ id: string; quantity?: number; min_quantity?: number }> = data || [];
      const total = count ?? items.length;
      const lowStock = items.filter(i => (i.quantity ?? 0) <= (i.min_quantity ?? 0)).length;

      return {
        label: 'Inventory Items',
        value: total.toString(),
        note: lowStock > 0 ? `${lowStock} low-stock alert(s)` : 'All stock levels healthy',
        icon: '◈',
        status: 'connected'
      };
    } catch {
      return {
        label: 'Inventory Items',
        value: 'Not connected',
        note: 'Unable to query inventory table',
        icon: '◈',
        status: 'not_connected'
      };
    }
  }

  private async fetchMonthlyPayroll(client: any): Promise<MetricItem> {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const { data, error } = await client
        .from('payroll')
        .select('id, month, net_salary, status');

      if (error) {
        return {
          label: 'Monthly Payroll',
          value: 'Not connected',
          note: error.message || 'Payroll table unavailable',
          icon: '＄',
          status: 'error'
        };
      }

      const rows: Array<{ id: string; month?: string; net_salary?: number; status?: string }> = data || [];
      if (rows.length === 0) {
        return {
          label: 'Monthly Payroll',
          value: 'EGP 0',
          note: 'No payroll records found',
          icon: '＄',
          status: 'empty'
        };
      }

      // Filter for current month or take latest available
      const monthRows = rows.filter(r => r.month === currentMonth);
      const activeList = monthRows.length > 0 ? monthRows : rows;
      const monthLabel = monthRows.length > 0 ? currentMonth : activeList[0]?.month || 'Recent';

      const totalNet = activeList.reduce((acc, curr) => acc + (Number(curr.net_salary) || 0), 0);

      return {
        label: 'Monthly Payroll',
        value: `EGP ${totalNet.toLocaleString()}`,
        note: `Period: ${monthLabel} (${activeList.length} slips)`,
        icon: '＄',
        status: 'connected'
      };
    } catch {
      return {
        label: 'Monthly Payroll',
        value: 'Not connected',
        note: 'Unable to query payroll records',
        icon: '＄',
        status: 'not_connected'
      };
    }
  }

  private async fetchFinancialSummary(client: any): Promise<MetricItem> {
    try {
      // Check verified accounting tables (safes or invoices)
      const { data: safes, error: safesErr } = await client
        .from('finance_safes')
        .select('id, name, balance')
        .eq('is_active', true);

      if (safesErr) {
        // Table may not be deployed yet in Supabase
        return {
          label: 'Financial Treasury',
          value: 'Not connected',
          note: 'Accounting schema tables not yet deployed in database',
          icon: '📊',
          status: 'not_connected'
        };
      }

      const safesList: Array<{ id: string; name: string; balance?: number }> = safes || [];
      const totalTreasury = safesList.reduce((acc, s) => acc + (Number(s.balance) || 0), 0);

      return {
        label: 'Financial Treasury',
        value: `EGP ${totalTreasury.toLocaleString()}`,
        note: `${safesList.length} active safe account(s)`,
        icon: '📊',
        status: 'connected'
      };
    } catch {
      return {
        label: 'Financial Treasury',
        value: 'Not connected',
        note: 'Verified financial data not available',
        icon: '📊',
        status: 'not_connected'
      };
    }
  }

  private buildUnconfiguredState(statusMsg: string): DashboardOverview {
    return {
      totalEmployees: {
        label: 'Total Employees',
        value: 'Not connected',
        note: 'Supabase URL and anon key required',
        icon: '♙',
        status: 'not_connected'
      },
      attendanceToday: {
        label: 'Attendance Today',
        value: 'Not connected',
        note: 'Awaiting database connection',
        icon: '◷',
        status: 'not_connected'
      },
      pendingRequests: {
        label: 'Pending Requests',
        value: 'Not connected',
        note: 'Awaiting database connection',
        icon: '▤',
        status: 'not_connected'
      },
      inventoryAlerts: {
        label: 'Inventory Items',
        value: 'Not connected',
        note: 'Awaiting database connection',
        icon: '◈',
        status: 'not_connected'
      },
      monthlyPayroll: {
        label: 'Monthly Payroll',
        value: 'Not connected',
        note: 'Awaiting database connection',
        icon: '＄',
        status: 'not_connected'
      },
      financialSummary: {
        label: 'Financial Treasury',
        value: 'Not connected',
        note: 'Awaiting database connection',
        icon: '📊',
        status: 'not_connected'
      },
      isSupabaseConfigured: false,
      statusMessage: statusMsg,
      lastUpdated: null
    };
  }

  private errorMetric(label: string, icon: string): MetricItem {
    return {
      label,
      value: 'Error',
      note: 'Failed to query database metric',
      icon,
      status: 'error'
    };
  }
}
