import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Permission } from '@/types/permissions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Building2, Check, X, Search, MapPin, Phone, Mail, Globe, Instagram } from 'lucide-react'
import { toast } from 'sonner'
import { Agency } from '@/types/agency'
import { EditAgencyModal } from '@/components/modals/EditAgencyModal'
import { ConfirmDeleteModal } from '@/components/modals/ConfirmDeleteModal'

export default function ListagemAgencias() {
  const { hasPermission, isLoading, profile } = useAuth()
  const navigate = useNavigate()
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [loadingAgencies, setLoadingAgencies] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // New state for modals and selected agency
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null)

  useEffect(() => {
    // Aguarda a autenticação carregar
    if (isLoading) {
      return
    }

    const canViewPage = hasPermission('agencies.verify') || hasPermission('agencies.review')

    if (!canViewPage) {
      toast.error('Você não tem permissão para acessar esta página')
      navigate('/')
      return
    }

    fetchAgencies()
  }, [isLoading, profile, hasPermission, navigate])

  const fetchAgencies = async () => {
    try {
      const { data, error } = await supabase
        .from('agencies')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setAgencies(data || [])
    } catch (error) {
      console.error('Erro ao buscar agências:', error)
      toast.error('Erro ao buscar agências')
    } finally {
      setLoadingAgencies(false)
    }
  }

  const handleStatusChange = async (agencyId: string, newStatus: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('agencies')
        .update({
          status: newStatus,
          verified_by: (await supabase.auth.getUser()).data.user?.id,
          verified_at: new Date().toISOString()
        })
        .eq('id', agencyId)

      if (error) throw error

      setAgencies(agencies.map(agency =>
        agency.id === agencyId ? { ...agency, status: newStatus } : agency
      ))

      toast.success(`Agência ${newStatus === 'approved' ? 'aprovada' : 'rejeitada'} com sucesso`)
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      toast.error('Erro ao atualizar status da agência')
    }
  }

  const filteredAgencies = agencies.filter(agency => {
    const searchLower = searchTerm.toLowerCase()
    return (
      agency.name.toLowerCase().includes(searchLower) ||
      (agency.email?.toLowerCase().includes(searchLower) ?? false) ||
      (agency.phone?.toLowerCase().includes(searchLower) ?? false) ||
      (agency.address?.toLowerCase().includes(searchLower) ?? false)
    )
  })

  const pendingAgencies = filteredAgencies.filter(a => a.status === 'pending')
  const approvedAgencies = filteredAgencies.filter(a => a.status === 'approved')
  const rejectedAgencies = filteredAgencies.filter(a => a.status === 'rejected')

  if (loadingAgencies || isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <>
      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        itemName={selectedAgency?.name}
        onConfirm={async () => {
          if (!selectedAgency) return
          try {
            const { error } = await supabase
              .from('agencies')
              .delete()
              .eq('id', selectedAgency.id)
            if (error) throw error
            setAgencies(agencies.filter(a => a.id !== selectedAgency.id))
            toast.success('Agência excluída com sucesso')
          } catch (error) {
            toast.error('Erro ao excluir agência')
          }
        }}
      />
      <div className="container py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Listagem de Agências</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie as agências de estágio cadastradas na plataforma
            </p>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar agências..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending" className="relative">
              Pendentes
              {pendingAgencies.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {pendingAgencies.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved">
              Aprovadas
              {approvedAgencies.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {approvedAgencies.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejeitadas
              {rejectedAgencies.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {rejectedAgencies.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingAgencies.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground">Nenhuma agência pendente</p>
                </CardContent>
              </Card>
            ) : (
              pendingAgencies.map((agency) => (
                <AgencyCard
                  key={agency.id}
                  agency={agency}
                  onApprove={() => handleStatusChange(agency.id, 'approved')}
                  onReject={() => handleStatusChange(agency.id, 'rejected')}
                  onEdit={() => {
                    navigate(`/admin/editar-agencia/${agency.id}`)
                  }}
                  onDelete={() => {
                    setSelectedAgency(agency)
                    setDeleteModalOpen(true)
                  }}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="approved" className="space-y-4">
            {approvedAgencies.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground">Nenhuma agência aprovada</p>
                </CardContent>
              </Card>
            ) : (
              approvedAgencies.map((agency) => (
                <AgencyCard
                  key={agency.id}
                  agency={agency}
                  onApprove={() => handleStatusChange(agency.id, 'approved')}
                  onReject={() => handleStatusChange(agency.id, 'rejected')}
                  onEdit={() => {
                    setSelectedAgency(agency)
                    setEditModalOpen(true)
                  }}
                  onDelete={() => {
                    setSelectedAgency(agency)
                    setDeleteModalOpen(true)
                  }}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="rejected" className="space-y-4">
            {rejectedAgencies.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground">Nenhuma agência rejeitada</p>
                </CardContent>
              </Card>
            ) : (
              rejectedAgencies.map((agency) => (
                <AgencyCard
                  key={agency.id}
                  agency={agency}
                  onApprove={() => handleStatusChange(agency.id, 'approved')}
                  onReject={() => handleStatusChange(agency.id, 'rejected')}
                  onEdit={() => {
                    setSelectedAgency(agency)
                    setEditModalOpen(true)
                  }}
                  onDelete={() => {
                    setSelectedAgency(agency)
                    setDeleteModalOpen(true)
                  }}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}

function AgencyCard({ agency, onApprove, onReject, onEdit, onDelete }: { agency: Agency; onApprove: () => void; onReject: () => void; onEdit: () => void; onDelete: () => void }) {
  const { profile } = useAuth()
  const isAdmin = profile?.role === 'admin'

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              {agency.name}
            </CardTitle>
            <CardDescription className="mt-1">
              {agency.description || 'Sem descrição'}
            </CardDescription>
          </div>
          <Badge variant={agency.status === 'approved' ? 'default' : agency.status === 'rejected' ? 'destructive' : 'secondary'}>
            {agency.status === 'approved' ? 'Aprovada' : agency.status === 'rejected' ? 'Rejeitada' : 'Pendente'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            {agency.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{agency.email}</p>
              </div>
            )}
            {agency.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{agency.phone}</p>
              </div>
            )}
          </div>
          {agency.address && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {agency.address}, {agency.city} - {agency.state}, {agency.cep}
              </p>
            </div>
          )}
          <div className="flex gap-4">
            {agency.website && (
              <a
                href={agency.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <Globe className="h-4 w-4" />
                Website
              </a>
            )}
            {agency.instagram && (
              <a
                href={`https://instagram.com/${agency.instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <Instagram className="h-4 w-4" />
                Instagram
              </a>
            )}
          </div>
          <div className="flex gap-2 mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
            >
              Editar
            </Button>
            {isAdmin && (
              <Button
                variant="destructive"
                size="sm"
                onClick={onDelete}
              >
                Excluir
              </Button>
            )}
          </div>
          {agency.status === 'pending' && (
            <div className="flex gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={onReject}
              >
                <X className="h-4 w-4 mr-2" />
                Rejeitar
              </Button>
              <Button
                size="sm"
                className="flex-1"
                onClick={onApprove}
              >
                <Check className="h-4 w-4 mr-2" />
                Aprovar
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}