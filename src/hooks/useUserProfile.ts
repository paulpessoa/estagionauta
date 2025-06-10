import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Profile } from '@/types/profile'

async function fetchProfile(userId: string): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (error) throw error
    return data as Profile
  } catch (error) {
    console.error('Error fetching profile:', error)
    return null
  }
}

export function useUserProfile(userId: string | null) {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: () => (userId ? fetchProfile(userId) : Promise.resolve(null)),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  })
}