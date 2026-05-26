
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useAddressGeocoding, GeocodedLocation } from './useAddressGeocoding'

const STORAGE_KEY = 'user_saved_location'

export function useUserLocation() {
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null)
  const [savedAddress, setSavedAddress] = useState<string>('')
  const [addressSearch, setAddressSearch] = useState('')
  
  const { geocodeAddress, loading: geocodeLoading } = useAddressGeocoding()

  // Carregar endereço salvo do localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsedLocation: GeocodedLocation = JSON.parse(saved)
        setSavedAddress(parsedLocation.address)
        setAddressSearch(parsedLocation.address)
        setUserLocation({ lat: parsedLocation.lat, lng: parsedLocation.lng })
      } catch (error) {
        console.error('Erro ao carregar localização salva:', error)
      }
    }
  }, [])

  // Função para salvar localização no localStorage
  const saveLocationToStorage = (location: GeocodedLocation) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(location))
      setSavedAddress(location.address)
    } catch (error) {
      console.error('Erro ao salvar localização:', error)
    }
  }

  // Buscar por endereço
  const searchByAddress = async (address: string) => {
    if (!address.trim()) {
      setUserLocation(null)
      return
    }

    const result = await geocodeAddress(address)
    if (result) {
      setUserLocation({ lat: result.lat, lng: result.lng })
      saveLocationToStorage(result)
      toast.success(`Localização encontrada: ${result.address}`)
    }
  }

  // Limpar localização
  const clearLocation = () => {
    setUserLocation(null)
    setSavedAddress('')
    setAddressSearch('')
    localStorage.removeItem(STORAGE_KEY)
  }

  // Alteração no campo de busca por endereço
  const handleAddressSearchChange = (value: string) => {
    setAddressSearch(value)
  }

  return {
    userLocation,
    addressSearch,
    savedAddress,
    geocodeLoading,
    handleAddressSearchChange,
    searchByAddress,
    clearLocation
  }
}
