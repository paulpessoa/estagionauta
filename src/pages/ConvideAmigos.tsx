import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'
import { apiClient } from '@/lib/apiClient'
import { 
  Users, 
  Copy, 
  Check, 
  Gift, 
  Coins,
  Share2,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Mail,
  Send,
  Loader2,
  Calendar
} from 'lucide-react'
import { toast } from 'sonner'

interface Invitee {
  id: string
  name: string
  email: string
  status: 'pending' | 'registered' | 'active'
  created_at: string
  updated_at: string
}

interface ReferralStats {
  referralCode: string
  referralUrl: string
  totalInvited: number
  registeredCount: number
  activeCount: number
  totalEarnedCredits: number
  invitees: Invitee[]
}

export default function ConvideAmigos() {
  const { profile } = useAuth()
  
  // Stats state
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)
  
  // Invite form state
  const [inviteName, setInviteName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [submittingInvite, setSubmittingInvite] = useState(false)
  
  // Copy state
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  // Fetch statistics
  const fetchStats = useCallback(async () => {
    setLoadingStats(true)
    try {
      const data = await apiClient.get<ReferralStats>('/api/referral/stats')
      setStats(data)
    } catch (err) {
      console.error('Error fetching referral stats:', err)
      toast.error('Não foi possível carregar o histórico de indicações.')
    } finally {
      setLoadingStats(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  const referralCode = stats?.referralCode || profile?.referral_code || '------'
  const referralLink = stats?.referralUrl || `${window.location.origin}/r/${referralCode}`

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode)
    setCopiedCode(true)
    toast.success('Código de indicação copiado!')
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink)
    setCopiedLink(true)
    toast.success('Link de indicação copiado!')
    setTimeout(() => setCopiedLink(false), 2000)
  }

  // Handle invite submission
  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!inviteName.trim()) {
      toast.error('Por favor, informe o nome do seu amigo.')
      return
    }
    if (!inviteEmail.trim()) {
      toast.error('Por favor, informe o e-mail do seu amigo.')
      return
    }

    setSubmittingInvite(true)
    try {
      const response = await apiClient.post<{ success: boolean; emailSent: boolean; message: string }>('/api/referral/invite', {
        name: inviteName.trim(),
        email: inviteEmail.trim(),
      })

      if (response.success) {
        if (response.emailSent) {
          toast.success(response.message || 'Convite enviado com sucesso por e-mail!')
        } else {
          toast.warning(response.message || 'Convite cadastrado, mas o e-mail não pôde ser enviado.')
        }
        setInviteName('')
        setInviteEmail('')
        // Refresh statistics to show new invite in list
        fetchStats()
      } else {
        toast.error(response.message || 'Erro ao enviar convite.')
      }
    } catch (err: any) {
      console.error('Error sending referral invite:', err)
      const errorMsg = err.response?.data?.error || 'Erro ao enviar convite. Tente novamente mais tarde.'
      toast.error(errorMsg)
    } finally {
      setSubmittingInvite(false)
    }
  }

  const steps = [
    {
      icon: Share2,
      title: "1. Envie o Link",
      description: "Copie seu link ou código exclusivo e compartilhe com seus amigos de faculdade ou grupos.",
      color: "bg-blue-500/10 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
    },
    {
      icon: Users,
      title: "2. Cadastro do Amigo",
      description: "Seu amigo se cadastra. Ele ganha 5 créditos de boas-vindas na hora para testar.",
      color: "bg-purple-500/10 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
    },
    {
      icon: Coins,
      title: "3. Ganhe Créditos",
      description: "Você ganha 3 créditos no cadastro do seu amigo, e mais 5 créditos se ele fizer a primeira compra.",
      color: "bg-yellow-500/10 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400"
    }
  ]

  // Translate status to badge
  const renderStatusBadge = (status: 'pending' | 'registered' | 'active') => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50">Pendente</Badge>
      case 'registered':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50">Cadastrado</Badge>
      case 'active':
        return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">Ativo</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/40 via-background to-violet-50/40 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-1.5 bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300 px-3.5 py-1 rounded-full text-xs font-bold border border-violet-100 dark:border-violet-900/30 mb-4 shadow-sm">
            <Gift className="h-3.5 w-3.5" /> Indique e Ganhe
          </div>
          <h1 className="text-4xl font-extrabold text-foreground tracking-tight sm:text-5xl leading-none bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-400">
            Traga seus amigos para o Estagionauta
          </h1>
          <p className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto font-medium">
            Compartilhe a plataforma com seus colegas de faculdade. Eles ganham créditos de boas-vindas e você ganha bônus para turbinar suas simulações de entrevistas e análises.
          </p>
        </div>

        {/* Dashboard de Estatísticas Rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="hover:shadow-md transition-all duration-300 bg-card/60 backdrop-blur-sm border-border/80">
            <CardContent className="p-5 flex flex-col justify-between h-full">
              <span className="text-sm font-semibold text-muted-foreground">Total Convidado</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-3xl font-extrabold">{loadingStats ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /> : stats?.totalInvited || 0}</span>
                <Mail className="h-5 w-5 text-blue-500 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-all duration-300 bg-card/60 backdrop-blur-sm border-border/80">
            <CardContent className="p-5 flex flex-col justify-between h-full">
              <span className="text-sm font-semibold text-muted-foreground">Cadastrados</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-3xl font-extrabold">{loadingStats ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /> : stats?.registeredCount || 0}</span>
                <Users className="h-5 w-5 text-indigo-500 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-all duration-300 bg-card/60 backdrop-blur-sm border-border/80">
            <CardContent className="p-5 flex flex-col justify-between h-full">
              <span className="text-sm font-semibold text-muted-foreground">Indicados Ativos</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-3xl font-extrabold">{loadingStats ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /> : stats?.activeCount || 0}</span>
                <Sparkles className="h-5 w-5 text-emerald-500 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-all duration-300 bg-gradient-to-br from-violet-600/5 to-indigo-600/5 dark:from-violet-950/10 dark:to-indigo-950/10 border-primary/20">
            <CardContent className="p-5 flex flex-col justify-between h-full">
              <span className="text-sm font-semibold text-violet-700 dark:text-violet-300">Créditos Ganhos</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-3xl font-extrabold text-violet-600 dark:text-violet-400">
                  {loadingStats ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /> : `+${stats?.totalEarnedCredits || 0}`}
                </span>
                <Coins className="h-5 w-5 text-violet-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Blocos de Ação Principais */}
        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          
          {/* Link block */}
          <Card className="lg:col-span-2 shadow-sm border border-border/80 bg-card/45 backdrop-blur-sm flex flex-col justify-between">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl flex items-center gap-2 font-bold tracking-tight">
                <Share2 className="h-5 w-5 text-violet-600" /> Seu Link de Indicação
              </CardTitle>
              <CardDescription>
                Compartilhe o seu link exclusivo nas suas redes, grupos da faculdade ou WhatsApp.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 flex-grow">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Link de Cadastro</Label>
                <div className="flex gap-2">
                  <div className="flex-1 bg-muted/30 dark:bg-muted/10 border rounded-lg px-3 py-2.5 text-sm font-mono truncate select-all flex items-center text-muted-foreground">
                    {referralLink}
                  </div>
                  <Button onClick={handleCopyLink} className="shrink-0 bg-violet-600 hover:bg-violet-700 active:scale-95 transition-all">
                    {copiedLink ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    <span className="hidden sm:inline ml-2">{copiedLink ? 'Copiado' : 'Copiar'}</span>
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Código de Indicação</Label>
                <div className="flex gap-3 items-center">
                  <div className="bg-violet-50 dark:bg-violet-950/20 border-2 border-dashed border-violet-200 dark:border-violet-800/40 rounded-lg px-4 py-2 text-2xl font-black font-mono tracking-wider text-violet-700 dark:text-violet-300 text-center min-w-[140px]">
                    {referralCode}
                  </div>
                  <Button variant="outline" onClick={handleCopyCode} className="active:scale-95 transition-all border-violet-200 hover:border-violet-300 hover:bg-violet-50/50 dark:border-violet-900 dark:hover:bg-violet-950/10">
                    {copiedCode ? <Check className="h-4 w-4 text-violet-600" /> : <Copy className="h-4 w-4 text-violet-600" />}
                    <span className="ml-2 text-violet-700 dark:text-violet-300">{copiedCode ? 'Copiado' : 'Copiar Código'}</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form block */}
          <Card className="shadow-sm border border-border/80 bg-card/45 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl flex items-center gap-2 font-bold tracking-tight">
                <Mail className="h-5 w-5 text-violet-600" /> Convidar por E-mail
              </CardTitle>
              <CardDescription>
                Envie um convite personalizado diretamente pelo Estagionauta.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendInvite} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="friend-name" className="text-xs font-bold text-muted-foreground uppercase">Nome do Amigo</Label>
                  <Input 
                    id="friend-name"
                    placeholder="Ex: Paul McCartney"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    disabled={submittingInvite}
                    className="focus-visible:ring-violet-600 border-border/80"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="friend-email" className="text-xs font-bold text-muted-foreground uppercase">E-mail do Amigo</Label>
                  <Input 
                    id="friend-email"
                    type="email"
                    placeholder="Ex: paul@beatles.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    disabled={submittingInvite}
                    className="focus-visible:ring-violet-600 border-border/80"
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={submittingInvite} 
                  className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 transition-all font-semibold active:scale-98 shadow-sm flex items-center justify-center gap-2"
                >
                  {submittingInvite ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Enviar Convite
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

        </div>

        {/* Tabela de Convidados */}
        <Card className="mb-12 shadow-sm border border-border/80 bg-card/30 backdrop-blur-sm overflow-hidden">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-lg font-bold tracking-tight flex items-center gap-2">
              <Users className="h-5 w-5 text-violet-600" /> Amigos Convidados
            </CardTitle>
            <CardDescription>
              Acompanhe o progresso e o status das suas indicações.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loadingStats ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm font-medium">Carregando seus convidados...</p>
              </div>
            ) : !stats?.invitees || stats.invitees.length === 0 ? (
              <div className="text-center py-16 px-4">
                <Mail className="h-12 w-12 text-muted-foreground/45 mx-auto mb-3" />
                <h3 className="font-bold text-base">Nenhum convite enviado ainda</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1">
                  Os amigos que você convidar por e-mail ou que utilizarem seu código aparecerão aqui.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/40 dark:bg-muted/5 border-b border-border/50 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      <th className="px-6 py-4 font-semibold">Nome</th>
                      <th className="px-6 py-4 font-semibold">E-mail</th>
                      <th className="px-6 py-4 font-semibold">Status</th>
                      <th className="px-6 py-4 font-semibold">Data do Convite</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {stats.invitees.map((invitee) => (
                      <tr key={invitee.id} className="hover:bg-muted/10 dark:hover:bg-muted/5 transition-colors">
                        <td className="px-6 py-4 font-semibold text-foreground">{invitee.name}</td>
                        <td className="px-6 py-4 font-mono text-muted-foreground text-xs">{invitee.email}</td>
                        <td className="px-6 py-4">{renderStatusBadge(invitee.status)}</td>
                        <td className="px-6 py-4 text-muted-foreground flex items-center gap-1.5 text-xs">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground/60" />
                          {new Date(invitee.created_at).toLocaleDateString('pt-BR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Como funciona */}
        <div className="mb-12">
          <h2 className="text-2xl font-extrabold text-center mb-8 bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-400">Como funciona o programa de indicações?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((step, idx) => {
              const IconComponent = step.icon
              return (
                <Card key={idx} className="relative hover:shadow-lg transition-all duration-300 bg-card/50 border-border/80 group">
                  <CardHeader className="pb-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 duration-300 ${step.color}`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <CardTitle className="text-lg font-bold tracking-tight">{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed font-medium">{step.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Regras */}
        <Card className="bg-violet-600/5 dark:bg-violet-950/10 border border-violet-200/50 dark:border-violet-900/40">
          <CardContent className="p-6 text-sm leading-relaxed">
            <span className="font-bold text-violet-800 dark:text-violet-300 block mb-3 text-base flex items-center gap-1.5">
              <TrendingUp className="h-4.5 w-4.5" /> Observações Importantes
            </span>
            <ul className="list-disc pl-5 space-y-2 text-xs text-muted-foreground font-medium">
              <li>Os créditos recebidos via indicação são classificados como créditos bônus e possuem **validade de 6 meses** a partir da data de ganho.</li>
              <li>Tentativas de fraudar o sistema de indicações criando contas falsas ou duplicadas resultarão no banimento permanente das contas e perda de todos os créditos associados.</li>
              <li>O Estagionauta se reserva o direito de alterar os valores de premiação em créditos a qualquer momento.</li>
            </ul>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}