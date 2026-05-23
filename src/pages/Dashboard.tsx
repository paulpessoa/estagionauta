import { useAuth } from '@/hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { supabase } from '@/integrations/supabase/client'
import { 
  FileText, 
  CreditCard, 
  BarChart3, 
  TrendingUp, 
  Users, 
  Building,
  Star,
  Award
} from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const { user, profile } = useAuth()

  const { data: analysisCount = 0 } = useQuery({
    queryKey: ['user-analysis-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0
      const { count } = await supabase
        .from('curriculum_analysis')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
      return count || 0
    },
    enabled: !!user?.id
  })

  const { data: recentAnalyses = [] } = useQuery({
    queryKey: ['recent-analyses', user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      const { data } = await supabase
        .from('curriculum_analysis')
        .select('id, name, created_at, status')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3)
      return data || []
    },
    enabled: !!user?.id
  })

  const quickActions = [
    {
      title: 'Analisar Currículo',
      description: 'Envie seu currículo para análise',
      icon: FileText,
      href: '/analise-curriculo',
      color: 'bg-blue-500'
    },
    {
      title: 'Simulador de Entrevistas',
      description: 'Pratique suas habilidades',
      icon: Users,
      href: '/simulador-entrevistas',
      color: 'bg-green-500'
    },
    {
      title: 'Gerador de Currículos',
      description: 'Crie currículos profissionais',
      icon: Award,
      href: '/gerador-curriculos',
      color: 'bg-purple-500'
    },
    {
      title: 'Kanban de Vagas',
      description: 'Acompanhe o status das suas candidaturas em um quadro visual, gerencie etapas e não perca prazos.',
      icon: BarChart3,
      href: '/candidaturas',
      color: 'bg-orange-500'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="max-w-7xl mx-auto p-4 space-y-8">
        <div className="text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Bem-vindo, {profile?.full_name || 'Estagionauta'}!
          </h1>
          <p className="text-gray-600 text-lg">
            Sua jornada profissional começa aqui
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Créditos</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profile?.credits || 0}</div>
              <p className="text-xs text-muted-foreground">
                créditos disponíveis
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Análises</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analysisCount}</div>
              <p className="text-xs text-muted-foreground">
                currículos analisados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Plano</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">
                {profile?.subscription_status || 'Free'}
              </div>
              <p className="text-xs text-muted-foreground">
                plano atual
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Progresso</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">85%</div>
              <p className="text-xs text-muted-foreground">
                perfil completo
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Ações Rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
                <Link to={action.href}>
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mb-4`}>
                      <action.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold mb-2">{action.title}</h3>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Analyses */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Análises Recentes</h2>
            <Button asChild variant="outline">
              <Link to="/minhas-analises">Ver todas</Link>
            </Button>
          </div>
          
          {recentAnalyses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentAnalyses.map((analysis) => (
                <Card key={analysis.id}>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2">{analysis.name}</h3>
                    <div className="flex justify-between items-center text-sm text-gray-600">
                      <span>
                        {new Date(analysis.created_at).toLocaleDateString('pt-BR')}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        analysis.status === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {analysis.status === 'completed' ? 'Concluído' : 'Processando'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma análise ainda</h3>
                <p className="text-gray-600 mb-4">
                  Envie seu primeiro currículo para começar!
                </p>
                <Button asChild>
                  <Link to="/analise-curriculo">Analisar Currículo</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}