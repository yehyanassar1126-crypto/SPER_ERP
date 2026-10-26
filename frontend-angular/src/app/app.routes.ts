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
        path: 'attendance',
        loadChildren: () =>
          import('./features/attendance/attendance.routes').then(m => m.ATTENDANCE_ROUTES)
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
