import { createClient } from '@supabase/supabase-js';
import { config } from './env';

// Create Supabase client for server-side operations
export const supabaseAdmin = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Create Supabase client for client-side operations
export const supabaseClient = createClient(
  config.supabase.url,
  config.supabase.anonKey
);

// Helper function to get Supabase client with user context
export const getSupabaseClient = (accessToken?: string) => {
  if (!accessToken) {
    return supabaseClient;
  }

  return createClient(
    config.supabase.url,
    config.supabase.anonKey,
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    }
  );
};

export default supabaseAdmin;

