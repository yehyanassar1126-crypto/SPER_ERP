import { Routes } from '@angular/router';
import { LoginComponent } from './features/hr/login/login';
import { MainLayout } from './layout/main-layout/main-layout';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: MainLayout,
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard').then(m => m.Dashboard)
      },
   {
        path: 'employees',
        loadComponent: () => import('./features/hr/employee-list/employee-list').then(m => m.EmployeeListComponent)
      },
      {
        path: 'employees/new',
        loadComponent: () => import('./features/hr/employee-form/employee-form').then(m => m.EmployeeFormComponent)
      },
      {
        path: 'employees/edit/:id',
        loadComponent: () => import('./features/hr/employee-form/employee-form').then(m => m.EmployeeFormComponent)
      },
      {
        path: 'finance',
        loadComponent: () => import('./features/finance/finance').then(m => m.Finance),
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'payroll' },
          {
            path: 'payroll',
            loadComponent: () => import('./features/finance/payroll/payroll').then(m => m.Payroll)
          },
          {
            path: 'expenses',
            loadComponent: () => import('./features/finance/expenses/expenses').then(m => m.Expenses)
          },
          {
            path: 'reports',
            loadComponent: () => import('./features/finance/reports/reports').then(m => m.FinancialReports)
          }
        ]
      },
      {
        path: 'attendance',
        loadChildren: () => import('./features/attendance/attendance.routes').then(m => m.ATTENDANCE_ROUTES)
      },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
