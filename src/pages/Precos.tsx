import { useState, useEffect } from 'react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Check, Star, Zap, Crown, Sparkles, Bot, Chrome, Loader2 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useCredits } from '../hooks/useCredits'
import { useToast } from '../hooks/use-toast'
import { apiClient } from '../lib/apiClient'
import { useNavigate } from 'react-router-dom'


const plans = [
  {
    id: 'gratuito',
    name: 'Gratuito',
    icon: Star,
    credits: 10,
    price: 0,
    originalPrice: 0,
    popular: false,
    description: '10 créditos mensais gratuitos automáticos no cadastro'
  },
  {
    id: 'cosmonauta',
    name: 'Cosmonauta',
    icon: Zap,
    credits: 40,
    price: 5.97,
    originalPrice: 9.90,
    popular: true,
    description: 'Recarga avulsa de 30 créditos + 10 créditos gratuitos mensais'
  },
  {
    id: 'astronauta',
    name: 'Astronauta',
    icon: Crown,
    credits: 100,
    price: 14.97,
    originalPrice: 24.90,
    popular: false,
    description: 'Recarga avulsa de 90 créditos + 10 créditos gratuitos mensais'
  }
]



export default function Precos() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { credits } = useCredits()
  const { toast } = useToast()
  const [loading, setLoading] = useState<string | null>(null)

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

        <div>
          <div className="text-center mb-8">
            <p className="text-sm text-muted-foreground">
              Cada análise de currículo custa 3 créditos • Seus créditos são válidos por 6 meses
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan) => (
              <Card 
                key={plan.id}
                className={`relative flex flex-col justify-between ${
                  plan.popular 
                    ? 'border-2 border-violet-600 shadow-xl dark:shadow-violet-950/20 scale-105' 
                    : 'border border-gray-200 dark:border-gray-800'
                }`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-violet-600 text-white font-bold tracking-wide">
                    Mais Popular
                  </Badge>
                )}
                
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-2">
                    <plan.icon className={`h-10 w-10 ${plan.popular ? 'text-violet-600' : 'text-blue-500'}`} />
                  </div>
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400 mt-2">
                    {plan.description}
                  </CardDescription>
                  <div className="text-xs text-muted-foreground mt-1 bg-muted/60 dark:bg-muted/30 py-1 px-2.5 rounded-full inline-block mx-auto font-medium">
                    {plan.credits} créditos no total
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6 flex-grow flex flex-col justify-end">
                  {/* Price with promo anchor */}
                  <div className="text-center">
                    {plan.price > 0 ? (
                      <div className="flex flex-col items-center justify-center">
                        <div className="text-sm line-through text-muted-foreground font-medium">
                          De R$ {plan.originalPrice.toFixed(2).replace('.', ',')}
                        </div>
                        <div className="text-4xl font-extrabold text-gray-900 dark:text-white mt-1">
                          R$ {plan.price.toFixed(2).replace('.', ',')}
                          <span className="text-xs text-muted-foreground font-normal ml-1">
                            {" pagamento único"}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-4xl font-extrabold text-gray-900 dark:text-white">
                        Grátis
                      </div>
                    )}
                  </div>

                  {/* Purchase Button */}
                  {plan.id === 'gratuito' ? (
                    <Button 
                      className="w-full bg-muted text-muted-foreground hover:bg-muted cursor-not-allowed"
                      disabled
                    >
                      Já Ativo no Cadastro
                    </Button>
                  ) : (
                    <Button 
                      className={`w-full ${
                        plan.popular 
                          ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold' 
                          : 'bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100'
                      }`}
                      onClick={() => handlePurchase(plan.id)}
                      disabled={loading === plan.id}
                    >
                      {loading === plan.id ? (
                        <div className="flex items-center space-x-2 justify-center">
                          <Loader2 className="animate-spin h-4 w-4" />
                          <span>Processando...</span>
                        </div>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Comprar {plan.name}
                        </>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

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
                Cada análise de currículo consome 3 créditos. Simulações consomem 2 créditos e geração consome 1 crédito. Os créditos são válidos por 6 meses após a compra.
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
                Sim! Para garantir a sustentabilidade dos serviços, os seus créditos são válidos por 6 meses após a data da compra.
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