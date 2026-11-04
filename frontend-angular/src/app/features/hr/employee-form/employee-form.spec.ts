import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { EmployeeService } from '../../../core/services/employee';
import { Employee } from '../../../core/models/employee.model';

@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './employee-form.html',
  styleUrls: ['./employee-form.scss']
})
export class EmployeeFormComponent implements OnInit {
  isEditMode = false;
  employeeId: string | null = null;
  loading = false;
  errorMessage = '';

  employee: Partial<Employee> = {
    name: '',
    email: '',
    department: '',
    position: '',
    phone: ''
  };

  constructor(
    private employeeService: EmployeeService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  async ngOnInit(): Promise<void> {
    this.employeeId = this.route.snapshot.paramMap.get('id');
    if (this.employeeId) {
      this.isEditMode = true;
      await this.loadEmployeeData(this.employeeId);
    }
  }

  async loadEmployeeData(id: string): Promise<void> {
    this.loading = true;
    const data = await this.employeeService.getEmployeeById(id);
    if (data) {
      this.employee = { ...data };
    } else {
      this.errorMessage = 'Failed to load employee details.';
    }
    this.loading = false;
  }

  async onSubmit(): Promise<void> {
    this.loading = true;
    this.errorMessage = '';

    try {
      let success = false;
      if (this.isEditMode && this.employeeId) {
        success = await this.employeeService.updateEmployee(this.employeeId, this.employee);
      } else {
        success = await this.employeeService.addEmployee(this.employee as Employee);
      }

      if (success) {
        this.router.navigate(['/employees']);
      } else {
        this.errorMessage = 'Operation failed. Please check database configuration.';
      }
    } catch (err: any) {
      this.errorMessage = err.message || 'An unexpected error occurred.';
    } finally {
      this.loading = false;
    }
  }
}
