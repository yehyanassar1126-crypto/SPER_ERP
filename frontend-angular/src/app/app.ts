
import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SupabaseService } from './core/services/supabase.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet />',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  private readonly supabaseService = inject(SupabaseService);

  ngOnInit(): void {
    this.supabaseService.testConnection();
  }
}
