import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { 
  Download, 
  FileText, 
  Loader2, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  GraduationCap, 
  Building2, 
  Linkedin, 
  Calendar,
  ExternalLink
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

interface CurriculumPDFProps {
  profile: {
    full_name: string
    email: string
    bio?: string
    course?: string
    university?: string
    period?: string
    phone?: string
    linkedin_url?: string
    avatar_url?: string
    credits?: number
    subscription_status?: string
    created_at: string
    updated_at: string
  }
  trigger?: React.ReactNode
}

export function CurriculumPDF({ profile, trigger }: CurriculumPDFProps) {
  const [generating, setGenerating] = useState(false)
  const pdfRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getPeriodText = (period: string) => {
    const periods = {
      '1-2': '1º - 2º período',
      '3-5': '3º - 5º período',
      '6+': '6º período ou mais',
      'formado': 'Formado'
    }
    return periods[period as keyof typeof periods] || period
  }

  const generatePDF = async () => {
    if (!pdfRef.current) return

    setGenerating(true)

    try {
      // Configurar o elemento para PDF
      const element = pdfRef.current
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      
      const imgWidth = 210 // A4 width in mm
      const pageHeight = 295 // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight

      let position = 0

      // Adicionar primeira página
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      // Adicionar páginas adicionais se necessário
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      // Salvar PDF
      const fileName = `curriculo-${profile.full_name.toLowerCase().replace(/\s+/g, '-')}.pdf`
      pdf.save(fileName)

      toast({
        title: "PDF gerado",
        description: "Seu currículo foi baixado com sucesso!",
      })

    } catch (error) {
      console.error('Error generating PDF:', error)
      toast({
        title: "Erro",
        description: "Erro ao gerar PDF. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setGenerating(false)
    }
  }

  return (
    <>
      <Button
        onClick={generatePDF}
        disabled={generating}
        variant="outline"
        className="flex items-center gap-2"
      >
        {generating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        {generating ? 'Gerando PDF...' : 'Download PDF'}
      </Button>

      {/* Elemento oculto para gerar PDF */}
      <div 
        ref={pdfRef}
        className="fixed -left-[9999px] top-0 w-[800px] bg-white p-8"
        style={{ fontFamily: 'Arial, sans-serif' }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Currículo de {profile.full_name}
          </h1>
          <p className="text-gray-600">
            Gerado via Estagionauta
          </p>
        </div>

        {/* Informações Pessoais */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5" />
              Informações Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="text-lg">
                  {profile.full_name ? getInitials(profile.full_name) : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {profile.full_name}
                  </h2>
                  <p className="text-gray-600">
                    {profile.bio || 'Sem biografia disponível'}
                  </p>
                </div>
                
                <div className="grid grid-cols-1 gap-3">
                  {profile.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {profile.email}
                      </span>
                    </div>
                  )}
                  {profile.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {profile.phone}
                      </span>
                    </div>
                  )}
                  {profile.linkedin_url && (
                    <div className="flex items-center gap-2">
                      <Linkedin className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-blue-600">
                        {profile.linkedin_url}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informações Acadêmicas */}
        {(profile.course || profile.university || profile.period) && (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <GraduationCap className="h-5 w-5" />
                Formação Acadêmica
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profile.course && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Curso</span>
                    <p className="text-gray-900">{profile.course}</p>
                  </div>
                )}
                {profile.university && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Universidade</span>
                    <p className="text-gray-900">{profile.university}</p>
                  </div>
                )}
                {profile.period && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Período</span>
                    <p className="text-gray-900">{getPeriodText(profile.period)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Status da Conta */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5" />
              Status da Conta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Badge variant={profile.subscription_status === 'premium' ? 'default' : 'secondary'}>
                {profile.subscription_status === 'premium' ? 'Premium' : 'Gratuito'}
              </Badge>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Créditos:</span>
                <Badge variant="outline">{profile.credits}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informações Adicionais */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5" />
              Informações Adicionais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Membro desde:</span>
                <p className="text-gray-900">
                  {new Date(profile.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Última atualização:</span>
                <p className="text-gray-900">
                  {new Date(profile.updated_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center py-8">
          <Separator className="mb-4" />
          <p className="text-sm text-gray-500">
            Currículo gerado via{' '}
            <span className="text-blue-600 font-medium">
              Estagionauta
            </span>
          </p>
        </div>
      </div>
    </>
  )
} 