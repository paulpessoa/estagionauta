
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Service role client for admin operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          role: 'mentor' | 'mentee' | 'admin'
          full_name: string
          avatar_url: string | null
          bio: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
      profiles: {
        Row: {
          id: string
          headline: string | null
          skills: string[] | null
          interests: string[] | null
          is_demo: boolean
          is_verified: boolean
          video_url: string | null
          linkedin_url: string | null
          github_url: string | null
          portfolio_url: string | null
          available_for_mentorship: boolean
        }
        Insert: Database['public']['Tables']['profiles']['Row']
        Update: Partial<Database['public']['Tables']['profiles']['Row']>
      }
      event_attendees: {
        Row: {
          id: string
          event_id: string | null
          user_id: string | null
          email: string
          full_name: string
          source_param: string | null
          form_data: any
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['event_attendees']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['event_attendees']['Insert']>
      }
      uploads: {
        Row: {
          id: string
          user_id: string | null
          file_url: string
          file_type: string
          created_at: string
          metadata: any
        }
        Insert: Omit<Database['public']['Tables']['uploads']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['uploads']['Insert']>
      }
    }
  }
}
