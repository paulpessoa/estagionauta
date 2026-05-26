import { useState, useEffect } from 'react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Check, Star, Zap, Crown, Sparkles, Bot, Chrome } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useCredits } from '../hooks/useCredits'
import { useToast } from '../hooks/use-toast'
import { apiClient } from '../lib/apiClient'
import { useNavigate } from 'react-router-dom'


const plans = [
  {
    id: 'cosmonauta',
    name: 'Cosmonauta',
    icon: Star,
    credits: 30,
    price: 1.99,
    popular: false
  },
  {
    id: 'astronauta',
    name: 'Astronauta',
    icon: Zap,
    credits: 80,
    price: 4.99,
    popular: true
  },
  {
    id: 'comandante',
    name: 'Comandante',
    icon: Crown,
    credits: 200,
    price: 9.99,
    popular: false
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
    ]
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
    popular: true
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
    ]
  }
]


export default function Precos() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { credits } = useCredits()
  const { toast } = useToast()
  const [loading, setLoading] = useState<string | null>(null)
  const [billingType, setBillingType] = useState<'credits' | 'subscriptions'>('credits')

  useEffect(() => {
    if (user) {
      navigate('/creditos', { replace: true })
    }
  }, [user, navigate])

  const handlePurchase = async (planId: string) => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Você precisa estar logado para comprar créditos.",
        variant: "destructive",
      })
      return
    }

    setLoading(planId)
    try {
      // Criar checkout session no backend Hono
      const { url } = await apiClient.post<{ url: string }>('/api/stripe/checkout', { planId })
      
      // Redirecionar para Stripe Checkout
      if (url) {
        window.location.href = url
      } else {
        throw new Error('URL de checkout não foi retornada')
      }
    } catch (error: any) {
      console.error('Erro na compra:', error)
      toast({
        title: "Erro na compra",
        description: error.message || "Não foi possível processar sua compra. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(null)
    }
  }

  const handleSubscribe = () => {
    toast({
      title: "Planos de Assinatura Em Breve!",
      description: "Estamos finalizando a integração das assinaturas recorrentes. Por enquanto, utilize a Recarga de Créditos Avulsos!",
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Planos e Preços
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Acelere sua carreira e otimize sua busca por estágio com o poder da Inteligência Artificial.
          </p>
          
          {user && credits && (
            <div className="inline-flex items-center space-x-2 bg-white dark:bg-gray-800 rounded-lg px-4 py-2 shadow-sm border">
              <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
              <span className="text-sm font-medium">
                Seus créditos atuais: {credits.credits}
              </span>
            </div>
          )}
        </div>

        {/* Tab Switcher */}
        <div className="flex justify-center mb-12">
          <div className="bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-full inline-flex border border-slate-200/55 dark:border-slate-700/50">
            <button
              onClick={() => setBillingType('credits')}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                billingType === 'credits'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/20'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Recarga de Créditos (Compra Única)
            </button>
            <button
              onClick={() => setBillingType('subscriptions')}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 relative ${
                billingType === 'subscriptions'
                  ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm border border-slate-200/20'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Assinaturas Anuais
              <span className="absolute -top-1.5 -right-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-[10px] text-white px-2 py-0.5 rounded-full scale-90 border border-white dark:border-slate-800 font-bold">
                Em Breve
              </span>
            </button>
          </div>
        </div>

        {/* Content based on selected billing type */}
        {billingType === 'credits' ? (
          <div>
            <div className="text-center mb-8">
              <p className="text-sm text-muted-foreground">
                Cada análise de currículo custa 3 créditos • Seus créditos expiram em 30 dias após a compra
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {plans.map((plan) => (
                <Card 
                  key={plan.id}
                  className={`relative flex flex-col justify-between ${
                    plan.popular 
                      ? 'border-2 border-blue-500 shadow-xl scale-105' 
                      : 'border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white">
                      Mais Popular
                    </Badge>
                  )}
                  
                  <CardHeader className="text-center pb-4">
                    <div className="flex justify-center mb-2">
                      <plan.icon className="h-10 w-10 text-blue-500" />
                    </div>
                    <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-400">
                      {plan.credits} créditos • Válidos por 30 dias
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    {/* Price */}
                    <div className="text-center">
                      <div className="text-4xl font-bold text-gray-900 dark:text-white">
                        R$ {plan.price.toFixed(2).replace('.', ',')}
                      </div>
                    </div>

                    {/* Purchase Button */}
                    <Button 
                      className={`w-full ${
                        plan.popular 
                          ? 'bg-blue-600 hover:bg-blue-700' 
                          : 'bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100'
                      }`}
                      onClick={() => handlePurchase(plan.id)}
                      disabled={loading === plan.id}
                    >
                      {loading === plan.id ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Processando...</span>
                        </div>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Comprar {plan.credits} Créditos
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <div className="text-center mb-8">
              <p className="text-sm text-muted-foreground">
                Cobrança única anual • Créditos mensais recorrentes • Cancele a renovação quando quiser
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto animate-fadeIn">
              {subscriptionPlans.map((plan) => (
                <Card 
                  key={plan.id}
                  className={`relative flex flex-col justify-between ${
                    plan.popular 
                      ? 'border-2 border-purple-500 shadow-xl scale-105' 
                      : 'border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-500 text-white">
                      Mais Popular
                    </Badge>
                  )}
                  
                  <CardHeader className="text-center pb-4">
                    <div className="flex justify-center mb-2">
                      <plan.icon className="h-10 w-10 text-purple-500" />
                    </div>
                    <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
                      {plan.name}
                    </CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-400">
                      {plan.credits} créditos por mês
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-6 flex-grow flex flex-col justify-between">
                    <div>
                      {/* Price */}
                      <div className="text-center mb-6 flex flex-col items-center">
                        <div className="text-4xl font-bold text-gray-900 dark:text-white">
                          R$ {plan.monthlyEquivalent.toFixed(2).replace('.', ',')}
                          <span className="text-sm font-normal text-muted-foreground">/mês</span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                          Cobrado em parcela única de R$ {plan.price.toFixed(2).replace('.', ',')}/ano
                        </div>
                        <div className="inline-flex items-center gap-1.5 mt-3 bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 px-2.5 py-1 rounded-full text-xs font-bold border border-purple-100 dark:border-purple-900/30">
                          {(() => {
                            const avulsoRef = plan.id.startsWith('cosmonauta') ? 1.99 : plan.id.startsWith('astronauta') ? 4.99 : 9.99;
                            const disc = Math.round((1 - (plan.monthlyEquivalent / avulsoRef)) * 100);
                            return `${disc}% mais barato que avulso`;
                          })()}
                        </div>
                      </div>

                      {/* Benefits list */}
                      <ul className="space-y-2 mb-6">
                        {plan.benefits.map((benefit, i) => (
                          <li key={i} className="flex items-start text-xs text-muted-foreground gap-2">
                            <Check className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Subscribe Button */}
                    <Button 
                      className={`w-full ${
                        plan.popular 
                          ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                          : 'bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100'
                      }`}
                      onClick={handleSubscribe}
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      Assinar (Em Breve)
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Como funciona */}
        <div className="mt-20 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4 text-gray-900 dark:text-white">
            Como funcionam os créditos?
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-10 max-w-xl mx-auto">
            Cada ferramenta consome uma quantidade de créditos. Use como quiser, sem planos fixos.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border text-center shadow-sm">
              <div className="text-3xl font-extrabold text-blue-600 mb-2">3 créditos</div>
              <p className="font-semibold text-sm">Análise de Currículo</p>
              <p className="text-xs text-muted-foreground mt-1">Revisão completa com IA</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border text-center shadow-sm">
              <div className="text-3xl font-extrabold text-purple-600 mb-2">2 créditos</div>
              <p className="font-semibold text-sm">Simulador de Entrevista</p>
              <p className="text-xs text-muted-foreground mt-1">5 rodadas de perguntas com IA</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border text-center shadow-sm">
              <div className="text-3xl font-extrabold text-green-600 mb-2">1 crédito</div>
              <p className="font-semibold text-sm">Gerador de Currículo</p>
              <p className="text-xs text-muted-foreground mt-1">Geração automática de PDF</p>
            </div>
          </div>
        </div>

        {/* Em Breve: Extensão e Assistente IA */}
        <div className="mt-20 max-w-5xl mx-auto border-t pt-16">
          <h2 className="text-3xl font-bold text-center mb-10 text-gray-900 dark:text-white">
            Em Breve na Plataforma
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Extensão do Chrome */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 p-8 rounded-3xl border border-blue-100 dark:border-gray-800">
              <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 px-3 py-1 rounded-full text-xs font-semibold mb-4">
                <Chrome className="h-3.5 w-3.5" /> Extensão do Chrome
              </div>
              <h3 className="text-xl font-extrabold mb-3 leading-tight">
                Capture vagas e salve na hora
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-4">
                Capture dados do LinkedIn ou Gupy. Use o **modo gratuito** (salvando localmente com sua própria API Key de IA ou integrando ao Google Sheets) ou o **modo premium** sincronizado em nuvem no Estagionauta.
              </p>
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Grátis: LocalStorage + Google Sheets (Sua API Key)
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Premium: Sincronização em nuvem e IA integrada
                </li>
              </ul>
            </div>

            {/* Assistente do Estagiário */}
            <div className="bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-gray-900 dark:to-gray-800 p-8 rounded-3xl border border-purple-100 dark:border-gray-800">
              <div className="inline-flex items-center gap-2 bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300 px-3 py-1 rounded-full text-xs font-semibold mb-4">
                <Bot className="h-3.5 w-3.5" /> Assistente do Estagiário
              </div>
              <h3 className="text-xl font-extrabold mb-3 leading-tight">
                Seu assistente pessoal com IA
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-4">
                Um chat inteligente que tira dúvidas sobre processos seletivos, te ajuda a montar estratégias e revisa suas respostas.
              </p>
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Disponível em planos futuros
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Integrado à extensão e à plataforma
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8 text-gray-900 dark:text-white">
            Perguntas Frequentes
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">
                Como funcionam os créditos?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Cada análise de currículo consome 3 créditos. Simulações consomem 2 créditos e geração consome 1 crédito. Os créditos são válidos por 30 dias após a compra.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">
                Qual plano escolher?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Cosmonauta para testar, Astronauta para uso regular, Comandante para uso intensivo. Todos os planos oferecem a mesma qualidade de análise.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">
                Os créditos expiram?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Sim! Para garantir o melhor fluxo de uso na plataforma, seus créditos expiram exatamente 1 mês (30 dias) após a data da compra.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">
                Como funciona o pagamento?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Aceitamos cartões de crédito e PIX. O pagamento é processado de forma segura pelo Stripe.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
            <h2 className="text-2xl font-bold mb-4">
              Comece a melhorar seu currículo hoje!
            </h2>
            <p className="text-blue-100 mb-6">
              Análises precisas com IA para destacar seus pontos fortes
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <Button 
                size="lg" 
                className="bg-white text-blue-600 hover:bg-gray-100 w-full sm:w-auto"
                onClick={() => window.location.href = '/analise-curriculo'}
              >
                Analisar Currículo
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="bg-transparent border-white text-white hover:bg-white/10 w-full sm:w-auto"
                onClick={() => window.location.href = '/resultado-curriculo-exemplo'}
              >
                Ver Exemplo de Análise
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}