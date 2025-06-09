
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: 'student' | 'agency' | 'admin' | 'moderator'
  credits: number
  subscription_status: 'free' | 'premium'
  subscription_tier: string | null
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, userData?: any) => Promise<{ data: any; error: any }>
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<void>
  isSupabaseAvailable: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const isSupabaseAvailable = isSupabaseConfigured()

  useEffect(() => {
    if (!isSupabaseAvailable) {
      setLoading(false)
      return
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [isSupabaseAvailable])

  const fetchProfile = async (userId: string) => {
    if (!isSupabaseAvailable) return
    
    try {
      const response = await supabase
        .from('user_profiles')
        .select('*')
        .eq(userId, userId)

      if (typeof response.then === 'function') {
        const { data, error } = await response
        
        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching profile:', error)
          return
        }

        if (data && data.length > 0) {
          setProfile(data[0] as Profile)
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, userData: any = {}) => {
    if (!isSupabaseAvailable) {
      return { 
        data: null, 
        error: { message: 'Funcionalidade de cadastro não disponível - Supabase não configurado' } 
      }
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    })

    if (error) {
      toast({
        title: "Erro no cadastro",
        description: error.message,
        variant: "destructive",
      })
    } else if (data.user && !data.session) {
      toast({
        title: "Verifique seu email",
        description: "Um link de confirmação foi enviado para seu email.",
      })
    }

    return { data, error }
  }

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseAvailable) {
      return { 
        data: null, 
        error: { message: 'Funcionalidade de login não disponível - Supabase não configurado' } 
      }
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      toast({
        title: "Erro no login",
        description: error.message,
        variant: "destructive",
      })
    }

    return { data, error }
  }

  const signOut = async () => {
    if (!isSupabaseAvailable) return

    const { error } = await supabase.auth.signOut()
    
    if (error) {
      toast({
        title: "Erro ao sair",
        description: error.message,
        variant: "destructive",
      })
    } else {
      setUser(null)
      setProfile(null)
      setSession(null)
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      })
    }
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!isSupabaseAvailable || !user) return

    try {
      const response = await supabase
        .from('user_profiles')
        .update(updates)
        .eq(user.id, user.id)

      if (typeof response.then === 'function') {
        const { error } = await response
        if (error) throw error
      }

      setProfile(prev => prev ? { ...prev, ...updates } : null)
      
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso.",
      })
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar perfil",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    isSupabaseAvailable,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
