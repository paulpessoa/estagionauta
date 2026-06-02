import { useState } from "react"
import { ResumeAnalysisForm } from "@/components/forms/ResumeAnalysisForm"
import { AnalysisLoading } from "@/components/AnalysisLoading"
import { useNavigate } from "react-router-dom"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { useCredits } from "@/hooks/useCredits"
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
  course: string
  university: string
  period: string
  hasInternship: string

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
    const missingFields = []
    if (!formData.course) missingFields.push("Curso")
    if (!formData.university) missingFields.push("Universidade")
    if (!formData.period) missingFields.push("Período")
    if (!formData.hasInternship) missingFields.push("Se já fez estágio")
    if (!formData.currentFocus) missingFields.push("Foco principal")
    if (!formData.careerGoals) missingFields.push("Objetivos de carreira")
    if (!formData.skillsToDevelop) missingFields.push("Habilidades a desenvolver")
    if (!formData.timeAvailability) missingFields.push("Disponibilidade de tempo")
    if (!formData.resumeFile) missingFields.push("Arquivo PDF do Currículo")

    if (missingFields.length > 0) {
      setError(
        `Por favor, preencha os seguintes campos obrigatórios: ${missingFields.join(", ")}.`
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

      const hasSpecificJob = !!(formData.jobDescription?.trim() || formData.jobRequirements?.trim())
      const jobDescription = hasSpecificJob
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
      navigate(`/analise/${data.analysisId}`, {
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Erro:</strong> {error}
            </AlertDescription>
          </Alert>
        )}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Análise Inteligente de Currículo
          </h1>
          <p className="text-muted-foreground mt-2">
            Faça upload do seu currículo em formato PDF e receba feedback detalhado gerado pela inteligência artificial.
          </p>
        </div>
        <ResumeAnalysisForm
          onComplete={handleFormComplete}
          loading={loading}
        />
      </div>
    </div>
  )
}
