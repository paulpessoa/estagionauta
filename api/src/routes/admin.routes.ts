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

const feedbackJotformSchema = z.object({
  email: z.string().email(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
  source: z.string().default('jotform'),
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
        acc[curr.user_id] = (acc[curr.user_id] || 0) + curr.amount;
      }
      return acc;
    }, {});

    const enrichedUsers = (users || []).map(u => ({
      ...u,
      referrals_count: referralCounts[u.id] || 0,
      total_paid: ltvCounts[u.id] || 0
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

    const { error: updateError } = await supabaseAdmin
      .from('user_profiles')
      .update({ role })
      .eq('id', targetId);

    if (updateError) {
      console.error('Role update error:', updateError);
      return c.json({ error: 'Erro ao atualizar cargo' }, 500);
    }

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

// PUT /api/admin/users/:id/credits - Adjust user credits securely
app.put('/users/:id/credits', authMiddleware, adminMiddleware, zValidator('json', updateCreditsSchema), async (c) => {
  const admin = c.get('user');
  if (!(await verifyIsAdmin(admin.id))) {
    return c.json({ error: 'Acesso negado: Apenas administradores' }, 403);
  }
  const targetId = c.req.param('id');
  const { amount } = c.req.valid('json');

  try {
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

    const { error: updateError } = await supabaseAdmin
      .from('user_profiles')
      .update({ credits: newCredits })
      .eq('id', targetId);

    if (updateError) {
      console.error('Credits update error:', updateError);
      return c.json({ error: 'Erro ao atualizar créditos' }, 500);
    }

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
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(targetId);

    if (authError) {
      console.error('Error deleting user from auth:', authError);
      await supabaseAdmin.from('user_profiles').delete().eq('id', targetId);
    }
    
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

    const { data: authData, error: authError } = await menvoClient.auth.admin.listUsers();
    if (authError) {
      console.error('Error listing external auth users:', authError);
      return c.json({ error: 'Erro ao listar usuários do auth externo: ' + authError.message }, 500);
    }

    let profiles: any[] = [];
    const { data: profilesData, error: profilesError } = await menvoClient
      .from('profiles')
      .select('*')
      .limit(1000);
    
    if (!profilesError && profilesData) {
      profiles = profilesData;
    } else {
      const { data: userProfilesData, error: userProfilesError } = await menvoClient
        .from('user_profiles')
        .select('*')
        .limit(1000);
      if (!userProfilesError && userProfilesData) {
        profiles = userProfilesData;
      }
    }

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
      let degree = '';
      let linkedinUrl = '';
      let githubUrl = '';
      let portfolioUrl = '';
      let cityState = '';
      let isCurrentlyInterning = false;
      let bio = '';

      for (const key in answers) {
        const field = answers[key];
        if (!field || field.answer === undefined || field.answer === null) continue;

        const fieldName = (field.name || '').toLowerCase();
        const fieldType = (field.type || '').toLowerCase();
        const fieldText = (field.text || '').toLowerCase();
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
        }
        // Check course first to avoid matching generic "nome"
        else if (fieldName.includes('curso') || fieldName.includes('nomedo') || fieldName.includes('cursoe') || fieldText.includes('curso')) {
          if (typeof val === 'string') {
            course = val.trim();
          }
        }
        else if (fieldName.includes('nome') || fieldName.includes('name') || fieldName.includes('completo')) {
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
        } else if (fieldName.includes('telefone') || fieldName.includes('phone') || fieldName.includes('celular') || fieldText.includes('telefone') || fieldText.includes('celular')) {
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
        else if (fieldType === 'control_fileupload' || fieldName.includes('curriculo') || fieldName.includes('currículo') || fieldName.includes('resume') || fieldName.includes('upload') || fieldText.includes('currículo') || fieldText.includes('curriculo') || fieldText.includes('resume')) {
          if (Array.isArray(val) && val.length > 0) {
            resumeUrl = val[0];
          } else if (typeof val === 'string') {
            resumeUrl = val;
          }
        }
        else if (fieldName.includes('instituicao') || fieldName.includes('instituição') || fieldName.includes('universidade') || fieldName.includes('faculdade') || fieldText.includes('instituição') || fieldText.includes('universidade') || fieldText.includes('faculdade') || fieldText.includes('escola')) {
          if (typeof val === 'string') {
            university = val.trim();
          }
        }
        else if (fieldName.includes('nivelacademico') || fieldName.includes('nível acadêmico') || fieldText.includes('nível acadêmico') || fieldText.includes('nivel academico') || fieldName.includes('nivel') || fieldText.includes('nível') || fieldName.includes('grau')) {
          if (typeof val === 'string') {
            degree = val.trim();
          }
        }
        else if (fieldName.includes('linkedin') || fieldText.includes('linkedin')) {
          if (typeof val === 'string') {
            linkedinUrl = val.trim();
          }
        }
        else if (fieldName.includes('github') || fieldText.includes('github')) {
          if (typeof val === 'string') {
            githubUrl = val.trim();
          }
        }
        else if (fieldName.includes('portfolio') || fieldText.includes('portfolio') || fieldName.includes('website') || fieldText.includes('website') || fieldName.includes('site') || fieldText.includes('site')) {
          if (typeof val === 'string') {
            portfolioUrl = val.trim();
          }
        }
        else if (fieldName.includes('cidade') || fieldText.includes('cidade') || fieldName.includes('reside') || fieldText.includes('reside') || fieldName.includes('estado') || fieldText.includes('estado')) {
          if (typeof val === 'string') {
            cityState = val.trim();
          }
        }
        else if (fieldName.includes('estagiando') || fieldText.includes('estagiando') || fieldText.includes('estagiário') || fieldText.includes('estagiario') || fieldName.includes('estagiario') || fieldText.includes('estágio') || fieldText.includes('estagio') || fieldText.includes('já é estagiário')) {
          if (typeof val === 'string') {
            const v = val.toLowerCase().trim();
            isCurrentlyInterning = v === 'sim' || v === 'yes' || v === 's' || v.startsWith('si') || v.includes('estagio') || v.includes('estágio');
          } else if (typeof val === 'boolean') {
            isCurrentlyInterning = val;
          }
        }
        else if (fieldName.includes('brevemente') || fieldText.includes('brevemente') || fieldName.includes('sobre voce') || fieldText.includes('sobre você') || fieldName.includes('apresentacao') || fieldText.includes('apresentação') || fieldName.includes('resumo') || fieldText.includes('resumo') || fieldName.includes('fala') || fieldText.includes('fale')) {
          if (typeof val === 'string') {
            bio = val.trim();
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
        degree: degree || null,
        linkedin_url: linkedinUrl || null,
        github_url: githubUrl || null,
        portfolio_url: portfolioUrl || null,
        city_state: cityState || null,
        is_currently_interning: isCurrentlyInterning,
        bio: bio || null,
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
    phone: z.string().optional().nullable(),
    resume_url: z.string().optional().nullable(),
    course: z.string().optional().nullable(),
    university: z.string().optional().nullable(),
    degree: z.string().optional().nullable(),
    linkedin_url: z.string().optional().nullable(),
    github_url: z.string().optional().nullable(),
    portfolio_url: z.string().optional().nullable(),
    city_state: z.string().optional().nullable(),
    is_currently_interning: z.boolean().optional().nullable(),
    bio: z.string().optional().nullable(),
    profile_data: z.any().optional().nullable()
  }))
});

// POST /api/admin/jotform/import - Import selected Jotform candidates
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
      const { data: existingUser } = await supabaseAdmin
        .from('user_profiles')
        .select('id, email')
        .eq('email', user.email)
        .maybeSingle();

      if (existingUser) {
        results.skipped.push(user.email);
        continue;
      }

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

      const { error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .update({
          phone: user.phone || '',
          course: user.course || '',
          university: user.university || '',
          linkedin_url: user.linkedin_url || null,
          github_url: user.github_url || null,
          portfolio_url: user.portfolio_url || null,
          city_state: user.city_state || null,
          is_currently_interning: user.is_currently_interning || false,
          bio: user.bio || null,
          education: (user.university || user.course) ? [
            {
              institution: user.university || '',
              degree: user.degree || 'Graduação',
              fieldOfStudy: user.course || '',
              startDate: '',
              endDate: '',
              current: true
            }
          ] : [],
          credits: 10,
          raw_import_data: user.profile_data || null
        })
        .eq('id', newUserId);

      if (profileError) {
        console.error(`Error updating profile for ${user.email}:`, profileError);
      }

      await supabaseAdmin
        .from('credit_transactions')
        .insert({
          user_id: newUserId,
          type: 'bonus',
          amount: 5,
          description: 'Bônus de boas-vindas da importação Jotform (+5 créditos)'
        });

      let fileUrl = '';
      if (user.resume_url) {
        try {
          const downloadRes = await fetch(user.resume_url);
          if (downloadRes.ok) {
            const arrayBuffer = await downloadRes.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            
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
        subject: 'Vem pro Estagionauta! Comece com 10 créditos grátis',
        htmlContent: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; padding: 32px 20px; color: #2c3e50; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%);">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid #e8eef5;">
            <h1 style="color: #4f46e5; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
              Vem pro Estagionauta!
            </h1>
            <p style="margin: 12px 0 0 0; color: #6b7280; font-size: 14px; font-weight: 500;">A plataforma que vai acelerar sua carreira</p>
          </div>

          <!-- Main content -->
          <div style="margin-bottom: 28px;">
            <p style="margin: 0 0 16px 0; color: #374151; font-size: 15px; line-height: 1.6;">
              Oi ${user.full_name},
            </p>
            
            <p style="margin: 0 0 16px 0; color: #374151; font-size: 15px; line-height: 1.6;">
              Estou entrando em contato pois você se inscreveu anteriormente para fazer parte do nosso grupo de WhatsApp no perfil <strong>instagram.com/estagiorecife</strong>. Devido à correria do dia a dia, por um tempo não consegui dar a atenção e o retorno que todos vocês mereciam. Como este é um trabalho voluntário que realizo com muito carinho, peço desculpas pela demora.
            </p>
            
            <p style="margin: 0 0 16px 0; color: #374151; font-size: 15px; line-height: 1.6;">
              Pensando em como ajudar você e centenas de outros estudantes de forma automatizada e eficiente com os desafios da busca por estágio, eu desenvolvi o <strong>Estagionauta</strong>. Esta é uma plataforma completa com ferramentas gratuitas e premium para acelerar sua carreira.
            </p>

            <p style="margin: 0 0 20px 0; color: #374151; font-size: 15px; line-height: 1.6;">
              Aqui você encontra ferramentas poderosas:
            </p>

            <!-- Features list -->
            <div style="background: #f9fafb; padding: 20px; border-radius: 10px; border-left: 4px solid #4f46e5; margin-bottom: 20px;">
              <ul style="margin: 0; padding: 0; list-style: none;">
                <li style="margin-bottom: 12px; display: flex; gap: 10px;">
                  <span style="flex-shrink: 0; color: #4f46e5; font-weight: bold;">•</span>
                  <span style="color: #374151; font-size: 14px;"><strong>Análise inteligente de currículo:</strong> Envie seu PDF e receba feedback detalhado com pontos fortes, áreas de melhoria e recomendações.</span>
                </li>
                <li style="margin-bottom: 12px; display: flex; gap: 10px;">
                  <span style="flex-shrink: 0; color: #4f46e5; font-weight: bold;">•</span>
                  <span style="color: #374151; font-size: 14px;"><strong>Gerador de currículos:</strong> Crie um currículo profissional formatado conforme as melhores práticas de recrutadores.</span>
                </li>
                <li style="margin-bottom: 12px; display: flex; gap: 10px;">
                  <span style="flex-shrink: 0; color: #4f46e5; font-weight: bold;">•</span>
                  <span style="color: #374151; font-size: 14px;"><strong>Simulador de entrevistas:</strong> Treine com IA simulando entrevistas reais para empresas específicas.</span>
                </li>
                <li style="display: flex; gap: 10px;">
                  <span style="flex-shrink: 0; color: #4f46e5; font-weight: bold;">•</span>
                  <span style="color: #374151; font-size: 14px;"><strong>Rover - Seu copiloto:</strong> Assistente virtual que responde dúvidas sobre carreira, mercado e desenvolvimento profissional.</span>
                </li>
              </ul>
            </div>

            <!-- Credits highlight -->
            <div style="background: linear-gradient(135deg, #f0f4ff 0%, #f5f0ff 100%); padding: 18px; border-radius: 10px; border: 2px solid #4f46e5; margin-bottom: 20px; text-align: center;">
              <p style="margin: 0 0 8px 0; color: #4f46e5; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">PRESENTE DE BOAS-VINDAS</p>
              <p style="margin: 0; color: #2c3e50; font-size: 24px; font-weight: 700;">10 Créditos Grátis</p>
              <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 13px;">Para você começar a usar as ferramentas sem custar nada</p>
            </div>

            <!-- Mentor section -->
            <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin-bottom: 24px; border-left: 4px solid #6b21a8;">
              <p style="margin: 0 0 8px 0; color: #6b21a8; font-size: 13px; font-weight: 600; text-transform: uppercase;">Para profissionais formados</p>
              <p style="margin: 0; color: #374151; font-size: 14px; line-height: 1.5;">
                Se você já está formado e quer compartilhar sua experiência, junte-se ao Menvo como mentor voluntário. Ajude jovens profissionais a alcançarem seus sonhos e expanda sua rede.
                <a href="https://menvo.com.br" target="_blank" style="color: #4f46e5; text-decoration: none; font-weight: 600;">Conheça o Menvo</a>
              </p>
            </div>
          </div>

          <!-- CTA Button -->
          <div style="margin: 32px 0; text-align: center;">
            <a href="${inviteLink}" style="background: linear-gradient(135deg, #4f46e5 0%, #3f3cdb 100%); color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 10px; font-weight: 600; display: inline-block; box-shadow: 0 4px 15px rgba(79, 70, 229, 0.3); transition: transform 0.2s, box-shadow 0.2s; font-size: 16px;">
              Ativar Conta e Usar Créditos
            </a>
          </div>

          <p style="text-align: center; margin: 16px 0 0 0; color: #9ca3af; font-size: 12px;">
            Se o botão não funcionar, copie e cole este link no seu navegador:<br>
            <code style="background: #f3f4f6; padding: 8px 12px; border-radius: 4px; display: inline-block; margin-top: 8px; word-break: break-all; color: #4f46e5; font-size: 11px;">${inviteLink}</code>
          </p>

          <!-- Feedback Section -->
          <div style="background: #f9fafb; padding: 24px; border-radius: 10px; margin: 32px 0; text-align: center;">
            <p style="margin: 0 0 16px 0; color: #2c3e50; font-weight: 600; font-size: 15px;">O que achou desta iniciativa?</p>
            <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 13px;">Sua opinião é essencial pra gente melhorar. Clique em uma estrela ou deixe um comentário.</p>
            
            <div style="display: flex; justify-content: center; gap: 8px; margin-bottom: 16px;">
              <a href="${env.CLIENT_URL}/feedback?rating=1&email=${encodeURIComponent(user.email)}&source=jotform" style="display: inline-block; width: 48px; height: 48px; line-height: 48px; text-align: center; background: #fee2e2; border-radius: 50%; text-decoration: none; font-size: 20px; transition: transform 0.2s; border: 2px solid transparent;" title="Péssimo">1</a>
              <a href="${env.CLIENT_URL}/feedback?rating=2&email=${encodeURIComponent(user.email)}&source=jotform" style="display: inline-block; width: 48px; height: 48px; line-height: 48px; text-align: center; background: #fecaca; border-radius: 50%; text-decoration: none; font-size: 20px; transition: transform 0.2s; border: 2px solid transparent;" title="Ruim">2</a>
              <a href="${env.CLIENT_URL}/feedback?rating=3&email=${encodeURIComponent(user.email)}&source=jotform" style="display: inline-block; width: 48px; height: 48px; line-height: 48px; text-align: center; background: #fef3c7; border-radius: 50%; text-decoration: none; font-size: 20px; transition: transform 0.2s; border: 2px solid transparent;" title="Neutro">3</a>
              <a href="${env.CLIENT_URL}/feedback?rating=4&email=${encodeURIComponent(user.email)}&source=jotform" style="display: inline-block; width: 48px; height: 48px; line-height: 48px; text-align: center; background: #dbeafe; border-radius: 50%; text-decoration: none; font-size: 20px; transition: transform 0.2s; border: 2px solid transparent;" title="Bom">4</a>
              <a href="${env.CLIENT_URL}/feedback?rating=5&email=${encodeURIComponent(user.email)}&source=jotform" style="display: inline-block; width: 48px; height: 48px; line-height: 48px; text-align: center; background: #dcfce7; border-radius: 50%; text-decoration: none; font-size: 20px; transition: transform 0.2s; border: 2px solid transparent;" title="Excelente">5</a>
            </div>

            <p style="margin: 0; color: #6b7280; font-size: 12px;">
              <a href="${env.CLIENT_URL}/feedback?email=${encodeURIComponent(user.email)}&source=jotform&show_comment=true" style="color: #4f46e5; text-decoration: none; font-weight: 600;">Deixar comentário</a>
            </p>
          </div>

          <!-- Support section -->
          <div style="background: #f0fdf4; padding: 16px; border-radius: 8px; margin-bottom: 24px; border-left: 4px solid #22c55e;">
            <p style="margin: 0 0 8px 0; color: #15803d; font-size: 13px; font-weight: 600;">Dúvidas ou sugestões?</p>
            <p style="margin: 0; color: #374151; font-size: 14px; line-height: 1.5;">
              Estou aqui pra ajudar! Responda este e-mail ou me envie mensagem pelo WhatsApp +55 81 99509-7377
            </p>
          </div>

          <!-- Footer -->
          <div style="border-top: 2px solid #e8eef5; padding-top: 24px; margin-top: 32px;">
            <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 16px;">
              <img src="https://github.com/paulmspessoa.png" alt="Paul Pessoa" style="width: 64px; height: 64px; border-radius: 50%; border: 3px solid #e8eef5;" />
              <div>
                <h4 style="margin: 0; color: #2c3e50; font-size: 15px; font-weight: 600;">Paul Pessoa</h4>
                <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 13px;">Criador do Estagionauta & Software Developer</p>
                <div style="margin-top: 8px; display: flex; gap: 12px;">
                  <a href="https://www.linkedin.com/in/paulmspessoa" target="_blank" style="color: #4f46e5; text-decoration: none; font-size: 12px; font-weight: 600;">LinkedIn</a>
                  <a href="https://wa.me/5581995097377" target="_blank" style="color: #4f46e5; text-decoration: none; font-size: 12px; font-weight: 600;">WhatsApp</a>
                </div>
              </div>
            </div>

            <p style="margin: 16px 0 0 0; padding-top: 16px; border-top: 1px solid #e8eef5; color: #9ca3af; font-size: 11px; line-height: 1.6;">
              <strong>Privacidade:</strong> Você recebeu este e-mail porque se inscreveu no @estagiorecife ou na plataforma Estagionauta. Sua privacidade é nossa prioridade (LGPD). Se não deseja mais receber mensagens, 
              <a href="mailto:contato@estagionauta.com.br?subject=Desinscrever" style="color: #4f46e5; text-decoration: none;">clique aqui para se desinscrever</a>.
            </p>
          </div>
        </div>`,
        textContent: `Vem pro Estagionauta!\n\nOlá ${user.full_name},\n\nEstou entrando em contato pois você se inscreveu anteriormente para fazer parte do nosso grupo de WhatsApp no perfil instagram.com/estagiorecife. Devido à correria do dia a dia, por um tempo não consegui dar a atenção e o retorno que todos vocês mereciam. Como este é um trabalho voluntário que realizo com muito carinho, peço desculpas pela demora.\n\nPensando em como ajudar você e centenas de outros estudantes de forma automatizada e eficiente com os desafios da busca por estágio, eu desenvolvi o Estagionauta. Esta é uma plataforma completa com ferramentas gratuitas e premium para acelerar sua carreira.\n\nComo você já demonstrou interesse em evoluir profissionalmente no EstagiRecife, adicionei 10 créditos gratuitos na sua conta como presente de boas-vindas para você testar todos os recursos imediatamente.\n\nAtive sua conta e resgate seus créditos aqui: ${inviteLink}\n\nAqui você encontra:\n- Análise inteligente de currículo\n- Gerador de currículos\n- Simulador de entrevistas com IA\n- Rover, seu copiloto de carreira\n\nProfissional formado? Seja mentor no Menvo: https://menvo.com.br\n\nDúvidas?\nE-mail: contato@estagionauta.com.br\nWhatsApp: +55 81 99509-7377\n\nAbração,\nPaul Pessoa`,
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

// POST /api/feedback-jotform - Specialized endpoint for Jotform feedback (with source tracking)
app.post('/feedback-jotform', zValidator('json', feedbackJotformSchema), async (c) => {
  const { email, rating, comment, source } = c.req.valid('json');

  try {
    const { error } = await supabaseAdmin
      .from('feedbacks')
      .insert({
        email: email.trim(),
        rating,
        comment: comment?.trim() || null,
        source, // Track source (jotform, email, etc)
        created_at: new Date().toISOString()
      });

    if (error) throw error;

    return c.json({ 
      success: true, 
      message: 'Feedback recebido com sucesso! Obrigado pela sua opinião.' 
    });
  } catch (err: any) {
    console.error('Feedback Jotform error:', err);
    return c.json({ 
      error: 'Erro ao registrar feedback. Tente novamente.' 
    }, 500);
  }
});

export default app;
