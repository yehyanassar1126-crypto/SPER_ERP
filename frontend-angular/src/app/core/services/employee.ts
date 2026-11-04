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
  // دالة الإضافة (Add)
  async addEmployee(employeeData: Partial<Employee>): Promise<boolean> {
    try {
      const generatedEmpId = 'EMP-' + Math.floor(1000 + Math.random() * 9000);
      const generatedUsername = employeeData.email
        ? employeeData.email.split('@')[0]
        : 'user_' + Math.floor(1000 + Math.random() * 9000);

      // الـ Payload الكامل شاملاً الحقول الإجبارية في الجدول
      const payload: any = {
        employee_id: generatedEmpId,
        username: generatedUsername,
        password_hash: '123456', // لتجاوز شرط password_hash الـ NOT NULL
        full_name: employeeData.name,
        email: employeeData.email,
        role: 'employee'
      };

      if (employeeData.department) payload.department = employeeData.department;
      if (employeeData.position) payload.position = employeeData.position;

      const { data, error } = await this.supabase
        .from('users')
        .insert([payload]);

      if (error) {
        console.error('Supabase Add Error Details:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Add Catch Error:', err);
      return false;
    }
  }

  // دالة التعديل (Update)
  async updateEmployee(id: string, employeeData: Partial<Employee>): Promise<boolean> {
    try {
      const payload: any = {
        full_name: employeeData.name,
        email: employeeData.email
      };

      if (employeeData.department) payload.department = employeeData.department;
      if (employeeData.position) payload.position = employeeData.position;

      const { data, error } = await this.supabase
        .from('users')
        .update(payload)
        .eq('id', id);

      if (error) {
        console.error('Supabase Update Error Details:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Update Catch Error:', err);
      return false;
    }
  }
  // 5. حذف موظف
// دالة الحذف (Delete)
  async deleteEmployee(id: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('users') // التوجيه لجدول users بدلاً من v_employee_summary
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Supabase Delete Error:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Delete Catch Error:', err);
      return false;
    }
  }
}
