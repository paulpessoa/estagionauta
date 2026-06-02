import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { apiClient } from '@/lib/apiClient'
import { useAuth } from '@/hooks/useAuth'
import { Link } from 'react-router-dom'
import {
  Gift,
  CheckCircle2,
  Coins,
  ArrowRight,
  User,
  FileText,
  Users,
  Sparkles,
  Loader2,
  Lock,
  ArrowUpRight
} from 'lucide-react'
import { toast } from 'sonner'

interface Task {
  key: string
  name: string
  description: string
  reward: number
  completed: boolean
  claimed: boolean
  status: string
}

interface RewardsData {
  tasks: Task[]
  availableToClaim: number
}

export default function Recompensas() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [claimingKey, setClaimingKey] = useState<string | null>(null)

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiClient.get<RewardsData>('/api/rewards/list')
      setTasks(data.tasks || [])
    } catch (err) {
      console.error('Error fetching rewards list:', err)
      toast.error('Não foi possível carregar as missões.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user) {
      fetchTasks()
    }
  }, [user, fetchTasks])

  // Claim reward handler
  const handleClaimReward = async (taskKey: string, taskName: string) => {
    setClaimingKey(taskKey)
    try {
      const result = await apiClient.post<{ success: boolean; reward: number; message: string }>('/api/rewards/claim', {
        taskKey
      })

      if (result.success) {
        toast.success(result.message || `Recompensa de ${taskName} resgatada!`, {
          icon: <Sparkles className="h-5 w-5 text-yellow-500 fill-yellow-500 animate-bounce" />
        })

        // Refresh tasks and credit balance context
        fetchTasks()
        // We trigger a window reload event to tell the Header/Credits hooks to update balance
        window.dispatchEvent(new Event('creditsUpdated'))
      } else {
        toast.error(result.message || 'Erro ao resgatar recompensa.')
      }
    } catch (err: any) {
      console.error('Error claiming reward:', err)
      const errorMsg = err.response?.data?.error || 'Erro ao resgatar. Tente novamente mais tarde.'
      toast.error(errorMsg)
    } finally {
      setClaimingKey(null)
    }
  }

  // Helper to render icon for task
  const getTaskIcon = (key: string) => {
    switch (key) {
      case 'complete_profile':
        return <User className="h-6 w-6 text-violet-600" />
      case 'first_analysis':
        return <FileText className="h-6 w-6 text-blue-600" />
      case 'first_interview':
        return <Users className="h-6 w-6 text-emerald-600" />
      case 'invite_friend':
        return <Gift className="h-6 w-6 text-pink-600" />
      default:
        return <Sparkles className="h-6 w-6 text-indigo-600" />
    }
  }

  // Helper to render redirect action link for pending tasks
  const getTaskRedirectPath = (key: string) => {
    switch (key) {
      case 'complete_profile':
        return '/perfil'
      case 'first_analysis':
        return '/analise-curriculo'
      case 'first_interview':
        return '/simulador-entrevistas'
      case 'invite_friend':
        return '/convide-amigos'
      default:
        return '/dashboard'
    }
  }

  const getTaskRedirectLabel = (key: string) => {
    switch (key) {
      case 'complete_profile':
        return 'Preencher Perfil'
      case 'first_analysis':
        return 'Analisar Currículo'
      case 'first_interview':
        return 'Treinar Entrevista'
      case 'invite_friend':
        return 'Convidar Amigo'
      default:
        return 'Ir para Painel'
    }
  }

  // Calculate statistics
  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => t.completed).length
  const claimedTasks = tasks.filter(t => t.claimed).length
  const progressPercent = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
  const unclaimedCount = tasks.filter(t => t.completed && !t.claimed).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/40 via-background to-violet-50/40 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 px-3.5 py-1 rounded-full text-xs font-bold border border-indigo-100 dark:border-indigo-900/30 mb-4 shadow-sm">
            <Coins className="h-3.5 w-3.5 animate-pulse" /> Missões & Recompensas
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl leading-none bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-400">
            Conquiste Créditos Gratuitos
          </h1>
          <p className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto font-medium">
            Complete desafios rápidos no Estagionauta, libere insígnias e ganhe créditos bônus para turbinar sua preparação profissional.
          </p>
        </div>

        {/* Progress Card */}
        <Card className="mb-8 border border-border/80 bg-card/65 backdrop-blur-sm shadow-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none">
            <Sparkles className="h-44 w-44 text-violet-600" />
          </div>
          <CardContent className="p-6 md:p-8">
            <div className="grid md:grid-cols-3 gap-6 items-center">

              <div className="md:col-span-2 space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-semibold text-muted-foreground">Progresso</span>
                  <span className="font-bold text-violet-600 dark:text-violet-400">
                    {completedTasks} de {totalTasks} concluídas ({Math.round(progressPercent)}%)
                  </span>
                </div>
                <Progress value={progressPercent} className="h-3 bg-muted/65" />
                <p className="text-xs text-muted-foreground font-medium">
                  Complete todas as missões iniciais de onboarding para destravar seu potencial máximo na plataforma.
                </p>
              </div>

              <div className="bg-violet-600/5 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/30 rounded-xl p-5 text-center flex flex-col justify-center items-center h-full">
                <Gift className="h-7 w-7 text-violet-600 dark:text-violet-400 mb-2 animate-bounce" />
                <span className="text-2xl font-black text-violet-700 dark:text-violet-300">
                  {unclaimedCount} {unclaimedCount === 1 ? 'Recompensa' : 'Recompensas'}
                </span>
                <span className="text-xs font-semibold text-muted-foreground mt-1">
                  disponíveis para resgate
                </span>
              </div>

            </div>
          </CardContent>
        </Card>

        {/* Tasks List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-violet-600" />
            <p className="text-sm font-semibold">Buscando missões da comunidade...</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {tasks.map((task) => {
              const redirectPath = getTaskRedirectPath(task.key)
              const redirectLabel = getTaskRedirectLabel(task.key)
              const taskIcon = getTaskIcon(task.key)

              return (
                <Card
                  key={task.key}
                  className={`hover:shadow-md transition-all duration-300 border bg-card/40 backdrop-blur-sm overflow-hidden flex flex-col justify-between group ${task.claimed
                    ? 'opacity-80 border-border/40'
                    : task.completed
                      ? 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/[0.02]'
                      : 'border-border/80'
                    }`}
                >
                  <CardHeader className="pb-3 flex flex-row items-start justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg border ${task.claimed
                          ? 'bg-muted border-border/30'
                          : task.completed
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'
                            : 'bg-violet-600/5 border-violet-100 dark:border-violet-950/20'
                          }`}>
                          {taskIcon}
                        </div>
                        <CardTitle className="text-base font-bold tracking-tight text-foreground">{task.name}</CardTitle>
                      </div>
                      <CardDescription className="text-xs text-muted-foreground font-medium pt-1.5 leading-relaxed">
                        {task.description}
                      </CardDescription>
                    </div>

                    <div className="shrink-0 flex flex-col items-end gap-1.5">
                      <div className="bg-yellow-500/10 text-yellow-600 dark:bg-yellow-950/30 dark:text-yellow-400 font-extrabold text-sm px-2.5 py-1 rounded-full border border-yellow-500/20 flex items-center gap-1 shadow-sm">
                        <Coins className="h-3.5 w-3.5 fill-yellow-500/20" />
                        +{task.reward}
                      </div>
                      {task.claimed ? (
                        <Badge className="bg-muted text-muted-foreground border-border/30 text-[10px] uppercase font-bold tracking-wide">Resgatada</Badge>
                      ) : task.completed ? (
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] uppercase font-bold tracking-wide">Concluída</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-wide">Pendente</Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="pt-2 pb-5 border-t border-border/30 bg-muted/10 dark:bg-muted/5 flex items-center justify-between gap-3">
                    <span className="text-xs text-muted-foreground font-medium">
                      {task.claimed
                        ? 'Créditos creditados no saldo'
                        : task.completed
                          ? 'Clique no botão para resgatar!'
                          : 'Requisito pendente'
                      }
                    </span>

                    {task.claimed ? (
                      <Button variant="outline" size="sm" disabled className="text-xs border-border/40 gap-1.5 opacity-60">
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                        Resgatado
                      </Button>
                    ) : task.completed ? (
                      <Button
                        size="sm"
                        disabled={claimingKey === task.key}
                        onClick={() => handleClaimReward(task.key, task.name)}
                        className="text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 transition-all shadow-sm active:scale-95 text-white animate-pulse"
                      >
                        {claimingKey === task.key ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Resgatando...
                          </>
                        ) : (
                          <>
                            Resgatar Recompensa
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" asChild className="text-xs font-semibold hover:bg-violet-600 hover:text-white border-violet-200 dark:border-violet-900 transition-all active:scale-95 group/btn">
                        <Link to={redirectPath} className="flex items-center gap-1.5">
                          {redirectLabel}
                          <ArrowUpRight className="h-3.5 w-3.5 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                        </Link>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

      </div>
    </div>
  )
}
