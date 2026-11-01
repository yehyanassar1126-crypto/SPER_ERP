import { Routes } from '@angular/router';
import { LoginComponent } from './features/hr/login/login';
import { MainLayout } from './layout/main-layout/main-layout';
import { Dashboard } from './features/dashboard/dashboard';
import { EmployeeListComponent } from './features/hr/employee-list/employee-list';
// المسار الصحيح للـ Attendance بناءً على شجرة الملفات
import { AttendanceComponent } from './features/attendance/attendance.component';
import { Finance } from './features/finance/finance';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: MainLayout,
    children: [
      { path: 'dashboard', component: Dashboard },
      { path: 'employees', component: EmployeeListComponent },
      { path: 'attendance', component: AttendanceComponent },
      { path: 'finance', component: Finance },
      { path: 'inventory', component: Dashboard },
      { path: 'manufacturing', component: Dashboard },
      { path: 'maintenance', component: Dashboard },
      { path: 'ai-insights', component: Dashboard },
    ]
  },
  { path: '**', redirectTo: 'login' }
];
