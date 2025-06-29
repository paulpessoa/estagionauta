import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { 
  Target, 
  CheckCircle, 
  AlertCircle, 
  Star, 
  TrendingUp,
  FileText,
  ExternalLink
} from 'lucide-react'

interface JobFitAnalysisProps {
  jobDescription: string
  jobRequirements: string
  fitScore: number
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
  onGenerateCoverLetter: () => void
}

export function JobFitAnalysis({
  jobDescription,
  jobRequirements,
  fitScore,
  strengths,
  weaknesses,
  recommendations,
  onGenerateCoverLetter
}: JobFitAnalysisProps) {
  const getFitColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getFitBadge = (score: number) => {
    if (score >= 80) return { label: 'Excelente Fit', variant: 'default' as const, color: 'bg-green-100 text-green-800' }
    if (score >= 60) return { label: 'Bom Fit', variant: 'secondary' as const, color: 'bg-yellow-100 text-yellow-800' }
    return { label: 'Fit Baixo', variant: 'destructive' as const, color: 'bg-red-100 text-red-800' }
  }

  const fitBadge = getFitBadge(fitScore)

  return (
    <Card className="border-2 border-blue-200 dark:border-blue-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-blue-600" />
          Análise de Adequação com a Vaga
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Fit Score */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-2xl font-bold">Adequação</span>
            <Badge className={fitBadge.color}>
              {fitBadge.label}
            </Badge>
          </div>
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className={`text-4xl font-bold ${getFitColor(fitScore)}`}>
              {fitScore}%
            </span>
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-6 w-6 ${
                    i < Math.floor(fitScore / 20) 
                      ? 'fill-yellow-400 text-yellow-400' 
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
          <Progress value={fitScore} className="h-3" />
        </div>

        {/* Job Info */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Descrição da Vaga
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-4">
              {jobDescription}
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Requisitos
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-4">
              {jobRequirements}
            </p>
          </div>
        </div>

        {/* Strengths and Weaknesses */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2 text-green-700 dark:text-green-400">
              <CheckCircle className="h-4 w-4" />
              Pontos Fortes
            </h4>
            <ul className="space-y-1">
              {strengths.map((strength, index) => (
                <li key={index} className="text-sm text-green-600 dark:text-green-400 flex items-start gap-2">
                  <CheckCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  {strength}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertCircle className="h-4 w-4" />
              Pontos de Melhoria
            </h4>
            <ul className="space-y-1">
              {weaknesses.map((weakness, index) => (
                <li key={index} className="text-sm text-red-600 dark:text-red-400 flex items-start gap-2">
                  <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  {weakness}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Recommendations */}
        <div>
          <h4 className="font-semibold mb-2 flex items-center gap-2 text-blue-700 dark:text-blue-400">
            <TrendingUp className="h-4 w-4" />
            Recomendações para Melhorar
          </h4>
          <ul className="space-y-2">
            {recommendations.map((recommendation, index) => (
              <li key={index} className="text-sm text-blue-600 dark:text-blue-400 flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                {recommendation}
              </li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t">
          <Button 
            onClick={onGenerateCoverLetter}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <FileText className="mr-2 h-4 w-4" />
            Gerar Carta de Apresentação
          </Button>
          <Button variant="outline" className="flex-1">
            <ExternalLink className="mr-2 h-4 w-4" />
            Ver Vaga Original
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 