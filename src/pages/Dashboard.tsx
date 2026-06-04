import { useAuth } from '@/hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { supabase } from '@/integrations/supabase/client'
import {
    FileText,
    CreditCard,
    BarChart3,
    Users,
    Award,
    Coins,
    Gift
} from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Dashboard() {
    const { user, profile } = useAuth()

    const { data: analysisCount = 0 } = useQuery({
        queryKey: ['user-analysis-count', user?.id],
        queryFn: async () => {
            if (!user?.id) return 0
            const { count } = await supabase
                .from('curriculum_analysis')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
            return count || 0
        },
        enabled: !!user?.id
    })

    const { data: simulationsCount = 0 } = useQuery({
        queryKey: ['user-simulations-count', user?.id],
        queryFn: async () => {
            if (!user?.id) return 0
            const { count } = await supabase
                .from('interview_simulations')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
            return count || 0
        },
        enabled: !!user?.id
    })

    const { data: resumesCount = 0 } = useQuery({
        queryKey: ['user-resumes-count', user?.id],
        queryFn: async () => {
            if (!user?.id) return 0
            const { count } = await supabase
                .from('generated_resumes')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
            return count || 0
        },
        enabled: !!user?.id
    })

    const { data: candidaturasCount = 0 } = useQuery({
        queryKey: ['user-candidaturas-count', user?.id],
        queryFn: async () => {
            if (!user?.id) return 0
            const { count } = await supabase
                .from('kanban_applications')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
            return count || 0
        },
        enabled: !!user?.id
    })

    const { data: referralsCount = 0 } = useQuery({
        queryKey: ['user-referrals-count', user?.id],
        queryFn: async () => {
            if (!user?.id) return 0
            const { count } = await supabase
                .from('user_profiles')
                .select('*', { count: 'exact', head: true })
                .eq('referred_by', user.id)
            return count || 0
        },
        enabled: !!user?.id
    })

    const { data: recentAnalyses = [] } = useQuery({
        queryKey: ['recent-analyses', user?.id],
        queryFn: async () => {
            if (!user?.id) return []
            const { data } = await supabase
                .from('curriculum_analysis')
                .select('id, name, created_at, status')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(5)
            return (data || []).map(item => ({
                id: item.id,
                type: 'analysis' as const,
                title: `Análise de Currículo: ${item.name}`,
                date: new Date(item.created_at),
                status: item.status,
                href: `/analise/${item.id}`
            }))
        },
        enabled: !!user?.id
    })

    const { data: recentSimulations = [] } = useQuery({
        queryKey: ['recent-simulations', user?.id],
        queryFn: async () => {
            if (!user?.id) return []
            const { data } = await supabase
                .from('interview_simulations')
                .select('id, job_title, created_at, status')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(5)
            return (data || []).map(item => ({
                id: item.id,
                type: 'simulation' as const,
                title: `Simulação de Entrevista: ${item.job_title}`,
                date: new Date(item.created_at),
                status: item.status,
                href: '/simulador-entrevistas'
            }))
        },
        enabled: !!user?.id
    })

    const { data: recentResumes = [] } = useQuery({
        queryKey: ['recent-resumes', user?.id],
        queryFn: async () => {
            if (!user?.id) return []
            const { data } = await supabase
                .from('generated_resumes')
                .select('id, title, created_at')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(5)
            return (data || []).map(item => ({
                id: item.id,
                type: 'resume' as const,
                title: `Currículo Gerado: ${item.title}`,
                date: new Date(item.created_at),
                status: 'completed',
                href: '/gerador-curriculos'
            }))
        },
        enabled: !!user?.id
    })

    const { data: recentApplications = [] } = useQuery({
        queryKey: ['recent-applications', user?.id],
        queryFn: async () => {
            if (!user?.id) return []
            const { data } = await supabase
                .from('kanban_applications')
                .select('id, company, position, created_at, status')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(5)
            return (data || []).map(item => ({
                id: item.id,
                type: 'application' as const,
                title: `Candidatura: ${item.position} na empresa ${item.company}`,
                date: new Date(item.created_at),
                status: item.status,
                href: '/candidaturas'
            }))
        },
        enabled: !!user?.id
    })

    const recentActivities = [
        ...recentAnalyses,
        ...recentSimulations,
        // ...recentResumes,
        ...recentApplications
    ].sort((a, b) => b.date.getTime() - a.date.getTime())
     .slice(0, 5)

    const statusMeta: Record<string, { label: string; class: string }> = {
        completed: { label: 'Concluído', class: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
        started: { label: 'Iniciado', class: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
        processing: { label: 'Processando', class: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
        interested: { label: 'Interesse', class: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400' },
        applied: { label: 'Candidatado', class: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
        interview: { label: 'Entrevista', class: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
        test: { label: 'Teste Técnico', class: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400' },
        offer: { label: 'Proposta', class: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
        rejected: { label: 'Finalizado/Recusado', class: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' }
    }

    const quickActions = [
        {
            title: 'Analisar Currículo',
            description: 'Envie seu currículo e receba feedback detalhado com IA.',
            icon: FileText,
            href: '/analises/new',
            color: 'bg-blue-500',
            quantity: analysisCount,
            label: 'feitas'
        },
        {
            title: 'Simulador de Entrevistas',
            description: 'Pratique perguntas reais e melhore suas respostas com IA.',
            icon: Users,
            href: '/simulador-entrevistas',
            color: 'bg-green-500',
            quantity: simulationsCount,
            label: 'realizadas'
        },
        {
            title: 'Candidaturas',
            description: 'Acompanhe suas candidaturas em um quadro visual organizado.',
            icon: BarChart3,
            href: '/candidaturas',
            color: 'bg-orange-500',
            quantity: candidaturasCount,
            label: 'cadastradas'
        },
        /* STANDBY
        {
            title: 'Recompensas',
            description: 'Veja como ganhar mais créditos.',
            icon: Coins,
            href: '/recompensas',
            color: 'bg-violet-500'
        },
        {
            title: 'Indicar Amigos',
            description: 'Convide amigos e ganhe bônus exclusivos.',
            icon: Gift,
            href: '/convide-amigos',
            color: 'bg-pink-500',
            quantity: referralsCount,
            label: 'indicados'
        }
        */
    ]

    const getGreeting = () => {
        const hour = new Date().getHours()
        if (hour >= 5 && hour < 12) {
            return 'Bom dia'
        } else if (hour >= 12 && hour < 18) {
            return 'Boa tarde'
        } else {
            return 'Boa noite'
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
            <div className="max-w-7xl mx-auto p-4 space-y-8">
                <div className="text-center md:text-left">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 text-capitalize">
                        {getGreeting()}, {profile?.full_name || 'Estagionauta'}!
                    </h1>
                    <p className="text-gray-600 text-lg">
                        Sua jornada profissional começa aqui
                    </p>
                </div>

                {/* Quick Actions */}
                <div>
                    <h2 className="text-2xl font-bold mb-6">Ações Rápidas</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {quickActions.map((action, index) => (
                            <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
                                <Link to={action.href}>
                                    <CardContent className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center`}>
                                                <action.icon className="w-6 h-6 text-white" />
                                            </div>
                                            {action.quantity !== undefined && (
                                                <div className="text-right">
                                                    <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                                        {action.quantity}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground block">
                                                        {action.label}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <h3 className="font-semibold mb-2">{action.title}</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{action.description}</p>
                                    </CardContent>
                                </Link>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Histórico de Atividades */}
                <div>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold">Histórico de Atividades</h2>
                    </div>

                    {recentActivities.length > 0 ? (
                        <div className="space-y-4">
                            {recentActivities.map((activity) => {
                                const IconComponent = {
                                    analysis: FileText,
                                    simulation: Users,
                                    resume: Award,
                                    application: BarChart3
                                }[activity.type];

                                const meta = statusMeta[activity.status] || {
                                    label: activity.status,
                                    class: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                                };

                                return (
                                    <Card key={`${activity.type}-${activity.id}`} className="hover:shadow-md transition-shadow">
                                        <Link to={activity.href}>
                                            <CardContent className="p-4 flex items-center justify-between">
                                                <div className="flex items-center space-x-4">
                                                    <div className="p-2 bg-gray-100 rounded-lg dark:bg-gray-800">
                                                        <IconComponent className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                                                            {activity.title}
                                                        </h3>
                                                        <span className="text-xs text-muted-foreground">
                                                            {activity.date.toLocaleDateString('pt-BR')} às {activity.date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                </div>
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${meta.class}`}>
                                                    {meta.label}
                                                </span>
                                            </CardContent>
                                        </Link>
                                    </Card>
                                )
                            })}
                        </div>
                    ) : (
                        <Card>
                            <CardContent className="p-8 text-center">
                                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold mb-2">Nenhum registro de atividade</h3>
                                <p className="text-gray-600 mb-4">
                                    Simule entrevistas, analise currículos ou organize candidaturas para começar!
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}