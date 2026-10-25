import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard {
  readonly stats = [
    { label: 'Total Employees', value: '—', note: 'Connect Supabase to load data', icon: '♙' },
    { label: 'Attendance Today', value: '—', note: 'Awaiting attendance data', icon: '◷' },
    { label: 'Pending Requests', value: '—', note: 'Awaiting workflow data', icon: '▤' },
    { label: 'Inventory Items', value: '—', note: 'Connect inventory data', icon: '◈' }
  ];
}