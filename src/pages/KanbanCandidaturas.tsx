import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { AddReminderModal } from '@/components/modals/AddReminderModal'
import { KanbanStats } from '@/components/kanban/KanbanStats'
import { JobApplication, Reminder } from '@/types/kanban'
import { apiClient } from '@/lib/apiClient'
import { 
  Kanban, 
  Calendar as CalendarIcon, 
  Bell, 
  Filter, 
  BarChart3, 
  Plus, 
  Upload, 
  Eye, 
  Edit, 
  Trash2, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Phone, 
  Mail, 
  MapPin, 
  Building, 
  Users, 
  Target,
  FileText,
  Image as ImageIcon,
  Camera,
  Search,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  Star,
  GitMerge
} from 'lucide-react'
import { format, addDays, isAfter, isBefore, startOfDay, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'

import { ApplicationCard } from '@/components/kanban/ApplicationCard'
import { KanbanReactFlow } from '@/components/kanban/KanbanReactFlow'

const statusConfig = {
  interested: { label: 'Interessado', color: 'bg-gray-100 text-gray-800', icon: Eye },
  applied: { label: 'Candidatado', color: 'bg-blue-100 text-blue-800', icon: FileText },
  interview: { label: 'Entrevista', color: 'bg-yellow-100 text-yellow-800', icon: Users },
  test: { label: 'Teste', color: 'bg-purple-100 text-purple-800', icon: Target },
  offer: { label: 'Proposta', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  rejected: { label: 'Recusado', color: 'bg-red-100 text-red-800', icon: AlertCircle }
}

export default function KanbanCandidaturas() {
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isImageUploadModalOpen, setIsImageUploadModalOpen] = useState(false)
  const [isAddReminderModalOpen, setIsAddReminderModalOpen] = useState(false)
  const [editingApplication, setEditingApplication] = useState<JobApplication | null>(null)
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showReminders, setShowReminders] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  // States to toggle Views
  const [viewMode, setViewMode] = useState<'board' | 'flow'>('board')
  const [selectedFlowStage, setSelectedFlowStage] = useState<string | null>(null)

  // Form state for new application
  const [formData, setFormData] = useState({
    company: '',
    position: '',
    description: '',
    salary: '',
    location: '',
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
    website: '',
    notes: '',
    tags: ''
  })

  // Load data from Hono backend
  useEffect(() => {
    const loadApplications = async () => {
      try {
        const data = await apiClient.get<JobApplication[]>('/api/kanban')
        setApplications(data)
      } catch (err: any) {
        console.error('Erro ao carregar candidaturas:', err)
        toast.error('Não foi possível carregar as candidaturas.')
      } finally {
        setIsLoading(false)
      }
    }
    loadApplications()
  }, [])

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      // Simulate AI processing and form auto-fill
      setTimeout(() => {
        setFormData({
          company: 'Nova Empresa',
          position: 'Desenvolvedor Full Stack',
          description: 'Vaga identificada através da imagem',
          salary: 'R$ 3.000',
          location: 'São Paulo, SP',
          contactPerson: '',
          contactEmail: '',
          contactPhone: '',
          website: '',
          notes: 'Vaga identificada automaticamente via IA',
          tags: 'Full Stack, React, Node.js'
        })
        toast.success('Informações extraídas da imagem com sucesso!')
      }, 2000)
    }
  }

  const handleAddApplication = async () => {
    if (!formData.company || !formData.position) {
      toast.error('Empresa e Cargo são obrigatórios')
      return
    }

    try {
      const payload = {
        company: formData.company,
        position: formData.position,
        status: 'interested' as const,
        appliedDate: new Date().toISOString(),
        description: formData.description,
        salary: formData.salary || null,
        location: formData.location || '',
        contactPerson: formData.contactPerson || null,
        contactEmail: formData.contactEmail || null,
        contactPhone: formData.contactPhone || null,
        website: formData.website || null,
        progress: 0,
        notes: formData.notes,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        imageUrl: selectedFile ? URL.createObjectURL(selectedFile) : null
      }

      if (editingApplication) {
        // Edit mode
        const updated = await apiClient.put<JobApplication>(`/api/kanban/${editingApplication.id}`, payload)
        setApplications(prev => prev.map(app => app.id === updated.id ? updated : app))
        toast.success('Candidatura atualizada com sucesso!')
      } else {
        // Create mode
        const createdApp = await apiClient.post<JobApplication>('/api/kanban', payload)
        setApplications(prev => [createdApp, ...prev])
        toast.success('Candidatura adicionada com sucesso!')
      }

      setIsAddModalOpen(false)
      setIsImageUploadModalOpen(false)
      setSelectedFile(null)
      setEditingApplication(null)
      setFormData({
        company: '',
        position: '',
        description: '',
        salary: '',
        location: '',
        contactPerson: '',
        contactEmail: '',
        contactPhone: '',
        website: '',
        notes: '',
        tags: ''
      })
      toast.success('Candidatura adicionada com sucesso!')
    } catch (err: any) {
      console.error('Erro ao criar candidatura:', err)
      toast.error('Não foi possível adicionar a candidatura.')
    }
  }

  const updateApplicationStatus = async (id: string, newStatus: JobApplication['status']) => {
    try {
      const updated = await apiClient.put<JobApplication>(`/api/kanban/${id}`, { 
        status: newStatus
      })
      setApplications(prev => prev.map(app => 
        app.id === id ? { ...app, status: updated.status, progress: updated.progress } : app
      ))
      toast.success(`Status atualizado para ${statusConfig[newStatus].label}`)
    } catch (err) {
      console.error('Erro ao atualizar status:', err)
      toast.error('Não foi possível atualizar o status.')
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault() // Necessário para permitir o drop
  }

  const handleDrop = (e: React.DragEvent, newStatus: JobApplication['status']) => {
    e.preventDefault()
    const applicationId = e.dataTransfer.getData('applicationId')
    if (applicationId) {
      updateApplicationStatus(applicationId, newStatus)
    }
  }

  const deleteApplication = async (id: string) => {
    try {
      await apiClient.delete(`/api/kanban/${id}`)
      setApplications(prev => prev.filter(app => app.id !== id))
      toast.success('Candidatura removida com sucesso!')
    } catch (err) {
      console.error('Erro ao excluir candidatura:', err)
      toast.error('Não foi possível excluir a candidatura.')
    }
  }

  const addReminderToApplication = async (applicationId: string, reminder: Omit<Reminder, 'id' | 'completed'>) => {
    try {
      const newReminder = await apiClient.post<Reminder>(`/api/kanban/${applicationId}/reminders`, {
        title: reminder.title,
        description: reminder.description,
        date: reminder.date,
        completed: false,
        type: reminder.type
      })

      setApplications(prev => prev.map(app => 
        app.id === applicationId 
          ? { ...app, reminders: [...app.reminders, newReminder] }
          : app
      ))
      toast.success('Lembrete adicionado com sucesso!')
    } catch (err) {
      console.error('Erro ao adicionar lembrete:', err)
      toast.error('Não foi possível adicionar o lembrete.')
    }
  }

  const toggleReminderCompletion = async (applicationId: string, reminderId: string) => {
    const app = applications.find(a => a.id === applicationId)
    const reminder = app?.reminders.find(r => r.id === reminderId)
    if (!reminder) return

    try {
      const updated = await apiClient.put<Reminder>(`/api/kanban/${applicationId}/reminders/${reminderId}`, {
        completed: !reminder.completed
      })

      setApplications(prev => prev.map(app => 
        app.id === applicationId 
          ? { 
              ...app, 
              reminders: app.reminders.map(r => 
                r.id === reminderId ? { ...r, completed: updated.completed } : r
              )
            }
          : app
      ))
      toast.success(updated.completed ? 'Lembrete concluído!' : 'Lembrete reaberto.')
    } catch (err) {
      console.error('Erro ao alternar lembrete:', err)
      toast.error('Não foi possível atualizar o lembrete.')
    }
  }

  const handleAddReminder = (applicationId: string) => {
    setSelectedApplicationId(applicationId)
    setIsAddReminderModalOpen(true)
  }

  const filteredApplications = applications.filter(app => {
    const matchesStatus = filterStatus === 'all' || app.status === filterStatus
    const matchesSearch = app.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.position.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const getApplicationsByStatus = (status: JobApplication['status']) => {
    return filteredApplications.filter(app => app.status === status)
  }

  const todayReminders = applications
    .flatMap(app => app.reminders)
    .filter(reminder => !reminder.completed && 
      (isSameDay(new Date(reminder.date), new Date()) || 
       isBefore(new Date(reminder.date), new Date()))
    )

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                Kanban de Candidaturas
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 mt-2">
                Organize suas candidaturas e acompanhe seu progresso
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowReminders(!showReminders)}
                className="flex items-center gap-2"
              >
                <Bell className="h-4 w-4" />
                Lembretes ({todayReminders.length})
              </Button>
              <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                <Button 
                  variant={viewMode === 'board' ? 'default' : 'ghost'} 
                  size="sm" 
                  onClick={() => setViewMode('board')}
                  className="text-xs"
                >
                  <Kanban className="h-4 w-4 mr-2" /> Quadro
                </Button>
                <Button 
                  variant={viewMode === 'flow' ? 'default' : 'ghost'} 
                  size="sm" 
                  onClick={() => setViewMode('flow')}
                  className="text-xs"
                >
                  <GitMerge className="h-4 w-4 mr-2" /> Fluxo
                </Button>
              </div>
              <Dialog 
                open={isAddModalOpen} 
                onOpenChange={(open) => {
                  setIsAddModalOpen(open)
                  if (!open) {
                    setEditingApplication(null)
                    setFormData({
                      company: '', position: '', description: '', salary: '', 
                      location: '', contactPerson: '', contactEmail: '', 
                      contactPhone: '', website: '', notes: '', tags: ''
                    })
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Nova Candidatura
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingApplication ? 'Editar Candidatura' : 'Adicionar Nova Candidatura'}</DialogTitle>
                    <DialogDescription>
                      {editingApplication 
                        ? 'Atualize as informações da vaga selecionada' 
                        : 'Preencha as informações da vaga ou use IA para extrair da imagem'}
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-6">
                    {/* Image Upload Section */}
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <Dialog open={isImageUploadModalOpen} onOpenChange={setIsImageUploadModalOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="mb-4">
                            <Camera className="h-4 w-4 mr-2" />
                            Extrair da Imagem com IA
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Upload de Imagem</DialogTitle>
                            <DialogDescription>
                              Faça upload de uma imagem da vaga para extrair informações automaticamente
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                              <Label htmlFor="image-upload" className="cursor-pointer">
                                <Input
                                  id="image-upload"
                                  type="file"
                                  accept="image/*"
                                  onChange={handleFileUpload}
                                  className="hidden"
                                />
                                <span className="text-blue-600 hover:text-blue-700">
                                  Clique para selecionar uma imagem
                                </span>
                              </Label>
                            </div>
                            {selectedFile && (
                              <div className="text-sm text-gray-600">
                                Arquivo selecionado: {selectedFile.name}
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                      <p className="text-sm text-gray-500">
                        Ou preencha manualmente as informações abaixo
                      </p>
                    </div>

                    {/* Form Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="company">Empresa *</Label>
                        <Input
                          id="company"
                          value={formData.company}
                          onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                          placeholder="Nome da empresa"
                        />
                      </div>
                      <div>
                        <Label htmlFor="position">Cargo *</Label>
                        <Input
                          id="position"
                          value={formData.position}
                          onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                          placeholder="Título da vaga"
                        />
                      </div>
                      <div>
                        <Label htmlFor="location">Localização</Label>
                        <Input
                          id="location"
                          value={formData.location}
                          onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                          placeholder="Cidade, Estado"
                        />
                      </div>
                      <div>
                        <Label htmlFor="salary">Salário</Label>
                        <Input
                          id="salary"
                          value={formData.salary}
                          onChange={(e) => setFormData(prev => ({ ...prev, salary: e.target.value }))}
                          placeholder="R$ 0,00"
                        />
                      </div>
                      <div>
                        <Label htmlFor="contactPerson">Contato</Label>
                        <Input
                          id="contactPerson"
                          value={formData.contactPerson}
                          onChange={(e) => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
                          placeholder="Nome do recrutador"
                        />
                      </div>
                      <div>
                        <Label htmlFor="contactEmail">Email</Label>
                        <Input
                          id="contactEmail"
                          type="email"
                          value={formData.contactEmail}
                          onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                          placeholder="email@empresa.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="contactPhone">Telefone</Label>
                        <Input
                          id="contactPhone"
                          value={formData.contactPhone}
                          onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                          placeholder="(11) 99999-9999"
                        />
                      </div>
                      <div>
                        <Label htmlFor="website">Website</Label>
                        <Input
                          id="website"
                          value={formData.website}
                          onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                          placeholder="https://empresa.com"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description">Descrição da Vaga</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Descrição da vaga e requisitos"
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="tags">Tags</Label>
                      <Input
                        id="tags"
                        value={formData.tags}
                        onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                        placeholder="React, TypeScript, Frontend (separadas por vírgula)"
                      />
                    </div>

                    <div>
                      <Label htmlFor="notes">Observações</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Observações pessoais sobre a vaga"
                        rows={2}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleAddApplication}>
                      {editingApplication ? 'Salvar Alterações' : 'Adicionar Candidatura'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por empresa ou cargo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {Object.entries(statusConfig).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Statistics */}
        <KanbanStats applications={applications} />

        {/* Reminders Panel */}
        {showReminders && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Lembretes de Hoje
              </CardTitle>
            </CardHeader>
            <CardContent>
              {todayReminders.length === 0 ? (
                <p className="text-gray-500">Nenhum lembrete para hoje</p>
              ) : (
                <div className="space-y-3">
                  {todayReminders.slice(0, 5).map(reminder => (
                    <div key={reminder.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{reminder.title}</p>
                        <p className="text-sm text-gray-600">{reminder.description}</p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(reminder.date), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </p>
                      </div>
                      <Button size="sm" variant="outline">
                        Marcar como feito
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Kanban Board or Flow */}
        {viewMode === 'flow' ? (
          <div className="space-y-6">
            <KanbanReactFlow 
              applications={applications} 
              statusConfig={statusConfig} 
              selectedStage={selectedFlowStage}
              onSelectStage={setSelectedFlowStage}
            />
            
            {/* List of cards below the flow when a stage is selected */}
            {selectedFlowStage && (
              <div className="bg-white dark:bg-gray-950 p-6 rounded-xl border shadow-sm mt-8">
                <div className="flex items-center gap-3 mb-6">
                  {(() => {
                    const Icon = statusConfig[selectedFlowStage as keyof typeof statusConfig].icon
                    return <div className={`p-2 rounded-lg ${statusConfig[selectedFlowStage as keyof typeof statusConfig].color}`}><Icon className="h-5 w-5" /></div>
                  })()}
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Vagas em: {statusConfig[selectedFlowStage as keyof typeof statusConfig].label}
                  </h3>
                  <Badge variant="outline" className="ml-auto">
                    {getApplicationsByStatus(selectedFlowStage as JobApplication['status']).length} vagas
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {getApplicationsByStatus(selectedFlowStage as JobApplication['status']).map(application => (
                    <ApplicationCard 
                      key={application.id} 
                      application={application}
                      onStatusChange={updateApplicationStatus}
                      onAddReminder={handleAddReminder}
                      onToggleReminder={toggleReminderCompletion}
                      onDelete={deleteApplication}
                      onEdit={(app) => {
                        setEditingApplication(app)
                        setFormData({
                          company: app.company,
                          position: app.position,
                          description: app.description || '',
                          salary: app.salary || '',
                          location: app.location || '',
                          contactPerson: app.contactPerson || '',
                          contactEmail: app.contactEmail || '',
                          contactPhone: app.contactPhone || '',
                          website: app.website || '',
                          notes: app.notes || '',
                          tags: app.tags.join(', ')
                        })
                        setIsAddModalOpen(true)
                      }}
                    />
                  ))}
                  {getApplicationsByStatus(selectedFlowStage as JobApplication['status']).length === 0 && (
                    <p className="text-gray-500 py-8 text-center col-span-full border-2 border-dashed rounded-xl">
                      Nenhuma candidatura nesta fase ainda.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex overflow-x-auto gap-6 pb-4 snap-x">
            {Object.entries(statusConfig).map(([status, config]) => {
              const StatusIcon = config.icon
              const statusApplications = getApplicationsByStatus(status as JobApplication['status'])
              
              return (
                <div 
                  key={status} 
                  className="space-y-4 min-w-[320px] snap-center bg-gray-50/50 dark:bg-gray-900/50 p-4 rounded-xl border-2 border-transparent transition-colors data-[drop=true]:border-primary/30"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, status as JobApplication['status'])}
                >
                  <div className="flex items-center gap-2">
                    <StatusIcon className="h-5 w-5" />
                    <h3 className="font-semibold">{config.label}</h3>
                    <Badge variant="secondary" className="ml-auto">
                      {statusApplications.length}
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    {statusApplications.map(application => (
                      <ApplicationCard 
                        key={application.id} 
                        application={application}
                        onStatusChange={updateApplicationStatus}
                        onAddReminder={handleAddReminder}
                        onToggleReminder={toggleReminderCompletion}
                        onDelete={deleteApplication}
                        onEdit={(app) => {
                          setEditingApplication(app)
                          setFormData({
                            company: app.company,
                            position: app.position,
                            description: app.description || '',
                            salary: app.salary || '',
                            location: app.location || '',
                            contactPerson: app.contactPerson || '',
                            contactEmail: app.contactEmail || '',
                            contactPhone: app.contactPhone || '',
                            website: app.website || '',
                            notes: app.notes || '',
                            tags: app.tags.join(', ')
                          })
                          setIsAddModalOpen(true)
                        }}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add Reminder Modal */}
      <AddReminderModal
        isOpen={isAddReminderModalOpen}
        onClose={() => {
          setIsAddReminderModalOpen(false)
          setSelectedApplicationId(null)
        }}
        onAddReminder={(reminder) => {
          if (selectedApplicationId) {
            addReminderToApplication(selectedApplicationId, reminder)
          }
        }}
      />
    </div>
  )
}