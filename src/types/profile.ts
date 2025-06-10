import { UserRole } from './permissions'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: UserRole
  credits: number
  subscription_status: 'free' | 'premium'
  subscription_tier: string | null
  created_at: string
  updated_at: string
} 