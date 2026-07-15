import { createClient, SupportedStorage } from '@supabase/supabase-js'

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim() || 'https://placeholder.supabase.co'
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim() || 'placeholder-anon-key'
const isPlaceholderUrl =
  supabaseUrl.includes('placeholder.supabase.co') ||
  supabaseUrl.includes('your-project-id') ||
  supabaseUrl.includes('your-supabase')
const isPlaceholderKey =
  supabaseAnonKey.includes('placeholder-anon-key') ||
  supabaseAnonKey.includes('your-supabase')

// Helper used by services/components to know whether the app has any Supabase env values configured.
// Placeholder values are treated as a local starter configuration so the app can boot.
export const isSupabaseUsingPlaceholderValues = isPlaceholderUrl || isPlaceholderKey
export const isSupabaseConfigured = !!supabaseUrl && !!supabaseAnonKey && !isSupabaseUsingPlaceholderValues

// Custom storage to support Remember Me functionality
// Defaults to localStorage (remember me = true). 
// The LoginForm will toggle this by writing to a local config before sign-in.
const customStorage: SupportedStorage = {
  getItem: (key) => {
    const useSessionStorage = localStorage.getItem('hc_use_session_storage') === 'true'
    if (useSessionStorage) {
      return sessionStorage.getItem(key)
    }
    return localStorage.getItem(key)
  },
  setItem: (key, value) => {
    const useSessionStorage = localStorage.getItem('hc_use_session_storage') === 'true'
    if (useSessionStorage) {
      sessionStorage.setItem(key, value)
    } else {
      localStorage.setItem(key, value)
    }
  },
  removeItem: (key) => {
    sessionStorage.removeItem(key)
    localStorage.removeItem(key)
  }
}

// NEVER use SUPABASE_SERVICE_ROLE_KEY here
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: customStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})
