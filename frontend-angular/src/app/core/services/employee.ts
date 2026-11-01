import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { BehaviorSubject } from 'rxjs';
import { Employee } from '../models/employee.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private supabase: SupabaseClient;

  // States: Loading & Error
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  private errorSubject = new BehaviorSubject<string | null>(null);
  public error$ = this.errorSubject.asObservable();

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  // 1. Fetch All Employees
  async getEmployees(): Promise<Employee[]> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);
    try {
      const { data, error } = await this.supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Employee[];
    } catch (err: any) {
      this.errorSubject.next(err.message || 'حدث خطأ أثناء جلب بيانات الموظفين');
      return [];
    } finally {
      this.loadingSubject.next(false);
    }
  }

  // 2. Fetch Single Employee
  async getEmployeeById(id: string): Promise<Employee | null> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);
    try {
      const { data, error } = await this.supabase
        .from('employees')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Employee;
    } catch (err: any) {
      this.errorSubject.next(err.message || 'تعذر العثور على بيانات الموظف');
      return null;
    } finally {
      this.loadingSubject.next(false);
    }
  }

  // 3. Add New Employee
  async addEmployee(employee: Employee): Promise<Employee | null> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);
    try {
      const { data, error } = await this.supabase
        .from('employees')
        .insert([employee])
        .select()
        .single();

      if (error) throw error;
      return data as Employee;
    } catch (err: any) {
      this.errorSubject.next(err.message || 'فشل في إضافة الموظف');
      return null;
    } finally {
      this.loadingSubject.next(false);
    }
  }

  // 4. Update Employee
  async updateEmployee(id: string, employee: Partial<Employee>): Promise<Employee | null> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);
    try {
      const { data, error } = await this.supabase
        .from('employees')
        .update(employee)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Employee;
    } catch (err: any) {
      this.errorSubject.next(err.message || 'فشل في تحديث بيانات الموظف');
      return null;
    } finally {
      this.loadingSubject.next(false);
    }
  }

  // 5. Delete Employee
  async deleteEmployee(id: string): Promise<boolean> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);
    try {
      const { error } = await this.supabase
        .from('employees')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (err: any) {
      this.errorSubject.next(err.message || 'فشل في حذف الموظف');
      return false;
    } finally {
      this.loadingSubject.next(false);
    }
  }
}