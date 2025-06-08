
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Download, Mail, Share2 } from 'lucide-react'
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip, ResponsiveContainer } from 'recharts'

interface AnalysisData {
  notas: {
    organizacao: number
    ortografia: number
    experiencias: number
    adequacao: number
    extracurriculares: number
    diferencial: number
    habilidades: number
  }
  analise: string[]
  recomendacoes: string[]
  tags: string[]
}

interface CurriculumAnalysis {
  id: string
  name: string
  email: string
  course: string
  university: string
  analysis_data: AnalysisData
  created_at: string
}

export default function ResultadoCurriculo() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [analysis, setAnalysis] = useState<CurriculumAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      fetchAnalysis(id)
    }
  }, [id])

  const fetchAnalysis = async (analysisId: string) => {
    try {
      const { data, error } = await supabase
        .from('curriculum_analysis')
        .select('*')
        .eq('id', analysisId)
        .single()

      if (error) {
        console.error('Error fetching analysis:', error)
        toast({
          title: "Erro",
          description: "Análise não encontrada.",
          variant: "destructive",
        })
        navigate('/')
        return
      }

      // Cast the analysis_data from Json to AnalysisData via unknown
      const analysisWithTypedData = {
        ...data,
        analysis_data: data.analysis_data as unknown as AnalysisData
      }

      setAnalysis(analysisWithTypedData)
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar análise.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = async () => {
    setActionLoading('pdf')
    try {
      // Implementar geração de PDF
      toast({
        title: "Em desenvolvimento",
        description: "Funcionalidade de download será implementada em breve.",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao gerar PDF.",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleSendEmail = async () => {
    setActionLoading('email')
    try {
      // Implementar envio por email
      toast({
        title: "Em desenvolvimento",
        description: "Envio por email será implementado em breve.",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao enviar email.",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleShare = async () => {
    const shareUrl = window.location.href
    const shareText = `Confira minha análise de currículo no Estagionauta! 🚀`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Análise de Currículo - Estagionauta',
          text: shareText,
          url: shareUrl,
        })
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${shareText} ${shareUrl}`)
      toast({
        title: "Link copiado!",
        description: "O link foi copiado para a área de transferência.",
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Carregando análise...</p>
        </div>
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-6">
            <p className="text-lg mb-4">Análise não encontrada</p>
            <Button onClick={() => navigate('/')}>
              Voltar ao início
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const radarData = [
    { habilidade: 'Organização', valor: analysis.analysis_data.notas.organizacao },
    { habilidade: 'Ortografia', valor: analysis.analysis_data.notas.ortografia },
    { habilidade: 'Experiências', valor: analysis.analysis_data.notas.experiencias },
    { habilidade: 'Adequação', valor: analysis.analysis_data.notas.adequacao },
    { habilidade: 'Extracurriculares', valor: analysis.analysis_data.notas.extracurriculares },
    { habilidade: 'Diferencial', valor: analysis.analysis_data.notas.diferencial },
    { habilidade: 'Habilidades', valor: analysis.analysis_data.notas.habilidades },
  ]

  const notaGeral = Object.values(analysis.analysis_data.notas).reduce((a, b) => a + b, 0) / 7

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Análise do Currículo de {analysis.name}
            </h1>
            <p className="text-gray-600 mt-2">
              {analysis.course} • {analysis.university}
            </p>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={handleShare}
              disabled={actionLoading === 'share'}
            >
              <Share2 className="mr-2 h-4 w-4" />
              Compartilhar
            </Button>
            <Button 
              variant="outline" 
              onClick={handleDownloadPDF}
              disabled={actionLoading === 'pdf'}
            >
              <Download className="mr-2 h-4 w-4" />
              {actionLoading === 'pdf' ? 'Gerando...' : 'Baixar PDF'}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleSendEmail}
              disabled={actionLoading === 'email'}
            >
              <Mail className="mr-2 h-4 w-4" />
              {actionLoading === 'email' ? 'Enviando...' : 'Enviar Email'}
            </Button>
          </div>
        </div>

        {/* Nota Geral */}
        <Card>
          <CardContent className="text-center p-8">
            <h2 className="text-2xl font-semibold mb-4">Nota Geral</h2>
            <div className="text-6xl font-bold text-blue-600 mb-2">
              {notaGeral.toFixed(1)}
            </div>
            <p className="text-gray-600">de 10.0</p>
          </CardContent>
        </Card>

        {/* Gráfico de Radar */}
        <Card>
          <CardHeader>
            <CardTitle>Habilidades Avaliadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="habilidade" />
                  <PolarRadiusAxis angle={30} domain={[0, 10]} />
                  <Radar 
                    name="Notas" 
                    dataKey="valor" 
                    stroke="#2B4C7E" 
                    fill="#66A5AD" 
                    fillOpacity={0.3} 
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Análise e Recomendações */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-green-700">Pontos Fortes</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside text-green-700 space-y-2">
                {analysis.analysis_data.analise.slice(0, Math.ceil(analysis.analysis_data.analise.length / 2)).map((ponto, idx) => (
                  <li key={idx}>{ponto}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-yellow-700">Pontos a Melhorar</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside text-yellow-700 space-y-2">
                {analysis.analysis_data.analise.slice(Math.ceil(analysis.analysis_data.analise.length / 2)).map((ponto, idx) => (
                  <li key={idx}>{ponto}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Recomendações */}
        <Card>
          <CardHeader>
            <CardTitle>Recomendações para Melhoria</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2">
              {analysis.analysis_data.recomendacoes.map((recomendacao, idx) => (
                <li key={idx}>{recomendacao}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Tags de Habilidades */}
        <Card>
          <CardHeader>
            <CardTitle>Habilidades Identificadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {analysis.analysis_data.tags.map((tag, idx) => (
                <Badge key={idx} variant="secondary" className="text-sm">
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Próximos Passos */}
        <Card>
          <CardHeader>
            <CardTitle>Próximos Passos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-700">
                Baseado na sua análise, recomendamos buscar mentoria nas seguintes áreas:
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Preparação para entrevistas</Badge>
                <Badge variant="outline">Networking</Badge>
                <Badge variant="outline">Desenvolvimento de soft skills</Badge>
                <Badge variant="outline">Estratégias de carreira</Badge>
              </div>
              <div className="pt-4">
                <Button asChild>
                  <a href="https://menvo.com.br" target="_blank" rel="noopener noreferrer">
                    Encontrar Mentores no Menvo
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
