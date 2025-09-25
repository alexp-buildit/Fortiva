import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('🔧 Supabase config:', {
  url: supabaseUrl,
  hasKey: !!supabaseAnonKey
});

// Validate environment variables
if (!supabaseUrl?.includes('wgqihgtcokgmrombniko')) {
  console.error('❌ Supabase URL mismatch:', supabaseUrl);
  throw new Error('Supabase URL mismatch - check your project URL');
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing env vars:', { supabaseUrl, supabaseAnonKey });
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

console.log('✅ Supabase client initialized successfully');

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          phone?: string;
          first_name: string;
          last_name: string;
          username: string;
          business_address?: any;
          is_admin: boolean;
          admin_approved: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          phone?: string;
          first_name: string;
          last_name: string;
          username: string;
          business_address?: any;
          is_admin?: boolean;
          admin_approved?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          phone?: string;
          first_name?: string;
          last_name?: string;
          username?: string;
          business_address?: any;
          is_admin?: boolean;
          admin_approved?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};