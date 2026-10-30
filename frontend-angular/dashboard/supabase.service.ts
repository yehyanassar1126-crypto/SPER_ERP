import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  public readonly client: SupabaseClient;
  private isConfiguredState = false;
  private configStatusMessage = '';

  constructor() {
    const url = (environment.supabaseUrl || '').trim();
    const key = (environment.supabasePublishableKey || environment.supabaseKey || environment.supabaseAnonKey || '').trim();

    if (url && key) {
      try {
        this.client = createClient(url, key, {
          auth: {
            persistSession: true,
            autoRefreshToken: true
          }
        });
        this.isConfiguredState = true;
        this.configStatusMessage = 'Connected to Supabase';
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown initialization error';
        this.configStatusMessage = `Failed to initialize Supabase client: ${errorMsg}`;
        this.isConfiguredState = false;
        this.client = createClient(url || 'https://placeholder.supabase.co', key || 'placeholder');
      }
    } else {
      this.isConfiguredState = false;
      this.configStatusMessage = 'Supabase credentials are not configured.';
      this.client = createClient('https://placeholder.supabase.co', 'placeholder');
    }
  }

  /**
   * Returns true if Supabase URL and anon key are properly configured and initialized.
   */
  public isConfigured(): boolean {
    return this.isConfiguredState;
  }

  /**
   * Returns the current configuration status or error message.
   */
  public getStatusMessage(): string {
    return this.configStatusMessage;
  }

  /**
   * Returns the active SupabaseClient instance.
   */
  public getClient(): SupabaseClient {
    return this.client;
  }

  /**
   * Quick connection verification test.
   */
  public async testConnection(): Promise<void> {
    const { data, error } = await this.client
      .from('users')
      .select('id, full_name')
      .limit(5);

    if (error) {
      console.error('Supabase connection error:', error.message);
      return;
    }

    console.log('Supabase connection successful!', data);
  }
}
