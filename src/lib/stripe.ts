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
    price: 4.00,
    credits: 30,
    analyses: 10,
    stripePriceId: ''
  },
  {
    id: 'astronauta',
    name: 'Astronauta',
    price: 5.00,
    credits: 60,
    analyses: 20,
    stripePriceId: ''
  },
  {
    id: 'comandante',
    name: 'Comandante',
    price: 15.00,
    credits: 300,
    analyses: 100,
    stripePriceId: ''
  }
]
