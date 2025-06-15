
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Filter, X, Star, MapPin, Navigation } from 'lucide-react'

interface AgencyFiltersProps {
  onFiltersChange: (filters: FilterState) => void
  totalAgencies: number
  userLocation: { lat: number; lng: number } | null
  onLocationToggle: () => void
}

export interface FilterState {
  search: string
  city: string
  state: string
  areas: string[]
  minRating: number
  verifiedOnly: boolean
  maxDistance: number
  sortBy: 'distance' | 'rating' | 'name'
}

const popularAreas = [
  'Tecnologia', 'Marketing', 'Administração', 'Vendas', 'RH',
  'Engenharia', 'Design', 'Comunicação', 'Finanças', 'Educação'
]

const states = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
]

export function AgencyFilters({ onFiltersChange, totalAgencies, userLocation, onLocationToggle }: AgencyFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    city: '',
    state: '',
    areas: [],
    minRating: 0,
    verifiedOnly: true,
    maxDistance: 0,
    sortBy: 'distance'
  })

  const [showAllFilters, setShowAllFilters] = useState(false)

  const updateFilters = (newFilters: Partial<FilterState>) => {
    const updatedFilters = { ...filters, ...newFilters }
    setFilters(updatedFilters)
    onFiltersChange(updatedFilters)
  }

  const addArea = (area: string) => {
    if (!filters.areas.includes(area)) {
      updateFilters({ areas: [...filters.areas, area] })
    }
  }

  const removeArea = (area: string) => {
    updateFilters({ areas: filters.areas.filter(a => a !== area) })
  }

  const clearFilters = () => {
    const clearedFilters: FilterState = {
      search: '',
      city: '',
      state: '',
      areas: [],
      minRating: 0,
      verifiedOnly: true,
      maxDistance: 0,
      sortBy: 'distance'
    }
    setFilters(clearedFilters)
    onFiltersChange(clearedFilters)
  }

  const hasActiveFilters = filters.search || filters.city || filters.state || 
    filters.areas.length > 0 || filters.minRating > 0 || !filters.verifiedOnly || filters.maxDistance > 0

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, descrição ou área..."
          value={filters.search}
          onChange={(e) => updateFilters({ search: e.target.value })}
          className="pl-10"
        />
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAllFilters(!showAllFilters)}
          className="flex items-center space-x-2"
        >
          <Filter className="h-4 w-4" />
          <span>Filtros</span>
        </Button>

        <Button
          variant={userLocation ? "default" : "outline"}
          size="sm"
          onClick={onLocationToggle}
          className="flex items-center space-x-1"
        >
          <Navigation className="h-4 w-4" />
          <span>{userLocation ? 'Localização ativa' : 'Ativar localização'}</span>
        </Button>

        <Button
          variant={filters.verifiedOnly ? "default" : "outline"}
          size="sm"
          onClick={() => updateFilters({ verifiedOnly: !filters.verifiedOnly })}
        >
          ✓ Verificadas
        </Button>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Limpar filtros
          </Button>
        )}

        <span className="text-sm text-muted-foreground ml-auto">
          {totalAgencies} agência{totalAgencies !== 1 ? 's' : ''} encontrada{totalAgencies !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Advanced Filters */}
      {showAllFilters && (
        <div className="space-y-4 p-4 border rounded-lg bg-muted/10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Cidade</label>
              <Input
                placeholder="Digite a cidade..."
                value={filters.city}
                onChange={(e) => updateFilters({ city: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Estado</label>
              <Select value={filters.state} onValueChange={(value) => updateFilters({ state: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os estados</SelectItem>
                  {states.map(state => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Avaliação mínima</label>
              <Select 
                value={filters.minRating.toString()} 
                onValueChange={(value) => updateFilters({ minRating: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Qualquer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Qualquer avaliação</SelectItem>
                  <SelectItem value="3">3+ estrelas</SelectItem>
                  <SelectItem value="4">4+ estrelas</SelectItem>
                  <SelectItem value="4.5">4.5+ estrelas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {userLocation && (
              <div>
                <label className="text-sm font-medium mb-2 block">Distância máxima</label>
                <Select 
                  value={filters.maxDistance.toString()} 
                  onValueChange={(value) => updateFilters({ maxDistance: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Qualquer distância" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Qualquer distância</SelectItem>
                    <SelectItem value="5">Até 5km</SelectItem>
                    <SelectItem value="10">Até 10km</SelectItem>
                    <SelectItem value="25">Até 25km</SelectItem>
                    <SelectItem value="50">Até 50km</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Sort and Areas Filter */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Ordenar por</label>
              <Select 
                value={filters.sortBy} 
                onValueChange={(value: 'distance' | 'rating' | 'name') => updateFilters({ sortBy: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {userLocation && <SelectItem value="distance">Distância</SelectItem>}
                  <SelectItem value="rating">Avaliação</SelectItem>
                  <SelectItem value="name">Nome</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Areas Filter */}
          <div>
            <label className="text-sm font-medium mb-2 block">Áreas de interesse</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {filters.areas.map((area) => (
                <Badge key={area} variant="default">
                  {area}
                  <button
                    onClick={() => removeArea(area)}
                    className="ml-2 hover:text-red-200"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {popularAreas
                .filter(area => !filters.areas.includes(area))
                .map((area) => (
                  <Button
                    key={area}
                    variant="outline"
                    size="sm"
                    onClick={() => addArea(area)}
                  >
                    + {area}
                  </Button>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
