import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { apiClient } from '@/lib/apiClient'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'

export default function StatusPage() {
  const [status, setStatus] = useState<'loading' | 'online' | 'offline'>('loading')
  const [lastCheck, setLastCheck] = useState<Date | null>(null)

  useEffect(() => {
    checkStatus()
    // Poll every 30 seconds
    const interval = setInterval(checkStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  const checkStatus = async () => {
    try {
      // Use useAuth: false so it doesn't try to send a token if not logged in
      const res = await apiClient.get<{ status: string, timestamp: string }>('/api/health', { useAuth: false })
      if (res.status === 'ok') {
        setStatus('online')
      } else {
        setStatus('offline')
      }
      setLastCheck(new Date())
    } catch (error) {
      console.error('Status check error:', error)
      setStatus('offline')
      setLastCheck(new Date())
    }
  }

  return (
    <div className="min-h-[80vh] bg-background py-16">
      <Helmet>
        <title>Status do Sistema | Estagionauta</title>
        <meta name="description" content="Acompanhe o status dos serviços do Estagionauta em tempo real." />
      </Helmet>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Status do Sistema
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Acompanhe a disponibilidade dos nossos serviços em tempo real.
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Serviço Principal (API)</CardTitle>
                <CardDescription>Conectividade com o banco de dados e rotas principais</CardDescription>
              </div>
              <div>
                {status === 'loading' && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Loader2 className="h-4 w-4 animate-spin" /> Verificando...
                  </Badge>
                )}
                {status === 'online' && (
                  <Badge className="bg-green-500 hover:bg-green-600 flex items-center gap-1 text-white">
                    <CheckCircle2 className="h-4 w-4" /> Operacional
                  </Badge>
                )}
                {status === 'offline' && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <XCircle className="h-4 w-4" /> Fora do Ar
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-4 border-t pt-4">
              Última verificação: {lastCheck ? lastCheck.toLocaleTimeString() : '...'}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
