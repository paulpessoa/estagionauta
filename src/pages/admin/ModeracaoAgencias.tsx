import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useDebounce } from '@/hooks/useDebounce'
import { apiClient } from '@/lib/apiClient'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Building2, Check, X, Search, Edit, Trash2, Star, Calendar, MessageSquare, ShieldAlert, Mail, Inbox } from 'lucide-react'
import { toast } from 'sonner'
import { Agency } from '@/types/agency'
import { EditAgencyModal } from '@/components/modals/EditAgencyModal'
import { ConfirmDeleteModal } from '@/components/modals/ConfirmDeleteModal'

type AgencyStatus = Agency['status']
type AgencySort = 'newest' | 'oldest' | 'name_asc' | 'name_desc'

const AGENCY_SORTS: Record<AgencySort, { label: string; column: 'created_at' | 'name'; ascending: boolean }> = {
  newest: { label: 'Mais recentes', column: 'created_at', ascending: false },
  oldest: { label: 'Mais antigas', column: 'created_at', ascending: true },
  name_asc: { label: 'Nome (A-Z)', column: 'name', ascending: true },
  name_desc: { label: 'Nome (Z-A)', column: 'name', ascending: false },
}

const PAGE_SIZE_OPTIONS = [10, 50, 100]

const BRAZIL_STATES = [
  'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT', 'PA',
  'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO',
]

const EMPTY_AGENCY_MESSAGES: Record<AgencyStatus, string> = {
  pending: 'Nenhuma agência pendente de moderação',
  approved: 'Nenhuma agência aprovada',
  rejected: 'Nenhuma agência rejeitada',
}

export default function ModeracaoAgencias() {
  const { hasPermission, isLoading, profile } = useAuth()
  const navigate = useNavigate()

  // Agencies state (server-side filtered, sorted and paginated — the table has thousands of rows)
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [loadingAgencies, setLoadingAgencies] = useState(true)
  const [loadingMoreAgencies, setLoadingMoreAgencies] = useState(false)
  const [hasMoreAgencies, setHasMoreAgencies] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  const [agencyStatus, setAgencyStatus] = useState<AgencyStatus>('pending')
  const [stateFilter, setStateFilter] = useState('all')
  const [agencySort, setAgencySort] = useState<AgencySort>('newest')
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0])
  const [agencyCounts, setAgencyCounts] = useState<Record<AgencyStatus, number>>({ pending: 0, approved: 0, rejected: 0 })
  const agencyRequestId = useRef(0)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Reviews state
  const [reviews, setReviews] = useState<any[]>([])
  const [loadingReviews, setLoadingReviews] = useState(true)
  const [reviewSearchTerm, setReviewSearchTerm] = useState('')

  // Feedbacks state
  const [feedbacks, setFeedbacks] = useState<any[]>([])
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(true)
  const [feedbackSearchTerm, setFeedbackSearchTerm] = useState('')

  // Modals state for agencies
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null)

  useEffect(() => {
    if (isLoading || !profile) {
      return
    }

    fetchReviews()
    fetchFeedbacks()
  }, [isLoading, profile])

  useEffect(() => {
    if (isLoading || !profile) return
    fetchAgencies(0)
  }, [isLoading, profile, agencyStatus, stateFilter, agencySort, pageSize, debouncedSearchTerm])

  useEffect(() => {
    if (isLoading || !profile) return
    fetchAgencyCounts()
  }, [isLoading, profile, stateFilter, debouncedSearchTerm])

  // Infinite scroll: load the next page when the sentinel below the list becomes visible
  useEffect(() => {
    const sentinel = loadMoreRef.current
    if (!sentinel || !hasMoreAgencies || loadingAgencies || loadingMoreAgencies) return

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) loadMoreAgencies()
    }, { rootMargin: '200px' })

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMoreAgencies, loadingAgencies, loadingMoreAgencies, agencies.length])

  const buildAgencyQuery = (status: AgencyStatus, head: boolean) => {
    let query = supabase
      .from('agencies')
      .select('*', { count: 'exact', head })
      .eq('status', status)

    if (stateFilter !== 'all') query = query.eq('state', stateFilter)

    // Commas and parentheses would break PostgREST's or() syntax
    const term = debouncedSearchTerm.trim().replace(/[,()]/g, ' ')
    if (term) {
      query = query.or(`name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%,city.ilike.%${term}%`)
    }

    return query
  }

  const fetchAgencies = async (offset: number) => {
    const requestId = offset === 0 ? ++agencyRequestId.current : agencyRequestId.current
    if (offset === 0) setLoadingAgencies(true)

    try {
      const sort = AGENCY_SORTS[agencySort]
      const { data, count, error } = await buildAgencyQuery(agencyStatus, false)
        .order(sort.column, { ascending: sort.ascending })
        .order('id', { ascending: true })
        .range(offset, offset + pageSize - 1)

      if (error) throw error
      // Filters changed while this request was in flight
      if (requestId !== agencyRequestId.current) return

      const rows = (data || []) as Agency[]
      setAgencies(prev => offset === 0 ? rows : [...prev, ...rows])
      setHasMoreAgencies(offset + rows.length < (count ?? 0))
    } catch (error) {
      console.error('Erro ao buscar agências:', error)
      toast.error('Erro ao buscar agências')
    } finally {
      if (requestId === agencyRequestId.current) setLoadingAgencies(false)
    }
  }

  const loadMoreAgencies = async () => {
    if (loadingMoreAgencies || !hasMoreAgencies) return
    setLoadingMoreAgencies(true)
    await fetchAgencies(agencies.length)
    setLoadingMoreAgencies(false)
  }

  const fetchAgencyCounts = async () => {
    try {
      const statuses: AgencyStatus[] = ['pending', 'approved', 'rejected']
      const results = await Promise.all(statuses.map(status => buildAgencyQuery(status, true)))
      const counts = { pending: 0, approved: 0, rejected: 0 }
      results.forEach(({ count, error }, index) => {
        if (error) throw error
        counts[statuses[index]] = count ?? 0
      })
      setAgencyCounts(counts)
    } catch (error) {
      console.error('Erro ao contar agências:', error)
    }
  }

  const fetchReviews = async () => {
    setLoadingReviews(true)
    try {
      const { data, error } = await supabase
        .from('agency_reviews')
        .select(`
          *,
          agencies (
            name
          ),
          user_profiles!agency_reviews_user_id_fkey (
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setReviews(data || [])
    } catch (error) {
      console.error('Erro ao buscar avaliações:', error)
      toast.error('Erro ao buscar avaliações para moderação')
    } finally {
      setLoadingReviews(false)
    }
  }

  const fetchFeedbacks = async () => {
    setLoadingFeedbacks(true)
    try {
      const { data, error } = await supabase
        .from('feedbacks')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setFeedbacks(data || [])
    } catch (error) {
      console.error('Erro ao buscar feedbacks:', error)
      toast.error('Erro ao buscar feedbacks de usuários')
    } finally {
      setLoadingFeedbacks(false)
    }
  }


  const handleStatusChange = async (agencyId: string, newStatus: 'approved' | 'rejected' | 'pending') => {
    try {
      const { error } = await supabase
        .from('agencies')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', agencyId)

      if (error) throw error

      // The list only shows the active status tab, so the agency moves to another tab
      const previousStatus = agencies.find(agency => agency.id === agencyId)?.status
      if (previousStatus && previousStatus !== newStatus) {
        setAgencies(agencies.filter(agency => agency.id !== agencyId))
        setAgencyCounts(counts => ({
          ...counts,
          [previousStatus]: Math.max(0, counts[previousStatus] - 1),
          [newStatus]: counts[newStatus] + 1,
        }))
      }

      toast.success(`Agência ${newStatus === 'approved' ? 'aprovada' : newStatus === 'rejected' ? 'rejeitada' : 'pendente'} com sucesso`)
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      toast.error('Erro ao atualizar status da agência')
    }
  }

  const handleDeleteAgency = async () => {
    if (!selectedAgency) return
    
    setDeleteLoading(true)
    try {
      const { error } = await supabase
        .from('agencies')
        .delete()
        .eq('id', selectedAgency.id)
      
      if (error) throw error
      
      setAgencies(agencies.filter(a => a.id !== selectedAgency.id))
      setAgencyCounts(counts => ({
        ...counts,
        [selectedAgency.status]: Math.max(0, counts[selectedAgency.status] - 1),
      }))
      setDeleteModalOpen(false)
      setSelectedAgency(null)
      toast.success('Agência excluída com sucesso')
    } catch (error) {
      console.error('Erro ao excluir agência:', error)
      toast.error('Erro ao excluir agência')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleReviewStatusChange = async (reviewId: string, newStatus: 'approved' | 'rejected' | 'pending') => {
    try {
      const { error } = await supabase
        .from('agency_reviews')
        .update({ 
          status: newStatus,
          is_moderated: newStatus !== 'pending',
          moderated_at: new Date().toISOString(),
          moderated_by: profile?.id
        })
        .eq('id', reviewId)

      if (error) throw error

      setReviews(reviews.map(review =>
        review.id === reviewId ? { ...review, status: newStatus, is_moderated: newStatus !== 'pending' } : review
      ))

      toast.success(`Avaliação ${newStatus === 'approved' ? 'aprovada' : newStatus === 'rejected' ? 'rejeitada' : 'redefinida para pendente'} com sucesso`)
    } catch (error) {
      console.error('Erro ao atualizar status da avaliação:', error)
      toast.error('Erro ao atualizar status da avaliação')
    }
  }

  const handleDeleteReview = async (reviewId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta avaliação permanentemente?')) return

    try {
      const { error } = await supabase
        .from('agency_reviews')
        .delete()
        .eq('id', reviewId)

      if (error) throw error

      setReviews(reviews.filter(r => r.id !== reviewId))
      toast.success('Avaliação excluída com sucesso')
    } catch (error) {
      console.error('Erro ao excluir avaliação:', error)
      toast.error('Erro ao excluir avaliação')
    }
  }

  const handleEditAgency = (agency: Agency) => {
    setSelectedAgency(agency)
    setEditModalOpen(true)
  }

  const handleDeleteClick = (agency: Agency) => {
    setSelectedAgency(agency)
    setDeleteModalOpen(true)
  }

  const handleAgencySaved = (updatedAgency: Agency) => {
    setAgencies(agencies.map(a => a.id === updatedAgency.id ? updatedAgency : a))
  }

  // Filter logic for reviews
  const filteredReviews = reviews.filter(review => {
    const searchLower = reviewSearchTerm.toLowerCase()
    const agencyName = review.agencies?.name?.toLowerCase() || ''
    const userName = review.user_profiles?.full_name?.toLowerCase() || ''
    const userEmail = review.user_profiles?.email?.toLowerCase() || ''
    const comment = review.comment?.toLowerCase() || ''
    const title = review.title?.toLowerCase() || ''
    const justification = review.justification?.toLowerCase() || ''
    
    return (
      agencyName.includes(searchLower) ||
      userName.includes(searchLower) ||
      userEmail.includes(searchLower) ||
      comment.includes(searchLower) ||
      title.includes(searchLower) ||
      justification.includes(searchLower)
    )
  })

  const pendingReviews = filteredReviews.filter(r => r.status === 'pending')
  const approvedReviews = filteredReviews.filter(r => r.status === 'approved')
  const rejectedReviews = filteredReviews.filter(r => r.status === 'rejected')

  // Filter logic for feedbacks
  const filteredFeedbacks = feedbacks.filter(fb => {
    const searchLower = feedbackSearchTerm.toLowerCase()
    const email = fb.email?.toLowerCase() || ''
    const comment = fb.comment?.toLowerCase() || ''
    return email.includes(searchLower) || comment.includes(searchLower)
  })

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <>
      <EditAgencyModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        agency={selectedAgency}
        onSave={handleAgencySaved}
      />
      
      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        itemName={selectedAgency?.name}
        onConfirm={handleDeleteAgency}
        loading={deleteLoading}
      />
      
      <div className="space-y-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Painel de Moderação</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Gerencie o cadastro de agências de estágio e a moderação de avaliações dos estudantes
          </p>
        </div>

        <Tabs defaultValue="agencies" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="agencies">Agências</TabsTrigger>
            <TabsTrigger value="reviews">Avaliações</TabsTrigger>
            <TabsTrigger value="feedbacks">Feedbacks</TabsTrigger>
          </TabsList>

          {/* Agencies Tab Content */}
          <TabsContent value="agencies" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-xl font-semibold">Cadastro de Agências</h2>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar agências..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 text-xs"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Select value={stateFilter} onValueChange={setStateFilter}>
                <SelectTrigger className="w-[150px] text-xs" aria-label="Filtrar por estado">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os estados</SelectItem>
                  {BRAZIL_STATES.map(uf => (
                    <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={agencySort} onValueChange={(value) => setAgencySort(value as AgencySort)}>
                <SelectTrigger className="w-[160px] text-xs" aria-label="Ordenar agências">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(AGENCY_SORTS) as AgencySort[]).map(sort => (
                    <SelectItem key={sort} value={sort}>{AGENCY_SORTS[sort].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={String(pageSize)} onValueChange={(value) => setPageSize(Number(value))}>
                <SelectTrigger className="w-[120px] text-xs" aria-label="Itens por página">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map(size => (
                    <SelectItem key={size} value={String(size)}>Exibir {size}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Tabs value={agencyStatus} onValueChange={(value) => setAgencyStatus(value as AgencyStatus)} className="space-y-4">
              <TabsList>
                <TabsTrigger value="pending" className="relative">
                  Pendentes
                  {agencyCounts.pending > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {agencyCounts.pending}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="approved">
                  Aprovadas
                  {agencyCounts.approved > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {agencyCounts.approved}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="rejected">
                  Rejeitadas
                  {agencyCounts.rejected > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {agencyCounts.rejected}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value={agencyStatus} className="space-y-4">
                {loadingAgencies ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : agencies.length === 0 ? (
                  <Card>
                    <CardContent className="flex items-center justify-center h-32">
                      <p className="text-muted-foreground text-sm">{EMPTY_AGENCY_MESSAGES[agencyStatus]}</p>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    <p className="text-xs text-muted-foreground">
                      Exibindo {agencies.length} de {agencyCounts[agencyStatus]} agências
                    </p>
                    {agencies.map((agency) => (
                      <AgencyCard
                        key={agency.id}
                        agency={agency}
                        onApprove={() => handleStatusChange(agency.id, 'approved')}
                        onReject={() => handleStatusChange(agency.id, 'rejected')}
                        onSetPending={() => handleStatusChange(agency.id, 'pending')}
                        onEdit={() => handleEditAgency(agency)}
                        onDelete={() => handleDeleteClick(agency)}
                      />
                    ))}
                    {hasMoreAgencies && (
                      <div ref={loadMoreRef} className="flex justify-center py-4">
                        <Button variant="outline" size="sm" disabled={loadingMoreAgencies} onClick={loadMoreAgencies}>
                          {loadingMoreAgencies ? 'Carregando...' : 'Carregar mais'}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Reviews Tab Content */}
          <TabsContent value="reviews" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-xl font-semibold">Avaliações de Agências</h2>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar comentários, justificativas..."
                  value={reviewSearchTerm}
                  onChange={(e) => setReviewSearchTerm(e.target.value)}
                  className="pl-9 text-xs"
                />
              </div>
            </div>

            <Tabs defaultValue="pending" className="space-y-4">
              <TabsList>
                <TabsTrigger value="pending" className="relative">
                  Pendentes
                  {pendingReviews.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {pendingReviews.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="approved">
                  Aprovadas
                  {approvedReviews.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {approvedReviews.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="rejected">
                  Rejeitadas
                  {rejectedReviews.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {rejectedReviews.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pending" className="space-y-4">
                {loadingReviews ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : pendingReviews.length === 0 ? (
                  <Card>
                    <CardContent className="flex items-center justify-center h-32">
                      <p className="text-muted-foreground text-sm">Nenhuma avaliação pendente de moderação</p>
                    </CardContent>
                  </Card>
                ) : (
                  pendingReviews.map((review) => (
                    <ReviewModerationCard
                      key={review.id}
                      review={review}
                      onApprove={() => handleReviewStatusChange(review.id, 'approved')}
                      onReject={() => handleReviewStatusChange(review.id, 'rejected')}
                      onSetPending={() => handleReviewStatusChange(review.id, 'pending')}
                      onDelete={() => handleDeleteReview(review.id)}
                    />
                  ))
                )}
              </TabsContent>

              <TabsContent value="approved" className="space-y-4">
                {loadingReviews ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : approvedReviews.length === 0 ? (
                  <Card>
                    <CardContent className="flex items-center justify-center h-32">
                      <p className="text-muted-foreground text-sm">Nenhuma avaliação aprovada</p>
                    </CardContent>
                  </Card>
                ) : (
                  approvedReviews.map((review) => (
                    <ReviewModerationCard
                      key={review.id}
                      review={review}
                      onApprove={() => handleReviewStatusChange(review.id, 'approved')}
                      onReject={() => handleReviewStatusChange(review.id, 'rejected')}
                      onSetPending={() => handleReviewStatusChange(review.id, 'pending')}
                      onDelete={() => handleDeleteReview(review.id)}
                    />
                  ))
                )}
              </TabsContent>

              <TabsContent value="rejected" className="space-y-4">
                {loadingReviews ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : rejectedReviews.length === 0 ? (
                  <Card>
                    <CardContent className="flex items-center justify-center h-32">
                      <p className="text-muted-foreground text-sm">Nenhuma avaliação rejeitada</p>
                    </CardContent>
                  </Card>
                ) : (
                  rejectedReviews.map((review) => (
                    <ReviewModerationCard
                      key={review.id}
                      review={review}
                      onApprove={() => handleReviewStatusChange(review.id, 'approved')}
                      onReject={() => handleReviewStatusChange(review.id, 'rejected')}
                      onSetPending={() => handleReviewStatusChange(review.id, 'pending')}
                      onDelete={() => handleDeleteReview(review.id)}
                    />
                  ))
                )}
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Feedbacks Tab Content */}
          <TabsContent value="feedbacks" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-xl font-semibold">Feedbacks & Sugestões dos Usuários</h2>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por email ou comentário..."
                  value={feedbackSearchTerm}
                  onChange={(e) => setFeedbackSearchTerm(e.target.value)}
                  className="pl-9 text-xs"
                />
              </div>
            </div>

            {loadingFeedbacks ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : filteredFeedbacks.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                  <Inbox className="h-12 w-12 mb-2 text-muted-foreground/50" />
                  <p className="text-sm">Nenhum feedback ou sugestão recebida</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredFeedbacks.map((feedback) => (
                  <FeedbackCard key={feedback.id} feedback={feedback} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}

function FeedbackCard({ feedback }: { feedback: any }) {
  const [isReplying, setIsReplying] = useState(false)
  const [replyMessage, setReplyMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [status, setStatus] = useState(feedback.status || 'pending')

  const handleSendReply = async () => {
    if (!replyMessage.trim()) {
      toast.error('Digite uma mensagem para responder.')
      return
    }

    if (!feedback.email) {
      toast.error('Este feedback não possui um e-mail associado.')
      return
    }

    setIsSending(true)
    try {
      await apiClient.post('/api/admin/reply-email', {
        feedbackId: feedback.id,
        toEmail: feedback.email,
        subject: 'Resposta ao seu feedback - Estagionauta',
        message: replyMessage,
      })

      toast.success('Resposta enviada com sucesso!')
      setStatus('replied')
      setIsReplying(false)
      setReplyMessage('')
    } catch (err) {
      console.error('Erro ao enviar resposta:', err)
      toast.error('Erro ao enviar resposta ao usuário.')
    } finally {
      setIsSending(false)
    }
  }

  const stars = Array.from({ length: 5 }, (_, i) => i + 1)
  return (
    <Card className={`transition-shadow ${status === 'replied' ? 'opacity-80' : 'hover:shadow-md'}`}>
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
          <div>
            <CardTitle className="text-md flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{feedback.email || 'Anônimo'}</span>
              {status === 'replied' && (
                <Badge variant="outline" className="ml-2 text-green-600 border-green-200 bg-green-50">Respondido</Badge>
              )}
            </CardTitle>
            <CardDescription className="text-xs mt-1 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
              {new Date(feedback.created_at).toLocaleString('pt-BR')}
            </CardDescription>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground mr-1 font-medium">Satisfação:</span>
            <div className="flex">
              {stars.map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${
                    star <= feedback.rating
                      ? 'text-yellow-500 fill-yellow-500'
                      : 'text-gray-300 dark:text-gray-700'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="text-xs">
        <div className="bg-muted/40 p-3 rounded-lg border border-border/50 mb-3">
          <p className="text-gray-700 dark:text-gray-300 italic">{feedback.comment}</p>
        </div>

        {feedback.email && status !== 'replied' && (
          <div className="flex flex-col gap-2 mt-2">
            {!isReplying ? (
              <Button variant="outline" size="sm" className="w-fit" onClick={() => setIsReplying(true)}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Responder
              </Button>
            ) : (
              <div className="space-y-3 p-3 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-md">
                <p className="font-medium text-blue-800 dark:text-blue-300">Resposta via E-mail para {feedback.email}</p>
                <textarea 
                  className="w-full p-2 text-sm rounded-md border min-h-[80px]"
                  placeholder="Escreva sua resposta..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                />
                <div className="flex items-center gap-2">
                  <Button size="sm" disabled={isSending} onClick={handleSendReply}>
                    {isSending ? 'Enviando...' : 'Enviar Resposta'}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setIsReplying(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function AgencyCard({ 
  agency, 
  onApprove, 
  onReject, 
  onSetPending, 
  onEdit, 
  onDelete 
}: { 
  agency: Agency
  onApprove: () => void
  onReject: () => void
  onSetPending: () => void
  onEdit: () => void
  onDelete: () => void 
}) {
  const { profile } = useAuth()
  const isAdmin = profile?.role === 'admin'

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5 text-primary" />
              {agency.name}
            </CardTitle>
            <CardDescription className="mt-1">
              {agency.description || 'Sem descrição cadastrada'}
            </CardDescription>
          </div>
          <Badge variant={agency.status === 'approved' ? 'default' : agency.status === 'rejected' ? 'destructive' : 'secondary'}>
            {agency.status === 'approved' ? 'Aprovada' : agency.status === 'rejected' ? 'Rejeitada' : 'Pendente'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div>
              <p className="font-semibold text-muted-foreground">Email</p>
              <p>{agency.email || 'Não informado'}</p>
            </div>
            <div>
              <p className="font-semibold text-muted-foreground">Telefone</p>
              <p>{agency.phone || 'Não informado'}</p>
            </div>
            {agency.website && (
              <div>
                <p className="font-semibold text-muted-foreground">Website</p>
                <a
                  href={agency.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {agency.website}
                </a>
              </div>
            )}
          </div>
          
          {agency.address && (
            <div>
              <p className="font-semibold text-muted-foreground">Endereço</p>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${agency.name} ${agency.address || ''} ${agency.city || ''} ${agency.state || ''}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {agency.address}, {agency.city} - {agency.state}
              </a>
            </div>
          )}
          
          {agency.areas && agency.areas.length > 0 && (
            <div>
              <p className="font-semibold text-muted-foreground mb-1">Áreas</p>
              <div className="flex flex-wrap gap-1">
                {agency.areas.map((area, index) => (
                  <Badge key={index} variant="outline" className="text-[10px] py-0">
                    {area}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-4 pt-3 border-t">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onEdit}
                className="h-8 text-xs"
              >
                <Edit className="h-3.5 w-3.5 mr-1" />
                Editar
              </Button>
              
              {isAdmin && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={onDelete}
                  className="h-8 text-xs bg-red-600 hover:bg-red-700"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Excluir
                </Button>
              )}
            </div>
            
            <div className="flex gap-2">
              {agency.status === 'pending' ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
                    onClick={onReject}
                  >
                    <X className="h-3.5 w-3.5 mr-1" />
                    Rejeitar
                  </Button>
                  <Button
                    size="sm"
                    className="h-8 text-xs"
                    onClick={onApprove}
                  >
                    <Check className="h-3.5 w-3.5 mr-1" />
                    Aprovar
                  </Button>
                </>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-muted-foreground"
                  onClick={onSetPending}
                >
                  Voltar para Pendente
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ReviewModerationCard({
  review,
  onApprove,
  onReject,
  onSetPending,
  onDelete
}: {
  review: any
  onApprove: () => void
  onReject: () => void
  onSetPending: () => void
  onDelete: () => void
}) {
  const { profile } = useAuth()
  const isAdmin = profile?.role === 'admin'

  const stars = Array.from({ length: 5 }, (_, i) => i + 1)

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
          <div>
            <CardTitle className="text-md flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              {review.agencies?.name || 'Agência desconhecida'}
            </CardTitle>
            <CardDescription className="text-xs mt-1 flex flex-col sm:flex-row sm:items-center gap-1">
              <span>Por: {review.user_profiles?.full_name || 'Estudante'} ({review.user_profiles?.email || 'N/A'})</span>
              <span className="hidden sm:inline">•</span>
              <span className="flex items-center text-[10px] text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 mr-1" />
                {new Date(review.created_at).toLocaleString('pt-BR')}
              </span>
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex">
              {stars.map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${
                    star <= review.rating
                      ? 'text-yellow-500 fill-yellow-500'
                      : 'text-gray-300 dark:text-gray-700'
                  }`}
                />
              ))}
            </div>
            <Badge variant={review.status === 'approved' ? 'default' : review.status === 'rejected' ? 'destructive' : 'secondary'}>
              {review.status === 'approved' ? 'Aprovada' : review.status === 'rejected' ? 'Rejeitada' : 'Pendente'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-xs">
        {review.title && (
          <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">{review.title}</p>
        )}
        <div className="bg-muted/40 p-3 rounded-lg border border-border/50">
          <p className="font-medium text-[11px] text-muted-foreground mb-1 flex items-center gap-1">
            <MessageSquare className="h-3.5 w-3.5 text-blue-500" />
            Comentário do Estudante:
          </p>
          <p className="text-gray-700 dark:text-gray-300 italic">{review.comment}</p>
        </div>

        {review.justification && (
          <div className="bg-amber-50/40 dark:bg-amber-950/10 p-3 rounded-lg border border-amber-200/40 dark:border-amber-900/20">
            <p className="font-semibold text-[11px] text-amber-800 dark:text-amber-300 mb-1 flex items-center gap-1">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
              Justificativa / Comprovação (Privada):
            </p>
            <p className="text-gray-600 dark:text-gray-400">{review.justification}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-4 pt-3 border-t">
          <div>
            {isAdmin && (
              <Button
                variant="destructive"
                size="sm"
                onClick={onDelete}
                className="h-8 text-xs bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Excluir
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            {review.status === 'pending' ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
                  onClick={onReject}
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  Rejeitar
                </Button>
                <Button
                  size="sm"
                  className="h-8 text-xs"
                  onClick={onApprove}
                >
                  <Check className="h-3.5 w-3.5 mr-1" />
                  Aprovar
                </Button>
              </>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-muted-foreground"
                onClick={onSetPending}
              >
                Voltar para Pendente
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
