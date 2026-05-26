
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
import { MapPin, List, Map, LocateFixed } from 'lucide-react'
import { AgencyReviewModal } from '@/components/modals/AgencyReviewModal'
import { AgencyFilterSidebar, FilterState } from '@/components/agency/AgencyFilterSidebar'
import { AgencyCard } from '@/components/agency/AgencyCard'
import { AgencyMap } from '@/components/agency/AgencyMap'
import { useAgencyFilters } from '@/hooks/useAgencyFilters'
import { useUserLocation } from '@/hooks/useUserLocation'
import { useDebounce } from '@/hooks/useDebounce'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AgencyReviewsModal } from '@/components/modals/AgencyReviewsModal'

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
  const [useGeolocation, setUseGeolocation] = useState(false)
  const [geoLoading, setGeoLoading] = useState(false)
  
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
      useGeolocation
    },
    userLocation
  })

  useEffect(() => {
    fetchApprovedAgencies()
  }, [])

  // Atualizar centro do mapa quando a localização do usuário mudar
  useEffect(() => {
    if (userLocation) {
      setMapCenter(userLocation)
    }
  }, [userLocation])

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
    const cities = [...new Set(agencies.map(a => a.city).filter(Boolean))] as string[]
    const types = [...new Set(agencies.map(a => a.agency_type).filter(Boolean))] as string[]
    return { states, cities, types }
  }, [agencies])

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

  // Address search submit for geocoding when user presses enter/search
  const handleAddressSearchSubmit = async (address: string) => {
    await searchByAddress(address)
  }

  // Toggle geolocation and also clear location if disabling
  const handleToggleGeolocation = () => {
    setUseGeolocation((prev) => {
      const next = !prev
      if (next) {
        setGeoLoading(true)
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setGeoLoading(false)
          },
          () => {
            setGeoLoading(false)
            setUseGeolocation(false)
          }
        )
      } else {
        clearLocation()
        setAddressSearch('')
      }
      return next
    })
  }

  // When typing into address field, forcibly unset "useGeolocation"
  const handleAddressSearchChange = (value: string) => {
    setAddressSearch(value)
    if (!value.toLowerCase().startsWith('minha localização')) {
      setUseGeolocation(false)
    }
  }

  // When changing the filters (besides address/name/location)
  const handleFiltersChange = (newFilters: FilterState) => {
    // Don't accept search/address/useGeolocation from sidebar
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      search: prev.search,
      addressSearch: prev.addressSearch,
      useGeolocation: prev.useGeolocation
    }))
  }

  if (loading) {
    return (
      <div className="container py-8 flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

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

        <div className="max-w-7xl mx-auto mb-8 space-y-4">
          {/* Primeira linha: Busca por nome, endereço e toggle de localização */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search-name">Buscar por nome</Label>
              <Input
                id="search-name"
                placeholder="Nome da agência ou área..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="search-address">Buscar por endereço</Label>
              <Input
                id="search-address"
                placeholder="Digite um endereço..."
                value={addressSearch}
                onChange={(e) => handleAddressSearchChange(e.target.value)}
                onBlur={() => { if (addressSearch.trim()) handleAddressSearchSubmit(addressSearch); }}
                disabled={useGeolocation}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Localização</Label>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleToggleGeolocation}
                  disabled={geoLoading}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all border w-full justify-center ${
                    useGeolocation
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <LocateFixed className="h-4 w-4" />
                  <span>Usar minha localização</span>
                </button>
                {geoLoading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                )}
              </div>
            </div>
          </div>

          {/* Segunda linha: Filtros avançados e toggle Lista/Mapa */}
          <div className="flex items-center justify-between">
            <AgencyFilterSidebar
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onAddressSearchSubmit={handleAddressSearchSubmit}
              totalAgencies={filteredAgencies.length}
              states={states}
              cities={cities}
              types={types}
              userLocation={userLocation}
              geoLoading={geoLoading}
              geocodeLoading={false}
            />

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
