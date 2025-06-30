import Stripe from 'stripe'
import { buffer } from 'micro'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const buf = await buffer(req)
  const sig = req.headers['stripe-signature']

  let event

  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret)
  } catch (err) {
    console.error('Erro no webhook:', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    
    // Adicionar créditos ao usuário
    try {
      const { userId, credits } = session.metadata
      
      // Chamar função do Supabase para adicionar créditos
      const { error } = await supabase.rpc('add_credits', {
        user_uuid: userId,
        amount: parseInt(credits),
        stripe_payment_intent_id: session.payment_intent,
        description: `Compra de ${credits} créditos`
      })

      if (error) {
        console.error('Erro ao adicionar créditos:', error)
      }
    } catch (error) {
      console.error('Erro ao processar pagamento:', error)
    }
  }

  res.status(200).json({ received: true })
}