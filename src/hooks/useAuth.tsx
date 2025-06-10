import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/integrations/supabase/client'
import { Profile } from '@/types/profile'
import { UserRole } from '@/types/permissions'
import { isSupabaseConfigured } from '@/integrations/supabase/config'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  hasPermission: (permission: string) => boolean
  signOut: () => Promise<void>
  isLoading: boolean
  isSupabaseAvailable: boolean
  isAdmin: boolean
  isModerator: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const isSupabaseAvailable = isSupabaseConfigured()

  useEffect(() => {
    if (!isSupabaseAvailable) {
      setIsLoading(false)
      return
    }

    const fetchSessionAndProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)

      if (session?.user) {
        try {
          const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
          
          if (error) throw error
          setProfile(data as Profile)
        } catch (error) {
          console.error('Erro ao buscar perfil inicial:', error)
          setProfile(null)
        }
      }
      setIsLoading(false)
    }

    fetchSessionAndProfile()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user ?? null
        setUser(currentUser)

        if (currentUser) {
          setIsLoading(true)
          try {
            const { data, error } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('id', currentUser.id)
              .single()
            if (error) throw error
            setProfile(data as Profile)
          } catch (error) {
            console.error('Erro ao buscar perfil na mudança de auth:', error)
            setProfile(null)
          } finally {
            setIsLoading(false)
          }
        } else {
          setProfile(null)
          setIsLoading(false)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [isSupabaseAvailable])

  const hasPermission = (permission: string): boolean => {
    if (!profile) return false
    
    const userRole = profile.role

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
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  const isAdmin = profile?.role === 'admin'
  const isModerator = profile?.role === 'moderator'

  const value = {
    user,
    profile,
    hasPermission,
    signOut,
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
