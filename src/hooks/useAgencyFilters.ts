
import { useMemo } from 'react'
import { Agency } from '@/types/agency'
import { getDistance } from '@/utils/geolocation'
export interface FilterState {
  search: string
  addressSearch: string
  state: string
  city: string
  type: string
  areas: string[]
  minRating: number
  verifiedOnly: boolean
  maxDistance: number
  sortBy: string
  useGeolocation: boolean
}

interface UseAgencyFiltersProps {
  agencies: Agency[]
  filters: FilterState
  userLocation: { lat: number; lng: number } | null
}

export function useAgencyFilters({
  agencies,
  filters,
  userLocation
}: UseAgencyFiltersProps) {
  const agenciesWithDistance = useMemo(() => {
    if (!userLocation) return agencies.map(a => ({ ...a, distance: undefined }));
    return agencies.map(agency => {
      if (agency.latitude && agency.longitude) {
        const distance = getDistance(userLocation.lat, userLocation.lng, agency.latitude, agency.longitude);
        return { ...agency, distance };
      }
      return { ...agency, distance: undefined };
    });
  }, [agencies, userLocation]);

  const filteredAgencies = useMemo(() => {
    const filtered = agenciesWithDistance.filter(agency => {
      const lowercasedTerm = filters.search.toLowerCase()
      const lowercasedAddress = filters.addressSearch.toLowerCase()
      const addressSearchActive = filters.addressSearch && !lowercasedAddress.startsWith('minha localização')

      const searchTermMatch = !lowercasedTerm || 
        agency.name.toLowerCase().includes(lowercasedTerm) || 
        (agency.description?.toLowerCase().includes(lowercasedTerm) ?? false) || 
        (agency.areas?.some(area => area.toLowerCase().includes(lowercasedTerm)) ?? false)
      
      const addressMatch = !addressSearchActive || 
        (agency.address?.toLowerCase().includes(lowercasedAddress) ?? false) || 
        (agency.city?.toLowerCase().includes(lowercasedAddress) ?? false) || 
        (agency.state?.toLowerCase().includes(lowercasedAddress) ?? false)
      
      const stateMatch = !filters.state || agency.state === filters.state
      const cityMatch = !filters.city || agency.city === filters.city
      const typeMatch = !filters.type || agency.agency_type === filters.type
      const ratingMatch = filters.minRating === 0 || (agency.rating && agency.rating >= filters.minRating)
      const verifiedMatch = !filters.verifiedOnly || agency.status === 'approved'
      const distanceMatch = filters.maxDistance === 0 || !agency.distance || agency.distance <= filters.maxDistance
      const areasMatch = filters.areas.length === 0 || 
        (agency.areas && filters.areas.some(filterArea => 
          agency.areas!.some(agencyArea => agencyArea.toLowerCase().includes(filterArea.toLowerCase()))
        ))

      return searchTermMatch && addressMatch && stateMatch && cityMatch && typeMatch && 
             ratingMatch && verifiedMatch && distanceMatch && areasMatch
    });

    if (filters.sortBy === 'distance' && userLocation) {
      return filtered.sort((a, b) => {
        if (a.distance === undefined) return 1;
        if (b.distance === undefined) return -1;
        return a.distance - b.distance;
      });
    } else if (filters.sortBy === 'rating') {
      return filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }
    return filtered.sort((a, b) => a.name.localeCompare(b.name));

  }, [agenciesWithDistance, filters, userLocation])

  return {
    agenciesWithDistance,
    filteredAgencies
  }
}
