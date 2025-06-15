
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Building2, Check, X, Search, Edit, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Agency } from '@/types/agency'
import { EditAgencyModal } from '@/components/modals/EditAgencyModal'
import { ConfirmDeleteModal } from '@/components/modals/ConfirmDeleteModal'

export default function ModeracaoAgencias() {
  const { hasPermission, isLoading, profile } = useAuth()
  const navigate = useNavigate()
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [loadingAgencies, setLoadingAgencies] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Modals state
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null)

  useEffect(() => {
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

      setAgencies(agencies.map(agency =>
        agency.id === agencyId ? { ...agency, status: newStatus } : agency
      ))

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

  const filteredAgencies = agencies.filter(agency => {
    const searchLower = searchTerm.toLowerCase()
    return (
      agency.name.toLowerCase().includes(searchLower) ||
      (agency.email?.toLowerCase().includes(searchLower) ?? false) ||
      (agency.phone?.toLowerCase().includes(searchLower) ?? false)
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
      
      <div className="container py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Moderação de Agências</h1>
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
                  onSetPending={() => handleStatusChange(agency.id, 'pending')}
                  onEdit={() => handleEditAgency(agency)}
                  onDelete={() => handleDeleteClick(agency)}
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
                  onSetPending={() => handleStatusChange(agency.id, 'pending')}
                  onEdit={() => handleEditAgency(agency)}
                  onDelete={() => handleDeleteClick(agency)}
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
                  onSetPending={() => handleStatusChange(agency.id, 'pending')}
                  onEdit={() => handleEditAgency(agency)}
                  onDelete={() => handleDeleteClick(agency)}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
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
            <div>
              <p className="text-sm font-medium">Email</p>
              <p className="text-sm text-muted-foreground">{agency.email || 'Não informado'}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Telefone</p>
              <p className="text-sm text-muted-foreground">{agency.phone || 'Não informado'}</p>
            </div>
          </div>
          
          {agency.address && (
            <div>
              <p className="text-sm font-medium">Endereço</p>
              <p className="text-sm text-muted-foreground">
                {agency.address}, {agency.city} - {agency.state}
              </p>
            </div>
          )}
          
          {agency.website && (
            <div>
              <p className="text-sm font-medium">Website</p>
              <a
                href={agency.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                {agency.website}
              </a>
            </div>
          )}
          
          {agency.areas && agency.areas.length > 0 && (
            <div>
              <p className="text-sm font-medium">Áreas</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {agency.areas.map((area, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {area}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Editar
            </Button>
            
            {isAdmin && (
              <Button
                variant="destructive"
                size="sm"
                onClick={onDelete}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Excluir
              </Button>
            )}
          </div>
          
          {agency.status === 'pending' && (
            <div className="flex gap-2">
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
          
          {agency.status !== 'pending' && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={onSetPending}
              >
                Voltar para Pendente
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
