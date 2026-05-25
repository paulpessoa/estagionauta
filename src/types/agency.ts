export interface Agency {
  id: string
  name: string
  description: string | null
  email: string | null
  phone: string | null
  website: string | null
  instagram: string | null
  whatsapp: string | null
  linkedin: string | null
  tiktok: string | null
  address: string | null
  city: string | null
  state: string | null
  cep: string | null
  latitude: number | null
  longitude: number | null
  areas: string[] | null
  status: 'pending' | 'approved' | 'rejected'
  rating: number | null
  total_reviews: number | null
  logo_url: string | null
  agency_type: string | null
  created_at: string
  updated_at: string
  verified_by?: string
  verified_at?: string
} 