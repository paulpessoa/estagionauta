import { useState, useEffect, useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { Agency } from '@/types/agency'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import { AuthRequiredModal } from '@/components/AuthRequiredModal'
import { MapPin, List, Map, X, Star } from 'lucide-react'
import { AgencyReviewModal } from '@/components/modals/AgencyReviewModal'
import { AgencyCard } from '@/components/agency/AgencyCard'
import { AgencyMap } from '@/components/agency/AgencyMap'
import { useAgencyFilters } from '@/hooks/useAgencyFilters'
import { useUserLocation } from '@/hooks/useUserLocation'
import { useDebounce } from '@/hooks/useDebounce'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { AgencyReviewsModal } from '@/components/modals/AgencyReviewsModal'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

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

const agencyTypeLabels: Record<string, string> = {
  faculdade: 'Faculdade/Universidade',
  consultoria: 'Consultoria',
  agencia_privada: 'Agência Privada',
  orgao_publico: 'Órgão Público',
  instituto: 'Instituto',
  fundacao: 'Fundação',
  outro: 'Outro',
  startup: 'Startup',
  remote: 'Remoto'
}

export default function AgenciasPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const [agencies, setAgencies] = useState<Agency[]>([])
  const [loading, setLoading] = useState(true)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [isReviewsModalOpen, setIsReviewsModalOpen] = useState(false)
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null)
  const [mapCenter, setMapCenter] = useState({ lat: -8.047562, lng: -34.877002 })

  const viewMode = (searchParams.get('view') as 'list' | 'map') || 'list'
  const setViewMode = (mode: 'list' | 'map') => {
    const next = new URLSearchParams(searchParams)
    next.set('view', mode)
    setSearchParams(next)
  }

  const currentPage = parseInt(searchParams.get('page') || '1', 10) || 1
  const setCurrentPage = (page: number | ((prev: number) => number)) => {
    const newPage = typeof page === 'function' ? page(currentPage) : page
    const next = new URLSearchParams(searchParams)
    next.set('page', newPage.toString())
    setSearchParams(next)
  }

  // Search states managed in page
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('q') || '')
  const [addressSearch, setAddressSearch] = useState(() => searchParams.get('address') || '')
  
  const debouncedSearchTerm = useDebounce(searchTerm, 800)
  const debouncedAddressSearch = useDebounce(addressSearch, 800)

  // Sync debounced search states to URL
  useEffect(() => {
    const urlQuery = searchParams.get('q') || ''
    if (debouncedSearchTerm !== urlQuery) {
      const next = new URLSearchParams(searchParams)
      if (debouncedSearchTerm) {
        next.set('q', debouncedSearchTerm)
      } else {
        next.delete('q')
      }
      next.set('page', '1')
      setSearchParams(next)
    }
  }, [debouncedSearchTerm, searchParams, setSearchParams])

  useEffect(() => {
    const urlAddress = searchParams.get('address') || ''
    if (debouncedAddressSearch !== urlAddress) {
      const next = new URLSearchParams(searchParams)
      if (debouncedAddressSearch) {
        next.set('address', debouncedAddressSearch)
      } else {
        next.delete('address')
      }
      next.set('page', '1')
      setSearchParams(next)
    }
  }, [debouncedAddressSearch, searchParams, setSearchParams])

  // Sync URL changes back to inputs
  useEffect(() => {
    const q = searchParams.get('q') || ''
    if (q !== searchTerm) {
      setSearchTerm(q)
    }
  }, [searchParams])

  useEffect(() => {
    const address = searchParams.get('address') || ''
    if (address !== addressSearch) {
      setAddressSearch(address)
    }
  }, [searchParams])

  // For main filters (excluding search/address/location)
  const [filters, setFilters] = useState<FilterState>({
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

  const { user } = useAuth()
  const navigate = useNavigate()

  const {
    userLocation,
    geocodeLoading,
    searchByAddress,
    clearLocation
  } = useUserLocation()

  const itemsPerPage = 5

  const { filteredAgencies } = useAgencyFilters({
    agencies,
    filters: {
      ...filters,
      search: debouncedSearchTerm,
      addressSearch: debouncedAddressSearch,
      useGeolocation: false
    },
    userLocation
  })

  useEffect(() => {
    fetchApprovedAgencies()
  }, [])

  // Auto geocode address search when debouncedAddressSearch changes
  useEffect(() => {
    if (debouncedAddressSearch.trim()) {
      searchByAddress(debouncedAddressSearch)
    } else {
      clearLocation()
    }
  }, [debouncedAddressSearch])

  // Atualizar centro do mapa quando a localização do usuário mudar
  useEffect(() => {
    if (userLocation) {
      setMapCenter(userLocation)
    }
  }, [userLocation])

  // Reset sortBy to name if userLocation becomes null and sortBy was distance
  useEffect(() => {
    if (!userLocation && filters.sortBy === 'distance') {
      handleFilterChange('sortBy', 'name')
    }
  }, [userLocation, filters.sortBy])

  const fetchApprovedAgencies = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('agencies')
        .select('*')
        .eq('status', 'approved')
        .order('name', { ascending: true })

      if (error) throw error
      setAgencies(data || [])
    } catch (error) {
      console.error('Erro ao buscar agências aprovadas:', error)
      toast.error('Não foi possível carregar as agências.')
    } finally {
      setLoading(false)
    }
  }

  const { states, cities, types } = useMemo(() => {
    const states = [...new Set(agencies.map(a => a.state).filter(Boolean))] as string[]
    
    // If a state is selected in the filter, only list cities from that state
    const filteredAgenciesForCities = filters.state 
      ? agencies.filter(a => a.state === filters.state)
      : agencies
      
    const cities = [...new Set(filteredAgenciesForCities.map(a => a.city).filter(Boolean))] as string[]
    const types = [...new Set(agencies.map(a => a.agency_type).filter(Boolean))] as string[]
    return { states, cities, types }
  }, [agencies, filters.state])

  const totalPages = Math.ceil(filteredAgencies.length / itemsPerPage)
  const paginatedAgencies = filteredAgencies.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(1)
    }
  }, [totalPages, currentPage])

  const handleReviewClick = async (agency: Agency) => {
    if (!user) {
      setShowAuthModal(true)
      return
    }

    try {
      const { data, error } = await supabase
        .from('agency_reviews')
        .select('id')
        .eq('agency_id', agency.id)
        .eq('user_id', user.id)
        .limit(1)

      if (error) throw error

      if (data && data.length > 0) {
        toast.error('Você já enviou uma avaliação para esta agência. Só é permitida uma avaliação por agência.')
        return
      }

      setSelectedAgency(agency)
      setIsReviewModalOpen(true)
    } catch (e) {
      console.error('Erro ao verificar avaliações anteriores:', e)
      setSelectedAgency(agency)
      setIsReviewModalOpen(true)
    }
  }

  const handleViewReviews = (agency: Agency) => {
    setSelectedAgency(agency)
    setIsReviewsModalOpen(true)
  }

  const handleReviewSubmitted = () => {
    toast.info("Sua avaliação está pendente de moderação.")
    fetchApprovedAgencies()
  }

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === 'all' ? '' : value
    }))
  }

  const handleStateChange = (stateValue: string) => {
    const nextState = stateValue === 'all' ? '' : stateValue
    handleFilterChange('state', nextState)
    if (nextState) {
      const stateCities = agencies
        .filter(a => a.state === nextState)
        .map(a => a.city)
      if (filters.city && !stateCities.includes(filters.city)) {
        handleFilterChange('city', '')
      }
    } else {
      handleFilterChange('city', '')
    }
  }

  const clearFilters = () => {
    setFilters({
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
    setSearchTerm('')
    setAddressSearch('')
    clearLocation()
    
    const next = new URLSearchParams(searchParams)
    next.delete('q')
    next.delete('address')
    next.set('page', '1')
    setSearchParams(next)
  }

  if (loading) {
    return (
      <div className="container py-8 flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  const isAnyFilterActive = !!(
    filters.state ||
    filters.city ||
    filters.type ||
    filters.minRating > 0 ||
    filters.maxDistance > 0 ||
    searchTerm ||
    addressSearch
  )

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Mapa de Agências de Estágio | Estagionauta</title>
        <meta name="description" content="Explore o mapa completo de agências de integração de estágio no Brasil. Encontre agências por cidade, estado e veja avaliações reais de outros estudantes." />
        <link rel="canonical" href="https://www.estagionauta.com.br/agencias" />
      </Helmet>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Mapa de Agências de Estágio</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">Descubra e avalie agências de estágio na sua região. Veja avaliações reais de outros estudantes.</p>
        </div>

        <div className="max-w-7xl mx-auto mb-8">
          <div className="bg-card border rounded-xl p-6 shadow-sm space-y-6">
            {/* Primeira linha: Busca por nome e endereço */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="search-name" className="text-sm font-semibold">Buscar por nome</Label>
                <Input
                  id="search-name"
                  placeholder="Nome da agência ou área..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="search-address" className="text-sm font-semibold">Buscar por endereço</Label>
                  {geocodeLoading && (
                    <span className="text-xs text-muted-foreground animate-pulse">Carregando coordenadas...</span>
                  )}
                </div>
                <Input
                  id="search-address"
                  placeholder="Digite um endereço para calcular distâncias..."
                  value={addressSearch}
                  onChange={(e) => setAddressSearch(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>

            {/* Segunda linha: Filtros em Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="filter-state" className="text-sm font-semibold">Estado</Label>
                <Select value={filters.state || 'all'} onValueChange={handleStateChange}>
                  <SelectTrigger id="filter-state">
                    <SelectValue placeholder="Todos os estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os estados</SelectItem>
                    {states.map(state => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="filter-city" className="text-sm font-semibold">Cidade</Label>
                <Select value={filters.city || 'all'} onValueChange={(val) => handleFilterChange('city', val)}>
                  <SelectTrigger id="filter-city">
                    <SelectValue placeholder="Todas as cidades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as cidades</SelectItem>
                    {cities.map(city => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="filter-type" className="text-sm font-semibold">Tipo de Agência</Label>
                <Select value={filters.type || 'all'} onValueChange={(val) => handleFilterChange('type', val)}>
                  <SelectTrigger id="filter-type">
                    <SelectValue placeholder="Todos os tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    {Object.entries(agencyTypeLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="filter-sort" className="text-sm font-semibold">Ordenar por</Label>
                <Select value={filters.sortBy || 'name'} onValueChange={(val) => handleFilterChange('sortBy', val)}>
                  <SelectTrigger id="filter-sort">
                    <SelectValue placeholder="Nome (A-Z)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Nome (A-Z)</SelectItem>
                    <SelectItem value="rating">Melhor Avaliação</SelectItem>
                    <SelectItem value="distance" disabled={!userLocation}>
                      Menor Distância {!userLocation && '(requer endereço)'}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Terceira linha: Sliders e Botão de Limpar */}
            <div className="flex flex-col md:flex-row gap-6 items-end justify-between pt-4 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full md:max-w-2xl">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <Label className="font-semibold">Avaliação Mínima</Label>
                    <span className="text-muted-foreground font-medium">
                      {filters.minRating || 'Qualquer'} {filters.minRating > 0 && '★'}
                    </span>
                  </div>
                  <Slider
                    min={0}
                    max={5}
                    step={0.5}
                    value={[filters.minRating]}
                    onValueChange={(val) => handleFilterChange('minRating', val[0])}
                  />
                </div>

                {userLocation ? (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <Label className="font-semibold">Distância Máxima</Label>
                      <span className="text-muted-foreground font-medium">
                        {filters.maxDistance === 0 ? 'Qualquer distância' : `${filters.maxDistance} km`}
                      </span>
                    </div>
                    <Slider
                      min={0}
                      max={150}
                      step={5}
                      value={[filters.maxDistance]}
                      onValueChange={(val) => handleFilterChange('maxDistance', val[0])}
                    />
                  </div>
                ) : (
                  <div className="flex items-center text-sm text-muted-foreground h-full pb-1">
                    <span className="italic">Defina um endereço de busca para filtrar por distância.</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                <div className="text-sm font-medium text-muted-foreground">
                  {filteredAgencies.length} {filteredAgencies.length === 1 ? 'agência encontrada' : 'agências encontradas'}
                </div>

                <div className="flex items-center gap-2">
                  {isAnyFilterActive && (
                    <Button
                      variant="ghost"
                      onClick={clearFilters}
                      className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-2"
                    >
                      <X className="h-4 w-4" />
                      Limpar Filtros
                    </Button>
                  )}

                  <div className="flex rounded-lg border bg-background p-1">
                    <button
                      onClick={() => setViewMode('list')}
                      className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                        viewMode === 'list' 
                          ? 'bg-primary text-primary-foreground shadow-sm' 
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                    >
                      <List className="h-4 w-4" />
                      <span>Lista</span>
                    </button>
                    <button
                      onClick={() => setViewMode('map')}
                      className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                        viewMode === 'map' 
                          ? 'bg-primary text-primary-foreground shadow-sm' 
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                    >
                      <Map className="h-4 w-4" />
                      <span>Mapa</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto">
          {viewMode === 'list' ? (
            <>
              <div className="space-y-6">
                {paginatedAgencies.map((agency) => (
                  <AgencyCard 
                    key={agency.id} 
                    agency={agency} 
                    onReviewClick={() => handleReviewClick(agency)}
                    onViewReviews={() => handleViewReviews(agency)}
                  />
                ))}
              </div>
              {paginatedAgencies.length === 0 && !loading && (
                <Card>
                  <CardContent className="text-center py-12">
                    <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Conhece uma agência que não está listada?</h3>
                    <p className="text-muted-foreground mb-4">Ajude outros estudantes adicionando agências que você conhece</p>
                    <Button asChild>
                      <Link to="/cadastro-agencia">Adicionar Agência</Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-8">
                  <Button variant="outline" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>Anterior</Button>
                  <span className="text-sm font-medium">Página {currentPage} de {totalPages}</span>
                  <Button variant="outline" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>Próxima</Button>
                </div>
              )}
            </>
          ) : (
            <div className="h-[70vh] rounded-lg overflow-hidden border">
              <AgencyMap 
                agencies={filteredAgencies}
                userLocation={userLocation}
                mapCenter={mapCenter}
              />
            </div>
          )}
        </div>

        <AuthRequiredModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
        
        {selectedAgency && (
          <>
            <AgencyReviewModal
              isOpen={isReviewModalOpen}
              onClose={() => setIsReviewModalOpen(false)}
              agencyId={selectedAgency.id}
              agencyName={selectedAgency.name}
              onReviewSubmitted={handleReviewSubmitted}
            />
            <AgencyReviewsModal
              isOpen={isReviewsModalOpen}
              onClose={() => setIsReviewsModalOpen(false)}
              agencyId={selectedAgency.id}
              agencyName={selectedAgency.name}
            />
          </>
        )}
      </div>
    </div>
  )
}
