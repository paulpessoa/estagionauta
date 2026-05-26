import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/hooks/useAuth'
import { useCredits } from '@/hooks/useCredits'
import { useToast } from '@/hooks/use-toast'
import { apiClient } from '@/lib/apiClient'
import {
  Star,
  ArrowUpRight,
  ArrowDownLeft,
  Sparkles,
  Coins,
  History,
  ShoppingBag,
  Zap,
  Crown,
  Loader2
} from 'lucide-react'

interface Transaction {
  id: string
  amount: number
  description: string
  created_at: string
}

const packages = [
  {
    id: 'cosmonauta',
    name: 'Cosmonauta',
    icon: Star,
    credits: 30,
    price: 1.99,
    popular: false,
    color: 'border-slate-200 dark:border-slate-800'
  },
  {
    id: 'astronauta',
    name: 'Astronauta',
    icon: Zap,
    credits: 80,
    price: 4.99,
    popular: true,
    color: 'border-blue-500 ring-2 ring-blue-500/20'
  },
  {
    id: 'comandante',
    name: 'Comandante',
    icon: Crown,
    credits: 200,
    price: 9.99,
    popular: false,
    color: 'border-purple-500'
  }
]

const subscriptionPlans = [
  {
    id: 'cosmonauta_pro',
    name: 'Básico',
    icon: Star,
    credits: 50,
    price: 34.80,
    monthlyEquivalent: 2.90,
    benefits: [
      'Kanban de vagas completo',
      'Suporte por e-mail',
      'Sincronização premium com a Extensão'
    ],
    color: 'border-slate-200 dark:border-slate-800'
  },
  {
    id: 'astronauta_pro',
    name: 'Recomendado',
    icon: Zap,
    credits: 150,
    price: 70.80,
    monthlyEquivalent: 5.90,
    benefits: [
      'Simulações de entrevista ilimitadas',
      'Geração de currículos ilimitada',
      'Suporte prioritário'
    ],
    popular: true,
    color: 'border-blue-500 ring-2 ring-blue-500/20'
  },
  {
    id: 'comandante_pro',
    name: 'Avançado',
    icon: Crown,
    credits: 500,
    price: 142.80,
    monthlyEquivalent: 11.90,
    benefits: [
      'Todos os recursos ilimitados',
      'Acesso antecipado a novidades',
      'Assistente do Estagiário com IA'
    ],
    color: 'border-purple-500'
  }
]

export default function Creditos() {
  const { user } = useAuth()
  const { credits, refreshCredits } = useCredits()
  const { toast } = useToast()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loadingTransactions, setLoadingTransactions] = useState(true)
  const [purchaseLoading, setPurchaseLoading] = useState<string | null>(null)
  const [billingType, setBillingType] = useState<'credits' | 'subscriptions'>('credits')

  const handleSubscribe = () => {
    toast({
      title: "Planos de Assinatura Em Breve!",
      description: "Estamos finalizando a integração das assinaturas recorrentes. Por enquanto, utilize a Recarga de Créditos Avulsos!",
    })
  }

  useEffect(() => {
    fetchTransactions()
  }, [user])

  const fetchTransactions = async () => {
    if (!user) return
    try {
      setLoadingTransactions(true)
      const data = await apiClient.get<Transaction[]>('/api/credits/transactions')
      setTransactions(data || [])
    } catch (error) {
      console.error('Erro ao buscar transações:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar o histórico de transações.',
        variant: 'destructive'
      })
    } finally {
      setLoadingTransactions(false)
    }
  }

  const handlePurchase = async (planId: string) => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Você precisa estar logado para comprar créditos.",
        variant: "destructive",
      })
      return
    }

    setPurchaseLoading(planId)
    try {
      const { url } = await apiClient.post<{ url: string }>('/api/stripe/checkout', { planId })
      if (url) {
        window.location.href = url
      } else {
        throw new Error('URL de checkout não foi retornada')
      }
    } catch (error: any) {
      console.error('Erro na compra:', error)
      toast({
        title: "Erro na compra",
        description: error.message || "Não foi possível iniciar o checkout. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setPurchaseLoading(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Coins className="h-8 w-8 text-yellow-500 fill-yellow-500" />
              Gestão de Créditos
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie seus créditos, compre recargas e acompanhe seu histórico de uso.
            </p>
          </div>

          <div className="bg-card border rounded-xl p-4 flex items-center gap-4 shadow-sm w-fit">
            <div className="p-3 bg-yellow-500/10 rounded-lg text-yellow-500">
              <Coins className="h-6 w-6 fill-yellow-500" />
            </div>
            <div>
              <span className="text-sm text-muted-foreground block font-medium">Saldo Atual</span>
              <span className="text-2xl font-bold text-foreground">{credits?.credits ?? 0} créditos</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna 1 & 2: Comprar Créditos */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="pt-6">
              <CardContent>
                {/* Tab Switcher */}
                <div className="flex justify-center mb-8">
                  <div className="bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-full inline-flex border border-slate-200/55 dark:border-slate-700/50">
                    <button
                      onClick={() => setBillingType('credits')}
                      className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300 ${
                        billingType === 'credits'
                          ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/20'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Recarga de Créditos (Compra Única)
                    </button>
                    <button
                      onClick={() => setBillingType('subscriptions')}
                      className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300 relative ${
                        billingType === 'subscriptions'
                          ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm border border-slate-200/20'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Assinaturas Anuais
                      <span className="absolute -top-1.5 -right-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-[9px] text-white px-2 py-0.5 rounded-full scale-90 border border-white dark:border-slate-800 font-bold">
                        Em Breve
                      </span>
                    </button>
                  </div>
                </div>

                {billingType === 'credits' ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {packages.map((pkg) => {
                      const IconComponent = pkg.icon
                      return (
                        <div
                          key={pkg.id}
                          className={`border rounded-2xl p-5 flex flex-col justify-between relative transition-all duration-300 hover:shadow-md ${pkg.color} ${pkg.popular ? 'bg-blue-50/10 dark:bg-blue-950/10' : 'bg-card'
                            }`}
                        >
                          {pkg.popular && (
                            <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white">
                              Mais Popular
                            </Badge>
                          )}

                          <div>
                            <div className="flex justify-between items-start mb-4">
                              <h3 className="font-bold text-lg">{pkg.name}</h3>
                              <IconComponent className="h-6 w-6 text-primary" />
                            </div>

                            <div className="text-3xl font-extrabold text-foreground mb-1">
                              {pkg.credits}
                            </div>
                            <span className="text-sm text-muted-foreground block mb-6">créditos</span>
                          </div>

                          <div>
                            <Separator className="my-4" />
                            <div className="text-2xl font-bold text-foreground mb-1">
                              R$ {pkg.price.toFixed(2).replace('.', ',')}
                            </div>
                            <div className="text-xs text-muted-foreground font-medium mb-4">
                              Pagamento Único
                            </div>

                            <Button
                              className="w-full"
                              variant={pkg.popular ? 'default' : 'outline'}
                              onClick={() => handlePurchase(pkg.id)}
                              disabled={purchaseLoading !== null}
                            >
                              {purchaseLoading === pkg.id ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <Sparkles className="h-4 w-4 mr-2" />
                              )}
                              Comprar
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {subscriptionPlans.map((plan) => {
                      const IconComponent = plan.icon
                      return (
                        <div
                          key={plan.id}
                          className={`border rounded-2xl p-5 flex flex-col justify-between relative transition-all duration-300 hover:shadow-md ${plan.color} ${plan.popular ? 'bg-purple-50/10 dark:bg-purple-950/10 border-purple-500' : 'bg-card'
                            }`}
                        >
                          {plan.popular && (
                            <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-600 text-white">
                              Mais Popular
                            </Badge>
                          )}

                          <div>
                            <div className="flex justify-between items-start mb-4">
                              <h3 className="font-bold text-lg">{plan.name}</h3>
                              <IconComponent className="h-6 w-6 text-purple-500" />
                            </div>

                            <div className="text-3xl font-extrabold text-foreground mb-1">
                               {plan.credits}
                             </div>
                            <span className="text-sm text-muted-foreground block mb-4">créditos mensais</span>
                          </div>

                           <div>
                            <Separator className="my-4" />
                            <div className="text-2xl font-bold text-foreground mb-1">
                              R$ {plan.monthlyEquivalent.toFixed(2).replace('.', ',')} / mês
                            </div>
                            <div className="text-xs text-muted-foreground mb-1">
                              Cobrado em parcela única de R$ {plan.price.toFixed(2).replace('.', ',')}/ano
                            </div>
                            
                            <div className="inline-flex items-center gap-1 mt-1 mb-4 bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full text-[10px] font-bold border border-purple-100 dark:border-purple-900/30">
                              {(() => {
                                const avulsoRef = plan.id.startsWith('cosmonauta') ? 1.99 : plan.id.startsWith('astronauta') ? 4.99 : 9.99;
                                const disc = Math.round((1 - (plan.monthlyEquivalent / avulsoRef)) * 100);
                                return `${disc}% mais barato que avulso`;
                              })()}
                            </div>

                            <Button
                              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                              onClick={handleSubscribe}
                            >
                              <Sparkles className="h-4 w-4 mr-2" />
                              Assinar (Em Breve)
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                <div className="mt-6 bg-muted/40 p-4 rounded-xl text-sm flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block mb-1">Como os créditos são consumidos?</span>
                    <ul className="list-disc pl-4 text-muted-foreground space-y-1">
                      <li><strong>Análise de Currículo com IA:</strong> 3 créditos</li>
                      <li><strong>Simulador de Entrevistas com IA:</strong> 2 créditos</li>
                      <li><strong>Gerador de Currículos com IA:</strong> 1 crédito</li>
                      <li><strong>Kanban de Vagas:</strong> Gratuito (limites conforme o nível do plano)</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Coluna 3: Histórico de Transações */}
          <div className="lg:col-span-1">
            <Card className="h-full flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  Histórico de Uso
                </CardTitle>
                <CardDescription>
                  Suas últimas transações de crédito.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto max-h-[500px]">
                {loadingTransactions ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <History className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p>Nenhuma transação encontrada.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {transactions.map((tx) => {
                      const isPositive = tx.amount > 0
                      return (
                        <div key={tx.id} className="flex justify-between items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-full mt-0.5 ${isPositive ? 'bg-green-100 text-green-700 dark:bg-green-950/30' : 'bg-red-100 text-red-700 dark:bg-red-950/30'
                              }`}>
                              {isPositive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}
                            </div>
                            <div>
                              <span className="font-semibold text-sm block leading-tight text-foreground">{tx.description}</span>
                              <span className="text-xs text-muted-foreground">{formatDate(tx.created_at)}</span>
                            </div>
                          </div>

                          <span className={`font-bold text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                            {isPositive ? '+' : ''}{tx.amount} créditos
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
