import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { JobApplication } from '@/types/kanban'
import { 
  TrendingUp, 
  Calendar, 
  Target, 
  CheckCircle, 
  AlertCircle,
  BarChart3
} from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface KanbanStatsProps {
  applications: JobApplication[]
}

export function KanbanStats({ applications }: KanbanStatsProps) {
  const totalApplications = applications.length
  const activeApplications = applications.filter(app => app.status !== 'rejected' && app.status !== 'offer').length
  const completedApplications = applications.filter(app => app.status === 'offer').length
  const rejectedApplications = applications.filter(app => app.status === 'rejected').length
  
  const averageProgress = totalApplications > 0 
    ? applications.reduce((sum, app) => sum + app.progress, 0) / totalApplications 
    : 0

  const upcomingReminders = applications
    .flatMap(app => app.reminders)
    .filter(reminder => !reminder.completed && differenceInDays(reminder.date, new Date()) <= 7)
    .length

  const statusCounts = {
    interested: applications.filter(app => app.status === 'interested').length,
    applied: applications.filter(app => app.status === 'applied').length,
    interview: applications.filter(app => app.status === 'interview').length,
    test: applications.filter(app => app.status === 'test').length,
    offer: applications.filter(app => app.status === 'offer').length,
    rejected: applications.filter(app => app.status === 'rejected').length
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Applications */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Candidaturas</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalApplications}</div>
          <p className="text-xs text-muted-foreground">
            {activeApplications} ativas
          </p>
        </CardContent>
      </Card>

      {/* Success Rate */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {totalApplications > 0 ? Math.round((completedApplications / totalApplications) * 100) : 0}%
          </div>
          <p className="text-xs text-muted-foreground">
            {completedApplications} propostas recebidas
          </p>
        </CardContent>
      </Card>

      {/* Average Progress */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Progresso Médio</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{Math.round(averageProgress)}%</div>
          <Progress value={averageProgress} className="mt-2" />
        </CardContent>
      </Card>

      {/* Upcoming Reminders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Lembretes Próximos</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{upcomingReminders}</div>
          <p className="text-xs text-muted-foreground">
            Próximos 7 dias
          </p>
        </CardContent>
      </Card>
    </div>
  )
} 