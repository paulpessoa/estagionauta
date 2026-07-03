import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { authMiddleware, type Env } from '../middleware/auth.middleware.js';
import { supabaseAdmin } from '../services/supabase.service.js';
import { runRedeemCoupon } from '../tools/redeem_coupon.js';

const app = new Hono<Env>();

// GET /api/credits - Get credit balance
app.get('/', authMiddleware, async (c) => {
  const user = c.get('user');

  try {
    const { data: profile, error } = await supabaseAdmin
      .from('user_profiles')
      .select('credits, total_credits_used, total_credits_purchased, subscription_status')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching credit balance:', error);
      return c.json({ error: 'Erro ao buscar saldo de créditos' }, 500);
    }

    return c.json({
      credits: profile?.credits ?? 0,
      total_credits_used: profile?.total_credits_used ?? 0,
      total_credits_purchased: profile?.total_credits_purchased ?? 0,
      subscription_status: profile?.subscription_status ?? 'free',
    });
  } catch (err) {
    console.error('Credits error:', err);
    return c.json({ error: 'Erro interno do servidor' }, 500);
  }
});

// GET /api/credits/transactions - Get credit transaction history
app.get('/transactions', authMiddleware, async (c) => {
  const user = c.get('user');

  try {
    const { data: transactions, error } = await supabaseAdmin
      .from('credit_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching transactions:', error);
      return c.json({ error: 'Erro ao buscar histórico de transações' }, 500);
    }

    return c.json(transactions ?? []);
  } catch (err) {
    console.error('Transactions history error:', err);
    return c.json({ error: 'Erro interno do servidor' }, 500);
  }
});

// POST /api/credits/redeem - Redeem a coupon code
app.post('/redeem', authMiddleware, zValidator('json', z.object({ code: z.string().min(1) })), async (c) => {
  const user = c.get('user');
  const { code } = c.req.valid('json');

  try {
    const result = await runRedeemCoupon(user.id, { code });
    if (result.error) {
      return c.json({ error: result.error }, 400);
    }
    return c.json(result);
  } catch (err: any) {
    console.error('Redeem coupon error:', err);
    return c.json({ error: 'Erro interno ao resgatar cupom' }, 500);
  }
});

export default app;
