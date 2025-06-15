import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Kanban, Calendar, Bell, Filter, BarChart3, Plus } from 'lucide-react'

export default function KanbanCandidaturas() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Badge variant="secondary" className="mb-4">
            Em Breve
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Kanban de Candidaturas
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Organize suas candidaturas com um Kanban inteligente e nunca perca o controle das suas oportunidades
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <div className="h-12 w-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
                <Kanban className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>Visualização Kanban</CardTitle>
              <CardDescription>
                Organize suas candidaturas em colunas personalizáveis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center">
                  <Plus className="h-4 w-4 text-green-500 mr-2" />
                  Colunas customizáveis
                </li>
                <li className="flex items-center">
                  <Filter className="h-4 w-4 text-green-500 mr-2" />
                  Filtros por empresa e status
                </li>
                <li className="flex items-center">
                  <BarChart3 className="h-4 w-4 text-green-500 mr-2" />
                  Métricas de desempenho
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle>Automação Inteligente</CardTitle>
              <CardDescription>
                Lembretes automáticos e integração com seu calendário
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center">
                  <Bell className="h-4 w-4 text-green-500 mr-2" />
                  Lembretes de follow-up
                </li>
                <li className="flex items-center">
                  <Calendar className="h-4 w-4 text-green-500 mr-2" />
                  Integração com Google Calendar
                </li>
                <li className="flex items-center">
                  <BarChart3 className="h-4 w-4 text-green-500 mr-2" />
                  Relatórios de progresso
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Coming Soon Notice */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
          <CardContent className="text-center py-8">
            <Kanban className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Em Desenvolvimento</h3>
            <p className="text-muted-foreground mb-6">
              Estamos criando a melhor ferramenta para organizar suas candidaturas. Em breve disponível!
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