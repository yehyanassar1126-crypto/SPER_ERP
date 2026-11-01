import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { EmployeeService } from '../../../core/services/employee';
import { Employee } from '../../../core/models/employee.model';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './employee-list.html',
  styleUrl: './employee-list.scss'
})
export class EmployeeListComponent implements OnInit {
  employees: Employee[] = [];
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
  }

  async deleteEmployee(id: string | undefined): Promise<void> {
    if (!id) return;
    if (confirm('هل أنت تأكد من رغبتك في حذف هذا الموظف؟')) {
      const success = await this.employeeService.deleteEmployee(id);
      if (success) {
        this.loadEmployees();
      }
    }
  }
}