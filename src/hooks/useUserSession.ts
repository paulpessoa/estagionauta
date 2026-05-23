import { useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/integrations/supabase/client'

export function useUserSession() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!isMounted) return
      setUser(session?.user ?? null)
      setIsLoading(false)
    }

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return
        setUser(session?.user ?? null)

        if (event === 'PASSWORD_RECOVERY') {
          window.location.href = '/redefinir-senha'
        }
      }
    )

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  return { user, isLoading }
}