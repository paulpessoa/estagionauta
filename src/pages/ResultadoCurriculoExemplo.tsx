import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Download, Mail, Share2, ArrowLeft } from 'lucide-react'
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip, ResponsiveContainer } from 'recharts'
import { useIsMobile } from '@/hooks/use-mobile'

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

export default function ResultadoCurriculoExemplo() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  // Mocked data for a pedagogy student example
  const analysis: CurriculumAnalysis = {
    id: 'exemplo-001',
    name: 'Maria Silva',
    email: 'maria.silva@example.com',
    course: 'Pedagogia',
    university: 'Universidade Federal de Pernambuco',
    created_at: new Date().toISOString(),
    analysis_data: {
      notas: {
        organizacao: 8,
        ortografia: 9,
        experiencias: 7,
        adequacao: 8,
        extracurriculares: 6,
        diferencial: 7,
        habilidades: 8,
      },
      analise: [
        'Boa organização geral do currículo, facilitando a leitura.',
        'Ortografia correta com poucos erros, demonstra cuidado.',
        'Experiências relevantes em estágios pedagógicos e projetos sociais.',
        'Adequação do currículo ao perfil da área de pedagogia.',
        'Participação em atividades extracurriculares relacionadas à educação.',
        'Diferencial na inclusão de projetos voluntários em escolas públicas.',
        'Habilidades destacadas em comunicação e trabalho em equipe.',
        'Pode melhorar a descrição das competências técnicas específicas.',
        'Sugere incluir mais detalhes sobre resultados alcançados nos estágios.',
        'Recomenda destacar cursos complementares e formações adicionais.',
      ],
      recomendacoes: [
        'Detalhar mais as competências técnicas específicas da área de pedagogia.',
        'Incluir resultados quantitativos dos projetos e estágios realizados.',
        'Adicionar cursos complementares e formações relevantes para a área.',
        'Revisar o layout para destacar as seções mais importantes.',
      ],
      tags: [
        'Organização',
        'Ortografia',
        'Experiência Pedagógica',
        'Projetos Sociais',
        'Comunicação',
        'Trabalho em Equipe',
        'Voluntariado',
      ],
    },
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

  const handleShare = async () => {
    const shareUrl = window.location.href
    const shareText = `Confira a análise de currículo de ${analysis.name} no Estagionauta! 🚀`
    
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
      navigator.clipboard.writeText(`${shareText} ${shareUrl}`)
      alert('Link copiado para a área de transferência.')
    }
  }

  const handleDownloadPDF = () => {
    alert('Funcionalidade de download será implementada em breve.')
  }

  const handleSendEmail = () => {
    alert('Envio por email será implementado em breve.')
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Header com botão voltar para mobile */}
        <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center md:space-y-0">
          <div className="flex items-center space-x-3">
            {isMobile && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate(-1)}
                className="flex-shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="text-1xl md:text-2xl font-bold truncate">
                Análise de {analysis.name} (Exemplo)
              </h1>
              <p className="text-gray-600 mt-1 text-sm md:text-base">
                {analysis.course} • {analysis.university}
              </p>
            </div>
          </div>
          
          {/* Action buttons - responsivo */}
          <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
            <Button 
              variant="outline" 
              onClick={handleShare}
              size={isMobile ? "default" : "default"}
              className="w-full md:w-auto"
            >
              <Share2 className="mr-2 h-4 w-4" />
              Compartilhar
            </Button>
            <Button 
              variant="outline" 
              onClick={handleDownloadPDF}
              size={isMobile ? "default" : "default"}
              className="w-full md:w-auto"
            >
              <Download className="mr-2 h-4 w-4" />
              Baixar PDF
            </Button>
            <Button 
              variant="outline" 
              onClick={handleSendEmail}
              size={isMobile ? "default" : "default"}
              className="w-full md:w-auto"
            >
              <Mail className="mr-2 h-4 w-4" />
              Enviar Email
            </Button>
          </div>
        </div>

        {/* Nota Geral */}
        <Card>
          <CardContent className="text-center p-6 md:p-8">
            <h2 className="text-xl md:text-2xl font-semibold mb-4">Nota Geral</h2>
            <div className="text-4xl md:text-6xl font-bold text-blue-600 mb-2">
              {notaGeral.toFixed(1)}
            </div>
            <p className="text-gray-600">de 10.0</p>
          </CardContent>
        </Card>

        {/* Gráfico de Radar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">Habilidades Avaliadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 md:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis 
                    dataKey="habilidade" 
                    tick={{ fontSize: isMobile ? 10 : 12 }}
                  />
                  <PolarRadiusAxis 
                    angle={30} 
                    domain={[0, 10]} 
                    tick={{ fontSize: isMobile ? 8 : 10 }}
                  />
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-green-700 text-lg md:text-xl">Pontos Fortes</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside text-green-700 space-y-2 text-sm md:text-base">
                {analysis.analysis_data.analise.slice(0, Math.ceil(analysis.analysis_data.analise.length / 2)).map((ponto, idx) => (
                  <li key={idx}>{ponto}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-yellow-700 text-lg md:text-xl">Pontos a Melhorar</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside text-yellow-700 space-y-2 text-sm md:text-base">
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
            <CardTitle className="text-lg md:text-xl">Recomendações para Melhoria</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2 text-sm md:text-base">
              {analysis.analysis_data.recomendacoes.map((recomendacao, idx) => (
                <li key={idx}>{recomendacao}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Tags de Habilidades */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">Habilidades Identificadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {analysis.analysis_data.tags.map((tag, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs md:text-sm">
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Próximos Passos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">Próximos Passos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-700 text-sm md:text-base">
                Baseado na análise de exemplo, recomendamos buscar mentoria nas seguintes áreas:
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="text-xs md:text-sm">Metodologias de Ensino</Badge>
                <Badge variant="outline" className="text-xs md:text-sm">Desenvolvimento Infantil</Badge>
                <Badge variant="outline" className="text-xs md:text-sm">Comunicação Educacional</Badge>
                <Badge variant="outline" className="text-xs md:text-sm">Planejamento de Aulas</Badge>
              </div>
              <div className="pt-4">
                <Button asChild className="w-full md:w-auto">
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