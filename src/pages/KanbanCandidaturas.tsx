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
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
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
  List
} from 'lucide-react'
import { format, addDays, isAfter, isBefore, startOfDay, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'

import { ApplicationCard } from '@/components/kanban/ApplicationCard'
import { KanbanTable } from '@/components/kanban/KanbanTable'

const statusConfig = {
  interested: { label: 'Interessado/Network', color: 'bg-gray-100 text-gray-800', icon: Eye },
  applied: { label: 'Candidato', color: 'bg-blue-100 text-blue-800', icon: FileText },
  test: { label: 'Teste', color: 'bg-purple-100 text-purple-800', icon: Target },
  group_dynamics: { label: 'Dinâmica em Grupo', color: 'bg-indigo-100 text-indigo-800', icon: Users },
  interview: { label: 'Entrevista', color: 'bg-yellow-100 text-yellow-800', icon: Users },
  cultural_fit: { label: 'Fit Cultural', color: 'bg-orange-100 text-orange-800', icon: Star },
  resource: { label: 'Recurso', color: 'bg-cyan-100 text-cyan-800', icon: AlertCircle },
  offer: { label: 'Proposta', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  hired: { label: 'Contratado', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle },
  rejected: { label: 'Reprovado/Feedback', color: 'bg-red-100 text-red-800', icon: AlertCircle }
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
  const [filterPosition, setFilterPosition] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('appliedDateDesc')
  const [reminderFilter, setReminderFilter] = useState<'today' | 'all_pending' | 'completed'>('today')
  const [searchTerm, setSearchTerm] = useState('')
  const [showReminders, setShowReminders] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  // States to toggle Views
  const [viewMode, setViewMode] = useState<'board' | 'table'>('table')

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

  // Drag and Drop End handler
  const onDragEnd = async (result: any) => {
    const { destination, source, draggableId } = result
    if (!destination) return

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return
    }

    const newStatus = destination.droppableId as JobApplication['status']
    const oldApplications = [...applications]

    // Optimistic UI update
    setApplications(prev => prev.map(app => 
      app.id === draggableId ? { ...app, status: newStatus } : app
    ))

    try {
      const updated = await apiClient.put<JobApplication>(`/api/kanban/${draggableId}`, { 
        status: newStatus
      })
      setApplications(prev => prev.map(app => 
        app.id === draggableId ? { ...app, status: updated.status, progress: updated.progress } : app
      ))
      toast.success(`Status atualizado para ${statusConfig[newStatus].label}`)
    } catch (err) {
      console.error('Erro ao atualizar status:', err)
      toast.error('Não foi possível atualizar o status.')
      setApplications(oldApplications)
    }
  }

  const uniquePositions = Array.from(new Set(applications.map(app => app.position)))
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b))

  const filteredApplications = applications.filter(app => {
    const matchesStatus = filterStatus === 'all' || app.status === filterStatus
    const matchesPosition = filterPosition === 'all' || app.position === filterPosition
    const matchesSearch = app.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.position.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesPosition && matchesSearch
  })

  const getNextReminderDate = (app: JobApplication) => {
    const activeReminders = app.reminders?.filter(r => !r.completed) || []
    if (activeReminders.length === 0) return Infinity
    const nextReminder = activeReminders.reduce((earliest, current) => {
      return new Date(current.date) < new Date(earliest.date) ? current : earliest
    }, activeReminders[0])
    return new Date(nextReminder.date).getTime()
  }

  const sortedApplications = [...filteredApplications].sort((a, b) => {
    if (sortBy === 'appliedDateDesc') {
      return new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime()
    }
    if (sortBy === 'appliedDateAsc') {
      return new Date(a.appliedDate).getTime() - new Date(b.appliedDate).getTime()
    }
    if (sortBy === 'progressDesc') {
      return b.progress - a.progress
    }
    if (sortBy === 'progressAsc') {
      return a.progress - b.progress
    }
    if (sortBy === 'nextReminder') {
      return getNextReminderDate(a) - getNextReminderDate(b)
    }
    return 0
  })

  const getApplicationsByStatus = (status: JobApplication['status']) => {
    return sortedApplications.filter(app => app.status === status)
  }

  const allRemindersMapped = applications.flatMap(app => 
    (app.reminders || []).map(r => ({
      ...r,
      applicationId: app.id,
      company: app.company,
      position: app.position
    }))
  )

  const activeTodayCount = allRemindersMapped.filter(r => 
    !r.completed && (isSameDay(new Date(r.date), new Date()) || isBefore(new Date(r.date), new Date()))
  ).length

  const filteredReminders = allRemindersMapped.filter(reminder => {
    const rDate = new Date(reminder.date)
    const today = new Date()
    
    if (reminderFilter === 'today') {
      return !reminder.completed && (isSameDay(rDate, today) || isBefore(rDate, today))
    }
    if (reminderFilter === 'all_pending') {
      return !reminder.completed
    }
    if (reminderFilter === 'completed') {
      return reminder.completed
    }
    return true
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                Jornada de Candidaturas
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
                Lembretes ({activeTodayCount})
              </Button>
              <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                <Button 
                  variant={viewMode === 'table' ? 'default' : 'ghost'} 
                  size="sm" 
                  onClick={() => setViewMode('table')}
                  className="text-xs"
                >
                  <List className="h-4 w-4 mr-2" /> Tabela
                </Button>
                <Button 
                  variant={viewMode === 'board' ? 'default' : 'ghost'} 
                  size="sm" 
                  onClick={() => setViewMode('board')}
                  className="text-xs"
                >
                  <Kanban className="h-4 w-4 mr-2" /> Quadro
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
        <div className="mb-6 flex flex-col lg:flex-row gap-4">
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
          <div className="flex flex-wrap gap-2 lg:gap-4">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-48">
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

            <Select value={filterPosition} onValueChange={setFilterPosition}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrar por Vaga/Cargo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as vagas</SelectItem>
                {uniquePositions.map(pos => (
                  <SelectItem key={pos} value={pos}>
                    {pos}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="appliedDateDesc">Mais Recentes</SelectItem>
                <SelectItem value="appliedDateAsc">Mais Antigas</SelectItem>
                <SelectItem value="progressDesc">Progresso (Maior)</SelectItem>
                <SelectItem value="progressAsc">Progresso (Menor)</SelectItem>
                <SelectItem value="nextReminder">Próximo Lembrete</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Statistics */}
        <KanbanStats applications={applications} />

        {/* Reminders Panel */}
        {showReminders && (
          <Card className="mb-6 border-amber-500/20 shadow-sm animate-in fade-in slide-in-from-top-4 duration-200">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                  <Bell className="h-5 w-5 text-amber-500" />
                  Painel de Lembretes
                </CardTitle>
                <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg self-start sm:self-auto">
                  <Button 
                    variant={reminderFilter === 'today' ? 'default' : 'ghost'} 
                    size="sm" 
                    onClick={() => setReminderFilter('today')}
                    className="text-xs"
                  >
                    Hoje
                  </Button>
                  <Button 
                    variant={reminderFilter === 'all_pending' ? 'default' : 'ghost'} 
                    size="sm" 
                    onClick={() => setReminderFilter('all_pending')}
                    className="text-xs"
                  >
                    Pendentes
                  </Button>
                  <Button 
                    variant={reminderFilter === 'completed' ? 'default' : 'ghost'} 
                    size="sm" 
                    onClick={() => setReminderFilter('completed')}
                    className="text-xs"
                  >
                    Concluídos
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredReminders.length === 0 ? (
                <p className="text-gray-500 text-sm py-4 text-center">Nenhum lembrete nesta categoria.</p>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                  {filteredReminders.map(reminder => (
                    <div 
                      key={reminder.id} 
                      className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border gap-3 ${
                        reminder.completed 
                          ? 'bg-gray-50/50 dark:bg-gray-900/50 opacity-60 border-gray-100 dark:border-gray-800' 
                          : 'bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 hover:border-amber-500/30'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`font-semibold text-sm ${reminder.completed ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                            {reminder.title}
                          </p>
                          <Badge variant="outline" className="text-[10px]">
                            {reminder.type === 'call' ? 'Ligação' :
                             reminder.type === 'email' ? 'E-mail' :
                             reminder.type === 'test' ? 'Teste' :
                             reminder.type === 'interview' ? 'Entrevista' :
                             reminder.type === 'follow-up' ? 'Acompanhamento' :
                             reminder.type === 'deadline' ? 'Prazo' : reminder.type}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            • {reminder.position} na {reminder.company}
                          </span>
                        </div>
                        {reminder.description && (
                          <p className="text-xs text-gray-600 dark:text-gray-400">{reminder.description}</p>
                        )}
                        <p className="text-[10px] text-gray-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(reminder.date), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                      <Button 
                        size="sm" 
                        variant={reminder.completed ? 'secondary' : 'outline'}
                        onClick={() => toggleReminderCompletion(reminder.applicationId, reminder.id)}
                        className="self-end sm:self-auto text-xs shrink-0"
                      >
                        {reminder.completed ? 'Reabrir' : 'Concluir'}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Kanban Board or Table */}
        {viewMode === 'table' ? (
          <KanbanTable
            applications={sortedApplications}
            onStatusChange={updateApplicationStatus}
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
            onAddReminder={handleAddReminder}
            onToggleReminder={toggleReminderCompletion}
            statusConfig={statusConfig}
          />
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex overflow-x-auto gap-6 pb-4 snap-x">
              {Object.entries(statusConfig).map(([status, config]) => {
                const StatusIcon = config.icon
                const statusApplications = getApplicationsByStatus(status as JobApplication['status'])
                
                return (
                  <div 
                    key={status} 
                    className="flex flex-col min-w-[320px] max-w-[320px] snap-center bg-gray-50/50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-150 dark:border-gray-800"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <StatusIcon className="h-4 w-4" />
                      <h3 className="font-semibold text-sm truncate">{config.label}</h3>
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {statusApplications.length}
                      </Badge>
                    </div>
                    
                    <Droppable droppableId={status}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`flex-1 min-h-[450px] space-y-3 transition-colors rounded-lg p-1 ${
                            snapshot.isDraggingOver ? 'bg-amber-500/5 dark:bg-amber-500/10 border border-dashed border-amber-500/30' : ''
                          }`}
                        >
                          {statusApplications.map((application, index) => (
                            <Draggable 
                              key={application.id} 
                              draggableId={application.id} 
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <ApplicationCard 
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
                                  provided={provided}
                                />
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                )
              })}
            </div>
          </DragDropContext>
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