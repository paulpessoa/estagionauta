import { UserRole } from './permissions'

export interface NotificationSettings {
  emailNotifications: boolean
  pushNotifications: boolean
  weeklyReport: boolean
  marketingEmails: boolean
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'private' | 'friends'
  showEmail: boolean
  showPhone: boolean
}

export interface AppearanceSettings {
  theme: 'light' | 'dark' | 'system'
  language: 'pt' | 'en' | 'es'
}

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
  is_currently_interning?: boolean
  curriculo_slug?: string | null
  notification_settings?: NotificationSettings
  privacy_settings?: PrivacySettings
  appearance_settings?: AppearanceSettings
  referral_code?: string | null
  referred_by?: string | null
  created_at: string
  updated_at: string
} 