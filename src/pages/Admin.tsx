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
  Mail, 
  Download,
  Eye,
  MessageSquare,
  Calendar,
  Star,
  Search,
  Plus,
  Minus,
  Building2,
  AlertTriangle,
  LayoutDashboard,
  ShieldCheck,
  CreditCard
} from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'sonner'
import { apiClient } from '@/lib/apiClient'
import ModeracaoAgencias from './admin/ModeracaoAgencias'

type AdminTab = 'overview' | 'users' | 'submissions' | 'transactions' | 'moderation' | 'settings'

export default function AdminPage() {
  const { profile, isLoading: authLoading } = useAuth()
  const navigate = useNavigate()
  
  const [activeTab, setActiveTab] = useState<AdminTab>('overview')
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

  const [usersList, setUsersList] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loadingUsers, setLoadingUsers] = useState(true)

  const [recentTransactions, setRecentTransactions] = useState<any[]>([])
  const [loadingTransactions, setLoadingTransactions] = useState(true)

  // User filter & sort states
  const [userRoleFilter, setUserRoleFilter] = useState('all')
  const [userSortBy, setUserSortBy] = useState('date_desc')

  // Transaction filter, search & sort states
  const [txSearchTerm, setTxSearchTerm] = useState('')
  const [txTypeFilter, setTxTypeFilter] = useState('all')
  const [txSortBy, setTxSortBy] = useState('date_desc')

  // Modal state for adjust credits dialog
  const [isAdjustCreditsOpen, setIsAdjustCreditsOpen] = useState(false)
  const [selectedUserForCredits, setSelectedUserForCredits] = useState<any | null>(null)
  const [creditsAdjustmentAmount, setCreditsAdjustmentAmount] = useState('0')

  useEffect(() => {
    if (authLoading) return

    if (!profile || (profile.role !== 'admin' && profile.role !== 'moderator')) {
      toast.error('Acesso negado. Apenas administradores ou moderadores podem acessar esta página.')
      navigate('/')
      return
    }

    loadStats()
    loadSubmissions()
    if (profile.role === 'admin') {
      loadUsers()
      loadTransactions()
    }
  }, [authLoading, profile, navigate])

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

  const loadTransactions = async () => {
    setLoadingTransactions(true)
    try {
      const data = await apiClient.get<any[]>('/api/admin/transactions')
      setRecentTransactions(data || [])
    } catch (e) {
      console.error('Erro ao carregar transações:', e)
    } finally {
      setLoadingTransactions(false)
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

  const sortedAndFilteredUsers = useMemo(() => {
    let result = usersList.filter(user => {
      const term = searchTerm.toLowerCase()
      const matchesSearch = (
        (user.full_name || '').toLowerCase().includes(term) ||
        (user.email || '').toLowerCase().includes(term) ||
        (user.course || '').toLowerCase().includes(term) ||
        (user.university || '').toLowerCase().includes(term)
      )
      
      const matchesRole = userRoleFilter === 'all' || user.role === userRoleFilter
      return matchesSearch && matchesRole
    })

    result.sort((a, b) => {
      if (userSortBy === 'name_asc') {
        return (a.full_name || '').localeCompare(b.full_name || '')
      }
      if (userSortBy === 'name_desc') {
        return (b.full_name || '').localeCompare(a.full_name || '')
      }
      if (userSortBy === 'credits_desc') {
        return b.credits - a.credits
      }
      if (userSortBy === 'credits_asc') {
        return a.credits - b.credits
      }
      if (userSortBy === 'date_desc') {
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      }
      if (userSortBy === 'date_asc') {
        return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
      }
      return 0
    })

    return result
  }, [usersList, searchTerm, userRoleFilter, userSortBy])

  const filteredTransactions = useMemo(() => {
    let result = [...recentTransactions]

    // Search term filter
    if (txSearchTerm) {
      const term = txSearchTerm.toLowerCase()
      result = result.filter(tx => {
        const userName = (tx.user_profiles?.full_name || '').toLowerCase()
        const userEmail = (tx.user_profiles?.email || '').toLowerCase()
        const txType = (tx.type || '').toLowerCase()
        const txId = (tx.user_id || '').toLowerCase()
        return userName.includes(term) || userEmail.includes(term) || txType.includes(term) || txId.includes(term)
      })
    }

    // Type filter
    if (txTypeFilter !== 'all') {
      result = result.filter(tx => tx.type === txTypeFilter)
    }

    // Sort
    result.sort((a, b) => {
      if (txSortBy === 'date_desc') {
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      }
      if (txSortBy === 'date_asc') {
        return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
      }
      if (txSortBy === 'amount_desc') {
        return b.amount - a.amount
      }
      if (txSortBy === 'amount_asc') {
        return a.amount - b.amount
      }
      return 0
    })

    return result
  }, [recentTransactions, txSearchTerm, txTypeFilter, txSortBy])

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
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="bg-white dark:bg-gray-800 border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200 hover:bg-yellow-100 dark:hover:bg-yellow-900"
                  onClick={() => setActiveTab('moderation')}
                >
                  Ir para Moderação
                </Button>
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
          </div>
        )
      case 'users':
        return (
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle>Gerenciamento de Usuários</CardTitle>
                  <CardDescription>Visualize, altere cargos e gerencie créditos</CardDescription>
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
                    <option value="credits_asc">Créditos (Menor)</option>
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
                    <thead className="text-xs uppercase bg-muted text-muted-foreground">
                      <tr>
                        <th className="px-6 py-3">Usuário</th>
                        <th className="px-6 py-3">Cargo</th>
                        <th className="px-6 py-3">Créditos</th>
                        <th className="px-6 py-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {sortedAndFilteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-muted/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-semibold">{user.full_name || 'Sem nome'}</div>
                            <div className="text-xs text-muted-foreground">{user.email}</div>
                            {user.created_at && (
                              <div className="text-[10px] text-muted-foreground/60 mt-0.5">
                                Cadastrado em: {new Date(user.created_at).toLocaleDateString('pt-BR')}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <select
                              value={user.role || 'student'}
                              onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                              className="bg-transparent text-sm border rounded p-1"
                            >
                              <option value="student">Estudante</option>
                              <option value="agency">Agência</option>
                              <option value="moderator">Moderador</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleUpdateCredits(user.id, -1)}><Minus className="h-3 w-3" /></Button>
                              <span className="font-semibold text-xs min-w-[20px] text-center">{user.credits}</span>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleUpdateCredits(user.id, 1)}><Plus className="h-3 w-3" /></Button>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Button
                              variant="outline" size="xs" className="text-xs py-1 px-2 h-7"
                              onClick={() => {
                                setSelectedUserForCredits(user)
                                setCreditsAdjustmentAmount('0')
                                setIsAdjustCreditsOpen(true)
                              }}
                            >
                              Ajustar
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
              <CardTitle>Análises Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingSubmissions ? (
                <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
              ) : (
                <div className="space-y-4">
                  {recentSubmissions.map((sub) => (
                    <div key={sub.id} className="flex flex-col sm:flex-row justify-between p-4 border rounded-xl hover:bg-muted/30">
                      <div>
                        <p className="font-semibold">{sub.name}</p>
                        <p className="text-xs text-muted-foreground">{sub.email}</p>
                      </div>
                      <Badge variant={sub.status === 'completed' ? 'default' : 'secondary'}>
                        {sub.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )
      case 'transactions':
        return (
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle>Histórico de Créditos</CardTitle>
                  <CardDescription>Consulte o extrato detalhado de consumo e adição de créditos</CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative w-full sm:w-60">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por usuário, email..."
                      value={txSearchTerm}
                      onChange={(e) => setTxSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <select
                    value={txTypeFilter}
                    onChange={(e) => setTxTypeFilter(e.target.value)}
                    className="bg-background text-sm border rounded-lg p-2 focus:ring-2 focus:ring-primary"
                  >
                    <option value="all">Todos os Tipos</option>
                    <option value="add_credits">Adição (+)</option>
                    <option value="consume_credits">Consumo (-)</option>
                  </select>
                  <select
                    value={txSortBy}
                    onChange={(e) => setTxSortBy(e.target.value)}
                    className="bg-background text-sm border rounded-lg p-2 focus:ring-2 focus:ring-primary"
                  >
                    <option value="date_desc">Mais Recentes</option>
                    <option value="date_asc">Mais Antigos</option>
                    <option value="amount_desc">Maior Valor</option>
                    <option value="amount_asc">Menor Valor</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingTransactions ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">Nenhuma transação encontrada.</div>
              ) : (
                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-muted text-muted-foreground">
                      <tr>
                        <th className="px-6 py-3">Usuário</th>
                        <th className="px-6 py-3">Data</th>
                        <th className="px-6 py-3">Tipo</th>
                        <th className="px-6 py-3">Qtde</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredTransactions.map((tx) => {
                        const userName = tx.user_profiles?.full_name || 'Sem nome';
                        const userEmail = tx.user_profiles?.email || 'Sem email';
                        const txDate = tx.created_at 
                          ? new Date(tx.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
                          : 'Sem data';
                        const isConsume = tx.type === 'consume_credits';

                        return (
                          <tr key={tx.id} className="hover:bg-muted/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-semibold text-sm">{userName}</div>
                              <div className="text-xs text-muted-foreground">{userEmail}</div>
                              <div className="text-[10px] text-muted-foreground/60 font-mono mt-0.5">{tx.user_id}</div>
                            </td>
                            <td className="px-6 py-4 text-xs text-muted-foreground">
                              {txDate}
                            </td>
                            <td className="px-6 py-4">
                              <Badge variant={isConsume ? "secondary" : "default"}>
                                {isConsume ? 'Consumo' : 'Adição'}
                              </Badge>
                              <div className="text-[10px] text-muted-foreground/60 mt-0.5 font-mono">{tx.type}</div>
                            </td>
                            <td className={`px-6 py-4 font-bold text-sm ${isConsume ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                              {isConsume ? '-' : '+'}{tx.amount}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )
      case 'moderation':
        return <ModeracaoAgencias />
      case 'settings':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-4">Logs de Sistema</h2>
            <Card>
              <CardHeader>
                <CardTitle>Logs de Sistema</CardTitle>
              </CardHeader>
              <CardContent>
                <Button variant="outline" asChild>
                  <Link to="/email-logs">
                    <Mail className="h-4 w-4 mr-2" />
                    Visualizar Logs de Email
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 md:min-h-[calc(100vh-3.5rem)] flex-shrink-0">
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
                icon={<CreditCard className="h-5 w-5" />} label="Créditos" 
                active={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')} 
              />
            )}
            <SidebarItem 
              icon={<ShieldCheck className="h-5 w-5" />} label="Moderação" 
              active={activeTab === 'moderation'} onClick={() => setActiveTab('moderation')} 
            />
            {profile?.role === 'admin' && (
              <SidebarItem 
                icon={<Settings className="h-5 w-5" />} label="Logs de Sistema" 
                active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} 
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
