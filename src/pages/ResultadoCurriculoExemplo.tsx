import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Download, Mail, Share2, ArrowLeft, Medal, UserCheck, UsersRound } from 'lucide-react'
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip, ResponsiveContainer } from 'recharts'
import { useIsMobile } from '@/hooks/use-mobile'
import { toast } from 'sonner'

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
        // AVALIACAO BAIXA
        // organizacao: 5,
        // ortografia: 4,
        // experiencias: 2,
        // adequacao: 8,
        // extracurriculares: 3,
        // diferencial: 7,
        // habilidades: 8,

        // AVALIACAO NORMAL
        organizacao: 8,
        ortografia: 9,
        experiencias: 7,
        adequacao: 8,
        extracurriculares: 6,
        diferencial: 7,
        habilidades: 8,

        // AVALIACAO TOPZERA
        // organizacao: 10,
        // ortografia: 9,
        // experiencias: 10,
        // adequacao: 10,
        // extracurriculares: 10,
        // diferencial: 10,
        // habilidades: 10,
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

      toast.info('Link copiado para a área de transferência.')
      navigator.clipboard.writeText(`${shareText} ${shareUrl}`)
      // await navigator.share({
        //   title: 'Análise de Currículo - Estagionauta',
        //   text: shareText,
        //   url: shareUrl,
        // })
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      navigator.clipboard.writeText(`${shareText} ${shareUrl}`)
      toast.info('Link copiado para a área de transferência.')
    }
  }

  const handleDownloadPDF = () => {
    toast.info('Funcionalidade de download será implementada em breve.')
  }

  const handleSendEmail = () => {
    toast.info('Envio por email será implementado em breve.')
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
        <Card
          className={`border relative ${
            notaGeral < 5
              ? 'bg-red-50 border-red-300 dark:bg-red-900 dark:border-red-700 text-red-700 dark:text-red-300'
              : notaGeral < 7
              ? 'bg-orange-50 border-orange-300 dark:bg-orange-900 dark:border-orange-700 text-orange-700 dark:text-orange-300'
              : notaGeral < 8.5
              ? 'bg-blue-50 border-blue-300 dark:bg-blue-900 dark:border-blue-700 text-blue-700 dark:text-blue-300'
              : notaGeral < 9.5
              ? 'bg-green-50 border-green-300 dark:bg-green-900 dark:border-green-700 text-green-700 dark:text-green-300'
              : 'border-transparent text-yellow-900 dark:text-yellow-100'
          }`}
          title={notaGeral >= 9.5 ? 'Currículo Topzera!' : undefined}
          style={
            notaGeral >= 9.5
              ? {
                  background: 'linear-gradient(270deg, #603489, #b501a0, #e715ce, #4b1c71)',                  
                  backgroundSize: '700% 800%',
                  animation: 'gradientAnimation 5s ease infinite',
                }
              : undefined
          }
        >
          {notaGeral > 8.5 && (
            <div
              className="h-8 w-8 text-yellow-300 dark:text-yellow-300 absolute top-4 right-4"
              >
             <Medal size={36}/>
              </div>
          )}
          <CardContent className="text-center p-6 md:p-8 flex flex-col items-center justify-center relative">
            <h2 className="text-gray-600 dark:text-gray-200 text-xl md:text-2xl font-semibold mb-4">Nota Geral</h2>
            <div
              className={`text-4xl md:text-6xl font-bold mb-2 ${
                notaGeral < 5
                  ? 'text-red-700 dark:text-red-300'
                  : notaGeral < 7
                  ? 'text-orange-700 dark:text-orange-300'
                  : notaGeral < 8.5
                  ? 'text-blue-700 dark:text-blue-300'
                  : notaGeral < 9.5
                  ? 'text-green-700 dark:text-green-300'
                  : 'text-yellow-300 dark:text-yellow-100'
              }`}
            >
              {notaGeral.toFixed(1)}
            </div>
            <p className=" text-gray-600 dark:text-gray-200">de 10.0</p>
          </CardContent>
          <style>
            {`
              @keyframes gradientAnimation {
                0% {background-position:0% 50%}
                50% {background-position:100% 50%}
                100% {background-position:0% 50%}
              }
            `}
          </style>
        </Card>

        {/* Gráfico de Radar */}
        <Card className="bg-blue-50 dark:bg-blue-900 border-blue-300 dark:border-blue-700">
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
          <Card className="bg-green-100 dark:bg-green-800 border-green-200 dark:border-green-600">
            <CardHeader>
              <CardTitle className="text-green-800 dark:text-green-200 text-lg md:text-xl">Pontos Fortes</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside text-green-800 dark:text-green-200 space-y-2 text-sm md:text-base">
                {analysis.analysis_data.analise.slice(0, Math.ceil(analysis.analysis_data.analise.length / 2)).map((ponto, idx) => (
                  <li key={idx}>{ponto}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-yellow-100 dark:bg-yellow-800 border-yellow-200 dark:border-yellow-600">
            <CardHeader>
              <CardTitle className="text-yellow-800 dark:text-yellow-200 text-lg md:text-xl">Pontos a Melhorar</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside text-yellow-800 dark:text-yellow-200 space-y-2 text-sm md:text-base">
                {analysis.analysis_data.analise.slice(Math.ceil(analysis.analysis_data.analise.length / 2)).map((ponto, idx) => (
                  <li key={idx}>{ponto}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Recomendações */}
        <Card className="bg-blue-50 dark:bg-blue-900 border-blue-300 dark:border-blue-700">
          <CardHeader>
            <CardTitle className="text-blue-700 dark:text-blue-300 text-lg md:text-xl">Recomendações para Melhoria</CardTitle>
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
        <Card className="bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600">
          <CardHeader>
            <CardTitle className="text-gray-800 dark:text-gray-200 text-lg md:text-xl">Habilidades Identificadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {analysis.analysis_data.tags.map((tag, idx) => (
                <Badge
                  key={idx}
                  variant="outline"
                  className="text-xs md:text-sm text-gray-700 dark:text-gray-300 border-gray-700 dark:border-gray-300"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Próximos Passos */}
        <Card className="bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">Próximos Passos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300 text-sm md:text-base">
                Baseado na análise de exemplo, recomendamos buscar mentoria nas seguintes áreas:
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant="outline"
                  className="text-xs md:text-sm text-teal-700 dark:text-teal-300 border-teal-700 dark:border-teal-300"
                >
                  Metodologias de Ensino
                </Badge>
                <Badge
                  variant="outline"
                  className="text-xs md:text-sm text-teal-700 dark:text-teal-300 border-teal-700 dark:border-teal-300"
                >
                  Desenvolvimento Infantil
                </Badge>
                <Badge
                  variant="outline"
                  className="text-xs md:text-sm text-teal-700 dark:text-teal-300 border-teal-700 dark:border-teal-300"
                >
                  Comunicação Educacional
                </Badge>
                <Badge
                  variant="outline"
                  className="text-xs md:text-sm text-teal-700 dark:text-teal-300 border-teal-700 dark:border-teal-300"
                >
                  Planejamento de Aulas
                </Badge>
              </div>
              <div className="pt-4 flex justify-center">
                <Button asChild className="w-full md:w-auto bg-teal-700 hover:bg-teal-600  text-white">
                  <a href="https://menvo.com.br" target="_blank" rel="noopener noreferrer" className="block px-4 py-2">
                    <UsersRound size={20} /> {/* Ícone Lucide React */}
                    Mentores Voluntários
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