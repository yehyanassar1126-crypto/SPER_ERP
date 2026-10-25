import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss'
})
export class Sidebar {
  readonly menuItems = [
    { label: 'Dashboard', icon: '◫', route: '/dashboard' },
    { label: 'Employees', icon: '♙', route: '/employees' },
    { label: 'Attendance', icon: '◷', route: '/attendance' },
    { label: 'Finance', icon: '＄', route: '/finance' },
    { label: 'Inventory', icon: '▤', route: '/inventory' },
    { label: 'Manufacturing', icon: '⚙', route: '/manufacturing' },
    { label: 'Maintenance', icon: '🔧', route: '/maintenance' },
    { label: 'AI Insights', icon: '✧', route: '/ai' }
  ];
}