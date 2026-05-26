import { useState, useEffect } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import {
  Upload,
  FileText,
  Brain,
  ArrowRight,
  ArrowLeft,
  Gift,
  Target,
  User,
  GraduationCap
} from "lucide-react"
import { useDropzone } from "react-dropzone"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/use-toast"

interface ResumeAnalysisFormProps {
  onComplete: (data: ResumeFormData) => void
  loading?: boolean
}

interface ResumeFormData {
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

export function ResumeAnalysisForm({
  onComplete,
  loading
}: ResumeAnalysisFormProps) {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<ResumeFormData>({
    // Basic info
    course: "",
    university: "",
    period: "",
    hasInternship: "",

    // Current situation
    currentFocus: "",
    careerGoals: "",
    skillsToDevelop: "",
    timeAvailability: "",

    // Optional: Specific job
    hasSpecificJob: false,
    jobDescription: "",
    jobRequirements: "",

    // Optional: Mentorship (moved to end)
    mentorshipTopics: "",
    hasParticipated: "",
    hasInterest: "",

    // About Estagionauta
    howHeard: "",
    feedback: "",

    // File upload
    resumeFile: null
  })

  // Preenche dados do perfil quando disponível
  useEffect(() => {
    if (profile) {
      setFormData((prev) => ({
        ...prev,
        course: profile.course || "",
        university: profile.university || "",
        period: profile.period || ""
      }))
    }
  }, [profile])

  const steps = [
    { title: "Perfil", description: "Informações básicas", icon: User },
    { title: "Momento Atual", description: "Sua situação atual", icon: Target },
    {
      title: "Vaga Específica",
      description: "Opcional",
      icon: GraduationCap
    },
    { title: "Currículo", description: "Upload do arquivo", icon: Upload }
  ]

  const onDrop = (acceptedFiles: File[], fileRejections: any[]) => {
    if (fileRejections.length > 0) {
      const errorMsg = fileRejections[0].errors[0]?.code === 'file-too-large'
        ? 'O arquivo é muito grande. O limite máximo é de 5MB.'
        : 'Formato inválido. Selecione apenas arquivos em formato PDF.';
      toast({
        title: "Arquivo inválido",
        description: errorMsg,
        variant: "destructive",
      });
      return;
    }
    if (acceptedFiles.length > 0) {
      setFormData((prev) => ({ ...prev, resumeFile: acceptedFiles[0] }))
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"]
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024 // 5MB
  })

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    onComplete(formData)
  }

  const updateFormData = (
    field: keyof ResumeFormData,
    value: string | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0: // Perfil
        return (
          <div className="space-y-6">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="course">Curso *</Label>
                <Input
                  id="course"
                  value={formData.course}
                  onChange={(e) => updateFormData("course", e.target.value)}
                  placeholder="Ex: Engenharia de Software"
                />
              </div>
              <div>
                <Label htmlFor="university">Universidade *</Label>
                <Input
                  id="university"
                  value={formData.university}
                  onChange={(e) =>
                    updateFormData("university", e.target.value)
                  }
                  placeholder="Ex: UPE"
                />
              </div>
            </div>

            <div>
              <Label>Período atual do curso *</Label>
              <RadioGroup
                value={formData.period}
                onValueChange={(value) => updateFormData("period", value)}
                className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="1-2" id="period1" />
                  <Label htmlFor="period1">1º ao 2º período</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="3-5" id="period2" />
                  <Label htmlFor="period2">3º ao 5º período</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="6+" id="period3" />
                  <Label htmlFor="period3">6º período em diante</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="graduated" id="period4" />
                  <Label htmlFor="period4">Formado há até 1 ano</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label>Você já fez estágio? *</Label>
              <RadioGroup
                value={formData.hasInternship}
                onValueChange={(value) =>
                  updateFormData("hasInternship", value)
                }
                className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="internship1" />
                  <Label htmlFor="internship1">Sim, já fiz estágio</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="internship2" />
                  <Label htmlFor="internship2">Não, nunca fiz estágio</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="looking" id="internship3" />
                  <Label htmlFor="internship3">Não, mas estou procurando</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        )

      case 1: // Momento Atual
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="currentFocus">
                Qual é seu foco principal no momento? *
              </Label>
              <Select
                value={formData.currentFocus}
                onValueChange={(value) => updateFormData("currentFocus", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione seu foco atual" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="first_internship">
                    Conseguir meu primeiro estágio
                  </SelectItem>
                  <SelectItem value="better_internship">
                    Trocar para um estágio melhor
                  </SelectItem>
                  <SelectItem value="trainee">
                    Conseguir programa de trainee
                  </SelectItem>
                  <SelectItem value="first_job">
                    Conseguir meu primeiro emprego
                  </SelectItem>
                  <SelectItem value="career_change">
                    Mudar de área/carreira
                  </SelectItem>
                  <SelectItem value="improve_skills">
                    Melhorar habilidades técnicas
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="careerGoals">
                Onde você se vê profissionalmente nos próximos 2 anos? *
              </Label>
              <Textarea
                id="careerGoals"
                value={formData.careerGoals}
                onChange={(e) => updateFormData("careerGoals", e.target.value)}
                placeholder="Descreva seus objetivos de carreira..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="skillsToDevelop">
                Quais habilidades você mais quer desenvolver? *
              </Label>
              <Textarea
                id="skillsToDevelop"
                value={formData.skillsToDevelop}
                onChange={(e) =>
                  updateFormData("skillsToDevelop", e.target.value)
                }
                placeholder="Ex: React, Python, gestão de projetos, comunicação..."
                rows={3}
              />
            </div>

            <div>
              <Label>
                Qual sua disponibilidade de tempo para buscar oportunidades? *
              </Label>
              <RadioGroup
                value={formData.timeAvailability}
                onValueChange={(value) =>
                  updateFormData("timeAvailability", value)
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="full_time" id="time1" />
                  <Label htmlFor="time1">Tempo integral (40h/semana)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="part_time" id="time2" />
                  <Label htmlFor="time2">Meio período (20h/semana)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="flexible" id="time3" />
                  <Label htmlFor="time3">
                    Flexível (depende da oportunidade)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="weekends" id="time4" />
                  <Label htmlFor="time4">Apenas finais de semana</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        )

      case 2: // Vaga Específica (Opcional)
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg">
              <div className="flex items-start space-x-3">
                <Target className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="text-blue-700 dark:text-blue-200">
                    Se você tem uma vaga específica em mente, preencha as informações abaixo para analisarmos
                    se seu currículo está adequado para ela.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="jobDescription">Descrição da vaga</Label>
                <Textarea
                  id="jobDescription"
                  value={formData.jobDescription}
                  onChange={(e) =>
                    updateFormData("jobDescription", e.target.value)
                  }
                  placeholder="Cole aqui a descrição da vaga ou cargo..."
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="jobRequirements">Requisitos da vaga</Label>
                <Textarea
                  id="jobRequirements"
                  value={formData.jobRequirements}
                  onChange={(e) =>
                    updateFormData("jobRequirements", e.target.value)
                  }
                  placeholder="Liste os requisitos, habilidades e experiências necessárias..."
                  rows={4}
                />
              </div>
            </div>
          </div>
        )
      case 3: // Currículo
        return (
          <div className="space-y-6">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />

              {formData.resumeFile ? (
                <div className="space-y-2">
                  <p className="text-green-600 font-medium">
                    ✓ {formData.resumeFile.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Clique ou arraste para substituir
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-lg font-medium">
                    {isDragActive
                      ? "Solte o arquivo aqui..."
                      : "Arraste seu currículo ou clique para selecionar"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Apenas arquivos PDF, máximo 5MB
                  </p>
                </div>
              )}
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg">
              <div className="flex items-start space-x-3">
                <Brain className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900 dark:text-blue-100">
                    O que você vai receber:
                  </p>
                  <ul className="mt-2 space-y-1 text-blue-700 dark:text-blue-200">
                    <li>• Nota geral do seu currículo (0-10)</li>
                    <li>• Análise detalhada em 7 critérios</li>
                    <li>• Sugestões personalizadas de melhoria</li>
                    {formData.hasSpecificJob && (
                      <li>• Análise de adequação para a vaga específica</li>
                    )}
                    <li>• Resultado enviado por email em até 48h</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const isStepValid = () => {
    switch (currentStep) {
      case 0: {
        // Perfil
        // Verifica se os campos obrigatórios estão preenchidos, considerando o perfil
        const hasCourse = formData.course || profile?.course
        const hasUniversity = formData.university || profile?.university
        const hasPeriod = formData.period || profile?.period

        return (
          !!hasCourse &&
          !!hasUniversity &&
          !!hasPeriod &&
          !!formData.hasInternship
        )
      }
      case 1: // Momento Atual
        return (
          formData.currentFocus &&
          formData.careerGoals &&
          formData.skillsToDevelop &&
          formData.timeAvailability
        )
      case 2: // Vaga Específica (sempre válido, é opcional)
        return true
      case 3: // Currículo
        return formData.resumeFile
      default:
        return false
    }
  }

  const canSkipStep = (step: number) => {
    return step === 2 // Vaga específica é opcional
  }

  return (
    <div className="mx-auto">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">
            Etapa {currentStep + 1} de {steps.length}
          </span>
          <span className="text-sm text-muted-foreground">
            {Math.round(((currentStep + 1) / steps.length) * 100)}%
          </span>
        </div>
        <Progress
          value={((currentStep + 1) / steps.length) * 100}
          className="h-2"
        />
      </div>

      {/* Steps indicator */}
      <div className="flex justify-between mb-8">
        {steps.map((step, index) => {
          const StepIcon = step.icon
          return (
            <div
              key={index}
              className={`flex flex-col items-center space-y-2 ${
                index <= currentStep ? "text-blue-600" : "text-gray-400"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  index <= currentStep
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                <StepIcon className="h-4 w-4" />
              </div>
              <div className="text-center">
                <div className="text-sm font-medium">{step.title}</div>
                <div className="text-xs text-muted-foreground hidden sm:block">
                  {step.description}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              {(() => {
                const StepIcon = steps[currentStep].icon
                return <StepIcon className="h-4 w-4 text-blue-600" />
              })()}
            </div>
            <span>{steps[currentStep].title}</span>
            {canSkipStep(currentStep) && (
              <Badge variant="secondary" className="text-xs">
                Opcional
              </Badge>
            )}
          </CardTitle>
          <CardDescription>{steps[currentStep].description}</CardDescription>
        </CardHeader>
        <CardContent>
          {renderStep()}

          {/* Navigation */}
          <div className="flex justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Anterior
            </Button>

            <div className="flex gap-2">
              {canSkipStep(currentStep) && (
                <Button variant="ghost" onClick={handleNext}>
                  Pular
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}

              {currentStep === steps.length - 1 ? (
                <Button
                  onClick={handleSubmit}
                  disabled={!isStepValid() || loading}
                  className="bg-purple-600 hover:bg-purple-700 relative overflow-hidden group"
                >
                  <div className="flex items-center">
                    {loading ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        <span>Processando...</span>
                      </>
                    ) : (
                      <>
                        <Brain className="mr-2 h-4 w-4 group-hover:animate-pulse" />
                        <span>Analisar Currículo</span>
                      </>
                    )}
                  </div>
                  {/* Efeito de brilho no hover */}
                  {!loading && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  )}
                </Button>
              ) : (
                <Button onClick={handleNext} disabled={!isStepValid()}>
                  Próximo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
