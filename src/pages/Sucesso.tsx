import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { CheckCircle, Star, Rocket, ArrowRight } from 'lucide-react'
import { apiClient } from '../lib/apiClient'
import { useCredits } from '../hooks/useCredits'
import { useToast } from '../hooks/use-toast'

interface PaymentData {
  credits: number
  analyses: number
  planName: string
  amount: number
}

export default function Sucesso() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { credits, refresh } = useCredits()
  const [loading, setLoading] = useState(true)
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null)

  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    if (sessionId) {
      verifyPaymentAndAddCredits()
    } else {
      setLoading(false)
    }
  }, [sessionId])

  const verifyPaymentAndAddCredits = async () => {
    try {
      const result = await apiClient.post<PaymentData>('/api/stripe/verify-session', { sessionId })
      setPaymentData(result)
      
      // Atualizar créditos na interface
      await refresh()
      
      toast({
        title: "Pagamento confirmado!",
        description: `Você recebeu ${result.credits} créditos.`,
      })
    } catch (error) {
      console.error('Erro ao verificar pagamento:', error)
      toast({
        title: "Erro",
        description: "Erro ao processar pagamento. Entre em contato conosco.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-lg">Processando pagamento...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          {/* Ícone de sucesso */}
          <div className="mb-8">
            <CheckCircle className="h-24 w-24 text-green-500 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Pagamento Confirmado!
            </h1>
            <p className="text-xl text-gray-600">
              Seus créditos foram adicionados com sucesso
            </p>
          </div>

          {/* Detalhes do pagamento */}
          {paymentData && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center justify-center space-x-2">
                  <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
                  <span>Detalhes da Compra</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-green-600">
                      {paymentData.credits}
                    </div>
                    <div className="text-sm text-green-800">Créditos Adicionados</div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-600">
                      {paymentData.analyses}
                    </div>
                    <div className="text-sm text-blue-800">Análises Disponíveis</div>
                  </div>
                </div>
                
                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    Plano: <span className="font-semibold">{paymentData.planName}</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Valor: <span className="font-semibold">R$ {paymentData.amount.toFixed(2).replace('.', ',')}</span>
                  </p>
                  {credits !== null && (
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mt-2 bg-yellow-500/10 py-1.5 px-3 rounded-lg inline-block">
                      Seu novo saldo: {credits.credits} ⭐
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Botões de ação */}
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 font-medium"
                onClick={() => navigate('/analise-curriculo')}
              >
                <Rocket className="mr-2 h-5 w-5" />
                Analisar Currículo
              </Button>

              <Button 
                size="lg" 
                variant="secondary"
                className="font-medium bg-white hover:bg-gray-100 border text-slate-900"
                onClick={() => navigate('/simulador-entrevistas')}
              >
                <Star className="mr-2 h-5 w-5 text-yellow-500 fill-yellow-500 animate-pulse" />
                Simulador de Entrevistas
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-4 justify-center">
              <Button 
                variant="outline" 
                onClick={() => navigate('/dashboard')}
              >
                <ArrowRight className="mr-2 h-4 w-4" />
                Ir para Dashboard
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => navigate('/minhas-analises')}
              >
                Ver Minhas Análises
              </Button>

              <Button 
                variant="outline" 
                onClick={() => navigate('/calculadora-recesso')}
              >
                Calculadora de Recesso
              </Button>
            </div>
          </div>

          {/* Informações adicionais */}
          <div className="mt-12 text-center">
            <p className="text-sm text-gray-500">
              Recebeu um email de confirmação? Se não, verifique sua caixa de spam.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Precisa de ajuda? Entre em contato conosco.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
