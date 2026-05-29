import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { CheckCircle, ArrowRight } from 'lucide-react'
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
      await refresh()
      toast({
        title: 'Pagamento confirmado',
        description: `${result.credits} créditos adicionados à sua conta.`,
      })
    } catch (error) {
      console.error('Erro ao verificar pagamento:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao processar pagamento. Entre em contato conosco.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Processando pagamento...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-lg mx-auto">

          {/* Confirmação */}
          <div className="text-center mb-10">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Pagamento confirmado
            </h1>
            <p className="text-muted-foreground">
              Seus créditos foram adicionados à sua conta.
            </p>
          </div>

          {/* Detalhes */}
          {paymentData && (
            <Card className="mb-8">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium text-muted-foreground">
                  Resumo da compra
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Plano</span>
                  <span className="font-semibold">{paymentData.planName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Créditos adicionados</span>
                  <span className="font-semibold">{paymentData.credits}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Valor cobrado</span>
                  <span className="font-semibold">R$ {paymentData.amount.toFixed(2).replace('.', ',')}</span>
                </div>
                {credits !== null && (
                  <>
                    <div className="border-t pt-3 mt-3 flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Novo saldo</span>
                      <span className="text-lg font-bold">{credits.credits} créditos</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Ações */}
          <div className="space-y-3">
            <Button
              className="w-full"
              onClick={() => navigate('/analise-curriculo')}
            >
              Analisar currículo
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate('/simulador-entrevistas')}
            >
              Simulador de entrevistas
            </Button>
            <Button
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowRight className="mr-2 h-4 w-4" />
              Ir para o dashboard
            </Button>
          </div>

        </div>
      </div>
    </div>
  )
}
