import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { EmployeeService } from '../../../core/services/employee';
import { Employee } from '../../../core/models/employee.model';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './employee-list.html',
  styleUrl: './employee-list.scss'
})
export class EmployeeListComponent implements OnInit {
  employees: Employee[] = [];
  filteredEmployees: Employee[] = [];
  searchTerm: string = '';

  loading$: Observable<boolean>;
  error$: Observable<string | null>;

  constructor(private employeeService: EmployeeService) {
    this.loading$ = this.employeeService.loading$;
    this.error$ = this.employeeService.error$;
  }

  ngOnInit(): void {
    this.loadEmployees();
  }

  async loadEmployees(): Promise<void> {
    this.employees = await this.employeeService.getEmployees();
    this.filteredEmployees = this.employees;
  }

filterEmployees(): void {
    if (!this.searchTerm || !this.searchTerm.trim()) {
      this.filteredEmployees = this.employees;
      return;
    }
    const term = this.searchTerm.toLowerCase();
    this.filteredEmployees = this.employees.filter((emp: any) =>
      emp.name?.toLowerCase().includes(term) ||
      emp.full_name?.toLowerCase().includes(term) ||
      emp.email?.toLowerCase().includes(term) ||
      emp.department?.toLowerCase().includes(term) ||
      emp.position?.toLowerCase().includes(term) ||
      emp.role?.toLowerCase().includes(term)
    );
  }
async deleteEmployee(id?: string): Promise<void> {
    if (!id) return;

    if (confirm('Are you sure you want to delete this employee?')) {
      const success = await this.employeeService.deleteEmployee(id);
      if (success) {
        await this.loadEmployees();
      } else {
        alert('Failed to delete employee. Please try again.');
      }
    }
  }
}
