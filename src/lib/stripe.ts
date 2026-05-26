import { loadStripe, Stripe } from '@stripe/stripe-js'

// Carregar Stripe apenas no cliente
let stripePromise: Promise<Stripe | null> | null = null

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
  }
  return stripePromise
}

// Tipos para os planos
export interface StripePlan {
  id: string
  name: string
  price: number
  credits: number
  stripePriceId: string
}

// Configuração dos planos
export const STRIPE_PLANS: StripePlan[] = [
  {
    id: 'cosmonauta',
    name: 'Cosmonauta',
    price: 1.99,
    credits: 30,
    stripePriceId: ''
  },
  {
    id: 'astronauta',
    name: 'Astronauta',
    price: 4.99,
    credits: 80,
    stripePriceId: ''
  },
  {
    id: 'comandante',
    name: 'Comandante',
    price: 9.99,
    credits: 200,
    stripePriceId: ''
  }
]
