import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Employee } from '../models/employee.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private supabase: SupabaseClient;

  private loadingSubject = new BehaviorSubject<boolean>(false);
  loading$: Observable<boolean> = this.loadingSubject.asObservable();

  private errorSubject = new BehaviorSubject<string | null>(null);
  error$: Observable<string | null> = this.errorSubject.asObservable();

  // اسم الـ View المعتمد في Supabase
  private readonly tableName = 'v_employee_summary';

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  // 1. جلب كافة الموظفين من قاعدة البيانات
  async getEmployees(): Promise<Employee[]> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*');

      if (error) throw error;

      this.loadingSubject.next(false);
      return data as Employee[];
    } catch (err: any) {
      console.error('Supabase fetch error:', err);
      this.errorSubject.next(err.message || 'Failed to fetch employees from database.');
      this.loadingSubject.next(false);
      return [];
    }
  }

  // 2. جلب موظف واحد عن طريق الـ ID
  async getEmployeeById(id: string): Promise<Employee | null> {
    this.loadingSubject.next(true);
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      this.loadingSubject.next(false);
      return data as Employee;
    } catch (err: any) {
      console.error('Error fetching employee by ID:', err);
      this.errorSubject.next(err.message);
      this.loadingSubject.next(false);
      return null;
    }
  }

  // 3. إضافة موظف جديد
  async addEmployee(employee: Employee): Promise<boolean> {
    this.loadingSubject.next(true);
    try {
      const { error } = await this.supabase
        .from(this.tableName)
        .insert([employee]);

      if (error) throw error;
      this.loadingSubject.next(false);
      return true;
    } catch (err: any) {
      console.error('Error adding employee:', err);
      this.errorSubject.next(err.message);
      this.loadingSubject.next(false);
      return false;
    }
  }

  // 4. تحديث بيانات موظف
  async updateEmployee(id: string, employee: Partial<Employee>): Promise<boolean> {
    this.loadingSubject.next(true);
    try {
      const { error } = await this.supabase
        .from(this.tableName)
        .update(employee)
        .eq('id', id);

      if (error) throw error;
      this.loadingSubject.next(false);
      return true;
    } catch (err: any) {
      console.error('Error updating employee:', err);
      this.errorSubject.next(err.message);
      this.loadingSubject.next(false);
      return false;
    }
  }

  // 5. حذف موظف
  async deleteEmployee(id: string): Promise<boolean> {
    this.loadingSubject.next(true);
    try {
      const { error } = await this.supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) throw error;
      this.loadingSubject.next(false);
      return true;
    } catch (err: any) {
      console.error('Error deleting employee:', err);
      this.errorSubject.next(err.message);
      this.loadingSubject.next(false);
      return false;
    }
  }
}
