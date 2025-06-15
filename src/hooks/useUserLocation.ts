
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useAddressGeocoding, GeocodedLocation } from './useAddressGeocoding'

const STORAGE_KEY = 'user_saved_location'

export function useUserLocation() {
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null)
  const [savedAddress, setSavedAddress] = useState<string>('')
  const [useGeolocation, setUseGeolocation] = useState(false)
  const [addressSearch, setAddressSearch] = useState('')
  const [geoLoading, setGeoLoading] = useState(false)
  
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

  // Solicitar geolocalização
  const requestGeolocation = () => {
    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        const newUserLocation = { lat: latitude, lng: longitude }
        setUserLocation(newUserLocation)
        setGeoLoading(false)
        
        const locationData: GeocodedLocation = {
          lat: latitude,
          lng: longitude,
          address: `Minha Localização (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`
        }
        saveLocationToStorage(locationData)
        setAddressSearch(locationData.address)
        toast.success("Geolocalização ativada!")
      },
      () => {
        toast.error("Não foi possível obter sua localização.")
        setGeoLoading(false)
        setUseGeolocation(false)
      }
    )
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
    setUseGeolocation(false)
    localStorage.removeItem(STORAGE_KEY)
  }

  // Alteração no campo de busca por endereço
  const handleAddressSearchChange = (value: string) => {
    setAddressSearch(value)
    
    // Se estiver digitando um endereço diferente da geolocalização, desmarcar "usar minha localização"
    if (value && !value.startsWith('Minha Localização')) {
      setUseGeolocation(false)
    }
  }

  // Toggle geolocalização
  const toggleGeolocation = () => {
    const newValue = !useGeolocation
    setUseGeolocation(newValue)
    
    if (newValue) {
      requestGeolocation()
    } else {
      // Se desmarcar, manter endereço salvo se houver
      if (savedAddress && !savedAddress.startsWith('Minha Localização')) {
        setAddressSearch(savedAddress)
      } else {
        clearLocation()
      }
    }
  }

  return {
    userLocation,
    addressSearch,
    useGeolocation,
    savedAddress,
    geoLoading,
    geocodeLoading,
    handleAddressSearchChange,
    toggleGeolocation,
    searchByAddress,
    clearLocation
  }
}
