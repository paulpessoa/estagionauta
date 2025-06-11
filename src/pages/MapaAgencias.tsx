import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Agency } from '@/types/agency'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Filter, X, LocateFixed, Navigation, MapPin, Phone, Mail, Globe } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF } from '@react-google-maps/api';
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Link } from 'react-router-dom'

const containerStyle = {
  width: '100%',
  height: '100%'
};

// Hook para debounce
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const handler = setTimeout(() => { setDebouncedValue(value) }, delay)
    return () => { clearTimeout(handler) }
  }, [value, delay])
  return debouncedValue
}

// Função para calcular distância
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distância em km
  return d;
}

function FilterSheet({ states, cities, types, filters, onFilterChange, onClearFilters }: {
  states: string[],
  cities: string[],
  types: string[],
  filters: { state: string, city: string, type: string },
  onFilterChange: (filterType: keyof typeof filters, value: string) => void,
  onClearFilters: () => void
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="w-full flex items-center justify-center space-x-2">
          <Filter className="h-4 w-4" />
          <span>Filtros</span>
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader><SheetTitle>Filtrar Agências</SheetTitle></SheetHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label>Estado</Label>
            <Select value={filters.state} onValueChange={(v) => onFilterChange('state', v)}>
              <SelectTrigger><SelectValue placeholder="Todos os estados" /></SelectTrigger>
              <SelectContent>{states.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Cidade</Label>
            <Select value={filters.city} onValueChange={(v) => onFilterChange('city', v)}>
              <SelectTrigger><SelectValue placeholder="Todas as cidades" /></SelectTrigger>
              <SelectContent>{cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Tipo de Agência</Label>
            <Select value={filters.type} onValueChange={(v) => onFilterChange('type', v)}>
              <SelectTrigger><SelectValue placeholder="Todos os tipos" /></SelectTrigger>
              <SelectContent>{types.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <Button variant="ghost" onClick={onClearFilters} className="w-full justify-start text-sm text-muted-foreground">
          <X className="mr-2 h-4 w-4" /> Limpar Filtros
        </Button>
      </SheetContent>
    </Sheet>
  )
}

export default function MapaAgencias() {
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [addressSearch, setAddressSearch] = useState('')
  const [filters, setFilters] = useState({ state: '', city: '', type: '' })
  const [useGeolocation, setUseGeolocation] = useState(false)
  const [sortBy, setSortBy] = useState('name')
  const debouncedSearchTerm = useDebounce(searchTerm, 500)
  const debouncedAddressSearch = useDebounce(addressSearch, 500)

  const [mapCenter, setMapCenter] = useState({ lat: -8.047562, lng: -34.877002 })
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null)
  const [activeMarker, setActiveMarker] = useState<string | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  useEffect(() => { fetchApprovedAgencies() }, [])

  useEffect(() => {
    if (useGeolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          const newUserLocation = { lat: latitude, lng: longitude };
          setUserLocation(newUserLocation)
          setMapCenter(newUserLocation)
          setAddressSearch(`Minha Localização (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`)
          toast.success("Geolocalização ativada!")
        },
        () => {
          toast.error("Não foi possível obter sua localização.")
          setUseGeolocation(false)
        }
      )
    } else {
      setUserLocation(null)
      if (addressSearch.startsWith("Minha Localização")) setAddressSearch('')
    }
  }, [useGeolocation])

  const fetchApprovedAgencies = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from('agencies').select('*').eq('status', 'approved').order('name', { ascending: true })
      if (error) throw error
      setAgencies(data || [])
    } catch (error) { toast.error('Não foi possível carregar as agências.') }
    finally { setLoading(false) }
  }

  const { states, cities, types } = useMemo(() => ({
    states: [...new Set(agencies.map(a => a.state).filter(Boolean))] as string[],
    cities: [...new Set(agencies.map(a => a.city).filter(Boolean))] as string[],
    types: [...new Set(agencies.map(a => a.agency_type).filter(Boolean))] as string[],
  }), [agencies])

  const agenciesWithDistance = useMemo(() => {
    if (!userLocation) return agencies.map(a => ({ ...a, distance: null }));
    return agencies.map(agency => {
      if (agency.latitude && agency.longitude) {
        const distance = getDistance(userLocation.lat, userLocation.lng, agency.latitude, agency.longitude);
        return { ...agency, distance };
      }
      return { ...agency, distance: null };
    });
  }, [agencies, userLocation]);

  const filteredAgencies = useMemo(() => {
    const filtered = agenciesWithDistance.filter(agency => {
      const lowercasedTerm = debouncedSearchTerm.toLowerCase()
      const lowercasedAddress = debouncedAddressSearch.toLowerCase()
      const addressSearchActive = debouncedAddressSearch && !lowercasedAddress.startsWith('minha localização')

      const searchTermMatch = !lowercasedTerm || agency.name.toLowerCase().includes(lowercasedTerm) || (agency.description?.toLowerCase().includes(lowercasedTerm) ?? false) || (agency.areas?.some(area => area.toLowerCase().includes(lowercasedTerm)) ?? false)
      const addressMatch = !addressSearchActive || (agency.address?.toLowerCase().includes(lowercasedAddress) ?? false) || (agency.city?.toLowerCase().includes(lowercasedAddress) ?? false) || (agency.state?.toLowerCase().includes(lowercasedAddress) ?? false)
      const stateMatch = !filters.state || agency.state === filters.state
      const cityMatch = !filters.city || agency.city === filters.city
      const typeMatch = !filters.type || agency.agency_type === filters.type

      return searchTermMatch && addressMatch && stateMatch && cityMatch && typeMatch
    });

    if (sortBy === 'distance' && userLocation) {
      return filtered.sort((a, b) => {
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });
    }
    return filtered.sort((a, b) => a.name.localeCompare(b.name));

  }, [agenciesWithDistance, debouncedSearchTerm, debouncedAddressSearch, filters, sortBy, userLocation])

  const clearFilters = () => setFilters({ state: '', city: '', type: '' })
  const handleFilterChange = (filterType: keyof typeof filters, value: string) => setFilters(prev => ({ ...prev, [filterType]: value }))

  const handleMarkerClick = (agencyId: string) => {
    setActiveMarker(agencyId);
  }

   const renderMap = () => (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={mapCenter}
      zoom={12}
      options={{
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        controlSize: 24,
        zoomControlOptions: {
          position: window.google.maps.ControlPosition.RIGHT_BOTTOM,
        },
      }}
    >
      {userLocation && <MarkerF position={userLocation} />}
      {filteredAgencies.map(agency =>
        agency.latitude && agency.longitude && (
          <MarkerF
            key={agency.id}
            position={{ lat: agency.latitude, lng: agency.longitude }}
            onClick={() => handleMarkerClick(agency.id)}
            icon={{
              url: '/logo.png',
              scaledSize: new window.google.maps.Size(35, 46),
              // Apply invert filter in dark mode for better visibility
              // This requires the marker icon to support transparency
              // Alternatively, use a different icon for dark mode if available
              // Here we use a custom SVG marker with fill color adapting to theme
              fillColor: getComputedStyle(document.documentElement).getPropertyValue('--background')?.trim() === '#000000' ? '#fff' : '#000',
              // Add label or use SVG marker for better contrast
            }}
          >
            {/* NOVO: Usando o ícone MapPin do Lucide React como marcador */}
            <MapPin
              size={35} // Tamanho do ícone
              color={getComputedStyle(document.documentElement).getPropertyValue('--background')?.trim() === '#000000' ? '#fff' : 'hsl(var(--primary)'} // Cor do ícone adaptada ao modo escuro/claro
            />
            {activeMarker === agency.id && (
              <InfoWindowF onCloseClick={() => setActiveMarker(null)}>
                <div className="p-2 max-w-xs bg-white dark:bg-gray-800 text-black dark:text-white rounded-md shadow-lg">
                  <h3 className="font-bold text-lg mb-1">{agency.name}</h3>
                  {agency.agency_type && <Badge variant="outline" className="mb-2 font-normal">{agency.agency_type}</Badge>}
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                    <MapPin className="h-3 w-3 inline-block" /> {agency.address}, {agency.city}, {agency.state}
                  </p>
                  {agency.phone && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                      <Phone className="h-3 w-3 inline-block" /> {agency.phone}
                    </p>
                  )}
                  {agency.email && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                      <Mail className="h-3 w-3 inline-block" /> {agency.email}
                    </p>
                  )}
                  {agency.website && (
                    <a href={agency.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1 mb-2">
                      <Globe className="h-3 w-3 inline-block" /> Site
                    </a>
                  )}
                  {agency.distance !== null && (
                    <p className="text-sm font-bold text-primary mt-2">{agency.distance.toFixed(1)} km de você</p>
                  )}
                  <Button size="sm" className="mt-3 w-full" onClick={() => toast.info("Abrir perfil...")}>Ver Detalhes</Button>
                </div>
              </InfoWindowF>
            )}
          </MarkerF>
        )
      )}
    </GoogleMap>
  )

  if (loadError) return <div>Erro ao carregar o mapa. Verifique sua chave de API do Google Maps.</div>;
  if (loading || !isLoaded) return <div className="flex justify-center items-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>

  return (
    <div className="flex flex-col md:flex-row container py-8">
      <div className="w-full md:w-1/3 p-4 border-r flex flex-col h-[80vh]"> {/* Adicionado h-[70vh] e flex-col */}
        <h1 className="text-2xl font-bold mb-4">Explorar Agências</h1> {/* Adicionado mb-4 para espaçamento */}

        <div className="space-y-4 mb-4"> {/* Adicionado mb-4 */}
          <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar por nome, área..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" /></div>
          <div className="relative"><Navigation className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar por endereço..." value={addressSearch} onChange={e => setAddressSearch(e.target.value)} className="pl-10" /></div>
          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50"><Label htmlFor="geolocation-switch" className="flex items-center gap-2 cursor-pointer"><LocateFixed className="h-4 w-4" /><span>Usar minha localização</span></Label><Switch id="geolocation-switch" checked={useGeolocation} onCheckedChange={setUseGeolocation} /></div>
          <FilterSheet states={states} cities={cities} types={types} filters={filters} onFilterChange={handleFilterChange} onClearFilters={clearFilters} />
        </div>

        <Separator className="mb-4" /> {/* Adicionado mb-4 */}

        <div className="flex justify-between items-center mb-4"> {/* Adicionado mb-4 */}
          <p className="text-sm text-muted-foreground">{filteredAgencies.length} agências encontradas</p>
          <Select value={sortBy} onValueChange={setSortBy} disabled={!userLocation}>
            <SelectTrigger className="w-[180px] text-xs">
              <SelectValue placeholder="Ordenar por..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Nome</SelectItem>
              <SelectItem value="distance">Distância</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-y-auto space-y-2 pr-2"> {/* Adicionado overflow-y-auto e pr-2 para o scrollbar */}
          {filteredAgencies.length === 0 && (
            <CardContent className="text-center py-8">
              <h3 className="text-lg font-semibold mb-2">Conhece uma agência que não está listada?</h3>
              <p className="text-muted-foreground mb-4">Ajude outros estudantes adicionando agências que você conhece</p>
              <Button asChild><Link to="/cadastro-agencia">Adicionar Agência</Link></Button>
            </CardContent>
          )}
          {filteredAgencies.map(agency => (
            <Card key={agency.id} className="cursor-pointer hover:bg-muted/50" onClick={() => agency.latitude && agency.longitude && setMapCenter({ lat: agency.latitude, lng: agency.longitude })}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h3 className="font-semibold pr-2">{agency.name}</h3>
                    <p className="text-sm text-muted-foreground">{agency.city}, {agency.state}</p>
                  </div>
                  {agency.distance !== null && (
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-primary">{agency.distance.toFixed(1)} km</p>
                      <p className="text-xs text-muted-foreground">de você</p>
                    </div>
                  )}
                </div>
                {agency.agency_type && <Badge variant="outline" className="mt-2 font-normal">{agency.agency_type}</Badge>}
              </CardContent>
            </Card>
          ))}



        </div>
      </div>
    <div className="w-full md:w-2/3 h-[60vh] md:h-[80vh]">
        {renderMap()}
      </div>
    </div>
  )
}