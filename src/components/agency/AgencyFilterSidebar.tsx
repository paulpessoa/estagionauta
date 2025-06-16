
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Filter, X } from 'lucide-react'

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

interface AgencyFilterSidebarProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  onAddressSearchSubmit: (address: string) => void
  totalAgencies: number
  states: string[]
  cities: string[]
  types: string[]
  userLocation: { lat: number; lng: number } | null
  geoLoading: boolean
  geocodeLoading: boolean
}

const availableAreas = [
  'Administração', 'Advocacia', 'Arquitetura', 'Comunicação', 'Contabilidade',
  'Design', 'Educação', 'Enfermagem', 'Engenharia', 'Farmácia',
  'Fisioterapia', 'Jornalismo', 'Marketing', 'Medicina', 'Nutrição',
  'Odontologia', 'Psicologia', 'Recursos Humanos', 'Tecnologia', 'Veterinária'
]

const sortOptions = [
  { value: 'name', label: 'Nome (A-Z)' },
  { value: 'rating', label: 'Melhor avaliada' },
  { value: 'reviews', label: 'Mais avaliações' },
  { value: 'distance', label: 'Menor distância' }
]

export function AgencyFilterSidebar({
  filters,
  onFiltersChange,
  totalAgencies,
  states,
  cities,
  types,
  userLocation
}: AgencyFilterSidebarProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  const handleAreaToggle = (area: string) => {
    const newAreas = filters.areas.includes(area)
      ? filters.areas.filter(a => a !== area)
      : [...filters.areas, area]
    handleFilterChange('areas', newAreas)
  }

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      addressSearch: '',
      state: '',
      city: '',
      type: '',
      areas: [],
      minRating: 0,
      verifiedOnly: true,
      maxDistance: 0,
      sortBy: 'name',
      useGeolocation: false
    })
  }

  const activeFiltersCount = [
    filters.state,
    filters.city,
    filters.type,
    filters.areas.length > 0,
    filters.minRating > 0,
    !filters.verifiedOnly,
    filters.maxDistance > 0
  ].filter(Boolean).length

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative">
          <Filter className="h-4 w-4 mr-2" />
          Filtros Avançados
          {activeFiltersCount > 0 && (
            <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>Filtros Avançados</SheetTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{totalAgencies} agências</Badge>
              {activeFiltersCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Limpar
                </Button>
              )}
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Localização e Estado */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={filters.state} onValueChange={(value) => handleFilterChange('state', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os estados</SelectItem>
                  {states.map((state) => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Cidade</Label>
              <Select value={filters.city} onValueChange={(value) => handleFilterChange('city', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as cidades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as cidades</SelectItem>
                  {cities.map((city) => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tipo de Agência */}
          <div className="space-y-2">
            <Label>Tipo de Agência</Label>
            <Select value={filters.type} onValueChange={(value) => handleFilterChange('type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {types.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Áreas de Atuação */}
          {/* <div className="space-y-3">
            <Label>Áreas de Atuação</Label>
            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded-md p-2">
              {availableAreas.map((area) => (
                <div key={area} className="flex items-center space-x-2">
                  <Switch
                    id={area}
                    checked={filters.areas.includes(area)}
                    onCheckedChange={() => handleAreaToggle(area)}
                  />
                  <Label htmlFor={area} className="text-sm cursor-pointer">{area}</Label>
                </div>
              ))}
            </div>
            {filters.areas.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {filters.areas.map((area) => (
                  <Badge key={area} variant="secondary" className="text-xs">
                    {area}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 ml-1 text-xs"
                      onClick={() => handleAreaToggle(area)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </div> */}

          {/* Avaliação Mínima */}
          <div className="space-y-3">
            <Label>Avaliação Mínima: {filters.minRating} estrelas</Label>
            <Slider
              value={[filters.minRating]}
              onValueChange={(value) => handleFilterChange('minRating', value[0])}
              max={5}
              min={0}
              step={0.5}
              className="w-full"
            />
          </div>

          {/* Distância Máxima */}
          {userLocation && (
            <div className="space-y-3">
              <Label>
                Distância Máxima: {filters.maxDistance === 0 ? 'Qualquer' : `${filters.maxDistance} km`}
              </Label>
              <Slider
                value={[filters.maxDistance]}
                onValueChange={(value) => handleFilterChange('maxDistance', value[0])}
                max={100}
                min={0}
                step={5}
                className="w-full"
              />
            </div>
          )}

          {/* Ordenação */}
          <div className="space-y-2">
            <Label>Ordenar por</Label>
            <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange('sortBy', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
