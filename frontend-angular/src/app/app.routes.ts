import { Routes } from '@angular/router';
import { MainLayout } from './layout/main-layout/main-layout';

export const routes: Routes = [
  {
    path: '',
    component: MainLayout,
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard').then(m => m.Dashboard)
      },
      {
        path: 'finance',
        loadComponent: () =>
          import('./features/finance/finance').then(m => m.Finance),
        children: [
          {
            path: '',
            pathMatch: 'full',
            redirectTo: 'payroll'
          },
          {
            path: 'payroll',
            loadComponent: () =>
              import('./features/finance/payroll/payroll').then(m => m.Payroll)
          },
          {
            path: 'expenses',
            loadComponent: () =>
              import('./features/finance/expenses/expenses').then(m => m.Expenses)
          },
          {
            path: 'reports',
            loadComponent: () =>
              import('./features/finance/reports/reports').then(m => m.FinancialReports)
          }
        ]
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard'
      },
      {
        path: '**',
        redirectTo: 'dashboard'
      }
    ]
  }
];