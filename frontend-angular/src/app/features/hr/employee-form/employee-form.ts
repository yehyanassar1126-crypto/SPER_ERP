import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { EmployeeService } from '../../../core/services/employee';

@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './employee-form.html',
  styleUrl: './employee-form.scss'
})
export class EmployeeFormComponent implements OnInit {
  employeeForm!: FormGroup;
  isEditMode = false;
  employeeId: string | null = null;
  loading$!: Observable<boolean>;
  error$!: Observable<string | null>;

  constructor(
    private fb: FormBuilder,
    private employeeService: EmployeeService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loading$ = this.employeeService.loading$;
    this.error$ = this.employeeService.error$;
  }

  ngOnInit(): void {
    this.initForm();
    this.employeeId = this.route.snapshot.paramMap.get('id');
    if (this.employeeId) {
      this.isEditMode = true;
      this.loadEmployeeData(this.employeeId);
    }
  }

  private initForm(): void {
    this.employeeForm = this.fb.group({
      first_name: ['', [Validators.required]],
      last_name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      department: [''],
      position: [''],
      salary: [null],
      hire_date: ['']
    });
  }

  async loadEmployeeData(id: string): Promise<void> {
    const employee = await this.employeeService.getEmployeeById(id);
    if (employee) {
      this.employeeForm.patchValue(employee);
    }
  }

  async onSubmit(): Promise<void> {
    if (this.employeeForm.invalid) {
      this.employeeForm.markAllAsTouched();
      return;
    }

    const formData = this.employeeForm.value;

    if (this.isEditMode && this.employeeId) {
      const updated = await this.employeeService.updateEmployee(this.employeeId, formData);
      if (updated) {
        this.router.navigate(['/hr/employees']);
      }
    } else {
      const created = await this.employeeService.addEmployee(formData);
      if (created) {
        this.router.navigate(['/hr/employees']);
      }
    }
  }
}