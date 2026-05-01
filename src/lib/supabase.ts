import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// NEVER use SUPABASE_SERVICE_ROLE_KEY here
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
