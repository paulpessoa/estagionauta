import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { Agency } from '@/types/agency'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { AuthRequiredModal } from '@/components/AuthRequiredModal'
import { Building, MapPin, Search, Star, Filter, Globe, Phone, Instagram, X, Users, MessageSquare, Rocket } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AgencyReviewModal } from '@/components/modals/AgencyReviewModal'

// Hook para debounce
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])
  return debouncedValue
}

function AgencyCard({ agency, onReviewClick }: { agency: Agency; onReviewClick: () => void }) {
  const { user } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)

  const handleReactionClick = () => {
    if (!user) {
      setShowAuthModal(true)
    } else {
      toast.info('Funcionalidade de reação em desenvolvimento!')
    }
  }

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow w-full">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <Avatar className="h-12 w-12 border">
                <AvatarImage src={agency.logo_url ?? undefined} alt={agency.name} />
                <AvatarFallback>{agency.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <span>{agency.name}</span>
                  {agency.status === 'approved' && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      ✓ Verificada
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="mt-2">{agency.description}</CardDescription>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="flex items-center justify-end space-x-1 mb-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{agency.rating?.toFixed(1) || 'N/A'}</span>
              </div>
              <p className="text-sm text-muted-foreground">{agency.total_reviews || 0} avaliações</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-muted-foreground text-sm">
              <MapPin className="h-4 w-4" />
              <span>{agency.address}, {agency.city} - {agency.state}</span>
            </div>
            {agency.areas && agency.areas.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Áreas de atuação:</p>
                <div className="flex flex-wrap gap-2">{agency.areas.map((area) => <Badge key={area} variant="outline">{area}</Badge>)}</div>
              </div>
            )}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 border-t">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4 sm:mb-0">
                {agency.phone && <div className="flex items-center space-x-2 text-sm text-muted-foreground"><Phone className="h-4 w-4" /><span>{agency.phone}</span></div>}
                {agency.website && <div className="flex items-center space-x-2 text-sm text-muted-foreground"><Globe className="h-4 w-4" /><a href={agency.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">{agency.website}</a></div>}
                {agency.instagram && <div className="flex items-center space-x-2 text-sm text-muted-foreground"><Instagram className="h-4 w-4" /><a href={`https://instagram.com/${agency.instagram}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">@{agency.instagram}</a></div>}
              </div>
              <div className="flex space-x-2 flex-shrink-0">
                <Button variant="outline" size="sm" onClick={() => toast.info('Funcionalidade de perfil em desenvolvimento.')}>Ver Perfil</Button>
                <Button size="sm" onClick={onReviewClick}>Avaliar</Button>
              </div>
            </div>
          </div>
        </CardContent>
        <div className="border-t mx-6 my-2"></div>
        <div className="px-6 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="flex items-center space-x-1 text-muted-foreground" onClick={handleReactionClick}>
                <Rocket className="h-4 w-4 -rotate-45" />
                <span>12</span>
              </Button>
              <Button variant="ghost" size="sm" className="flex items-center space-x-1 text-muted-foreground" onClick={handleReactionClick}>
                <Rocket className="h-4 w-4 rotate-135" />
                <span>3</span>
              </Button>
              <Button variant="ghost" size="sm" className="flex items-center space-x-1 text-muted-foreground" onClick={() => toast.info('Funcionalidade de comentários em desenvolvimento.')}>
                <MessageSquare className="h-4 w-4" />
                <span>Comentários</span>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Última atualização: 2 dias atrás</p>
          </div>
        </div>
      </Card>
      <AuthRequiredModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  )
}

export function FilterSheet({ states, cities, types, filters, onFilterChange, onClearFilters }: {
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
        <Button variant="outline" className="flex items-center space-x-2">
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

export default function AgenciasPage() {
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [filters, setFilters] = useState({ state: '', city: '', type: '' })
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null)
  
  const { user } = useAuth()
  const navigate = useNavigate()
  const debouncedSearchTerm = useDebounce(searchTerm, 500)
  const itemsPerPage = 5

  useEffect(() => {
    fetchApprovedAgencies()
  }, [])

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

  const filteredAgencies = useMemo(() => {
    return agencies.filter(agency => {
      const lowercasedTerm = debouncedSearchTerm.toLowerCase()
      const searchTermMatch = !debouncedSearchTerm ||
        agency.name.toLowerCase().includes(lowercasedTerm) ||
        (agency.description?.toLowerCase().includes(lowercasedTerm) ?? false) ||
        (agency.areas?.some(area => area.toLowerCase().includes(lowercasedTerm)) ?? false)

      const stateMatch = !filters.state || agency.state === filters.state
      const cityMatch = !filters.city || agency.city === filters.city
      const typeMatch = !filters.type || agency.agency_type === filters.type

      return searchTermMatch && stateMatch && cityMatch && typeMatch
    })
  }, [agencies, debouncedSearchTerm, filters])

  const { states, cities, types } = useMemo(() => {
    const states = [...new Set(agencies.map(a => a.state).filter(Boolean))] as string[]
    const cities = [...new Set(agencies.map(a => a.city).filter(Boolean))] as string[]
    const types = [...new Set(agencies.map(a => a.agency_type).filter(Boolean))] as string[]
    return { states, cities, types }
  }, [agencies])

  const stats = useMemo(() => {
    const totalReviews = agencies.reduce((acc, agency) => acc + (agency.total_reviews || 0), 0)
    const totalRatedAgencies = agencies.filter(a => a.rating !== null && a.rating > 0).length
    const averageRating = totalRatedAgencies > 0 ? agencies.reduce((acc, agency) => acc + (agency.rating || 0), 0) / totalRatedAgencies : 0
    return {
      totalAgencies: agencies.length,
      totalReviews,
      averageRating
    }
  }, [agencies])

  const totalPages = Math.ceil(filteredAgencies.length / itemsPerPage)
  const paginatedAgencies = filteredAgencies.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleReviewClick = (agency: Agency) => {
    if (!user) {
      setShowAuthModal(true)
    } else {
      setSelectedAgency(agency)
      setIsReviewModalOpen(true)
    }
  }

  const handleReviewSubmitted = () => {
    toast.info("Sua avaliação está pendente de moderação.")
  }

  const handleFilterChange = (filterType: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [filterType]: value }))
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setFilters({ state: '', city: '', type: '' })
    setCurrentPage(1)
  }

  if (loading) {
    return (
      <div className="container py-8 flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto py-8 px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Mapa de Agências de Estágio 🗺️</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">Descubra e avalie agências de estágio na sua região. Veja avaliações reais de outros estudantes.</p>
        </div>
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por nome, área ou localização..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <FilterSheet states={states} cities={cities} types={types} filters={filters} onFilterChange={handleFilterChange} onClearFilters={clearFilters} />
          </div>
        </div>
        <div className="max-w-4xl mx-auto mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card><CardContent className="flex items-center space-x-4 p-6"><div className="h-12 w-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center"><Building className="h-6 w-6 text-green-600" /></div><div><p className="text-2xl font-bold">{stats.totalAgencies}</p><p className="text-muted-foreground">Agências cadastradas</p></div></CardContent></Card>
            <Card><CardContent className="flex items-center space-x-4 p-6"><div className="h-12 w-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center"><Users className="h-6 w-6 text-blue-600" /></div><div><p className="text-2xl font-bold">{stats.totalReviews}</p><p className="text-muted-foreground">Avaliações</p></div></CardContent></Card>
            <Card><CardContent className="flex items-center space-x-4 p-6"><div className="h-12 w-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center"><Star className="h-6 w-6 text-purple-600" /></div><div><p className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</p><p className="text-muted-foreground">Média geral</p></div></CardContent></Card>
          </div>
        </div>
        <div className="max-w-4xl mx-auto">
          <div className="space-y-6">
            {paginatedAgencies.map((agency) => <AgencyCard key={agency.id} agency={agency} onReviewClick={() => handleReviewClick(agency)} />)}
          </div>
          {paginatedAgencies.length === 0 && !loading && (
            <Card><CardContent className="text-center py-12"><MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><h3 className="text-lg font-semibold mb-2">Nenhuma agência encontrada</h3><p className="text-muted-foreground">Tente ajustar os filtros ou termos de busca.</p></CardContent></Card>
          )}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8">
              <Button variant="outline" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>Anterior</Button>
              <span className="text-sm font-medium">Página {currentPage} de {totalPages}</span>
              <Button variant="outline" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>Próxima</Button>
            </div>
          )}
          <Card className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
            <CardContent className="text-center py-8">
              <h3 className="text-lg font-semibold mb-2">Conhece uma agência que não está listada?</h3>
              <p className="text-muted-foreground mb-4">Ajude outros estudantes adicionando agências que você conhece</p>
              <Button asChild><Link to="/cadastro-agencia">Adicionar Agência</Link></Button>
            </CardContent>
          </Card>
        </div>
        <AuthRequiredModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
        
        {selectedAgency && (
          <AgencyReviewModal
            isOpen={isReviewModalOpen}
            onClose={() => setIsReviewModalOpen(false)}
            agencyId={selectedAgency.id}
            agencyName={selectedAgency.name}
            onReviewSubmitted={handleReviewSubmitted}
          />
        )}
      </div>
    </div>
  )
}
