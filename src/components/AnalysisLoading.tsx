import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Brain, FileText, Sparkles, Rocket, CheckCircle } from 'lucide-react'

interface AnalysisLoadingProps {
  isVisible: boolean
}

export function AnalysisLoading({ isVisible }: AnalysisLoadingProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [showRocket, setShowRocket] = useState(false)

  const steps = [
    { 
      title: "Processando currículo", 
      description: "Extraindo informações do PDF...",
      icon: FileText,
      duration: 2000
    },
    { 
      title: "Analisando conteúdo", 
      description: "IA analisando experiência e formação...",
      icon: Brain,
      duration: 3000
    },
    { 
      title: "Gerando insights", 
      description: "Criando sugestões personalizadas...",
      icon: Sparkles,
      duration: 2500
    },
    { 
      title: "Finalizando análise", 
      description: "Preparando resultado completo...",
      icon: CheckCircle,
      duration: 1500
    }
  ]

  useEffect(() => {
    if (!isVisible) {
      setCurrentStep(0)
      setProgress(0)
      setShowRocket(false)
      return
    }

    let stepIndex = 0
    let currentProgress = 0
    const totalSteps = steps.length

    const interval = setInterval(() => {
      if (stepIndex < totalSteps) {
        const step = steps[stepIndex]
        const stepProgress = (stepIndex / totalSteps) * 100
        const nextStepProgress = ((stepIndex + 1) / totalSteps) * 100
        
        // Animar progresso dentro do step atual
        const stepDuration = step.duration
        const progressIncrement = (nextStepProgress - stepProgress) / (stepDuration / 50)
        
        const progressInterval = setInterval(() => {
          currentProgress += progressIncrement
          if (currentProgress >= nextStepProgress) {
            currentProgress = nextStepProgress
            setProgress(currentProgress)
            clearInterval(progressInterval)
            
            // Mostrar foguete no final
            if (stepIndex === totalSteps - 1) {
              setShowRocket(true)
            }
          } else {
            setProgress(currentProgress)
          }
        }, 50)

        setCurrentStep(stepIndex)
        stepIndex++
      } else {
        clearInterval(interval)
      }
    }, steps[0].duration)

    return () => {
      clearInterval(interval)
    }
  }, [isVisible])

  if (!isVisible) return null

  const CurrentStepIcon = steps[currentStep]?.icon || FileText

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4 relative overflow-hidden">
        <CardHeader className="text-center pb-4">
          {/* Logo animada */}
          <div className="relative mx-auto mb-6">
            <div className="relative">
              <img 
                src="/logo.png" 
                alt="Estagionauta" 
                className="h-16 w-auto mx-auto animate-pulse hover:animate-spin transition-all duration-1000"
              />
              {/* Partículas flutuantes */}
              <div className="absolute inset-0">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-bounce"
                    style={{
                      left: `${15 + i * 12}%`,
                      top: `${5 + (i % 3) * 30}%`,
                      animationDelay: `${i * 0.3}s`,
                      animationDuration: '2.5s'
                    }}
                  />
                ))}
              </div>
              {/* Estrelas brilhantes */}
              <div className="absolute inset-0">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={`star-${i}`}
                    className="absolute w-1 h-1 bg-yellow-400 rounded-full animate-ping"
                    style={{
                      left: `${25 + i * 20}%`,
                      top: `${20 + (i % 2) * 60}%`,
                      animationDelay: `${i * 0.5}s`,
                      animationDuration: '3s'
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
          
          <CardTitle className="text-xl mb-2">
            Analisando seu currículo...
          </CardTitle>
          <CardDescription>
            Nossa IA está trabalhando para você
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progresso</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>

          {/* Current step */}
          <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <CurrentStepIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-blue-900 dark:text-blue-100">
                  {steps[currentStep]?.title}
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-200">
                  {steps[currentStep]?.description}
                </p>
              </div>
            </div>
          </div>

          {/* Steps indicator */}
          <div className="flex justify-between">
            {steps.map((step, index) => {
              const StepIcon = step.icon
              return (
                <div
                  key={index}
                  className={`flex flex-col items-center space-y-1 ${
                    index <= currentStep ? 'text-blue-600' : 'text-gray-400'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                      index <= currentStep
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    <StepIcon className="h-3 w-3" />
                  </div>
                  <div className="text-xs text-center max-w-16">
                    {step.title.split(' ')[0]}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Rocket animation */}
          {showRocket && (
            <div className="absolute -top-4 -right-4 animate-bounce">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-3 rounded-full shadow-lg">
                <Rocket className="h-6 w-6" />
              </div>
            </div>
          )}

          {/* Loading dots */}
          <div className="flex justify-center space-x-1">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>

          {/* Fun fact */}
          <div className="text-center text-sm text-muted-foreground">
            <p>💡 Dica: Enquanto aguarda, que tal revisar seu LinkedIn?</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 