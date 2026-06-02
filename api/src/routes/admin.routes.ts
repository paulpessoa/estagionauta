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

// GET /api/admin/external-users - Fetch list of users from the external Supabase instance (Menvo)
app.get('/external-users', authMiddleware, adminMiddleware, async (c) => {
  const admin = c.get('user');
  if (!(await verifyIsAdmin(admin.id))) {
    return c.json({ error: 'Acesso negado: Apenas administradores' }, 403);
  }

  const url = env.MENVO_NEXT_PUBLIC_SUPABASE_URL;
  const key = env.MENVO_SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return c.json({ error: 'Chaves do Menvo não configuradas no backend (MENVO_NEXT_PUBLIC_SUPABASE_URL ou MENVO_SUPABASE_SERVICE_ROLE_KEY ausente)' }, 400);
  }

  try {
    const { createClient } = await import('@supabase/supabase-js');
    const menvoClient = createClient(url, key, { auth: { persistSession: false } });

    // Fetch auth users
    const { data: authData, error: authError } = await menvoClient.auth.admin.listUsers();
    if (authError) {
      console.error('Error listing external auth users:', authError);
      return c.json({ error: 'Erro ao listar usuários do auth externo: ' + authError.message }, 500);
    }

    // Try fetching profiles table if it exists to get more details (like name)
    let profiles: any[] = [];
    const { data: profilesData, error: profilesError } = await menvoClient
      .from('profiles')
      .select('*')
      .limit(1000);
    
    if (!profilesError && profilesData) {
      profiles = profilesData;
    } else {
      // Try 'user_profiles' if 'profiles' fails
      const { data: userProfilesData, error: userProfilesError } = await menvoClient
        .from('user_profiles')
        .select('*')
        .limit(1000);
      if (!userProfilesError && userProfilesData) {
        profiles = userProfilesData;
      }
    }

    // Combine them
    const users = (authData.users || []).map((user: any) => {
      const profile = profiles.find((p: any) => p.id === user.id || p.email === user.email || p.user_id === user.id);
      return {
        id: user.id,
        email: user.email,
        phone: user.phone || profile?.phone || '',
        full_name: profile?.full_name || profile?.name || user.user_metadata?.full_name || user.user_metadata?.name || '',
        avatar_url: profile?.avatar_url || user.user_metadata?.avatar_url || '',
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        has_resume: !!(profile?.resume_url || profile?.resume || profile?.curriculum_url || profile?.curriculum),
        resume_url: profile?.resume_url || profile?.resume || profile?.curriculum_url || profile?.curriculum || '',
        profile_data: profile || null
      };
    });

    return c.json({ users });
  } catch (err: any) {
    console.error('External users fetch error:', err);
    return c.json({ error: 'Erro interno ao buscar usuários do Menvo: ' + err.message }, 500);
  }
});

// GET /api/admin/jotform/forms - List active Jotform forms
app.get('/jotform/forms', authMiddleware, adminMiddleware, async (c) => {
  const admin = c.get('user');
  if (!(await verifyIsAdmin(admin.id))) {
    return c.json({ error: 'Acesso negado: Apenas administradores' }, 403);
  }

  const apiKey = c.req.query('apiKey') || env.MENVO_JOTFORM_API_KEY;
  if (!apiKey) {
    return c.json({ error: 'Chave API do Jotform não configurada no backend (MENVO_JOTFORM_API_KEY ausente).' }, 400);
  }

  try {
    const response = await fetch(`https://api.jotform.com/user/forms?limit=100`, {
      headers: {
        'APIKEY': apiKey
      }
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Erro na API do Jotform: ${response.status} - ${errText}`);
    }

    const data = (await response.json()) as any;
    if (data.responseCode !== 200) {
      throw new Error(data.message || 'Erro ao consultar Jotform');
    }

    const forms = (data.content || []).map((form: any) => ({
      id: form.id,
      title: form.title,
      count: parseInt(form.count || '0', 10),
      status: form.status,
      created_at: form.created_at
    }));

    return c.json({ forms });
  } catch (err: any) {
    console.error('Jotform forms fetch error:', err);
    return c.json({ error: 'Erro ao buscar formulários do Jotform: ' + err.message }, 500);
  }
});

// GET /api/admin/jotform/submissions/:formId - Fetch and parse Jotform submissions
app.get('/jotform/submissions/:formId', authMiddleware, adminMiddleware, async (c) => {
  const admin = c.get('user');
  if (!(await verifyIsAdmin(admin.id))) {
    return c.json({ error: 'Acesso negado: Apenas administradores' }, 403);
  }

  const formId = c.req.param('formId');
  const apiKey = c.req.query('apiKey') || env.MENVO_JOTFORM_API_KEY;

  if (!apiKey) {
    return c.json({ error: 'Chave API do Jotform não configurada no backend.' }, 400);
  }

  try {
    const response = await fetch(`https://api.jotform.com/form/${formId}/submissions?limit=1000`, {
      headers: {
        'APIKEY': apiKey
      }
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Erro na API do Jotform: ${response.status} - ${errText}`);
    }

    const data = (await response.json()) as any;
    if (data.responseCode !== 200) {
      throw new Error(data.message || 'Erro ao obter submissões');
    }

    const rawSubmissions = data.content || [];
    const users = rawSubmissions.map((sub: any) => {
      const answers = sub.answers || {};
      
      let name = '';
      let email = '';
      let phone = '';
      let resumeUrl = '';
      let course = '';
      let university = '';

      for (const key in answers) {
        const field = answers[key];
        if (!field || field.answer === undefined || field.answer === null) continue;

        const fieldName = (field.name || '').toLowerCase();
        const fieldType = (field.type || '').toLowerCase();
        const val = field.answer;

        if (fieldType === 'control_email' || fieldName === 'email' || fieldName.includes('email')) {
          email = typeof val === 'string' ? val.trim() : val;
        }
        else if (fieldType === 'control_fullname') {
          if (typeof val === 'object' && val !== null) {
            const first = val.first || '';
            const last = val.last || '';
            name = `${first} ${last}`.trim();
          } else if (typeof val === 'string') {
            name = val.trim();
          }
        } else if (fieldName.includes('nome') || fieldName.includes('name') || fieldName.includes('completo')) {
          if (!name) {
            if (typeof val === 'string') {
              name = val.trim();
            } else if (typeof val === 'object' && val !== null) {
              const first = val.first || '';
              const last = val.last || '';
              name = `${first} ${last}`.trim();
            }
          }
        }
        else if (fieldType === 'control_phone') {
          if (typeof val === 'object' && val !== null) {
            const area = val.area || '';
            const phoneNum = val.phone || '';
            phone = `(${area}) ${phoneNum}`.trim();
          } else if (typeof val === 'string') {
            phone = val.trim();
          }
        } else if (fieldName.includes('telefone') || fieldName.includes('phone') || fieldName.includes('celular')) {
          if (!phone) {
            if (typeof val === 'string') {
              phone = val.trim();
            } else if (typeof val === 'object' && val !== null) {
              const area = val.area || '';
              const phoneNum = val.phone || '';
              phone = `(${area}) ${phoneNum}`.trim();
            }
          }
        }
        else if (fieldType === 'control_fileupload' || fieldName.includes('curriculo') || fieldName.includes('currículo') || fieldName.includes('resume') || fieldName.includes('upload')) {
          if (Array.isArray(val) && val.length > 0) {
            resumeUrl = val[0];
          } else if (typeof val === 'string') {
            resumeUrl = val;
          }
        }
        else if (fieldName.includes('curso') || fieldName.includes('nomedo') || fieldName.includes('cursoe')) {
          if (typeof val === 'string') {
            course = val.trim();
          }
        }
        else if (fieldName.includes('instituicao') || fieldName.includes('instituição') || fieldName.includes('universidade') || fieldName.includes('faculdade')) {
          if (typeof val === 'string') {
            university = val.trim();
          }
        }
      }

      return {
        id: sub.id,
        email: email,
        phone: phone,
        full_name: name || 'Candidato Jotform',
        course: course,
        university: university,
        created_at: sub.created_at,
        has_resume: !!resumeUrl,
        resume_url: resumeUrl,
        profile_data: sub
      };
    });

    const validUsers = users.filter((u: any) => !!u.email);

    return c.json({ users: validUsers });
  } catch (err: any) {
    console.error('Jotform submissions fetch error:', err);
    return c.json({ error: 'Erro ao buscar submissões do Jotform: ' + err.message }, 500);
  }
});

// Zod validation for Jotform import request
const importJotformSchema = z.object({
  users: z.array(z.object({
    email: z.string().email(),
    full_name: z.string(),
    phone: z.string().optional(),
    resume_url: z.string().optional(),
    course: z.string().optional(),
    university: z.string().optional(),
    profile_data: z.any().optional()
  }))
});

// POST /api/admin/jotform/import - Import selected Jotform candidates, create auth, update profile to 10 credits and send Brevo invitation
app.post('/jotform/import', authMiddleware, adminMiddleware, zValidator('json', importJotformSchema), async (c) => {
  const admin = c.get('user');
  if (!(await verifyIsAdmin(admin.id))) {
    return c.json({ error: 'Acesso negado: Apenas administradores' }, 403);
  }

  const { users } = c.req.valid('json');
  
  if (!env.BREVO_API_KEY) {
    return c.json({ error: 'Serviço de e-mail não configurado (BREVO_API_KEY ausente).' }, 400);
  }

  const results = {
    imported: [] as string[],
    skipped: [] as string[],
    failed: [] as { email: string; error: string }[]
  };

  for (const user of users) {
    try {
      // 1. Check if user already exists in profiles
      const { data: existingUser } = await supabaseAdmin
        .from('user_profiles')
        .select('id, email')
        .eq('email', user.email)
        .maybeSingle();

      if (existingUser) {
        results.skipped.push(user.email);
        continue;
      }

      // 2. Create user in Supabase Auth
      const tempPassword = Math.random().toString(36).slice(-12) + 'A1!';
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        email_confirm: true,
        password: tempPassword,
        user_metadata: {
          full_name: user.full_name,
          phone: user.phone || ''
        }
      });

      if (authError || !authData.user) {
        results.failed.push({ email: user.email, error: authError?.message || 'Erro ao criar usuário no Auth' });
        continue;
      }

      const newUserId = authData.user.id;

      // 3. Update the newly created profile with phone, course, university, 10 credits and raw_import_data
      const { error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .update({
          phone: user.phone || '',
          course: user.course || '',
          university: user.university || '',
          credits: 10, // Give 10 credits initial balance
          raw_import_data: user.profile_data || null
        })
        .eq('id', newUserId);

      if (profileError) {
        console.error(`Error updating profile for ${user.email}:`, profileError);
      }

      // 4. Update/insert credit transactions: Add additional 5 credits transaction log (trigger gives 5)
      await supabaseAdmin
        .from('credit_transactions')
        .insert({
          user_id: newUserId,
          type: 'bonus',
          amount: 5,
          description: 'Bônus de boas-vindas da importação Jotform (+5 créditos)'
        });

      // 5. Download and Upload resume PDF to curriculum-files bucket
      let fileUrl = '';
      if (user.resume_url) {
        try {
          const downloadRes = await fetch(user.resume_url);
          if (downloadRes.ok) {
            const arrayBuffer = await downloadRes.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            
            // Extract filename or generate one
            let originalFilename = 'curriculo.pdf';
            try {
              const urlPath = new URL(user.resume_url).pathname;
              const pathFilename = urlPath.substring(urlPath.lastIndexOf('/') + 1);
              if (pathFilename) {
                originalFilename = decodeURIComponent(pathFilename);
              }
            } catch (urlErr) {
              console.error('Error parsing filename from resume URL:', urlErr);
            }
            
            const storagePath = `resumes/${newUserId}/${Date.now()}_${originalFilename}`;

            const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
              .from('curriculum-files')
              .upload(storagePath, buffer, {
                contentType: 'application/pdf',
                upsert: true
              });

            if (uploadError) {
              console.error(`Error uploading resume to storage for ${user.email}:`, uploadError);
            } else if (uploadData) {
              const { data: publicUrlData } = supabaseAdmin.storage
                .from('curriculum-files')
                .getPublicUrl(storagePath);
              fileUrl = publicUrlData?.publicUrl || '';
            }
          }
        } catch (downloadErr) {
          console.error(`Error downloading resume from Jotform for ${user.email}:`, downloadErr);
        }
      }

      // 6. Link in curriculum_analysis
      if (fileUrl) {
        const { error: analysisError } = await supabaseAdmin
          .from('curriculum_analysis')
          .insert({
            user_id: newUserId,
            name: user.full_name,
            email: user.email,
            course: user.course || null,
            university: user.university || null,
            file_url: fileUrl,
            status: 'completed',
            credits_used: 0,
            analysis_data: {
              pontosFortes: ['Currículo original importado do Jotform'],
              areasMelhoria: ['Você pode solicitar uma nova análise inteligente utilizando seus créditos.'],
              recomendacoes: ['Complete o seu perfil acadêmico para melhores resultados.'],
              scoreGeral: 75,
              adequacaoMercado: 75,
              potencialCrescimento: 75,
              resumo: 'Currículo original importado automaticamente a partir das inscrições do Jotform.'
            }
          });

        if (analysisError) {
          console.error(`Error saving curriculum analysis for ${user.email}:`, analysisError);
        }
      }

      // 7. Generate recovery link pointing to the frontend reset-password route
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: user.email,
        options: {
          redirectTo: `${env.CLIENT_URL}/redefinir-senha`
        }
      });

      if (linkError || !linkData?.properties?.action_link) {
        results.failed.push({ email: user.email, error: linkError?.message || 'Erro ao gerar link de convite' });
        continue;
      }

      const inviteLink = linkData.properties.action_link;

      // 8. Send invitation email via Brevo
      const emailData = {
        sender: {
          name: 'Paul Pessoa - Estagionauta',
          email: 'contato@estagionauta.com.br',
        },
        to: [
          {
            email: user.email,
            name: user.full_name
          },
        ],
        subject: 'Convite Especial: Conheça o Estagionauta!',
        htmlContent: `<div style="font-family: Arial, sans-serif; padding: 25px; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff; line-height: 1.6;">
            <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #f1f5f9; padding-bottom: 15px;">
              <h1 style="color: #4f46e5; margin: 0; font-size: 24px;">Convite Especial: Conheça o Estagionauta</h1>
            </div>
            <p>Ola, <strong>${user.full_name}</strong>,</p>
            <p>Estou entrando em contato pois voce se inscreveu anteriormente para fazer parte do nosso grupo de WhatsApp no perfil <strong>instagram.com/estagiorecife</strong>. Devido a correria do dia a dia, por um tempo nao consegui dar a atencao e o retorno que todos voces mereciam. Como este e um trabalho voluntario que realizo com muito carinho, peco desculpas pela demora.</p>
            
            <p>Pensando em como ajudar voce e centenas de outros estudantes de forma automatizada e eficiente com os desafios da busca por estagio, eu desenvolvi o <strong>Estagionauta</strong>. Esta e uma plataforma completa com ferramentas gratuitas e premium para acelerar sua carreira.</p>

            <p>Aqui esta o que voce encontrara no Estagionauta para se destacar no mercado:</p>
            <ul style="padding-left: 20px; color: #334155; margin: 15px 0;">
              <li style="margin-bottom: 8px;"><strong>Analise inteligente e otimizacao de curriculo por inteligencia artificial:</strong> envie seu curriculo em PDF e receba uma avaliacao detalhada com notas, pontos fortes e recomendacoes praticas de melhoria.</li>
              <li style="margin-bottom: 8px;"><strong>Gerador de curriculos profissional:</strong> crie um curriculo formatado de acordo com as melhores praticas recomendadas por recrutadores.</li>
              <li style="margin-bottom: 8px;"><strong>Simulador de entrevistas de emprego com IA:</strong> treine suas respostas com nossa inteligencia artificial simulando entrevistas para empresas e cargos especificos, recebendo feedback em tempo real.</li>
              <li style="margin-bottom: 8px;"><strong>Rover, o agente web inteligente e copiloto de carreira:</strong> um assistente virtual disponivel na plataforma para responder duvidas sobre legislacao de estagio, calcular recesso e analisar seu perfil.</li>
            </ul>

            <p>Como voce ja demonstrou interesse em evoluir profissionalmente no EstagiRecife, adicionei <strong>10 creditos gratuitos</strong> na sua conta como presente de boas-vindas para voce testar todos os recursos imediatamente.</p>

            <div style="margin: 30px 0; text-align: center;">
              <a href="${inviteLink}" style="background-color: #4f46e5; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);">Ativar Minha Conta e Resgatar 10 Creditos</a>
            </div>
            
            <p style="font-size: 12px; color: #64748b; margin-top: 15px;">Se o botao acima nao funcionar, copie e cole o link a seguir no seu navegador:</p>
            <p style="font-size: 11px; color: #4f46e5; word-break: break-all; background: #f8fafc; padding: 10px; border-radius: 6px; border: 1px dashed #cbd5e1; margin-top: 5px;">${inviteLink}</p>
            
            <div style="margin: 30px 0; text-align: center; background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
              <p style="margin: 0 0 12px 0; font-weight: bold; color: #1e293b; font-size: 15px;">O que voce achou deste convite?</p>
              <div style="display: inline-block;">
                <a href="${env.CLIENT_URL}/feedback?rating=1&email=${encodeURIComponent(user.email)}" style="text-decoration: none; display: inline-block; width: 42px; height: 42px; line-height: 42px; margin: 0 4px; border: 1px solid #cbd5e1; border-radius: 6px; background: #ffffff; color: #64748b; font-size: 18px; font-weight: bold; text-align: center;">1 ★</a>
                <a href="${env.CLIENT_URL}/feedback?rating=2&email=${encodeURIComponent(user.email)}" style="text-decoration: none; display: inline-block; width: 42px; height: 42px; line-height: 42px; margin: 0 4px; border: 1px solid #cbd5e1; border-radius: 6px; background: #ffffff; color: #64748b; font-size: 18px; font-weight: bold; text-align: center;">2 ★</a>
                <a href="${env.CLIENT_URL}/feedback?rating=3&email=${encodeURIComponent(user.email)}" style="text-decoration: none; display: inline-block; width: 42px; height: 42px; line-height: 42px; margin: 0 4px; border: 1px solid #cbd5e1; border-radius: 6px; background: #ffffff; color: #64748b; font-size: 18px; font-weight: bold; text-align: center;">3 ★</a>
                <a href="${env.CLIENT_URL}/feedback?rating=4&email=${encodeURIComponent(user.email)}" style="text-decoration: none; display: inline-block; width: 42px; height: 42px; line-height: 42px; margin: 0 4px; border: 1px solid #cbd5e1; border-radius: 6px; background: #ffffff; color: #64748b; font-size: 18px; font-weight: bold; text-align: center;">4 ★</a>
                <a href="${env.CLIENT_URL}/feedback?rating=5&email=${encodeURIComponent(user.email)}" style="text-decoration: none; display: inline-block; width: 42px; height: 42px; line-height: 42px; margin: 0 4px; border: 1px solid #4f46e5; border-radius: 6px; background: #4f46e5; color: #ffffff; font-size: 18px; font-weight: bold; text-align: center;">5 ★</a>
              </div>
              <p style="margin: 12px 0 0 0; font-size: 12px; color: #64748b;">Clique em uma nota acima para nos dar seu feedback sobre a plataforma.</p>
            </div>

            <p style="font-size: 13px; color: #64748b;"><strong>Aviso sobre Privacidade (LGPD):</strong> Caso nao deseje fazer parte deste projeto e queira parar de receber mensagens, basta responder diretamente a este e-mail solicitando a remocao do seu contato. Como a lista de cadastros do Jotform atingiu o limite maximo de armazenamento da ferramenta, estaremos excluindo definitivamente a base de dados do Jotform em breve.</p>
            
            <p style="font-size: 14px; color: #334155; margin-top: 20px;">Se voce tiver qualquer duvida, pode falar diretamente comigo respondendo a este e-mail em <a href="mailto:contato@estagionauta.com.br" style="color: #4f46e5; text-decoration: none;">contato@estagionauta.com.br</a> ou pelo meu <a href="https://wa.me/5581995097377" style="color: #4f46e5; text-decoration: none;">WhatsApp</a>.</p>

            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
            
            <table border="0" cellpadding="0" cellspacing="0" style="margin-top: 20px;">
              <tr>
                <td style="vertical-align: top; padding-right: 15px;">
                  <img src="https://github.com/paulmspessoa.png" alt="Paul Pessoa" style="width: 70px; height: 70px; border-radius: 50%; border: 2px solid #e2e8f0; display: block;" />
                </td>
                <td style="vertical-align: middle;">
                  <h4 style="margin: 0; color: #1e293b; font-size: 16px;">Paul Pessoa</h4>
                  <p style="margin: 3px 0 0 0; color: #64748b; font-size: 13px;">Idealizador do Estagionauta &amp; Software Developer</p>
                  <p style="margin: 5px 0 0 0; font-size: 12px;">
                    <a href="https://www.linkedin.com/in/paulmspessoa" target="_blank" style="color: #4f46e5; text-decoration: none; margin-right: 10px; font-weight: bold;">LinkedIn</a>
                    <a href="https://wa.me/5581995097377" target="_blank" style="color: #4f46e5; text-decoration: none; font-weight: bold;">WhatsApp (+55 81 99509-7377)</a>
                  </p>
                </td>
              </tr>
            </table>
          </div>`,
        textContent: `Ola, ${user.full_name}. Voce foi convidado para o Estagionauta! Ative sua conta usando o link a seguir: ${inviteLink} - Caso tenha duvidas, entre em contato em contato@estagionauta.com.br ou pelo WhatsApp +55 81 99509-7377.`,
      };

      const emailResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'api-key': env.BREVO_API_KEY
        },
        body: JSON.stringify(emailData)
      });

      if (!emailResponse.ok) {
        console.error(`Error sending Brevo email to ${user.email}`);
      }

      // Log email to database
      await supabaseAdmin.from('email_logs').insert({
        to_email: user.email,
        subject: emailData.subject,
        status: emailResponse.ok ? 'sent' : 'failed',
        error_message: emailResponse.ok ? null : `Status ${emailResponse.status}`
      });

      results.imported.push(user.email);
    } catch (err: any) {
      console.error(`Import failed for ${user.email}:`, err);
      results.failed.push({ email: user.email, error: err.message || 'Erro inesperado' });
    }
  }

  return c.json(results);
});

export default app;
