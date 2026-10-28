import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private client: SupabaseClient | null = null;
  private isConfiguredState = false;
  private configStatusMessage = '';

  constructor() {
    this.initClient();
  }

  private initClient(): void {
    const url = (environment.supabaseUrl || '').trim();
    const key = (environment.supabaseAnonKey || '').trim();

    if (!url || !key) {
      this.isConfiguredState = false;
      this.configStatusMessage =
        'Supabase credentials are not configured. Provide SUPABASE_URL and SUPABASE_ANON_KEY in environment configuration.';
      this.client = null;
      return;
    }

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
      this.isConfiguredState = false;
      const errorMsg = err instanceof Error ? err.message : 'Unknown initialization error';
      this.configStatusMessage = `Failed to initialize Supabase client: ${errorMsg}`;
      this.client = null;
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
   * Returns the active SupabaseClient instance, or null if unconfigured.
   */
  public getClient(): SupabaseClient | null {
    return this.client;
  }
}
