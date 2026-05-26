import { useState, useEffect } from 'react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Check, Star, Zap, Crown, Sparkles } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useCredits } from '../hooks/useCredits'
import { useToast } from '../hooks/use-toast'
import { apiClient } from '../lib/apiClient'
import { StripeDebug } from '../components/StripeDebug'
import { useNavigate } from 'react-router-dom'


const plans = [
  {
    id: 'cosmonauta',
    name: 'Cosmonauta',
    icon: Star,
    credits: 30,
    analyses: 10,
    price: 1.99,
    pricePerAnalysis: 0.20,
    popular: false
  },
  {
    id: 'astronauta',
    name: 'Astronauta',
    icon: Zap,
    credits: 100,
    analyses: 33,
    price: 4.99,
    pricePerAnalysis: 0.15,
    popular: true
  },
  {
    id: 'comandante',
    name: 'Comandante',
    icon: Crown,
    credits: 350,
    price: 9.99,
    pricePerAnalysis: 0.09, // Consome 3 por análise -> 350 créditos / 3 = 116 análises.
    popular: false
  }
]

const subscriptionPlans = [
  {
    id: 'cosmonauta_pro',
    name: 'Cosmonauta Pro',
    icon: Star,
    credits: 50,
    price: 9.90,
    benefits: [
      '50 créditos recorrentes mensais',
      'Até 16 análises de currículo com IA',
      'Acesso total ao Kanban de vagas',
      'Suporte via e-mail em até 24h',
      'Acesso gratuito à Extensão do Chrome'
    ],
    badge: 'Plano Pro'
  },
  {
    id: 'astronauta_pro',
    name: 'Astronauta Pro',
    icon: Zap,
    credits: 150,
    price: 19.90,
    benefits: [
      '150 créditos recorrentes/mês',
      'Até 50 análises de currículo/mês',
      'Simulações de entrevista ilimitadas',
      'Geração de currículos ilimitada',
      'Suporte prioritário via WhatsApp'
    ],
    badge: 'Mais Popular',
    popular: true
  },
  {
    id: 'comandante_pro',
    name: 'Comandante Pro',
    icon: Crown,
    credits: 500,
    price: 49.90,
    benefits: [
      '500 créditos recorrentes/mês',
      'Até 166 análises de currículo/mês',
      'Simulações e gerações ilimitadas',
      'Análise de vaga automática com IA',
      'Acesso antecipado a novas ferramentas'
    ],
    badge: 'Elite'
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
              Assinaturas Mensais
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
                Cada análise de currículo custa 3 créditos • Seus créditos não expiram
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
                      Equivale a ~{Math.floor(plan.credits / 3)} análises completas
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    {/* Price */}
                    <div className="text-center">
                      <div className="text-4xl font-bold text-gray-900 dark:text-white">
                        R$ {plan.price.toFixed(2).replace('.', ',')}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {plan.credits} créditos inclusos
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
                Cobrança recorrente mensal • Cancele quando quiser diretamente no painel
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
                      {!plan.popular && (
                        <Badge variant="outline" className="text-[10px] uppercase font-bold text-muted-foreground">
                          {plan.badge}
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-400">
                      Receba {plan.credits} créditos mensais
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-6 flex-grow flex flex-col justify-between">
                    <div>
                      {/* Price */}
                      <div className="text-center mb-6">
                        <div className="text-4xl font-bold text-gray-900 dark:text-white">
                          R$ {plan.price.toFixed(2).replace('.', ',')}
                          <span className="text-sm font-normal text-muted-foreground">/mês</span>
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

        {/* Tabela Comparativa de Limites */}
        <div className="mt-20 max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4 text-gray-900 dark:text-white">
            Comparativo de Recursos por Nível
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-10 max-w-xl mx-auto">
            Entenda o que cada nível libera na plataforma para otimizar sua busca por estágio.
          </p>

          <div className="border rounded-2xl overflow-hidden shadow-sm bg-white dark:bg-gray-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b">
                    <th className="p-4 font-bold text-sm text-gray-700 dark:text-gray-300">Funcionalidade / Limite</th>
                    <th className="p-4 font-bold text-sm text-center text-gray-700 dark:text-gray-300">Cosmonauta</th>
                    <th className="p-4 font-bold text-sm text-center text-gray-700 dark:text-gray-300">Astronauta</th>
                    <th className="p-4 font-bold text-sm text-center text-gray-700 dark:text-gray-300">Comandante</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm">
                  <tr>
                    <td className="p-4 font-medium">Créditos Inclusos (Recarga)</td>
                    <td className="p-4 text-center">30 ⭐</td>
                    <td className="p-4 text-center font-semibold text-blue-600 dark:text-blue-400">100 ⭐</td>
                    <td className="p-4 text-center">350 ⭐</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium">Revisões de Currículo com IA (3 cr/cada)</td>
                    <td className="p-4 text-center">Até 10/mês</td>
                    <td className="p-4 text-center font-semibold text-blue-600 dark:text-blue-400">Até 33/mês</td>
                    <td className="p-4 text-center">Até 116/mês</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium">Simulações de Entrevista (2 cr/cada)</td>
                    <td className="p-4 text-center">Até 5/mês</td>
                    <td className="p-4 text-center">Até 20/mês</td>
                    <td className="p-4 text-center font-semibold text-blue-600 dark:text-blue-400">Ilimitado</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium">Gerações de Currículos (1 cr/cada)</td>
                    <td className="p-4 text-center">Até 5/mês</td>
                    <td className="p-4 text-center">Até 15/mês</td>
                    <td className="p-4 text-center font-semibold text-blue-600 dark:text-blue-400">Ilimitado</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium">Vagas no Kanban</td>
                    <td className="p-4 text-center">Até 15 vagas</td>
                    <td className="p-4 text-center">Até 50 vagas</td>
                    <td className="p-4 text-center font-semibold text-blue-600 dark:text-blue-400">Ilimitado</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium">Lembretes de Agenda & Notificações</td>
                    <td className="p-4 text-center text-red-500">❌ Não</td>
                    <td className="p-4 text-center text-green-500 font-semibold">✅ Sim</td>
                    <td className="p-4 text-center text-green-500 font-semibold">✅ Sim (Prioritário)</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium">Integração com a Extensão do Chrome</td>
                    <td className="p-4 text-center text-green-500 font-medium">✅ Gratuita</td>
                    <td className="p-4 text-center text-green-500 font-medium">✅ Gratuita</td>
                    <td className="p-4 text-center text-green-500 font-semibold">✅ Inteligência Artificial Auto-fill</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Seção da Extensão do Chrome */}
        <div className="mt-20 max-w-5xl mx-auto border-t pt-16">
          <div className="grid md:grid-cols-2 gap-8 items-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 p-8 rounded-3xl border border-blue-100 dark:border-gray-800">
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 px-3 py-1 rounded-full text-xs font-semibold mb-4">
                <Sparkles className="h-3.5 w-3.5 text-blue-500 fill-blue-500" /> Em Breve: Extensão do Chrome
              </div>
              <h2 className="text-3xl font-extrabold mb-4 leading-tight">
                Capture Vagas em 1 Clique direto no seu Navegador
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm leading-relaxed">
                Nossa futura extensão gratuita do Chrome vai ajudar você a economizar tempo de preenchimento. 
                Ao abrir a extensão em portais como LinkedIn, Gupy ou Cia de Talentos, ela captura os dados da vaga e os envia instantaneamente para o seu Kanban no Estagionauta.
              </p>
              <ul className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Captura automática de Título, Empresa, Requisitos e Link
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Sem redigitar ou copiar e colar
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Gere currículos e cartas específicas para a vaga direto do dashboard
                </li>
              </ul>
            </div>
            
            <div className="flex flex-col items-center justify-center p-6 bg-card border rounded-2xl shadow-sm text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-xl"></div>
              <Zap className="h-12 w-12 text-blue-500 mb-4 animate-bounce" />
              <h3 className="font-bold text-lg mb-2">Busca de Vagas Descomplicada</h3>
              <p className="text-xs text-muted-foreground max-w-xs mb-4">
                Depois de salvar a vaga pela extensão, use o Simulador de Entrevistas e a Análise de IA na plataforma para aumentar suas chances de aprovação.
              </p>
              <Badge variant="outline" className="text-xs">Extensão Gratuita para Todos os Usuários</Badge>
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
                Cada análise de currículo consome 3 créditos. Os créditos não expiram e podem ser usados a qualquer momento.
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
                Não! Os créditos são válidos permanentemente e podem ser usados quando quiser.
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
            <Button 
              size="lg" 
              className="bg-white text-blue-600 hover:bg-gray-100"
              onClick={() => window.location.href = '/analise-curriculo'}
            >
              <Zap className="mr-2 h-5 w-5" />
              Analisar Currículo
            </Button>
          </div>
        </div>
      </div>
      
      {/* Debug Stripe - Remover depois dos testes */}
      <StripeDebug />
    </div>
  )
}