import { useState } from 'react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Check, Star, Zap, Crown, Sparkles } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useCredits } from '../hooks/useCredits'
import { useToast } from '../hooks/use-toast'
import { apiClient } from '../lib/apiClient'
import { StripeDebug } from '../components/StripeDebug'


const plans = [
  {
    id: 'cosmonauta',
    name: 'Cosmonauta',
    icon: Star,
    credits: 30,
    analyses: 10,
    price: 4.00,
    pricePerAnalysis: 0.40,
    popular: false
  },
  {
    id: 'astronauta',
    name: 'Astronauta',
    icon: Zap,
    credits: 100,
    analyses: 33,
    price: 10.00,
    pricePerAnalysis: 0.30,
    popular: true
  },
  {
    id: 'comandante',
    name: 'Comandante',
    icon: Crown,
    credits: 350,
    analyses: 116,
    price: 25.00,
    pricePerAnalysis: 0.21,
    popular: false
  }
]

export default function Precos() {
  const { user } = useAuth()
  const { credits } = useCredits()
  const { toast } = useToast()
  const [loading, setLoading] = useState<string | null>(null)

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

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Planos de Créditos
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Cada análise de currículo custa 3 créditos • Preços a partir de R$ 4,00
          </p>
          
          {user && credits && (
            <div className="inline-flex items-center space-x-2 bg-white dark:bg-gray-800 rounded-lg px-4 py-2 shadow-sm">
              <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
              <span className="text-sm font-medium">
                Seus créditos: {credits.credits}
              </span>
            </div>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <Card 
              key={plan.id}
              className={`relative ${
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
                  {plan.analyses} análises de currículo
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Price */}
                <div className="text-center">
                  <div className="text-4xl font-bold text-gray-900 dark:text-white">
                    R$ {plan.price.toFixed(2).replace('.', ',')}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    R$ {plan.pricePerAnalysis.toFixed(2).replace('.', ',')} por análise
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