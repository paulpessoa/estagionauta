
import { useState, useEffect } from 'react'
import { toast } from 'sonner'

export function useGeolocation() {
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null)
  const [loading, setLoading] = useState(false)

  const requestLocation = () => {
    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        const newUserLocation = { lat: latitude, lng: longitude };
        setUserLocation(newUserLocation)
        setLoading(false)
        toast.success("Geolocalização ativada!")
      },
      () => {
        toast.error("Não foi possível obter sua localização.")
        setLoading(false)
      }
    )
  }

  const clearLocation = () => {
    setUserLocation(null)
  }

  return {
    userLocation,
    loading,
    requestLocation,
    clearLocation
  }
}
