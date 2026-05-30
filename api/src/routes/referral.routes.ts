import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { authMiddleware, type Env } from '../middleware/auth.middleware.js';
import { supabaseAdmin } from '../services/supabase.service.js';
import { env } from '../config/env.js';
import { runInviteFriend } from '../tools/invite_friend.js';

const app = new Hono<Env>();

const inviteFriendSchema = z.object({
  email: z.string().email('Endereço de e-mail inválido'),
  name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres'),
});

// GET /api/referral/stats - Get referral statistics and invite list
app.get('/stats', authMiddleware, async (c) => {
  const user = c.get('user');

  try {
    // 1. Fetch user's referral code
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('user_profiles')
      .select('referral_code')
      .eq('id', user.id)
      .single();

    if (profileErr || !profile) {
      console.error('Error fetching profile referral code:', profileErr);
      return c.json({ error: 'Perfil de usuário não encontrado' }, 404);
    }

    let referralCode = profile.referral_code;
    if (!referralCode) {
      referralCode = user.id.replace(/-/g, '').substring(0, 8).toUpperCase();
      const { error: updateErr } = await supabaseAdmin
        .from('user_profiles')
        .update({ referral_code: referralCode })
        .eq('id', user.id);

      if (updateErr) {
        console.error('Error generating referral code:', updateErr);
      }
    }

    const referralUrl = `${env.CLIENT_URL}/r/${referralCode}`;

    // 2. Get invites list and count
    const { data: invites, error: invitesErr } = await supabaseAdmin
      .from('referral_invites')
      .select('id, name, email, status, created_at, updated_at')
      .eq('referrer_id', user.id)
      .order('created_at', { ascending: false });

    if (invitesErr) {
      console.error('Error fetching invites:', invitesErr);
      return c.json({ error: 'Erro ao buscar convites' }, 500);
    }

    const totalInvited = invites?.length || 0;
    const registeredCount = invites?.filter(i => i.status === 'registered' || i.status === 'active').length || 0;
    const activeCount = invites?.filter(i => i.status === 'active').length || 0;

    // 3. Fetch user credit transactions to count total earned credits
    const { data: transactions, error: txErr } = await supabaseAdmin
      .from('credit_transactions')
      .select('amount, description')
      .eq('user_id', user.id)
      .eq('type', 'bonus');

    let totalEarnedCredits = 0;
    if (!txErr && transactions) {
      const referralTx = transactions.filter(t => 
        t.description?.toLowerCase().includes('indicação') || 
        t.description?.toLowerCase().includes('indicado') ||
        t.description?.toLowerCase().includes('bônus: primeira compra')
      );
      totalEarnedCredits = referralTx.reduce((sum, tx) => sum + tx.amount, 0);
    }

    return c.json({
      referralCode,
      referralUrl,
      totalInvited,
      registeredCount,
      activeCount,
      totalEarnedCredits,
      invitees: invites || []
    });

  } catch (err) {
    console.error('Referral stats route error:', err);
    return c.json({ error: 'Erro interno ao processar estatísticas de indicações' }, 500);
  }
});

// POST /api/referral/invite - Invite a friend by sending them an email invitation
app.post('/invite', authMiddleware, zValidator('json', inviteFriendSchema), async (c) => {
  const user = c.get('user');
  const body = c.req.valid('json');

  try {
    const result = await runInviteFriend(user.id, body);
    
    if ('error' in result) {
      return c.json({ error: result.error }, 400);
    }

    return c.json(result);
  } catch (err: any) {
    console.error('Referral invite route error:', err);
    return c.json({ error: 'Erro interno ao processar convite' }, 500);
  }
});

export default app;
