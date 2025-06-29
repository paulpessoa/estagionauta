import { createContext, useContext, ReactNode } from 'react'
import { useUserSession } from './useUserSession'
import { useUserProfile } from './useUserProfile'
import { User } from '@supabase/supabase-js'
import { Profile } from '@/types/profile'
import { UserRole } from '@/types/permissions'
import { isSupabaseConfigured } from '@/integrations/supabase/config'
import { supabase } from '@/integrations/supabase/client'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  hasPermission: (permission: string) => boolean
  signOut: () => Promise<void>
  signInWithOtp: (email: string) => Promise<void>
  isLoading: boolean
  isSupabaseAvailable: boolean
  isAdmin: boolean
  isModerator: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const isSupabaseAvailable = isSupabaseConfigured()
  const { user, isLoading: sessionLoading } = useUserSession()
  const { data: profile, isLoading: profileLoading } = useUserProfile(user?.id ?? null)

  const isLoading = sessionLoading || profileLoading

  const hasPermission = (permission: string): boolean => {
    if (!profile) return false

    const userRole = (profile as Profile).role

    const rolePermissions: Record<UserRole, string[]> = {
      student: ['agencies.view', 'resumes.view', 'resumes.analyze', 'content.view'],
      agency: ['agencies.view', 'agencies.update', 'resumes.view', 'content.view', 'reports.create'],
      moderator: [
        'agencies.view', 'agencies.verify', 'agencies.review',
        'resumes.view', 'resumes.review', 'content.view',
        'content.moderate', 'reports.view', 'reports.resolve'
      ],
      admin: [
        'agencies.view', 'agencies.create', 'agencies.update', 'agencies.delete',
        'agencies.verify', 'agencies.review', 'resumes.view', 'resumes.analyze',
        'resumes.delete', 'resumes.review', 'users.view', 'users.create',
        'users.update', 'users.delete', 'users.manage_roles', 'content.view',
        'content.create', 'content.update', 'content.delete', 'content.moderate',
        'reports.view', 'reports.create', 'reports.resolve'
      ]
    }

    return rolePermissions[userRole]?.includes(permission) || false
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      window.location.href = '/'
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const signInWithOtp = async (email: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })
      
      if (error) {
        throw error
      }
    } catch (error) {
      console.error('Error signing in with OTP:', error)
      throw error
    }
  }

  const isAdmin = (profile as Profile)?.role === 'admin'
  const isModerator = (profile as Profile)?.role === 'moderator'

  const value: AuthContextType = {
    user,
    profile: (profile as Profile) ?? null,
    hasPermission,
    signOut,
    signInWithOtp,
    isLoading,
    isSupabaseAvailable,
    isAdmin: isAdmin || false,
    isModerator: isModerator || false,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}