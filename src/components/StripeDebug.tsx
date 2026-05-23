import { useEffect, useState } from 'react'
import { getStripe } from '../lib/stripe'

export function StripeDebug() {
  const [stripeLoaded, setStripeLoaded] = useState(false)
  const [publishableKey, setPublishableKey] = useState('')

  useEffect(() => {
    // Verificar se a chave pública está disponível
    const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
    setPublishableKey(key || 'NÃO ENCONTRADA')

    // Testar carregamento do Stripe
    const testStripe = async () => {
      try {
        const stripe = await getStripe()
        setStripeLoaded(!!stripe)
        console.log('Stripe carregado com sucesso:', stripe)
      } catch (error) {
        console.error('Erro ao carregar Stripe:', error)
        setStripeLoaded(false)
      }
    }

    testStripe()
  }, [])

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg p-4 shadow-lg z-50 max-w-sm">
      <h3 className="font-bold text-sm mb-2">Debug Stripe</h3>
      <div className="text-xs space-y-1">
        <div>
          <strong>Chave Pública:</strong> 
          <span className={publishableKey.startsWith('pk_') ? 'text-green-600' : 'text-red-600'}>
            {publishableKey.substring(0, 20)}...
          </span>
        </div>
        <div>
          <strong>Stripe Carregado:</strong> 
          <span className={stripeLoaded ? 'text-green-600' : 'text-red-600'}>
            {stripeLoaded ? 'Sim' : 'Não'}
          </span>
        </div>
        <div className="text-gray-500 mt-2">
          Abra o console (F12) para mais detalhes
        </div>
      </div>
    </div>
  )
} 