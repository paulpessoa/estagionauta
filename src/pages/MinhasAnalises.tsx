import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/integrations/supabase/client'
import { Link, useNavigate } from 'react-router-dom'
import { 
  FileText, 
  Search, 
  Calendar, 
  Eye, 
  Download,
  Filter,
  ArrowUpDown,
  Trash2
} from 'lucide-react'
import { toast } from 'sonner'
import { apiClient } from '@/lib/apiClient'

interface Analysis {
  id: string
  name: string
  email: string
  course: string
  university: string
  status: string
  created_at: string
  analysis_data: Record<string, unknown>
  file_url?: string
}

export default function MinhasAnalises() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date')

  const { data: analyses = [], isLoading } = useQuery({
    queryKey: ['user-analyses', user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      const { data } = await supabase
        .from('curriculum_analysis')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      return data || []
    },
    enabled: !!user?.id
  })

  const filteredAnalyses = analyses
    .filter(analysis => 
      analysis.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      analysis.course.toLowerCase().includes(searchTerm.toLowerCase()) ||
      analysis.university.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
      return a.name.localeCompare(b.name)
    })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Concluído</Badge>
      case 'processing':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Processando</Badge>
      case 'failed':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Falhou</Badge>
      default:
        return <Badge variant="secondary">Pendente</Badge>
    }
  }

  const handleViewAnalysis = (id: string) => {
    navigate(`/analise/${id}`)
  }

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiClient.delete(`/api/analysis/${id}`)
    },
    onSuccess: () => {
      toast.success('Análise excluída com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['user-analyses', user?.id] })
    },
    onError: () => {
      toast.error('Erro ao excluir análise. Tente novamente.')
    }
  })

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir permanentemente esta análise?')) {
      deleteMutation.mutate(id)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-900 dark:text-gray-100">Carregando suas análises...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8">
      <div className="max-w-7xl mx-auto p-4 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Minhas Análises
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Visualize e gerencie todas as suas análises de currículo
            </p>
          </div>
          <Button asChild>
            <Link to="/analises/new">
              <FileText className="w-4 h-4 mr-2" />
              Nova Análise
            </Link>
          </Button>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por nome, curso ou universidade..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setSortBy(sortBy === 'date' ? 'name' : 'date')}
              >
                <ArrowUpDown className="w-4 h-4 mr-2" />
                {sortBy === 'date' ? 'Data' : 'Nome'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Analyses Grid */}
        {filteredAnalyses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAnalyses.map((analysis) => (
              <Card key={analysis.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg font-semibold line-clamp-2">
                      {analysis.name}
                    </CardTitle>
                    {getStatusBadge(analysis.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <p><strong>Curso:</strong> {analysis.course}</p>
                    <p><strong>Universidade:</strong> {analysis.university}</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(analysis.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    {analysis.status === 'completed' && (
                      <Button
                        size="sm"
                        onClick={() => handleViewAnalysis(analysis.id)}
                        className="flex-1"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Resultado
                      </Button>
                    )}
                    {analysis.status === 'processing' && (
                      <Button size="sm" disabled className="flex-1">
                        Processando...
                      </Button>
                    )}
                    {analysis.status === 'failed' && (
                      <Button size="sm" variant="outline" className="flex-1">
                        Tentar Novamente
                      </Button>
                    )}
                    {analysis.file_url && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(analysis.file_url, '_blank')}
                        title="Baixar Currículo Original"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      onClick={() => handleDelete(analysis.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
                {searchTerm ? 'Nenhuma análise encontrada' : 'Nenhuma análise ainda'}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {searchTerm 
                  ? 'Tente ajustar os filtros de busca'
                  : 'Envie seu primeiro currículo para começar a receber insights valiosos!'
                }
              </p>
              {!searchTerm && (
                <Button asChild size="lg">
                  <Link to="/analises/new">
                    <FileText className="w-5 h-5 mr-2" />
                    Analisar Primeiro Currículo
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}