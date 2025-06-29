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
  phone: string | null
  bio: string | null
  course: string | null
  university: string | null
  period: string | null
  linkedin_url: string | null
  created_at: string
  updated_at: string
} 