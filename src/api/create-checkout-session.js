import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { planId, planName, price, credits, userId } = req.body

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: `${planName} - ${credits} créditos`,
              description: `${credits} créditos para análise de currículos`,
            },
            unit_amount: Math.round(price * 100), // Stripe usa centavos
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.STRIPE_SUCCESS_URL}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: process.env.STRIPE_CANCEL_URL,
      metadata: {
        planId,
        userId,
        credits: credits.toString(),
      },
    })

    res.status(200).json({ sessionId: session.id })
  } catch (error) {
    console.error('Erro ao criar checkout session:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}