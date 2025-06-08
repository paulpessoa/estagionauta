
'use client'

import React, { useState, useEffect, createContext, useContext } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/integrations/supabase/client'
import { jwtDecode } from 'jwt-decode'

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: 'student' | 'admin' | 'moderator' | 'agency'
  credits: number
  subscription_status: string
  subscription_tier: string | null
  location_enabled: boolean
}

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  loading: boolean
  userRole: string | null
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  session: null,
  loading: true,
  userRole: null,
  signOut: async () => {},
  refreshProfile: async () => {}
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (error) {
        console.error('Error fetching user profile:', error)
        return null
      }
      
      return data as UserProfile
    } catch (error) {
      console.error('Error fetching user profile:', error)
      return null
    }
  }

  const refreshProfile = async () => {
    if (user) {
      const profileData = await fetchUserProfile(user.id)
      setProfile(profileData)
    }
  }

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)
        
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.access_token) {
          try {
            const jwt = jwtDecode(session.access_token) as any
            setUserRole(jwt.user_role || null)
          } catch (error) {
            console.error('Error decoding JWT:', error)
            setUserRole(null)
          }
        } else {
          setUserRole(null)
        }
        
        if (session?.user) {
          // Defer profile fetch to avoid blocking auth flow
          setTimeout(async () => {
            const profileData = await fetchUserProfile(session.user.id)
            setProfile(profileData)
          }, 0)
        } else {
          setProfile(null)
        }
        
        setLoading(false)
      }
    )

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession(session)
        setUser(session.user)
        
        if (session.access_token) {
          try {
            const jwt = jwtDecode(session.access_token) as any
            setUserRole(jwt.user_role || null)
          } catch (error) {
            console.error('Error decoding JWT:', error)
          }
        }
        
        if (session.user) {
          fetchUserProfile(session.user.id).then((profileData) => {
            setProfile(profileData)
          })
        }
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      session, 
      loading, 
      userRole, 
      signOut, 
      refreshProfile 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
