import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { 
  Users, 
  FileText, 
  TrendingUp, 
  Settings, 
  Mail, 
  Download,
  Eye,
  MessageSquare,
  Calendar,
  Star,
  Shield,
  Search,
  Plus,
  Minus,
  Check,
  Building2,
  AlertTriangle,
  ArrowUpDown
} from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'sonner'

export default function AdminPage() {
  const { profile, isLoading: authLoading } = useAuth()
  const navigate = useNavigate()
  
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

  useEffect(() => {
    if (authLoading) return

    if (!profile || profile.role !== 'admin') {
      toast.error('Acesso negado. Apenas administradores podem acessar esta página.')
      navigate('/')
      return
    }

    loadStats()
    loadSubmissions()
    loadUsers()
    loadTransactions()
  }, [authLoading, profile, navigate])

  const loadStats = async () => {
    setLoadingStats(true)
    try {
      // Total users
      const { count: usersCount, error: usersErr } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
      
      // Resumes analyzed
      const { count: resumesCount, error: resumesErr } = await supabase
        .from('curriculum_analysis')
        .select('*', { count: 'exact', head: true })

      // Simulations run
      const { count: simulationsCount, error: simulationsErr } = await supabase
        .from('interview_simulations')
        .select('*', { count: 'exact', head: true })

      // Total reviews
      const { count: reviewsCount, error: reviewsErr } = await supabase
        .from('agency_reviews')
        .select('*', { count: 'exact', head: true })

      // Pending agencies
      const { count: pendingAgenciesCount, error: pendingAgenciesErr } = await supabase
        .from('agencies')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      // Pending reviews
      const { count: pendingReviewsCount, error: pendingReviewsErr } = await supabase
        .from('agency_reviews')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      if (usersErr || resumesErr || simulationsErr || reviewsErr || pendingAgenciesErr || pendingReviewsErr) {
        throw new Error('Erro ao buscar alguns contadores')
      }

      setStats({
        totalUsers: usersCount || 0,
        resumesAnalyzed: resumesCount || 0,
        simulationsRun: simulationsCount || 0,
        totalReviews: reviewsCount || 0,
        pendingAgencies: pendingAgenciesCount || 0,
        pendingReviews: pendingReviewsCount || 0
      })
    } catch (e) {
      console.error(e)
      toast.error('Erro ao carregar estatísticas do painel')
    } finally {
      setLoadingStats(false)
    }
  }

  const loadSubmissions = async () => {
    setLoadingSubmissions(true)
    try {
      const { data, error } = await supabase
        .from('curriculum_analysis')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      setRecentSubmissions(data || [])
    } catch (e) {
      console.error('Erro ao carregar submissões:', e)
      toast.error('Erro ao carregar análises de currículo recentes')
    } finally {
      setLoadingSubmissions(false)
    }
  }

  const loadUsers = async () => {
    setLoadingUsers(true)
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setUsersList(data || [])
    } catch (e) {
      console.error('Erro ao carregar usuários:', e)
      toast.error('Erro ao carregar lista de usuários')
    } finally {
      setLoadingUsers(false)
    }
  }

  const loadTransactions = async () => {
    setLoadingTransactions(true)
    try {
      const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error
      setRecentTransactions(data || [])
    } catch (e) {
      console.error('Erro ao carregar transações:', e)
    } finally {
      setLoadingTransactions(false)
    }
  }

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ role: newRole })
        .eq('id', userId)

      if (error) throw error
      toast.success('Cargo atualizado com sucesso')
      setUsersList(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
    } catch (e) {
      console.error('Erro ao atualizar cargo:', e)
      toast.error('Erro ao atualizar cargo')
    }
  }

  const handleUpdateCredits = async (userId: string, amount: number) => {
    try {
      const user = usersList.find(u => u.id === userId)
      if (!user) return
      
      const newCredits = Math.max(0, user.credits + amount)
      
      const { error } = await supabase
        .from('user_profiles')
        .update({ credits: newCredits })
        .eq('id', userId)

      if (error) throw error
      toast.success(`Créditos atualizados para ${newCredits}`)
      setUsersList(prev => prev.map(u => u.id === userId ? { ...u, credits: newCredits } : u))
      loadStats() // Refresh header counts
    } catch (e) {
      console.error('Erro ao atualizar créditos:', e)
      toast.error('Erro ao atualizar créditos')
    }
  }

  const filteredUsers = usersList.filter(user => {
    const term = searchTerm.toLowerCase()
    return (
      (user.full_name || '').toLowerCase().includes(term) ||
      (user.email || '').toLowerCase().includes(term) ||
      (user.course || '').toLowerCase().includes(term) ||
      (user.university || '').toLowerCase().includes(term)
    )
  })

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive'
      case 'moderator':
        return 'default'
      case 'agency':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const getRoleName = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Admin'
      case 'moderator':
        return 'Moderador'
      case 'agency':
        return 'Agência'
      default:
        return 'Estudante'
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Painel Administrativo
          </h1>
          <p className="text-lg text-muted-foreground">
            Gerencie usuários, créditos, análises de currículo e configurações da plataforma
          </p>
        </div>

        {/* Warning Banner for Moderation */}
        {(stats.pendingAgencies > 0 || stats.pendingReviews > 0) && (
          <div className="mb-8 p-4 bg-yellow-50 dark:bg-yellow-950/40 border border-yellow-200 dark:border-yellow-900/60 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
            <Button asChild variant="outline" size="sm" className="bg-white dark:bg-gray-800 border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200 hover:bg-yellow-100 dark:hover:bg-yellow-900">
              <Link to="/admin/moderacao-agencias">
                Ir para Moderação
              </Link>
            </Button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="flex items-center space-x-4 p-6">
              <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{loadingStats ? '...' : stats.totalUsers}</p>
                <p className="text-sm text-muted-foreground">Usuários cadastrados</p>
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
                <p className="text-sm text-muted-foreground">Currículos analisados</p>
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
                <p className="text-sm text-muted-foreground">Simulações realizadas</p>
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
                <p className="text-sm text-muted-foreground">Avaliações enviadas</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-2xl">
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="submissions">Submissões</TabsTrigger>
            <TabsTrigger value="transactions">Histórico de Créditos</TabsTrigger>
            <TabsTrigger value="settings">Sistema</TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <CardTitle>Gerenciamento de Usuários</CardTitle>
                    <CardDescription>
                      Visualize, altere cargos e gerencie créditos de todos os usuários
                    </CardDescription>
                  </div>
                  <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome, email, curso..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loadingUsers ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    Nenhum usuário encontrado.
                  </div>
                ) : (
                  <div className="overflow-x-auto border rounded-lg">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs uppercase bg-muted text-muted-foreground">
                        <tr>
                          <th className="px-6 py-3">Nome / Email</th>
                          <th className="px-6 py-3">Curso / Faculdade</th>
                          <th className="px-6 py-3">Cargo</th>
                          <th className="px-6 py-3">Créditos</th>
                          <th className="px-6 py-3">Cadastro</th>
                          <th className="px-6 py-3 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {filteredUsers.map((user) => (
                          <tr key={user.id} className="hover:bg-muted/50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="font-semibold">{user.full_name || 'Sem nome'}</div>
                              <div className="text-xs text-muted-foreground">{user.email}</div>
                            </td>
                            <td className="px-6 py-4">
                              {user.course ? (
                                <div>
                                  <p className="font-medium text-xs">{user.course}</p>
                                  <p className="text-[10px] text-muted-foreground">{user.university || 'N/A'}</p>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">Não informado</span>
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
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => handleUpdateCredits(user.id, -1)}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="font-semibold text-xs min-w-[20px] text-center">
                                  {user.credits}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => handleUpdateCredits(user.id, 1)}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-xs whitespace-nowrap text-muted-foreground">
                              {new Date(user.created_at).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="px-6 py-4 text-right whitespace-nowrap">
                              <Button
                                variant="outline"
                                size="xs"
                                className="text-xs py-1 px-2 h-7"
                                onClick={() => {
                                  const add = prompt('Ajustar créditos deste usuário (ex: +5, -10):')
                                  if (add) {
                                    const val = parseInt(add)
                                    if (!isNaN(val)) {
                                      handleUpdateCredits(user.id, val)
                                    } else {
                                      toast.error('Valor inválido')
                                    }
                                  }
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
          </TabsContent>

          {/* Submissions Tab */}
          <TabsContent value="submissions">
            <Card>
              <CardHeader>
                <CardTitle>Análises de Currículo Recentes</CardTitle>
                <CardDescription>
                  Monitore as submissões de currículos e acesse os relatórios gerados
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingSubmissions ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : recentSubmissions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    Nenhuma submissão de currículo encontrada.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentSubmissions.map((submission) => (
                      <div key={submission.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-xl gap-4 hover:bg-muted/30 transition-colors">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <p className="font-semibold">{submission.name}</p>
                            <Badge variant={submission.status === 'completed' ? 'default' : submission.status === 'failed' ? 'destructive' : 'secondary'}>
                              {submission.status === 'completed' ? 'Concluído' : submission.status === 'failed' ? 'Falhou' : 'Processando'}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{submission.email}</p>
                          <p className="text-xs text-muted-foreground">
                            {submission.course || 'Curso não informado'} - {submission.university || 'Instituição não informada'}
                          </p>
                          <p className="text-[10px] text-muted-foreground flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(submission.created_at).toLocaleString('pt-BR')}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          {submission.status === 'completed' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => navigate(`/resultado-curriculo/${submission.id}`)}
                            >
                              <Eye className="h-4 w-4 mr-1.5" />
                              Ver Relatório
                            </Button>
                          )}
                          {submission.file_url && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={submission.file_url} target="_blank" rel="noopener noreferrer">
                                <Download className="h-4 w-4 mr-1.5" />
                                Download PDF
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Créditos</CardTitle>
                <CardDescription>
                  Veja as últimas transações de crédito e o consumo dos usuários
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingTransactions ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : recentTransactions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    Nenhuma transação de crédito encontrada.
                  </div>
                ) : (
                  <div className="overflow-x-auto border rounded-lg">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs uppercase bg-muted text-muted-foreground">
                        <tr>
                          <th className="px-6 py-3">Usuário</th>
                          <th className="px-6 py-3">Tipo</th>
                          <th className="px-6 py-3">Quantidade</th>
                          <th className="px-6 py-3">Descrição</th>
                          <th className="px-6 py-3">Data</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {recentTransactions.map((tx) => {
                          const userProfile = usersList.find(u => u.id === tx.user_id)
                          return (
                            <tr key={tx.id} className="hover:bg-muted/50 transition-colors">
                              <td className="px-6 py-4">
                                <div className="font-semibold text-xs">
                                  {userProfile?.full_name || 'Usuário do Sistema'}
                                </div>
                                <div className="text-[10px] text-muted-foreground">
                                  {userProfile?.email || tx.user_id}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <Badge variant={
                                  tx.type === 'purchase' ? 'default' : 
                                  tx.type === 'usage' ? 'outline' : 'secondary'
                                }>
                                  {tx.type === 'purchase' ? 'Compra' : 
                                   tx.type === 'usage' ? 'Uso' : 
                                   tx.type === 'bonus' ? 'Bônus' : 'Reembolso'}
                                </Badge>
                              </td>
                              <td className={`px-6 py-4 font-bold text-xs ${
                                tx.type === 'usage' ? 'text-red-500' : 'text-green-600'
                              }`}>
                                {tx.type === 'usage' ? '-' : '+'}{tx.amount} ⭐
                              </td>
                              <td className="px-6 py-4 text-xs">
                                {tx.description || '-'}
                                {tx.stripe_payment_intent_id && (
                                  <span className="block text-[10px] text-muted-foreground truncate max-w-[200px]">
                                    Stripe: {tx.stripe_payment_intent_id}
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-xs text-muted-foreground whitespace-nowrap">
                                {new Date(tx.created_at).toLocaleString('pt-BR')}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Configurações Globais do Sistema</CardTitle>
                <CardDescription>
                  Administre chaves de API, templates e manutenções básicas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-sm mb-4">Emails da Plataforma</h4>
                    <div className="space-y-3">
                      <Button variant="outline" className="w-full justify-start text-xs h-9" asChild>
                        <Link to="/email-logs">
                          <Mail className="h-4 w-4 mr-2" />
                          Visualizar Logs de Envios de Email (Brevo)
                        </Link>
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-sm mb-4">Moderação Rápida</h4>
                    <div className="space-y-3">
                      <Button variant="outline" className="w-full justify-start text-xs h-9" asChild>
                        <Link to="/admin/moderacao-agencias">
                          <Building2 className="h-4 w-4 mr-2" />
                          Moderar Agências e Avaliações Pendentes
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
