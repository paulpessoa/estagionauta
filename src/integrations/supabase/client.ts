
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL) {
  throw new Error('VITE_SUPABASE_URL environment variable is required. Please add it to your .env.local file.')
}

if (!SUPABASE_ANON_KEY) {
  throw new Error('VITE_SUPABASE_ANON_KEY environment variable is required. Please add it to your .env.local file.')
}

export const supabase = createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY)
