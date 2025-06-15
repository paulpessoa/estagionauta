
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
