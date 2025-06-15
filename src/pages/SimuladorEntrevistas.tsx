import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, Video, Clock, Target, Users, BookOpen } from 'lucide-react'

export default function SimuladorEntrevistas() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Badge variant="secondary" className="mb-4">
            Em Breve
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Simulador de Entrevistas com IA
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Pratique entrevistas com IA e receba feedback personalizado para se preparar melhor para suas oportunidades
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                <MessageSquare className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle>Entrevistas Personalizadas</CardTitle>
              <CardDescription>
                Simulações baseadas na sua área de atuação e nível de experiência
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center">
                  <Target className="h-4 w-4 text-green-500 mr-2" />
                  Perguntas específicas para sua área
                </li>
                <li className="flex items-center">
                  <Clock className="h-4 w-4 text-green-500 mr-2" />
                  Tempo real de entrevista
                </li>
                <li className="flex items-center">
                  <Users className="h-4 w-4 text-green-500 mr-2" />
                  Diferentes tipos de entrevistadores
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
                <BookOpen className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle>Feedback Detalhado</CardTitle>
              <CardDescription>
                Análise completa da sua performance com dicas de melhoria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center">
                  <Target className="h-4 w-4 text-green-500 mr-2" />
                  Pontos fortes e fracos identificados
                </li>
                <li className="flex items-center">
                  <Clock className="h-4 w-4 text-green-500 mr-2" />
                  Sugestões de melhoria
                </li>
                <li className="flex items-center">
                  <Users className="h-4 w-4 text-green-500 mr-2" />
                  Relatório detalhado de performance
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Coming Soon Notice */}
        <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border-yellow-200 dark:border-yellow-800">
          <CardContent className="text-center py-8">
            <Video className="h-16 w-16 text-yellow-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Em Desenvolvimento</h3>
            <p className="text-muted-foreground mb-6">
              Estamos finalizando este recurso incrível. Em breve você poderá praticar entrevistas com nossa IA avançada.
            </p>
            <Button disabled variant="outline">
              Disponível em Breve
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}