import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { authMiddleware, type Env } from '../middleware/auth.middleware.js';
import { adminMiddleware } from '../middleware/admin.middleware.js';
import { supabaseAdmin } from '../services/supabase.service.js';
import { env } from '../config/env.js';

const app = new Hono<Env>();

async function verifyIsAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('user_profiles')
    .select('role')
    .eq('id', userId)
    .single();
  return !error && data?.role === 'admin';
}

// Zod schemas for input validation
const updateRoleSchema = z.object({
  role: z.enum(['student', 'agency', 'moderator', 'admin']),
});

const updateCreditsSchema = z.object({
  amount: z.number().int('O ajuste de créditos deve ser um número inteiro'),
});

const replyEmailSchema = z.object({
  feedbackId: z.string().uuid(),
  toEmail: z.string().email(),
  subject: z.string().min(3),
  message: z.string().min(5),
});

// GET /api/admin/stats - Retrieve consolidated statistics
app.get('/stats', authMiddleware, adminMiddleware, async (c) => {
  try {
    const [
      { count: usersCount },
      { count: resumesCount },
      { count: simulationsCount },
      { count: reviewsCount },
      { count: pendingAgenciesCount },
      { count: pendingReviewsCount }
    ] = await Promise.all([
      supabaseAdmin.from('user_profiles').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('curriculum_analysis').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('interview_simulations').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('agency_reviews').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('agencies').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabaseAdmin.from('agency_reviews').select('*', { count: 'exact', head: true }).eq('status', 'pending')
    ]);

    return c.json({
      totalUsers: usersCount || 0,
      resumesAnalyzed: resumesCount || 0,
      simulationsRun: simulationsCount || 0,
      totalReviews: reviewsCount || 0,
      pendingAgencies: pendingAgenciesCount || 0,
      pendingReviews: pendingReviewsCount || 0
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    return c.json({ error: 'Erro ao carregar estatísticas do admin' }, 500);
  }
});

// GET /api/admin/users - List users (exposes only required PII fields)
app.get('/users', authMiddleware, adminMiddleware, async (c) => {
  const user = c.get('user');
  if (!(await verifyIsAdmin(user.id))) {
    return c.json({ error: 'Acesso negado: Apenas administradores' }, 403);
  }
  try {
    const { data: users, error } = await supabaseAdmin
      .from('user_profiles')
      .select('id, full_name, email, role, credits, created_at, avatar_url')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Fetch all referrals to calculate referrals_count
    const { data: referrals } = await supabaseAdmin
      .from('user_profiles')
      .select('referred_by')
      .not('referred_by', 'is', null);

    // Fetch all purchase transactions to calculate LTV (total_paid)
    // Here we consider the cost of credits or just sum the amounts of type 'purchase'
    // If amount is credits, we might need a way to convert to currency, but we can assume amount * price or just store 'amount' as LTV.
    // Wait, the transaction amount is credits. We'll return it as 'total_paid' in credits, or we can just fetch total_credits_purchased from profile.
    // Let's also fetch total_credits_purchased if available, or just use credit_transactions.
    const { data: purchases } = await supabaseAdmin
      .from('credit_transactions')
      .select('user_id, amount')
      .eq('type', 'purchase');

    const referralCounts = (referrals || []).reduce((acc: any, curr) => {
      if (curr.referred_by) {
        acc[curr.referred_by] = (acc[curr.referred_by] || 0) + 1;
      }
      return acc;
    }, {});

    const ltvCounts = (purchases || []).reduce((acc: any, curr) => {
      if (curr.user_id) {
        // Assuming 1 credit = R$ 1 for simplicity in LTV, or just sending the amount of credits purchased
        acc[curr.user_id] = (acc[curr.user_id] || 0) + curr.amount;
      }
      return acc;
    }, {});

    const enrichedUsers = (users || []).map(u => ({
      ...u,
      referrals_count: referralCounts[u.id] || 0,
      total_paid: ltvCounts[u.id] || 0 // Assuming 'total_paid' is based on credits purchased for now
    }));

    return c.json(enrichedUsers);
  } catch (err) {
    console.error('Admin users fetch error:', err);
    return c.json({ error: 'Erro ao carregar lista de usuários' }, 500);
  }
});

// GET /api/admin/submissions - List recent resume reviews
app.get('/submissions', authMiddleware, adminMiddleware, async (c) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('curriculum_analysis')
      .select('id, name, email, status, created_at, course, university')
      .order('created_at', { ascending: false })
      .limit(1000);

    if (error) throw error;
    return c.json(data || []);
  } catch (err) {
    console.error('Admin submissions fetch error:', err);
    return c.json({ error: 'Erro ao carregar submissões recentes' }, 500);
  }
});

// GET /api/admin/transactions - List recent transactions
app.get('/transactions', authMiddleware, adminMiddleware, async (c) => {
  const user = c.get('user');
  if (!(await verifyIsAdmin(user.id))) {
    return c.json({ error: 'Acesso negado: Apenas administradores' }, 403);
  }
  try {
    const { data, error } = await supabaseAdmin
      .from('credit_transactions')
      .select('id, user_id, type, amount, created_at, user_profiles(full_name, email)')
      .order('created_at', { ascending: false })
      .limit(150);

    if (error) throw error;
    return c.json(data || []);
  } catch (err) {
    console.error('Admin transactions fetch error:', err);
    return c.json({ error: 'Erro ao carregar transações recentes' }, 500);
  }
});

// PUT /api/admin/users/:id/role - Update user role securely
app.put('/users/:id/role', authMiddleware, adminMiddleware, zValidator('json', updateRoleSchema), async (c) => {
  const admin = c.get('user');
  if (!(await verifyIsAdmin(admin.id))) {
    return c.json({ error: 'Acesso negado: Apenas administradores' }, 403);
  }
  const targetId = c.req.param('id');
  const { role } = c.req.valid('json');

  try {
    // 1. Fetch current role for logging
    const { data: targetUser, error: fetchError } = await supabaseAdmin
      .from('user_profiles')
      .select('role')
      .eq('id', targetId)
      .single();

    if (fetchError || !targetUser) {
      return c.json({ error: 'Usuário não encontrado' }, 404);
    }

    if (targetUser.role === role) {
      return c.json({ success: true, message: 'Usuário já possui este cargo' });
    }

    // 2. Perform role update (service role connection bypasses our trigger block)
    const { error: updateError } = await supabaseAdmin
      .from('user_profiles')
      .update({ role })
      .eq('id', targetId);

    if (updateError) {
      console.error('Role update error:', updateError);
      return c.json({ error: 'Erro ao atualizar cargo' }, 500);
    }

    // 3. Insert audit log record
    const ipAddress = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
    const { error: auditError } = await supabaseAdmin
      .from('admin_audit_logs')
      .insert({
        admin_id: admin.id,
        target_user_id: targetId,
        action: 'update_role',
        previous_value: targetUser.role,
        new_value: role,
        ip_address: ipAddress
      });

    if (auditError) {
      console.error('Audit logging error:', auditError);
    }

    return c.json({ success: true, message: 'Cargo atualizado com sucesso' });
  } catch (err) {
    console.error('Admin update role error:', err);
    return c.json({ error: 'Erro interno do servidor ao atualizar cargo' }, 500);
  }
});

// PUT /api/admin/users/:id/credits - Adjust user credits securely (relational adjustment)
app.put('/users/:id/credits', authMiddleware, adminMiddleware, zValidator('json', updateCreditsSchema), async (c) => {
  const admin = c.get('user');
  if (!(await verifyIsAdmin(admin.id))) {
    return c.json({ error: 'Acesso negado: Apenas administradores' }, 403);
  }
  const targetId = c.req.param('id');
  const { amount } = c.req.valid('json');

  try {
    // 1. Fetch current credits for logging
    const { data: targetUser, error: fetchError } = await supabaseAdmin
      .from('user_profiles')
      .select('credits')
      .eq('id', targetId)
      .single();

    if (fetchError || !targetUser) {
      return c.json({ error: 'Usuário não encontrado' }, 404);
    }

    const currentCredits = targetUser.credits;
    const newCredits = Math.max(0, currentCredits + amount);

    // 2. Update user's credits
    const { error: updateError } = await supabaseAdmin
      .from('user_profiles')
      .update({ credits: newCredits })
      .eq('id', targetId);

    if (updateError) {
      console.error('Credits update error:', updateError);
      return c.json({ error: 'Erro ao atualizar créditos' }, 500);
    }

    // 3. Insert transaction log
    const { error: txError } = await supabaseAdmin
      .from('credit_transactions')
      .insert({
        user_id: targetId,
        type: amount > 0 ? 'bonus' : 'usage',
        amount: Math.abs(amount),
        description: `Ajuste administrativo: ${amount > 0 ? '+' : ''}${amount} créditos`
      });

    if (txError) {
      console.error('Credit transaction logging error:', txError);
    }

    // 4. Insert audit log record
    const ipAddress = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
    const { error: auditError } = await supabaseAdmin
      .from('admin_audit_logs')
      .insert({
        admin_id: admin.id,
        target_user_id: targetId,
        action: 'update_credits',
        previous_value: currentCredits.toString(),
        new_value: newCredits.toString(),
        ip_address: ipAddress
      });

    if (auditError) {
      console.error('Audit logging error:', auditError);
    }

    return c.json({ success: true, message: `Créditos atualizados para ${newCredits}` });
  } catch (err) {
    console.error('Admin update credits error:', err);
    return c.json({ error: 'Erro interno do servidor ao ajustar créditos' }, 500);
  }
});

// POST /api/admin/reply-email - Reply to a user's feedback
app.post('/reply-email', authMiddleware, adminMiddleware, zValidator('json', replyEmailSchema), async (c) => {
  const admin = c.get('user');
  if (!(await verifyIsAdmin(admin.id))) {
    return c.json({ error: 'Acesso negado: Apenas administradores' }, 403);
  }

  const { feedbackId, toEmail, subject, message } = c.req.valid('json');

  if (!env.BREVO_API_KEY) {
    return c.json({ error: 'Serviço de e-mail não configurado neste ambiente (BREVO_API_KEY ausente)' }, 503);
  }

  try {
    const emailData = {
      sender: {
        name: 'Equipe Estagionauta',
        email: env.BREVO_SENDER_EMAIL,
      },
      to: [
        {
          email: toEmail,
        },
      ],
      subject: subject,
      htmlContent: `<div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2>Resposta ao seu feedback</h2>
          <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #667eea; margin-bottom: 20px;">
            <p style="white-space: pre-wrap;">${message}</p>
          </div>
          <p>Obrigado por nos ajudar a melhorar o Estagionauta!</p>
        </div>`,
      textContent: message,
    };

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': env.BREVO_API_KEY,
      },
      body: JSON.stringify(emailData),
    });

    if (!response.ok) {
      const errorData = (await response.json()) as any;
      throw new Error(errorData.message || 'Erro ao enviar email');
    }

    // Optionally mark the feedback as replied in DB
    await supabaseAdmin
      .from('feedbacks')
      .update({ status: 'replied' })
      .eq('id', feedbackId);

    return c.json({ success: true, message: 'Email de resposta enviado com sucesso' });
  } catch (err) {
    console.error('Admin reply email error:', err);
    return c.json({ error: 'Erro ao enviar email de resposta' }, 500);
  }
});

// GET /api/admin/email-logs - List email logs
app.get('/email-logs', authMiddleware, adminMiddleware, async (c) => {
  const user = c.get('user');
  if (!(await verifyIsAdmin(user.id))) {
    return c.json({ error: 'Acesso negado: Apenas administradores' }, 403);
  }
  try {
    const { data, error } = await supabaseAdmin
      .from('email_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) throw error;
    return c.json(data || []);
  } catch (err) {
    console.error('Admin email logs fetch error:', err);
    return c.json({ error: 'Erro ao carregar logs de email' }, 500);
  }
});

// DELETE /api/admin/users/:id - Delete a user account completely
app.delete('/users/:id', authMiddleware, adminMiddleware, async (c) => {
  const admin = c.get('user');
  if (!(await verifyIsAdmin(admin.id))) {
    return c.json({ error: 'Acesso negado: Apenas administradores' }, 403);
  }
  const targetId = c.req.param('id');
  
  if (admin.id === targetId) {
     return c.json({ error: 'Não é possível excluir a própria conta' }, 400);
  }

  try {
    // Excluir via Auth admin
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(targetId);

    if (authError) {
      console.error('Error deleting user from auth:', authError);
      // Fallback: tentar excluir do banco (embora ON DELETE CASCADE deva cuidar disso)
      await supabaseAdmin.from('user_profiles').delete().eq('id', targetId);
    }
    
    // Log the action
    const ipAddress = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
    await supabaseAdmin
      .from('admin_audit_logs')
      .insert({
        admin_id: admin.id,
        target_user_id: targetId,
        action: 'delete_user',
        previous_value: 'active',
        new_value: 'deleted',
        ip_address: ipAddress
      });

    return c.json({ success: true, message: 'Usuário excluído com sucesso' });
  } catch (err) {
    console.error('Admin delete user error:', err);
    return c.json({ error: 'Erro ao excluir usuário' }, 500);
  }
});

export default app;
