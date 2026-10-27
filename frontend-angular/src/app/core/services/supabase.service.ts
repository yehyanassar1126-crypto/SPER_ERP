
import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  public readonly client: SupabaseClient;

  constructor() {
    this.client = createClient(
      environment.supabaseUrl,
      environment.supabaseKey
    );
  }

  async testConnection() {
    const { data, error } = await this.client
      .from('users')
      .select('id, full_name')
      .limit(5);

    if (error) {
      console.error('Supabase connection error:', error.message);
      return;
    }

    console.log('Supabase connection successful!');
    console.log('Users:', data);
  }
}
