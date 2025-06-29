import { useState } from 'react'
import { ResumeAnalysisForm } from '@/components/forms/ResumeAnalysisForm'
import { useNavigate } from 'react-router-dom'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'

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

  // Função para converter arquivo em base64
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const base64String = reader.result as string
        // Remove o prefixo "data:application/pdf;base64," do resultado
        const base64 = base64String.split(',')[1]
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const handleFormComplete = async (formData: ResumeFormData) => {
    if (!formData.resumeFile || !formData.name || !formData.email || !formData.course || !formData.university || !formData.period) {
      setError('Por favor, preencha todos os campos obrigatórios e selecione um arquivo PDF.')
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Convert PDF to base64
      const base64 = await convertFileToBase64(formData.resumeFile)
      
      // Prepare data for analysis
      const analysisData = {
        ...formData,
        user_id: user?.id,
        hasSpecificJob: formData.hasSpecificJob,
        jobDescription: formData.jobDescription || '',
        jobRequirements: formData.jobRequirements || ''
      }
      
      console.log('Calling Edge Function with data:', {
        hasResumeText: !!base64,
        formDataKeys: Object.keys(analysisData)
      })
      
      // Call Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('analyze-resume', {
        body: {
          resumeText: base64,
          formData: analysisData
        }
      })

      if (error) {
        console.error('Edge Function error:', error)
        throw new Error(error.message)
      }

      if (!data.success) {
        console.error('Edge Function returned error:', data.error)
        throw new Error(data.error || 'Erro ao analisar currículo')
      }

      console.log('Analysis completed successfully:', data)

      // Redirect to results page
      navigate(`/resultado-curriculo/${data.analysisId}`)
    } catch (err) {
      console.error('Error analyzing resume:', err)
      setError(err instanceof Error ? err.message : 'Erro ao analisar currículo')
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : 'Erro ao analisar currículo',
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto py-8 px-4">
        <ResumeAnalysisForm onComplete={handleFormComplete} />
        
        {/* Error Display */}
        {error && (
          <div className="max-w-2xl mx-auto mt-4">
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
