import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { authMiddleware, type Env } from '../middleware/auth.middleware.js';
import { adminMiddleware } from '../middleware/admin.middleware.js';
import { supabaseAdmin } from '../services/supabase.service.js';

const app = new Hono<Env>();

// Zod schemas for input validation
const updateRoleSchema = z.object({
  role: z.enum(['student', 'agency', 'moderator', 'admin']),
});

const updateCreditsSchema = z.object({
  amount: z.number().int('O ajuste de créditos deve ser um número inteiro'),
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
  try {
    const { data: users, error } = await supabaseAdmin
      .from('user_profiles')
      .select('id, full_name, email, role, credits, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return c.json(users || []);
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
      .select('id, name, email, status, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;
    return c.json(data || []);
  } catch (err) {
    console.error('Admin submissions fetch error:', err);
    return c.json({ error: 'Erro ao carregar submissões recentes' }, 500);
  }
});

// GET /api/admin/transactions - List recent transactions
app.get('/transactions', authMiddleware, adminMiddleware, async (c) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('credit_transactions')
      .select('id, user_id, type, amount, created_at')
      .order('created_at', { ascending: false })
      .limit(20);

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

export default app;
