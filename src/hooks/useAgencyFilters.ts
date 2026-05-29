import { useMemo } from 'react'
import { Agency } from '@/types/agency'

export interface FilterState {
  search: string
  state: string
  city: string
  type: string
  minRating: number
  verifiedOnly: boolean
}

interface UseAgencyFiltersProps {
  agencies: Agency[]
  filters: FilterState
}

export function useAgencyFilters({
  agencies,
  filters
}: UseAgencyFiltersProps) {
  const filteredAgencies = useMemo(() => {
    return agencies
      .filter(agency => {
        const lowercasedTerm = filters.search.toLowerCase()

        const searchTermMatch = !lowercasedTerm || 
          agency.name.toLowerCase().includes(lowercasedTerm) || 
          (agency.description?.toLowerCase().includes(lowercasedTerm) ?? false) || 
          (agency.areas?.some(area => area.toLowerCase().includes(lowercasedTerm)) ?? false)
        
        const stateMatch = !filters.state || agency.state === filters.state
        const cityMatch = !filters.city || agency.city === filters.city
        const typeMatch = !filters.type || agency.agency_type === filters.type
        const ratingMatch = filters.minRating === 0 || (agency.rating && agency.rating >= filters.minRating)
        const verifiedMatch = !filters.verifiedOnly || agency.status === 'approved'

        return searchTermMatch && stateMatch && cityMatch && typeMatch && ratingMatch && verifiedMatch
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [agencies, filters])

  return {
    filteredAgencies
  }
}
