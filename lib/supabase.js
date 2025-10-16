/**
 * 🗄️ Supabase Client Configuration
 * Unified Supabase client for both client and server-side usage
 */

import { createClient } from '@supabase/supabase-js';

// Public client (for client-side usage)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️  Supabase environment variables not found. Using fallback.');
}

// Client-side Supabase client (with anon key)
export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);

// Server-side Supabase client (with service role key - full access)
// Only use this in API routes, NEVER expose to client!
export function getServiceSupabase() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  }
  
  return createClient(
    supabaseUrl || '',
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

// Helper function to check if Supabase is configured
export function isSupabaseConfigured() {
  return !!(supabaseUrl && supabaseAnonKey);
}

export default supabase;
