import { Component, ChangeDetectorRef, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  encapsulation: ViewEncapsulation.None
})
export class LoginComponent {
  username = '';
  password = '';
  loading = false;
  errorMessage = '';

  private supabase = createClient(environment.supabaseUrl, environment.supabaseKey);

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  async onLogin() {
    if (!this.username.trim() || !this.password) {
      this.errorMessage = 'Please enter both username and password.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    try {
      // البحث المباشر باسم المستخدم من عمود username
      const { data: users, error } = await this.supabase
        .from('users')
        .select('*')
        .ilike('username', this.username.trim());

      if (error || !users || users.length === 0) {
        this.errorMessage = 'Invalid username or password. Please try again.';
      } else {
        const user = users[0];

        // المطابقة مع عمود password_hash الموجود في الجدول عندك
        if (user.password_hash !== this.password) {
          this.errorMessage = 'Invalid username or password. Please try again.';
        } else {
          localStorage.setItem('currentUser', JSON.stringify(user));
          await this.router.navigate(['/dashboard']);
        }
      }
    } catch (err: any) {
      this.errorMessage = 'Invalid login details. Please try again.';
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }
}
