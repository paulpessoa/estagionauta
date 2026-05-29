import Stripe from 'stripe';
import { env } from '../config/env.js';
import { supabaseAdmin } from '../services/supabase.service.js';

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16' as any,
});

const PLANS = {
  cosmonauta: { priceId: env.STRIPE_PRICE_COSMONAUTA_AVULSO, credits: 30, name: 'Cosmonauta', type: 'payment' },
  astronauta: { priceId: env.STRIPE_PRICE_ASTRONAUTA_AVULSO, credits: 90, name: 'Astronauta', type: 'payment' },
} as const;

type PlanId = keyof typeof PLANS;

export const buyCreditsDefinition = {
  type: 'function' as const,
  function: {
    name: 'buy_credits',
    description: 'Gera um link de checkout do Stripe para o plano escolhido (Cosmonauta ou Astronauta) para o usuário comprar créditos. Retorna um link clicável contendo a URL de checkout.',
    parameters: {
      type: 'object',
      properties: {
        planId: {
          type: 'string',
          enum: ['cosmonauta', 'astronauta'],
          description: 'Identificador do plano: "cosmonauta" (30 créditos) ou "astronauta" (90 créditos).'
        }
      },
      required: ['planId']
    }
  }
};

export async function runBuyCredits(userId: string, args: { planId: PlanId }) {
  try {
    const { planId } = args;
    if (!PLANS[planId]) {
      return { error: 'Plano inválido fornecido. Escolha entre "cosmonauta" ou "astronauta".' };
    }

    // 1. Obter email do usuário do banco de dados
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('user_profiles')
      .select('email')
      .eq('id', userId)
      .single();

    if (profileErr || !profile?.email) {
      return { error: 'Não foi possível encontrar as informações do usuário para gerar o pagamento.' };
    }

    const plan = PLANS[planId];

    // 2. Criar a checkout session no Stripe
    const session = await stripe.checkout.sessions.create({
      customer_email: profile.email,
      line_items: [
        {
          price: plan.priceId,
          quantity: 1,
        },
      ],
      mode: plan.type,
      allow_promotion_codes: true,
      metadata: {
        userId,
        planId,
        credits: plan.credits.toString(),
      },
      success_url: env.STRIPE_SUCCESS_URL ? `${env.STRIPE_SUCCESS_URL}?session_id={CHECKOUT_SESSION_ID}` : `${env.CLIENT_URL}/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: env.STRIPE_CANCEL_URL ? `${env.STRIPE_CANCEL_URL}?payment=cancel` : `${env.CLIENT_URL}/precos?payment=cancel`,
    });

    return {
      success: true,
      message: `Checkout para o Plano ${plan.name} (${plan.credits} créditos) gerado com sucesso. Clique no link abaixo para finalizar o pagamento:`,
      url: session.url,
      planName: plan.name,
      credits: plan.credits
    };
  } catch (err: any) {
    console.error('Error generating checkout session in tool:', err);
    return { error: `Erro ao gerar checkout do Stripe: ${err.message}` };
  }
}
