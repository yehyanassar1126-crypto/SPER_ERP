import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface PayrollRecord {
  id: string;
  employee_id?: string;
  employee_name: string;
  department?: string;
  month: string;
  base_salary: number;
  overtime_pay: number;
  bonuses: number;
  performance_bonus?: number;
  penalties: number;
  late_deductions: number;
  absence_deductions: number;
  net_salary: number;
  status: 'processing' | 'funds_released' | 'paid' | string;
  paid_date?: string;
  created_at?: string;
}

export interface ExpenseRecord {
  id: string;
  employee_id?: string;
  employee_name: string;
  type: string;
  amount: number;
  date: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected' | string;
  created_at?: string;
}

export interface CreateExpenseDto {
  employee_name: string;
  type: string;
  amount: number;
  date: string;
  description: string;
}

export interface SafeAccount {
  id: string;
  name: string;
  balance: number;
  is_active: boolean;
}

export interface BankAccount {
  id: string;
  bank_name: string;
  account_number?: string;
  branch?: string;
  balance: number;
  is_active: boolean;
}

export interface FinancialReportSummary {
  isConfigured: boolean;
  totalRevenue: number;
  totalExpenses: number;
  totalPayroll: number;
  netOperatingResult: number;
  safesBalance: number;
  banksBalance: number;
  totalLiquidity: number;
  revenueStatus: 'connected' | 'not_connected' | 'empty';
  expensesStatus: 'connected' | 'not_connected' | 'empty';
  payrollStatus: 'connected' | 'not_connected' | 'empty';
  treasuryStatus: 'connected' | 'not_connected' | 'empty';
  notes: string[];
}

export interface ExpenseCategoryBreakdown {
  category: string;
  totalAmount: number;
  count: number;
}

@Injectable({
  providedIn: 'root'
})
export class FinanceService {
  private readonly supabase = inject(SupabaseService);

  // ==========================================
  // PAYROLL MODULE
  // ==========================================

  public async getPayrollRecords(month?: string): Promise<{ data: PayrollRecord[]; error: string | null }> {
    const client = this.supabase.getClient();
    if (!client) {
      return { data: [], error: 'Supabase is not configured. Connect database credentials to view payroll.' };
    }

    try {
      let query = client
        .from('payroll')
        .select('*')
        .order('created_at', { ascending: false });

      if (month && month !== 'all') {
        query = query.eq('month', month);
      }

      const { data, error } = await query;
      if (error) {
        return { data: [], error: `Failed to fetch payroll: ${error.message}` };
      }

      const mapped: PayrollRecord[] = (data || []).map((row: any) => ({
        id: row.id,
        employee_id: row.employee_id,
        employee_name: row.employee_name || 'Unnamed Employee',
        department: row.department || 'General',
        month: row.month || 'Unknown',
        base_salary: Number(row.base_salary) || 0,
        overtime_pay: Number(row.overtime_pay) || 0,
        bonuses: Number(row.bonuses) || 0,
        performance_bonus: Number(row.performance_bonus) || 0,
        penalties: Number(row.penalties) || 0,
        late_deductions: Number(row.late_deductions) || 0,
        absence_deductions: Number(row.absence_deductions) || 0,
        net_salary: Number(row.net_salary) || 0,
        status: row.status || 'processing',
        paid_date: row.paid_date,
        created_at: row.created_at
      }));

      return { data: mapped, error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network or execution error';
      return { data: [], error: `Payroll query failed: ${msg}` };
    }
  }

  public async updatePayrollStatus(
    id: string,
    newStatus: 'processing' | 'funds_released' | 'paid'
  ): Promise<{ success: boolean; error: string | null }> {
    const client = this.supabase.getClient();
    if (!client) {
      return { success: false, error: 'Database not connected' };
    }

    try {
      const updatePayload: Record<string, any> = { status: newStatus };
      if (newStatus === 'paid') {
        updatePayload['paid_date'] = new Date().toISOString().split('T')[0];
      }

      const { error } = await client.from('payroll').update(updatePayload).eq('id', id);
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Update failed';
      return { success: false, error: msg };
    }
  }

  public async releaseAllFundsForMonth(month: string): Promise<{ success: boolean; count: number; error: string | null }> {
    const client = this.supabase.getClient();
    if (!client) {
      return { success: false, count: 0, error: 'Database not connected' };
    }

    try {
      const { data, error } = await client
        .from('payroll')
        .update({ status: 'funds_released' })
        .eq('month', month)
        .eq('status', 'processing')
        .select('id');

      if (error) {
        return { success: false, count: 0, error: error.message };
      }
      return { success: true, count: data?.length || 0, error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Bulk release failed';
      return { success: false, count: 0, error: msg };
    }
  }

  // ==========================================
  // EXPENSES MODULE
  // ==========================================

  public async getExpenses(statusFilter?: string): Promise<{ data: ExpenseRecord[]; error: string | null }> {
    const client = this.supabase.getClient();
    if (!client) {
      return { data: [], error: 'Supabase is not configured. Connect database credentials to view expenses.' };
    }

    try {
      let query = client
        .from('expenses')
        .select('*')
        .order('date', { ascending: false });

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) {
        return { data: [], error: `Failed to fetch expenses: ${error.message}` };
      }

      const mapped: ExpenseRecord[] = (data || []).map((row: any) => ({
        id: row.id,
        employee_id: row.employee_id,
        employee_name: row.employee_name || 'Staff Member',
        type: row.type || 'General Expense',
        amount: Number(row.amount) || 0,
        date: row.date || new Date().toISOString().split('T')[0],
        description: row.description || '',
        status: row.status || 'pending',
        created_at: row.created_at
      }));

      return { data: mapped, error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network or execution error';
      return { data: [], error: `Expenses query failed: ${msg}` };
    }
  }

  public async submitExpense(dto: CreateExpenseDto): Promise<{ success: boolean; error: string | null }> {
    const client = this.supabase.getClient();
    if (!client) {
      return { success: false, error: 'Database not connected' };
    }

    try {
      const { error } = await client.from('expenses').insert([
        {
          employee_name: dto.employee_name.trim(),
          type: dto.type,
          amount: dto.amount,
          date: dto.date,
          description: dto.description.trim(),
          status: 'pending'
        }
      ]);

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Submission failed';
      return { success: false, error: msg };
    }
  }

  public async updateExpenseStatus(
    id: string,
    newStatus: 'approved' | 'rejected'
  ): Promise<{ success: boolean; error: string | null }> {
    const client = this.supabase.getClient();
    if (!client) {
      return { success: false, error: 'Database not connected' };
    }

    try {
      const { error } = await client
        .from('expenses')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Status update failed';
      return { success: false, error: msg };
    }
  }

  // ==========================================
  // FINANCIAL REPORTS MODULE
  // ==========================================

  public async getFinancialReportSummary(): Promise<FinancialReportSummary> {
    const client = this.supabase.getClient();
    if (!client) {
      return {
        isConfigured: false,
        totalRevenue: 0,
        totalExpenses: 0,
        totalPayroll: 0,
        netOperatingResult: 0,
        safesBalance: 0,
        banksBalance: 0,
        totalLiquidity: 0,
        revenueStatus: 'not_connected',
        expensesStatus: 'not_connected',
        payrollStatus: 'not_connected',
        treasuryStatus: 'not_connected',
        notes: ['Database connection credentials required to load verified financial statements.']
      };
    }

    const notes: string[] = [];

    // 1. Fetch Expenses (Approved only)
    let totalExpenses = 0;
    let expensesStatus: 'connected' | 'not_connected' | 'empty' = 'not_connected';
    try {
      const { data: expData, error: expErr } = await client
        .from('expenses')
        .select('amount, status')
        .eq('status', 'approved');

      if (!expErr && expData) {
        totalExpenses = expData.reduce((acc, row) => acc + (Number(row.amount) || 0), 0);
        expensesStatus = expData.length > 0 ? 'connected' : 'empty';
      } else if (expErr) {
        notes.push(`Expenses query note: ${expErr.message}`);
      }
    } catch {
      notes.push('Unable to read expenses table');
    }

    // 2. Fetch Payroll Totals (Paid or Released)
    let totalPayroll = 0;
    let payrollStatus: 'connected' | 'not_connected' | 'empty' = 'not_connected';
    try {
      const { data: payData, error: payErr } = await client
        .from('payroll')
        .select('net_salary, status');

      if (!payErr && payData) {
        totalPayroll = payData.reduce((acc, row) => acc + (Number(row.net_salary) || 0), 0);
        payrollStatus = payData.length > 0 ? 'connected' : 'empty';
      } else if (payErr) {
        notes.push(`Payroll query note: ${payErr.message}`);
      }
    } catch {
      notes.push('Unable to read payroll table');
    }

    // 3. Fetch Revenue from verified Invoices (Sales invoices)
    let totalRevenue = 0;
    let revenueStatus: 'connected' | 'not_connected' | 'empty' = 'not_connected';
    try {
      const { data: invData, error: invErr } = await client
        .from('finance_invoices')
        .select('total, paid_amount, invoice_type')
        .eq('invoice_type', 'sales');

      if (!invErr && invData) {
        totalRevenue = invData.reduce((acc, row) => acc + (Number(row.total) || 0), 0);
        revenueStatus = invData.length > 0 ? 'connected' : 'empty';
      } else if (invErr) {
        revenueStatus = 'not_connected';
        notes.push('finance_invoices table is not deployed; revenue figures remain unverified.');
      }
    } catch {
      revenueStatus = 'not_connected';
      notes.push('Sales invoices table inaccessible.');
    }

    // 4. Fetch Treasury & Bank Balances
    let safesBalance = 0;
    let banksBalance = 0;
    let treasuryStatus: 'connected' | 'not_connected' | 'empty' = 'not_connected';
    try {
      const [safesRes, banksRes] = await Promise.allSettled([
        client.from('finance_safes').select('id, balance').eq('is_active', true),
        client.from('finance_bank_accounts').select('id, balance').eq('is_active', true)
      ]);

      let hasSafes = false;
      let hasBanks = false;

      if (safesRes.status === 'fulfilled' && !safesRes.value.error && safesRes.value.data) {
        safesBalance = safesRes.value.data.reduce((acc: number, s: any) => acc + (Number(s.balance) || 0), 0);
        hasSafes = true;
      }
      if (banksRes.status === 'fulfilled' && !banksRes.value.error && banksRes.value.data) {
        banksBalance = banksRes.value.data.reduce((acc: number, b: any) => acc + (Number(b.balance) || 0), 0);
        hasBanks = true;
      }

      if (hasSafes || hasBanks) {
        treasuryStatus = (safesBalance > 0 || banksBalance > 0) ? 'connected' : 'empty';
      } else {
        treasuryStatus = 'not_connected';
        notes.push('Treasury tables (finance_safes/finance_bank_accounts) not yet deployed in database.');
      }
    } catch {
      treasuryStatus = 'not_connected';
    }

    const netOperatingResult = totalRevenue - (totalExpenses + totalPayroll);
    const totalLiquidity = safesBalance + banksBalance;

    return {
      isConfigured: true,
      totalRevenue,
      totalExpenses,
      totalPayroll,
      netOperatingResult,
      safesBalance,
      banksBalance,
      totalLiquidity,
      revenueStatus,
      expensesStatus,
      payrollStatus,
      treasuryStatus,
      notes
    };
  }

  public async getExpenseBreakdown(): Promise<ExpenseCategoryBreakdown[]> {
    const client = this.supabase.getClient();
    if (!client) return [];

    try {
      const { data, error } = await client
        .from('expenses')
        .select('type, amount')
        .eq('status', 'approved');

      if (error || !data) return [];

      const map = new Map<string, { total: number; count: number }>();
      for (const row of data) {
        const cat = (row.type || 'Other').trim();
        const current = map.get(cat) || { total: 0, count: 0 };
        current.total += Number(row.amount) || 0;
        current.count += 1;
        map.set(cat, current);
      }

      return Array.from(map.entries()).map(([category, val]) => ({
        category,
        totalAmount: val.total,
        count: val.count
      }));
    } catch {
      return [];
    }
  }
}
