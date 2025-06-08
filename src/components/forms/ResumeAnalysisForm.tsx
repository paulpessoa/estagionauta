
import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Upload, FileText, Brain, ArrowRight, ArrowLeft, Gift } from 'lucide-react'
import { useDropzone } from 'react-dropzone'

interface ResumeAnalysisFormProps {
  onComplete: (data: any) => void
}

export function ResumeAnalysisForm({ onComplete }: ResumeAnalysisFormProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState({
    // Basic info
    name: '',
    email: '',
    course: '',
    university: '',
    period: '',
    hasInternship: '',
    hasLinkedIn: '',
    
    // Mentorship interests
    mentorshipTopics: '',
    hasParticipated: '',
    hasInterest: '',
    
    // About Menvo
    howHeard: '',
    feedback: '',
    
    // File upload
    resumeFile: null as File | null
  })

  const steps = [
    { title: "Perfil", description: "Informações básicas" },
    { title: "Interesses", description: "Sobre mentoria" },
    { title: "Feedback", description: "Sua opinião" },
    { title: "Currículo", description: "Upload do arquivo" }
  ]

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFormData(prev => ({ ...prev, resumeFile: acceptedFiles[0] }))
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
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

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome completo</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateFormData('name', e.target.value)}
                  placeholder="Seu nome completo"
                />
              </div>
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData('email', e.target.value)}
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="course">Curso</Label>
                <Input
                  id="course"
                  value={formData.course}
                  onChange={(e) => updateFormData('course', e.target.value)}
                  placeholder="Ex: Engenharia de Software"
                />
              </div>
              <div>
                <Label htmlFor="university">Universidade</Label>
                <Input
                  id="university"
                  value={formData.university}
                  onChange={(e) => updateFormData('university', e.target.value)}
                  placeholder="Ex: UPE"
                />
              </div>
            </div>

            <div>
              <Label>Período atual do curso</Label>
              <RadioGroup value={formData.period} onValueChange={(value) => updateFormData('period', value)}>
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
              <Label>Você já fez estágio?</Label>
              <Select value={formData.hasInternship} onValueChange={(value) => updateFormData('hasInternship', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma opção" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Sim</SelectItem>
                  <SelectItem value="no">Não</SelectItem>
                  <SelectItem value="looking">Estou procurando</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )

      case 1:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="mentorshipTopics">Se você pudesse conversar com alguém mais experiente, sobre o quê seria?</Label>
              <Textarea
                id="mentorshipTopics"
                value={formData.mentorshipTopics}
                onChange={(e) => updateFormData('mentorshipTopics', e.target.value)}
                placeholder="Conte sobre seus interesses em mentoria..."
                rows={4}
              />
            </div>

            <div>
              <Label>Você já participou de algum programa de mentoria?</Label>
              <RadioGroup value={formData.hasParticipated} onValueChange={(value) => updateFormData('hasParticipated', value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="participated1" />
                  <Label htmlFor="participated1">Sim</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="participated2" />
                  <Label htmlFor="participated2">Não</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="heard" id="participated3" />
                  <Label htmlFor="participated3">Já ouvi falar, mas nunca participei</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label>Você teria interesse em participar de mentorias gratuitas com profissionais voluntários?</Label>
              <RadioGroup value={formData.hasInterest} onValueChange={(value) => updateFormData('hasInterest', value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="interest1" />
                  <Label htmlFor="interest1">Sim, com certeza</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="maybe" id="interest2" />
                  <Label htmlFor="interest2">Talvez</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="interest3" />
                  <Label htmlFor="interest3">Não tenho interesse</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <Label>Como ficou sabendo do Estagionauta?</Label>
              <Select value={formData.howHeard} onValueChange={(value) => updateFormData('howHeard', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma opção" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upe_destaca">Evento UPE Destaca</SelectItem>
                  <SelectItem value="friend">Indicação de amigo</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="feedback">O que você achou da ideia do Estagionauta em poucas palavras? (opcional)</Label>
              <Textarea
                id="feedback"
                value={formData.feedback}
                onChange={(e) => updateFormData('feedback', e.target.value)}
                placeholder="Compartilhe sua opinião sobre nossa plataforma..."
                rows={3}
              />
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Gift className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Seu presente 🎁</h3>
              <p className="text-muted-foreground">
                Anexe seu currículo em PDF para uma análise gratuita com ajuda de IA
              </p>
            </div>

            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                  : 'border-gray-300 hover:border-gray-400'
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
                      ? 'Solte o arquivo aqui...'
                      : 'Arraste seu currículo ou clique para selecionar'}
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
      case 0:
        return formData.name && formData.email && formData.course && formData.university && formData.period && formData.hasInternship
      case 1:
        return formData.mentorshipTopics && formData.hasParticipated && formData.hasInterest
      case 2:
        return formData.howHeard
      case 3:
        return formData.resumeFile
      default:
        return false
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          Análise Gratuita de Currículo 🎯
        </h1>
        <p className="text-xl text-muted-foreground">
          Responda algumas perguntas rápidas e receba uma análise completa do seu currículo
        </p>
      </div>

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
        <Progress value={((currentStep + 1) / steps.length) * 100} className="h-2" />
      </div>

      {/* Steps indicator */}
      <div className="flex justify-between mb-8">
        {steps.map((step, index) => (
          <div
            key={index}
            className={`flex flex-col items-center space-y-2 ${
              index <= currentStep ? 'text-blue-600' : 'text-gray-400'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                index <= currentStep
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {index + 1}
            </div>
            <div className="text-center">
              <div className="text-sm font-medium">{step.title}</div>
              <div className="text-xs text-muted-foreground hidden sm:block">
                {step.description}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <FileText className="h-4 w-4 text-blue-600" />
            </div>
            <span>{steps[currentStep].title}</span>
          </CardTitle>
          <CardDescription>
            {steps[currentStep].description}
          </CardDescription>
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

            {currentStep === steps.length - 1 ? (
              <Button
                onClick={handleSubmit}
                disabled={!isStepValid()}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Gift className="mr-2 h-4 w-4" />
                Enviar e Receber Análise
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!isStepValid()}
              >
                Próximo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
