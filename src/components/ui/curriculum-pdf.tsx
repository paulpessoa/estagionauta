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

      // Adicionar páginas adicionais se necessário (com margem mínima)
      while (heightLeft >= 10) {
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

      {/* Elemento oculto para gerar PDF - CORRIGIDO: sem altura fixa */}
      <div 
        ref={pdfRef}
        className="fixed -left-[9999px] top-0 w-[800px] bg-white p-6"
        style={{ fontFamily: 'Arial, sans-serif' }}
      >
        {/* Header */}
        <div className="text-center mb-6 pb-4 border-b border-gray-200">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">
            {profile.full_name}
          </h1>
          <p className="text-gray-600 text-sm">
            Currículo Profissional
          </p>
        </div>

        {/* Informações Pessoais */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Contato
          </h2>
          <div className="grid grid-cols-1 gap-2 text-sm">
            {profile.email && (
              <div className="flex items-start gap-2">
                <span className="text-gray-500 font-medium">E-mail:</span>
                <a href={`mailto:${profile.email}`} className="text-blue-600 hover:underline">
                  {profile.email}
                </a>
              </div>
            )}
            {profile.phone && (
              <div className="flex items-start gap-2">
                <span className="text-gray-500 font-medium">Telefone:</span>
                <span className="text-gray-700">{profile.phone}</span>
              </div>
            )}
            {profile.linkedin_url && (
              <div className="flex items-start gap-2">
                <span className="text-gray-500 font-medium">LinkedIn:</span>
                <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                  {profile.linkedin_url}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Resumo Profissional / Bio */}
        {profile.bio && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Resumo Profissional</h2>
            <p className="text-sm text-gray-700 leading-relaxed">
              {profile.bio.trim()}
            </p>
          </div>
        )}

        {/* Informações Acadêmicas */}
        {(profile.course || profile.university || profile.period) && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Formação Acadêmica
            </h2>
            <div className="space-y-2 text-sm">
              {profile.course && (
                <div>
                  <span className="font-medium text-gray-700">{profile.course}</span>
                </div>
              )}
              {profile.university && (
                <div>
                  <span className="text-gray-600">{profile.university}</span>
                </div>
              )}
              {profile.period && (
                <div>
                  <span className="text-gray-600">Período: {getPeriodText(profile.period)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Status da Conta */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Status da Conta
          </h2>
          <div className="flex items-center gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">
                {profile.subscription_status === 'premium' ? 'Premium' : 'Gratuito'}
              </span>
            </div>
            {profile.credits !== undefined && (
              <div>
                <span className="text-gray-600">Créditos: {profile.credits}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-6 mt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Currículo gerado via Estagionauta • {new Date().toLocaleDateString('pt-BR')}
          </p>
        </div>
      </div>
    </>
  )
}
