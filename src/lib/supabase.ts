import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Check if environment variables are properly configured
const isSupabaseConfigured = supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('http') && 
  !supabaseUrl.includes('placeholder')

if (!isSupabaseConfigured) {
  console.warn('Supabase not configured - some features will be disabled')
}

// Only create client if properly configured
export const supabase = isSupabaseConfigured 
  ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
  : null

// Admin client for server-side operations
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export const supabaseAdmin = (isSupabaseConfigured && supabaseServiceKey)
  ? createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null

// Helper function to check if Supabase is available
export const isSupabaseAvailable = () => isSupabaseConfigured && supabase !== null

// Helper function to get supabase client safely
export const getSupabaseClient = () => {
  if (!isSupabaseAvailable()) {
    throw new Error('Supabase is not configured. Please set up your environment variables.')
  }
  return supabase as NonNullable<typeof supabase>
}