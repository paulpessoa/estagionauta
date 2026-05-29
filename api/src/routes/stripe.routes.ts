import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import Stripe from 'stripe';
import { env } from '../config/env.js';
import { authMiddleware, type Env } from '../middleware/auth.middleware.js';
import { supabaseAdmin } from '../services/supabase.service.js';

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16', // Ensure standard Stripe API compatibility
});

const app = new Hono<Env>();

const PLANS = {
  cosmonauta: { priceId: env.STRIPE_PRICE_COSMONAUTA_AVULSO, credits: 40, name: 'Cosmonauta', type: 'payment' },
  astronauta: { priceId: env.STRIPE_PRICE_ASTRONAUTA_AVULSO, credits: 100, name: 'Astronauta', type: 'payment' },
} as const;

type PlanId = keyof typeof PLANS;

const checkoutSchema = z.object({
  planId: z.enum(['cosmonauta', 'astronauta']),
});

// POST /api/stripe/checkout - Create checkout session
app.post('/checkout', authMiddleware, zValidator('json', checkoutSchema), async (c) => {
  const { planId } = c.req.valid('json') as { planId: PlanId };
  const plan = PLANS[planId];
  const user = c.get('user');

  try {
    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      line_items: [
        {
          price: plan.priceId,
          quantity: 1,
        },
      ],
      mode: plan.type,
      allow_promotion_codes: true,
      payment_method_collection: 'if_required',
      metadata: {
        userId: user.id,
        planId,
        credits: plan.credits.toString(),
      },
      success_url: env.STRIPE_SUCCESS_URL ? `${env.STRIPE_SUCCESS_URL}?session_id={CHECKOUT_SESSION_ID}` : `${env.CLIENT_URL}/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: env.STRIPE_CANCEL_URL ? `${env.STRIPE_CANCEL_URL}?payment=cancel` : `${env.CLIENT_URL}/precos?payment=cancel`,
    });

    return c.json({ url: session.url });
  } catch (err: any) {
    console.error('Stripe checkout session creation failed:', err);
    return c.json({ error: err.message || 'Erro ao criar sessão de pagamento' }, 500);
  }
});

// POST /api/stripe/webhook - Stripe Webhook
app.post('/webhook', async (c) => {
  const sig = c.req.header('stripe-signature');
  if (!sig) {
    return c.json({ error: 'Missing stripe-signature header' }, 400);
  }

  let event: Stripe.Event;

  try {
    const rawBody = await c.req.text();
    event = stripe.webhooks.constructEvent(rawBody, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return c.json({ error: `Webhook Error: ${err.message}` }, 400);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const { userId, credits, planId } = session.metadata || {};

    if (!userId || !credits) {
      console.error('Missing userId or credits in session metadata:', session.metadata);
      return c.json({ error: 'Missing metadata' }, 400);
    }

    console.log(`Processing successful payment for user: ${userId}, credits: ${credits}`);

    const { error } = await supabaseAdmin.rpc('add_credits', {
      user_uuid: userId,
      amount: parseInt(credits, 10),
      stripe_payment_intent_id: (session.payment_intent as string) || session.id,
      description: `Compra do Plano ${planId ? PLANS[planId as PlanId]?.name : ''}`,
    });

    if (error) {
      console.error('Database error executing add_credits RPC:', error);
      return c.json({ error: 'Internal database error' }, 500);
    }
  }

  return c.json({ received: true });
});

// GET /api/stripe/plans - List plans
app.get('/plans', (c) => {
  return c.json(
    Object.entries(PLANS).map(([id, plan]) => ({
      id,
      ...plan,
    }))
  );
});

// POST /api/stripe/verify-session - Verify checkout session details for success page
app.post('/verify-session', authMiddleware, zValidator('json', z.object({ sessionId: z.string() })), async (c) => {
  const { sessionId } = c.req.valid('json');
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status === 'paid') {
      const planId = session.metadata?.planId;
      const credits = session.metadata?.credits ? parseInt(session.metadata.credits, 10) : 0;
      const plan = planId ? PLANS[planId as PlanId] : null;

      return c.json({
        credits,
        analyses: plan ? Math.floor(plan.credits / 3) : 0,
        planName: plan ? plan.name : 'Personalizado',
        amount: session.amount_total ? session.amount_total / 100 : 0,
      });
    } else {
      return c.json({ error: 'Pagamento não confirmado' }, 400);
    }
  } catch (err) {
    console.error('Verify Stripe session failed:', err);
    return c.json({ error: 'Erro ao verificar pagamento' }, 500);
  }
});

export default app;
