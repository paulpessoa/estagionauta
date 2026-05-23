import { useState } from "react"
import { ResumeAnalysisForm } from "@/components/forms/ResumeAnalysisForm"
import { AnalysisLoading } from "@/components/AnalysisLoading"
import { useNavigate } from "react-router-dom"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { useCredits } from "@/hooks/useCredits"
import { useNotifications } from "@/hooks/useNotifications"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Star, AlertTriangle, CreditCard } from "lucide-react"
import { apiClient } from "@/lib/apiClient"

interface ResumeFormData {
  // Basic info
  name: string
  email: string
  course: string
  university: string
  period: string
  hasInternship: string
  hasLinkedIn: string

  // Current situation
  currentFocus: string
  careerGoals: string
  skillsToDevelop: string
  timeAvailability: string

  // Optional: Specific job
  hasSpecificJob: boolean
  jobDescription: string
  jobRequirements: string

  // Optional: Mentorship (moved to end)
  mentorshipTopics: string
  hasParticipated: string
  hasInterest: string

  // About Estagionauta
  howHeard: string
  feedback: string

  // File upload
  resumeFile: File | null
}

export default function AnalyseCurriculoPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const navigate = useNavigate()
  const { toast } = useToast()
  const { user, profile } = useAuth()
  const { credits, hasEnoughCredits, refresh } = useCredits()

  // Função para converter arquivo em base64
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const base64String = reader.result as string
        // Remove o prefixo "data:application/pdf;base64," do resultado
        const base64 = base64String.split(",")[1]
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const handleFormComplete = async (formData: ResumeFormData) => {
    if (
      !formData.resumeFile ||
      !formData.name ||
      !formData.email ||
      !formData.course ||
      !formData.university ||
      !formData.period
    ) {
      setError(
        "Por favor, preencha todos os campos obrigatórios e selecione um arquivo PDF."
      )
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Verificar créditos antes de começar
      if (!hasEnoughCredits(3)) {
        setError("Créditos insuficientes. Por favor, compre mais créditos.")
        return
      }

      // Convert PDF to base64
      const base64 = await convertFileToBase64(formData.resumeFile)

      // Prepare current situation description
      const currentSituation = [
        formData.currentFocus ? `Foco atual: ${formData.currentFocus}` : "",
        formData.careerGoals
          ? `Objetivos de carreira: ${formData.careerGoals}`
          : "",
        formData.skillsToDevelop
          ? `Habilidades a desenvolver: ${formData.skillsToDevelop}`
          : "",
        formData.timeAvailability
          ? `Disponibilidade: ${formData.timeAvailability}`
          : "",
        formData.period ? `Período da faculdade: ${formData.period}` : "",
        formData.hasInternship ? `Tem estágio: ${formData.hasInternship}` : ""
      ]
        .filter(Boolean)
        .join("\n")

      const jobDescription = formData.hasSpecificJob
        ? `Vaga de Interesse: ${formData.jobDescription || ""}\nRequisitos: ${formData.jobRequirements || ""}`
        : ""

      console.log("Calling Backend API with data:", {
        hasResumeText: !!base64,
        jobDescriptionLen: jobDescription.length,
        currentSituationLen: currentSituation.length
      })

      // Call Backend API
      const data = await apiClient.post<any>("/api/analysis/analyze", {
        resumeText: base64,
        jobDescription: jobDescription || undefined,
        currentSituation: currentSituation || undefined,
        mentorshipQuestions: formData.mentorshipTopics || undefined
      })

      console.log("Analysis completed successfully:", data)

      // Atualizar créditos na interface
      await refresh()

      // Redirecionar para resultado
      navigate(`/resultado-curriculo/${data.analysisId}`, {
        state: {
          analysis: data.analysis,
          score: data.analysis.scoreGeral,
          usedFallback: data.usedFallback,
          creditsConsumed: 3,
          remainingCredits: data.remainingCredits
        }
      })
    } catch (err) {
      console.error("Error analyzing resume:", err)
      setError(
        err instanceof Error ? err.message : "Erro ao analisar currículo"
      )
      toast({
        title: "Erro",
        description:
          err instanceof Error ? err.message : "Erro ao analisar currículo",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <AnalysisLoading isVisible={loading} />
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Erro:</strong> {error}
            </AlertDescription>
          </Alert>
        )}
        <Card>
          <CardHeader>
            <CardTitle>Análise Inteligente de Currículo</CardTitle>
            <CardDescription>
              Faça upload do seu currículo e receba feedback detalhado com IA
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResumeAnalysisForm
              onComplete={handleFormComplete}
              loading={loading}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
