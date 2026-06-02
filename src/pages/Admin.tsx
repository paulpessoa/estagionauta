import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { 
  Users, 
  FileText, 
  Settings, 
  Search,
  Plus,
  Minus,
  AlertTriangle,
  LayoutDashboard,
  MessageSquare,
  Star,
  Trash2,
  Download
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { apiClient } from '@/lib/apiClient'
import ModeracaoAgencias from './admin/ModeracaoAgencias'
import EmailLogs from './EmailLogs'
import ImportadorUsuarios from './admin/ImportadorUsuarios'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export default function AdminPage() {
  const { profile, isLoading: authLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const pathname = location.pathname
  
  let activeTab = 'overview'
  if (pathname === '/admin/usuarios') activeTab = 'users'
  else if (pathname === '/admin/history') activeTab = 'submissions'
  else if (pathname === '/admin/logs') activeTab = 'settings'
  else if (pathname === '/admin/importador') activeTab = 'importer'

  const setActiveTab = (tab: string) => {
    if (tab === 'overview') navigate('/admin')
    else if (tab === 'users') navigate('/admin/usuarios')
    else if (tab === 'submissions') navigate('/admin/history')
    else if (tab === 'settings') navigate('/admin/logs')
    else if (tab === 'importer') navigate('/admin/importador')
  }

  const [stats, setStats] = useState({
    totalUsers: 0,
    resumesAnalyzed: 0,
    simulationsRun: 0,
    totalReviews: 0,
    pendingAgencies: 0,
    pendingReviews: 0
  })
  const [loadingStats, setLoadingStats] = useState(true)

  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([])
  const [loadingSubmissions, setLoadingSubmissions] = useState(true)
  const [submissionSearchTerm, setSubmissionSearchTerm] = useState('')

  const [usersList, setUsersList] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loadingUsers, setLoadingUsers] = useState(true)

  // User filter & sort states
  const [userRoleFilter, setUserRoleFilter] = useState('all')
  const [userSortBy, setUserSortBy] = useState('date_desc')

  // Modal state for adjust credits dialog
  const [isAdjustCreditsOpen, setIsAdjustCreditsOpen] = useState(false)
  const [selectedUserForCredits, setSelectedUserForCredits] = useState<any | null>(null)
  const [creditsAdjustmentAmount, setCreditsAdjustmentAmount] = useState('0')

  // Modal state for delete user dialog
  const [isDeleteUserOpen, setIsDeleteUserOpen] = useState(false)
  const [selectedUserForDelete, setSelectedUserForDelete] = useState<any | null>(null)
  const [isDeletingUser, setIsDeletingUser] = useState(false)

  useEffect(() => {
    if (authLoading) return

    if (!profile || (profile.role !== 'admin' && profile.role !== 'moderator')) {
      toast.error('Acesso negado. Apenas administradores ou moderadores podem acessar esta página.')
      navigate('/')
      return
    }

    if (activeTab === 'overview') {
      loadStats()
    } else if (activeTab === 'users' && profile.role === 'admin') {
      loadUsers()
    } else if (activeTab === 'submissions') {
      loadSubmissions()
    }
  }, [authLoading, profile, navigate, activeTab])

  const loadStats = async () => {
    setLoadingStats(true)
    try {
      const data = await apiClient.get<any>('/api/admin/stats')
      setStats(data)
    } catch (e) {
      console.error(e)
      toast.error('Erro ao carregar estatísticas')
    } finally {
      setLoadingStats(false)
    }
  }

  const loadSubmissions = async () => {
    setLoadingSubmissions(true)
    try {
      const data = await apiClient.get<any[]>('/api/admin/submissions')
      setRecentSubmissions(data || [])
    } catch (e) {
      console.error('Erro ao carregar submissões:', e)
    } finally {
      setLoadingSubmissions(false)
    }
  }

  const loadUsers = async () => {
    setLoadingUsers(true)
    try {
      const data = await apiClient.get<any[]>('/api/admin/users')
      setUsersList(data || [])
    } catch (e) {
      console.error('Erro ao carregar usuários:', e)
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      await apiClient.put(`/api/admin/users/${userId}/role`, { role: newRole })
      toast.success('Cargo atualizado')
      setUsersList(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
    } catch (e: any) {
      console.error('Erro ao atualizar cargo:', e)
      toast.error(e.message || 'Erro ao atualizar cargo')
    }
  }

  const handleUpdateCredits = async (userId: string, amount: number) => {
    try {
      const user = usersList.find(u => u.id === userId)
      if (!user) return
      
      const newCredits = Math.max(0, user.credits + amount)
      
      await apiClient.put(`/api/admin/users/${userId}/credits`, { amount })
      toast.success(`Créditos atualizados para ${newCredits}`)
      setUsersList(prev => prev.map(u => u.id === userId ? { ...u, credits: newCredits } : u))
      loadStats()
    } catch (e: any) {
      console.error('Erro ao atualizar créditos:', e)
      toast.error(e.message || 'Erro ao atualizar créditos')
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUserForDelete) return
    setIsDeletingUser(true)
    try {
      await apiClient.delete(`/api/admin/users/${selectedUserForDelete.id}`)
      toast.success('Usuário excluído com sucesso')
      setUsersList(prev => prev.filter(u => u.id !== selectedUserForDelete.id))
      setIsDeleteUserOpen(false)
    } catch (e: any) {
      console.error('Erro ao excluir usuário:', e)
      toast.error(e.message || 'Erro ao excluir usuário')
    } finally {
      setIsDeletingUser(false)
      setSelectedUserForDelete(null)
    }
  }

  const sortedAndFilteredUsers = useMemo(() => {
    const result = usersList.filter(user => {
      const term = searchTerm.toLowerCase()
      const matchesSearch = (
        (user.full_name || '').toLowerCase().includes(term) ||
        (user.email || '').toLowerCase().includes(term)
      )
      
      const matchesRole = userRoleFilter === 'all' || user.role === userRoleFilter
      return matchesSearch && matchesRole
    })

    result.sort((a, b) => {
      if (userSortBy === 'name_asc') return (a.full_name || '').localeCompare(b.full_name || '')
      if (userSortBy === 'name_desc') return (b.full_name || '').localeCompare(a.full_name || '')
      if (userSortBy === 'credits_desc') return b.credits - a.credits
      if (userSortBy === 'credits_asc') return a.credits - b.credits
      if (userSortBy === 'ltv_desc') return (b.total_paid || 0) - (a.total_paid || 0)
      if (userSortBy === 'date_desc') return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      if (userSortBy === 'date_asc') return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
      return 0
    })

    return result
  }, [usersList, searchTerm, userRoleFilter, userSortBy])

  const filteredSubmissions = useMemo(() => {
    if (!submissionSearchTerm) return recentSubmissions
    const term = submissionSearchTerm.toLowerCase()
    return recentSubmissions.filter(sub => 
      (sub.name || '').toLowerCase().includes(term) ||
      (sub.email || '').toLowerCase().includes(term) ||
      (sub.course || '').toLowerCase().includes(term) ||
      (sub.university || '').toLowerCase().includes(term)
    )
  }, [recentSubmissions, submissionSearchTerm])

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-4">Visão Geral</h2>
            
            {(stats.pendingAgencies > 0 || stats.pendingReviews > 0) && (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-950/40 border border-yellow-200 dark:border-yellow-900/60 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-yellow-800 dark:text-yellow-200">
                      Itens pendentes de moderação
                    </p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      Existem {stats.pendingAgencies} agências e {stats.pendingReviews} avaliações aguardando revisão.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="flex items-center space-x-4 p-6">
                  <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{loadingStats ? '...' : stats.totalUsers}</p>
                    <p className="text-sm text-muted-foreground">Usuários</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex items-center space-x-4 p-6">
                  <div className="h-12 w-12 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center">
                    <FileText className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{loadingStats ? '...' : stats.resumesAnalyzed}</p>
                    <p className="text-sm text-muted-foreground">Currículos</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex items-center space-x-4 p-6">
                  <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center">
                    <MessageSquare className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{loadingStats ? '...' : stats.simulationsRun}</p>
                    <p className="text-sm text-muted-foreground">Simulações</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex items-center space-x-4 p-6">
                  <div className="h-12 w-12 bg-amber-100 dark:bg-amber-900/50 rounded-lg flex items-center justify-center">
                    <Star className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{loadingStats ? '...' : stats.totalReviews}</p>
                    <p className="text-sm text-muted-foreground">Avaliações</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="mt-8">
              <h3 className="text-xl font-bold mb-4">Moderação</h3>
              <ModeracaoAgencias />
            </div>
          </div>
        )
      case 'users':
        return (
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle>Gerenciamento de Usuários</CardTitle>
                  <CardDescription>Visualize, altere cargos, créditos e acompanhe métricas de LTV</CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative w-full sm:w-60">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar nome, email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <select
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                    className="bg-background text-sm border rounded-lg p-2 focus:ring-2 focus:ring-primary"
                  >
                    <option value="all">Todos os Cargos</option>
                    <option value="student">Estudantes</option>
                    <option value="agency">Agências</option>
                    <option value="moderator">Moderadores</option>
                    <option value="admin">Administradores</option>
                  </select>
                  <select
                    value={userSortBy}
                    onChange={(e) => setUserSortBy(e.target.value)}
                    className="bg-background text-sm border rounded-lg p-2 focus:ring-2 focus:ring-primary"
                  >
                    <option value="date_desc">Mais Recentes</option>
                    <option value="date_asc">Mais Antigos</option>
                    <option value="name_asc">Nome (A-Z)</option>
                    <option value="name_desc">Nome (Z-A)</option>
                    <option value="credits_desc">Créditos (Maior)</option>
                    <option value="ltv_desc">LTV (Maior)</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingUsers ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : sortedAndFilteredUsers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">Nenhum usuário encontrado.</div>
              ) : (
                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-muted text-muted-foreground whitespace-nowrap">
                      <tr>
                        <th className="px-4 py-3">Usuário</th>
                        <th className="px-4 py-3">Cargo</th>
                        <th className="px-4 py-3">Créditos</th>
                        <th className="px-4 py-3">LTV / Refs</th>
                        <th className="px-4 py-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {sortedAndFilteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-muted/50 transition-colors">
                          <td className="px-4 py-3 min-w-[200px]">
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={user.avatar_url || ''} />
                                <AvatarFallback>{user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-semibold">{user.full_name || 'Sem nome'}</div>
                                <div className="text-xs text-muted-foreground">{user.email}</div>
                                {user.created_at && (
                                  <div className="text-[10px] text-muted-foreground/60 mt-0.5">
                                    Cadastrado em: {new Date(user.created_at).toLocaleDateString('pt-BR')}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={user.role || 'student'}
                              onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                              className="bg-transparent text-sm border rounded p-1 w-full max-w-[120px]"
                            >
                              <option value="student">Estudante</option>
                              <option value="agency">Agência</option>
                              <option value="moderator">Moderador</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-1">
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleUpdateCredits(user.id, -1)}><Minus className="h-3 w-3" /></Button>
                              <span className="font-semibold text-xs min-w-[20px] text-center">{user.credits}</span>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleUpdateCredits(user.id, 1)}><Plus className="h-3 w-3" /></Button>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-xs">
                              <div><span className="text-muted-foreground">LTV:</span> <span className="font-semibold text-emerald-600">R$ {user.total_paid || 0}</span></div>
                              <div><span className="text-muted-foreground">Indicações:</span> <span className="font-semibold">{user.referrals_count || 0}</span></div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                            <Button
                              variant="outline" size="sm" className="h-8"
                              onClick={() => {
                                setSelectedUserForCredits(user)
                                setCreditsAdjustmentAmount('0')
                                setIsAdjustCreditsOpen(true)
                              }}
                            >
                              Créditos
                            </Button>
                            <Button
                              variant="destructive" size="icon" className="h-8 w-8"
                              onClick={() => {
                                setSelectedUserForDelete(user)
                                setIsDeleteUserOpen(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )
      case 'submissions':
        return (
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle>Histórico de Análises</CardTitle>
                  <CardDescription>Todas as análises de currículos realizadas</CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative w-full sm:w-60">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome, curso, faculdade..."
                      value={submissionSearchTerm}
                      onChange={(e) => setSubmissionSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingSubmissions ? (
                <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
              ) : filteredSubmissions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">Nenhuma análise encontrada.</div>
              ) : (
                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-muted text-muted-foreground">
                      <tr>
                        <th className="px-6 py-3">Candidato</th>
                        <th className="px-6 py-3">Curso / Instituição</th>
                        <th className="px-6 py-3">Data</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredSubmissions.map((sub) => (
                        <tr key={sub.id} className="hover:bg-muted/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-semibold">{sub.name || 'Sem nome'}</div>
                            <div className="text-xs text-muted-foreground">{sub.email || 'Sem email'}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm truncate max-w-[200px]" title={sub.course}>{sub.course || '-'}</div>
                            <div className="text-xs text-muted-foreground truncate max-w-[200px]" title={sub.university}>{sub.university || '-'}</div>
                          </td>
                          <td className="px-6 py-4 text-xs text-muted-foreground">
                            {sub.created_at ? new Date(sub.created_at).toLocaleDateString('pt-BR') : '-'}
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant={sub.status === 'completed' ? 'default' : 'secondary'}>
                              {sub.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-right">
                             {sub.status === 'completed' && (
                               <Button variant="outline" size="sm" onClick={() => navigate(`/analise/${sub.id}`)}>
                                 Ver Detalhes
                               </Button>
                             )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )
      case 'settings':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Logs de Sistema</h2>
            </div>
            {/* Componente que já existia independentemente, agora integrado no tab */}
            <div className="border rounded-xl bg-card overflow-hidden">
              <EmailLogs />
            </div>
          </div>
        )
      case 'importer':
        return (
          <div className="space-y-6">
            <ImportadorUsuarios />
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col md:flex-row pt-16">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 md:min-h-[calc(100vh-4rem)] flex-shrink-0">
        <div className="p-4 md:p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Admin Dashboard</h2>
          <nav className="space-y-1">
            <SidebarItem 
              icon={<LayoutDashboard className="h-5 w-5" />} label="Visão Geral" 
              active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} 
            />
            {profile?.role === 'admin' && (
              <SidebarItem 
                icon={<Users className="h-5 w-5" />} label="Usuários" 
                active={activeTab === 'users'} onClick={() => setActiveTab('users')} 
              />
            )}
            <SidebarItem 
              icon={<FileText className="h-5 w-5" />} label="Histórico de Análises" 
              active={activeTab === 'submissions'} onClick={() => setActiveTab('submissions')} 
            />
            {profile?.role === 'admin' && (
              <SidebarItem 
                icon={<Settings className="h-5 w-5" />} label="Logs de Sistema" 
                active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} 
              />
            )}
            {profile?.role === 'admin' && (
              <SidebarItem 
                icon={<Download className="h-5 w-5" />} label="Importador" 
                active={activeTab === 'importer'} onClick={() => setActiveTab('importer')} 
              />
            )}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {renderContent()}
        </div>
      </main>

      {/* Modal para ajuste de créditos */}
      <Dialog open={isAdjustCreditsOpen} onOpenChange={setIsAdjustCreditsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ajustar Créditos</DialogTitle>
            <DialogDescription>
              Adicione ou remova créditos para o usuário: <span className="font-semibold">{selectedUserForCredits?.full_name || selectedUserForCredits?.email}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex justify-between items-center bg-muted/50 p-3 rounded-lg text-sm font-medium">
              <span>Saldo Atual:</span>
              <span className="font-bold">{selectedUserForCredits?.credits || 0} créditos</span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="credits-amount">Quantidade a ajustar (use números negativos para remover)</Label>
              <Input
                id="credits-amount"
                type="number"
                placeholder="Ex: 10 ou -5"
                value={creditsAdjustmentAmount}
                onChange={(e) => setCreditsAdjustmentAmount(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAdjustCreditsOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                const amount = parseInt(creditsAdjustmentAmount)
                if (isNaN(amount) || amount === 0) {
                  toast.error('Por favor, insira um valor válido e diferente de zero.')
                  return
                }
                if (selectedUserForCredits) {
                  handleUpdateCredits(selectedUserForCredits.id, amount)
                  setIsAdjustCreditsOpen(false)
                }
              }}
            >
              Confirmar Ajuste
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para exclusão de usuário */}
      <Dialog open={isDeleteUserOpen} onOpenChange={setIsDeleteUserOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Excluir Usuário</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o usuário <span className="font-semibold">{selectedUserForDelete?.full_name || selectedUserForDelete?.email}</span>? 
              <br/><br/>Esta ação é <strong>irreversível</strong>. Todos os dados associados serão perdidos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteUserOpen(false)} disabled={isDeletingUser}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser} disabled={isDeletingUser}>
              {isDeletingUser ? 'Excluindo...' : 'Sim, excluir usuário'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SidebarItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        active 
          ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' 
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}
