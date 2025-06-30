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
    stripePriceId: 'prod_SagIZy72dgBgoj'
  },
  {
    id: 'astronauta',
    name: 'Astronauta',
    price: 5.00,
    credits: 60,
    analyses: 20,
    stripePriceId: 'prod_SagIf385mVw3Yb'
  },
  {
    id: 'comandante',
    name: 'Comandante',
    price: 15.00,
    credits: 300,
    analyses: 100,
    stripePriceId: 'prod_SagGPvF1lCtYhw'
  }
]

export interface StripeConfig {
  lunarPlan: string
  stellarPlan: string
  galacticPlan: string
  stardustPackage: string
  nebulaPackage: string
  cosmicPackage: string
}

// Configuração dos links/IDs do Stripe
// Substitua pelos seus links reais do Stripe após configurar
export const stripeConfig: StripeConfig = {
  lunarPlan: 'https://buy.stripe.com/your-lunar-plan-link',
  stellarPlan: 'https://buy.stripe.com/your-stellar-plan-link', 
  galacticPlan: 'https://buy.stripe.com/your-galactic-plan-link',
  stardustPackage: 'https://buy.stripe.com/your-stardust-package-link',
  nebulaPackage: 'https://buy.stripe.com/your-nebula-package-link',
  cosmicPackage: 'https://buy.stripe.com/your-cosmic-package-link'
}

export const redirectToStripe = (planType: keyof StripeConfig) => {
  const url = stripeConfig[planType]
  if (url && url !== '#') {
    window.open(url, '_blank')
  } else {
    console.log(`Stripe link not configured for ${planType}`)
    alert('Link de pagamento ainda não configurado. Entre em contato conosco!')
  }
}

export const getPlanPrice = (planType: keyof StripeConfig): number => {
  const prices = {
    lunarPlan: 9.99,
    stellarPlan: 19.99,
    galacticPlan: 29.99,
    stardustPackage: 29.99,
    nebulaPackage: 19.99,
    cosmicPackage: 24.99
  }
  return prices[planType]
}
