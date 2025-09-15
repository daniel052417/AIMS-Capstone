import { createClient } from '@supabase/supabase-js';
import { config } from './env';

// Client for user operations (uses anon key)
export const supabase = createClient(
  config.SUPABASE_URL,
  config.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  },
);

// Admin client for server operations (uses service role key)
export const supabaseAdmin = createClient(
  config.SUPABASE_URL,
  config.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

// Database types (you'll update these after running schema)
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          first_name: string;
          last_name: string;
          phone?: string;
          branch_id?: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          last_login?: string;
        };
        Insert: {
          id: string;
          email: string;
          first_name: string;
          last_name: string;
          phone?: string;
          branch_id?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          last_login?: string;
        };
        Update: {
          id?: string;
          email?: string;
          first_name?: string;
          last_name?: string;
          phone?: string;
          branch_id?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          last_login?: string;
        };
      };
      // Add other table types as needed
    };
  };
};