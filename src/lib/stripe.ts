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
  analyses: number
  stripePriceId: string
}

// Configuração dos planos
export const STRIPE_PLANS: StripePlan[] = [
  {
    id: 'cosmonauta',
    name: 'Cosmonauta',
    price: 59.70,
    credits: 30,
    analyses: 10,
    stripePriceId: ''
  },
  {
    id: 'astronauta',
    name: 'Astronauta',
    price: 119.20,
    credits: 80,
    analyses: 26,
    stripePriceId: ''
  },
  {
    id: 'comandante',
    name: 'Comandante',
    price: 198.00,
    credits: 200,
    analyses: 66,
    stripePriceId: ''
  }
]
