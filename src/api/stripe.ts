import { STRIPE_PLANS } from '../lib/stripe'

// Função para criar checkout session
export const createCheckoutSession = async (planId: string, userId: string) => {
  try {
    const plan = STRIPE_PLANS.find(p => p.id === planId)
    if (!plan) {
      throw new Error('Plano não encontrado')
    }

    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        planId,
        planName: plan.name,
        price: plan.price,
        credits: plan.credits,
        userId,
        successUrl: `${window.location.origin}/sucesso?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/precos`,
      }),
    })

    if (!response.ok) {
      throw new Error('Erro ao criar sessão de checkout')
    }

    const { sessionId } = await response.json()
    return sessionId
  } catch (error) {
    console.error('Erro ao criar checkout session:', error)
    throw error
  }
}

// Função para verificar status do pagamento
export const verifyPayment = async (sessionId: string) => {
  try {
    const response = await fetch('/api/verify-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionId }),
    })

    if (!response.ok) {
      throw new Error('Erro ao verificar pagamento')
    }

    return await response.json()
  } catch (error) {
    console.error('Erro ao verificar pagamento:', error)
    throw error
  }
} 