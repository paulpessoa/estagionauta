
import { useState } from 'react'
import { toast } from 'sonner'

export interface GeocodedLocation {
  lat: number
  lng: number
  address: string
}

export function useAddressGeocoding() {
  const [loading, setLoading] = useState(false)

  const geocodeAddress = async (address: string): Promise<GeocodedLocation | null> => {
    if (!address.trim()) return null
    
    setLoading(true)
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`
      )
      
      const data = await response.json()
      
      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0]
        const location = result.geometry.location
        
        return {
          lat: location.lat,
          lng: location.lng,
          address: result.formatted_address
        }
      } else {
        toast.error('Endereço não encontrado')
        return null
      }
    } catch (error) {
      console.error('Erro ao geocodificar endereço:', error)
      toast.error('Erro ao buscar endereço')
      return null
    } finally {
      setLoading(false)
    }
  }

  return {
    geocodeAddress,
    loading
  }
}
