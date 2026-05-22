import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { JobFitAnalysis } from '@/components/analysis/JobFitAnalysis'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Download, Mail, Share2, ArrowLeft, Medal, UsersRound, Star, Send, Loader2 } from 'lucide-react'
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip, ResponsiveContainer } from 'recharts'
import { useIsMobile } from '@/hooks/use-mobile'
import { useCredits } from '@/hooks/useCredits'
import { apiClient } from '@/lib/apiClient'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

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
  jobFit?: {
    fitScore: number
    strengths: string[]
    weaknesses: string[]
    recommendations: string[]
    jobDescription: string
    jobRequirements: string
  }
}

interface CurriculumAnalysis {
  id: string
  name: string
  email: string
  course: string
  university: string
  analysis_data: AnalysisData
  created_at: string
  user_id?: string
  status?: string
  used_fallback?: boolean
}

export default function ResultadoCurriculo() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()
  const isMobile = useIsMobile()
  const { credits } = useCredits()
  const [analysis, setAnalysis] = useState<CurriculumAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const analysisRef = useRef<HTMLDivElement>(null)

  // Estados para o envio de e-mail
  const [emailModalOpen, setEmailModalOpen] = useState(false)
  const [recipientEmail, setRecipientEmail] = useState('')
  const [emailSubject, setEmailSubject] = useState('')
  const [emailMessage, setEmailMessage] = useState('')

  // Dados da análise passados via state
  const analysisData = location.state?.analysis
  const creditsConsumed = location.state?.creditsConsumed
  const remainingCredits = location.state?.remainingCredits

  useEffect(() => {
    if (analysis) {
      setEmailSubject(`Análise de Currículo - ${analysis.name}`)
      setEmailMessage(`Olá,

Gostaria de compartilhar com você o resultado da análise do meu currículo no Estagionauta.

Você pode visualizar a análise completa no seguinte link:
${window.location.origin}/analise-curriculo/resultado/${analysis.id}

Atenciosamente,
${analysis.name}`)
    }
  }, [analysis])

  useEffect(() => {
    if (id) {
      console.log('Fetching analysis with ID:', id)
      fetchAnalysis(id)
    } else {
      console.error('No analysis ID provided')
      navigate('/')
    }
  }, [id])

  const fetchAnalysis = async (analysisId: string) => {
    console.log('Starting to fetch analysis:', analysisId)
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

      console.log('Analysis data received:', data)

      const analysisWithTypedData = {
        ...data,
        analysis_data: data.analysis_data as unknown as AnalysisData
      }

      console.log('Processed analysis data:', analysisWithTypedData)
      setAnalysis(analysisWithTypedData)
    } catch (error) {
      console.error('Unexpected error fetching analysis:', error)
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
    if (!analysisRef.current) return
    setActionLoading('pdf')
    try {
      const element = analysisRef.current
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#030712', // Cor escura correspondente ao tema dark do Estagionauta
        onclone: (clonedDoc) => {
          // Esconder botões e elementos interativos no PDF gerado
          const actionButtons = clonedDoc.querySelector('#action-buttons')
          if (actionButtons) (actionButtons as HTMLElement).style.display = 'none'
          
          const backBtn = clonedDoc.querySelector('#back-button')
          if (backBtn) (backBtn as HTMLElement).style.display = 'none'

          const creditsBanner = clonedDoc.querySelector('#credits-banner')
          if (creditsBanner) (creditsBanner as HTMLElement).style.display = 'none'

          const fallbackBanner = clonedDoc.querySelector('#fallback-banner')
          if (fallbackBanner) (fallbackBanner as HTMLElement).style.display = 'none'

          const nextStepsCard = clonedDoc.querySelector('#next-steps-card')
          if (nextStepsCard) (nextStepsCard as HTMLElement).style.display = 'none'
        }
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      
      const imgWidth = 210
      const pageHeight = 295
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight

      let position = 0

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      const fileName = `analise-curriculo-${analysis.name.toLowerCase().replace(/\s+/g, '-')}.pdf`
      pdf.save(fileName)

      toast({
        title: "PDF baixado",
        description: "Sua análise de currículo foi salva em PDF com sucesso!",
      })
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast({
        title: "Erro",
        description: "Não foi possível gerar o PDF. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleSendEmail = async () => {
    if (!recipientEmail) {
      toast({
        title: "Erro",
        description: "Por favor, insira um e-mail de destino.",
        variant: "destructive",
      })
      return
    }

    setActionLoading('email')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast({
          title: "Erro",
          description: "Você precisa estar logado para enviar e-mails.",
          variant: "destructive",
        })
        return
      }

      await apiClient.post('/api/email/send', {
        toEmails: [recipientEmail],
        subject: emailSubject,
        message: emailMessage,
        profile: {
          id: user.id,
          full_name: analysis.name,
          course: analysis.course || null,
          university: analysis.university || null,
          bio: null,
          phone: null,
          linkedin_url: null,
          curriculo_slug: analysis.id,
        },
        curriculumUrl: window.location.origin + `/analise-curriculo/resultado/${analysis.id}`
      })

      toast({
        title: "E-mail enviado!",
        description: `A análise foi compartilhada com ${recipientEmail} com sucesso.`,
      })
      setEmailModalOpen(false)
      setRecipientEmail('')
    } catch (error: any) {
      console.error('Error sending email:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao enviar e-mail.",
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
      navigator.clipboard.writeText(`${shareText} ${shareUrl}`)
      toast({
        title: "Link copiado!",
        description: "O link foi copiado para a área de transferência.",
      })
    }
  }

  const handleGenerateCoverLetter = () => {
    toast({
      title: "Funcionalidade em Desenvolvimento",
      description: "A geração de carta de apresentação será implementada em breve no Gerador de Currículos.",
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg">Carregando análise...</p>
        </div>
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
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
     <div className="flex flex-col min-h-screen">
      <div ref={analysisRef} className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Header com botão voltar para mobile */}
        <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center md:space-y-0">
          <div className="flex items-center space-x-3">
            {isMobile && (
              <Button 
                id="back-button"
                variant="ghost" 
                size="icon"
                onClick={() => navigate(-1)}
                className="flex-shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white truncate">
                Análise de {analysis.name}
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1 text-sm md:text-base">
                {analysis.course} • {analysis.university}
              </p>
            </div>
          </div>
          
          {/* Action buttons - responsivo */}
          <div id="action-buttons" className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
            <Button 
              variant="outline" 
              onClick={handleShare}
              disabled={actionLoading === 'share'}
              size={isMobile ? "default" : "default"}
              className="w-full md:w-auto"
            >
              <Share2 className="mr-2 h-4 w-4" />
              Compartilhar
            </Button>
            <Button 
              variant="outline" 
              onClick={handleDownloadPDF}
              disabled={actionLoading === 'pdf'}
              size={isMobile ? "default" : "default"}
              className="w-full md:w-auto"
            >
              <Download className="mr-2 h-4 w-4" />
              {actionLoading === 'pdf' ? 'Gerando...' : 'Baixar PDF'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setEmailModalOpen(true)}
              disabled={actionLoading === 'email'}
              size={isMobile ? "default" : "default"}
              className="w-full md:w-auto"
            >
              <Mail className="mr-2 h-4 w-4" />
              Enviar Email
            </Button>
          </div>
        </div>

        {/* Créditos Restantes */}
        {(creditsConsumed || remainingCredits) && (
          <Card id="credits-banner" className="border-green-200 bg-green-50 dark:bg-green-950/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Star className="h-5 w-5 text-green-600 fill-green-600" />
                  <div>
                    <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                      Análise Concluída
                    </h3>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      {creditsConsumed} créditos consumidos • {remainingCredits} créditos restantes
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-bold text-green-800 dark:text-green-200">
                    {credits?.credits || remainingCredits}
                  </span>
                  <Star className="h-4 w-4 text-green-600 fill-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Aviso de Fallback */}
        {analysis.used_fallback && (
          <Card id="fallback-banner" className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/30">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                    <span className="text-yellow-900 text-xs font-bold">!</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Análise Simplificada
                  </h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    Devido a uma alta demanda no momento, esta análise foi gerada automaticamente. 
                    Para uma análise mais detalhada, tente novamente em alguns minutos.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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

        {/* Análise de Adequação com Vaga Específica */}
        {analysis.analysis_data.jobFit && (
          <JobFitAnalysis
            jobDescription={analysis.analysis_data.jobFit.jobDescription}
            jobRequirements={analysis.analysis_data.jobFit.jobRequirements}
            fitScore={analysis.analysis_data.jobFit.fitScore}
            strengths={analysis.analysis_data.jobFit.strengths}
            weaknesses={analysis.analysis_data.jobFit.weaknesses}
            recommendations={analysis.analysis_data.jobFit.recommendations}
            onGenerateCoverLetter={handleGenerateCoverLetter}
          />
        )}

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
        <Card id="next-steps-card" className="bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">Próximos Passos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300 text-sm md:text-base">
                Baseado na sua análise, recomendamos buscar mentoria nas seguintes áreas:
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant="outline"
                  className="text-xs md:text-sm text-teal-700 dark:text-teal-300 border-teal-700 dark:border-teal-300"
                >
                  Preparação para entrevistas
                </Badge>
                <Badge
                  variant="outline"
                  className="text-xs md:text-sm text-teal-700 dark:text-teal-300 border-teal-700 dark:border-teal-300"
                >
                  Networking
                </Badge>
                <Badge
                  variant="outline"
                  className="text-xs md:text-sm text-teal-700 dark:text-teal-300 border-teal-700 dark:border-teal-300"
                >
                  Desenvolvimento de soft skills
                </Badge>
                <Badge
                  variant="outline"
                  className="text-xs md:text-sm text-teal-700 dark:text-teal-300 border-teal-700 dark:border-teal-300"
                >
                  Estratégias de carreira
                </Badge>
              </div>
              <div className="pt-4 flex justify-center">
                <Button asChild className="w-full md:w-auto bg-teal-700 hover:bg-teal-600 text-white">
                  <a href="https://menvo.com.br" target="_blank" rel="noopener noreferrer" className="block px-4 py-2">
                    <UsersRound size={20} />
                    Mentores Voluntários
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal de envio de e-mail */}
      <Dialog open={emailModalOpen} onOpenChange={setEmailModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Compartilhar Análise por E-mail
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="email" className="text-sm font-medium">E-mail do Destinatário</Label>
              <Input
                id="email"
                type="email"
                placeholder="recrutador@empresa.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="subject" className="text-sm font-medium">Assunto</Label>
              <Input
                id="subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="message" className="text-sm font-medium">Mensagem</Label>
              <Textarea
                id="message"
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                rows={6}
                className="mt-1"
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setEmailModalOpen(false)
                  setRecipientEmail('')
                }}
                disabled={actionLoading === 'email'}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSendEmail}
                disabled={actionLoading === 'email' || !recipientEmail}
                className="flex items-center gap-2"
              >
                {actionLoading === 'email' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Enviar Email
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
