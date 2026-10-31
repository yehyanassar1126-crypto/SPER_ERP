import { Component, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';

const PAGE_TITLES: Record<string, string> = {
  dashboard: 'Dashboard',
  employees: 'Employees',
  attendance: 'Attendance',
  finance: 'Finance',
  inventory: 'Inventory',
  manufacturing: 'Manufacturing',
  maintenance: 'Maintenance',
  ai: 'AI Insights'
};

@Component({
  selector: 'app-navbar',
  standalone: true,
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class Navbar {
  private readonly router = inject(Router);

  readonly pageTitle = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      startWith(null),
      map(() => this.getTitle(this.router.url))
    ),
    { initialValue: 'Overview' }
  );

  private getTitle(url: string): string {
    const segment = url.split('?')[0].split('#')[0].split('/').filter(Boolean)[0];
    if (!segment) {
      return 'Overview';
    }
    return PAGE_TITLES[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1);
  }
}
