import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { authMiddleware, type Env } from '../middleware/auth.middleware.js';
import { supabaseAdmin } from '../services/supabase.service.js';
import { env } from '../config/env.js';

const app = new Hono<Env>();

const emailSchema = z.object({
  toEmails: z.array(z.string().email()).min(1).max(5),
  subject: z.string().min(3),
  message: z.string().min(5),
  profile: z.object({
    id: z.string().uuid(),
    full_name: z.string(),
    course: z.string().nullable().optional(),
    university: z.string().nullable().optional(),
    bio: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    linkedin_url: z.string().nullable().optional(),
    curriculo_slug: z.string().nullable().optional(),
  }),
  curriculumUrl: z.string().url(),
});

// Helper to save email history in the DB
async function saveEmailHistory(emailData: {
  to_email: string;
  from_email: string;
  subject: string;
  status: 'sent' | 'failed';
  provider: 'brevo';
  provider_id?: string;
  error_message?: string;
  template_name: string;
  profile_id?: string;
  curriculum_slug?: string;
}) {
  try {
    const insertData = {
      to_email: emailData.to_email,
      from_email: emailData.from_email,
      subject: emailData.subject,
      status: emailData.status,
      provider: emailData.provider,
      template_name: emailData.template_name,
      provider_id: emailData.provider_id || null,
      error_message: emailData.error_message || null,
      profile_id: emailData.profile_id || null,
      curriculum_slug: emailData.curriculum_slug || null,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabaseAdmin.from('email_logs').insert(insertData);

    if (error) {
      console.error('Error saving email log to DB:', error);
    }
  } catch (err) {
    console.error('Exception saving email log:', err);
  }
}

// Helper to generate HTML email
function generateEmailHTML(profile: any, message: string, curriculumUrl: string, sender: any) {
  const initials = sender.full_name
    ? sender.full_name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Currículo de ${profile.full_name}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .profile-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .btn { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        .sender-info { background: #e8f4fd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
        .sender-avatar { width: 50px; height: 50px; background: #667eea; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; margin-right: 15px; }
        .sender-details { flex: 1; }
        .sender-row { display: flex; align-items: center; }
        .platform-info { background: #f0f8ff; padding: 10px; border-radius: 6px; margin: 15px 0; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Currículo Compartilhado</h1>
          <p>Estagionauta - Plataforma de Carreira</p>
        </div>
        
        <div class="content">
          <div class="sender-info">
            <div class="sender-row">
              <div class="sender-avatar">
                ${initials}
              </div>
              <div class="sender-details">
                <h3 style="margin: 0 0 5px 0; color: #333;">${sender.full_name || 'Usuário Estagionauta'}</h3>
                <p style="margin: 0; color: #666; font-size: 14px;">${sender.email}</p>
                <p style="margin: 5px 0 0 0; color: #667eea; font-size: 12px;">✓ Compartilhado através da plataforma Estagionauta</p>
              </div>
            </div>
          </div>

          <div class="platform-info">
            <strong>Informação:</strong> Este email foi enviado pela plataforma Estagionauta em nome de ${sender.full_name || 'um usuário'}. 
            Uma cópia foi enviada para ${sender.email} para confirmação.
          </div>

          <div class="profile-card">
            <h2>${profile.full_name}</h2>
            ${profile.course && profile.university ? `<p><strong>Formação:</strong> ${profile.course} • ${profile.university}</p>` : ''}
            ${profile.bio ? `<p><strong>Sobre:</strong> ${profile.bio}</p>` : ''}
            ${profile.phone ? `<p><strong>Contato:</strong> ${profile.phone}</p>` : ''}
            ${profile.linkedin_url ? `<p><strong>LinkedIn:</strong> <a href="${profile.linkedin_url}">${profile.linkedin_url}</a></p>` : ''}
          </div>
          
          <div style="white-space: pre-wrap; background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">${message}</div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${curriculumUrl}" class="btn">Ver Currículo Completo</a>
          </div>
          
          <div class="footer">
            <p>Este email foi enviado através da plataforma Estagionauta</p>
            <p>Para responder, use o email: <strong>${sender.email}</strong></p>
            <p>Para mais informações, acesse: <a href="https://estagionauta.com.br">estagionauta.com.br</a></p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Helper to generate text email
function generateEmailText(profile: any, message: string, curriculumUrl: string, sender: any) {
  return `
Currículo de ${profile.full_name} - Estagionauta

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COMPARTILHADO POR: ${sender.full_name || 'Usuário Estagionauta'}
EMAIL: ${sender.email}
PLATAFORMA: Estagionauta
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ℹ️ INFORMAÇÃO: Este email foi enviado pela plataforma Estagionauta 
em nome de ${sender.full_name || 'um usuário'}. Uma cópia foi 
enviada para ${sender.email} para confirmação.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CURRÍCULO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${profile.full_name}
${profile.course && profile.university ? `Formação: ${profile.course} • ${profile.university}` : ''}
${profile.bio ? `Sobre: ${profile.bio}` : ''}
${profile.phone ? `Contato: ${profile.phone}` : ''}
${profile.linkedin_url ? `LinkedIn: ${profile.linkedin_url}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MENSAGEM:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${message}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AÇÃO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Ver currículo completo: ${curriculumUrl}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INFORMAÇÕES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Este email foi enviado através da plataforma Estagionauta
Para responder, use o email: ${sender.email}
Para mais informações: https://estagionauta.com.br
  `.trim();
}

// POST /api/email/send - Share curriculum via email using Brevo
app.post('/send', authMiddleware, zValidator('json', emailSchema), async (c) => {
  const user = c.get('user');
  const { toEmails, subject, message, profile, curriculumUrl } = c.req.valid('json');

  // Verify that the user is the owner of the profile
  if (profile.id !== user.id) {
    return c.json({ error: 'Sem permissão para compartilhar este currículo' }, 403);
  }

  if (!env.BREVO_API_KEY) {
    return c.json({ error: 'Serviço de e-mail não configurado neste ambiente (BREVO_API_KEY ausente)' }, 503);
  }

  try {
    // Get sender's details from DB
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile) {
      console.error('Error fetching user profile for email sharing:', profileError);
      return c.json({ error: 'Perfil do remetente não encontrado' }, 404);
    }

    const results: { email: string; success: boolean; error?: string }[] = [];

    // Send email to each recipient
    for (const toEmail of toEmails) {
      try {
        const emailData = {
          sender: {
            name: 'Estagionauta',
            email: env.BREVO_SENDER_EMAIL,
          },
          replyTo: {
            name: userProfile.full_name || 'Estagionauta',
            email: userProfile.email,
          },
          to: [
            {
              email: toEmail,
              name: toEmail.split('@')[0],
            },
          ],
          cc: [
            {
              email: userProfile.email,
              name: userProfile.full_name || 'Usuário Estagionauta',
            },
          ],
          subject: subject,
          htmlContent: generateEmailHTML(profile, message, curriculumUrl, userProfile),
          textContent: generateEmailText(profile, message, curriculumUrl, userProfile),
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

        const result = (await response.json()) as any;

        // Log successful send to DB
        await saveEmailHistory({
          to_email: toEmail,
          from_email: env.BREVO_SENDER_EMAIL,
          subject: subject,
          status: 'sent',
          provider: 'brevo',
          provider_id: result.messageId,
          template_name: 'curriculum_share',
          profile_id: profile.id,
          curriculum_slug: profile.curriculo_slug || undefined,
        });

        results.push({ email: toEmail, success: true });
      } catch (err: any) {
        console.error(`Failed to send email to ${toEmail}:`, err);

        // Log failed send to DB
        await saveEmailHistory({
          to_email: toEmail,
          from_email: env.BREVO_SENDER_EMAIL,
          subject: subject,
          status: 'failed',
          provider: 'brevo',
          error_message: err.message || String(err),
          template_name: 'curriculum_share',
          profile_id: profile.id,
          curriculum_slug: profile.curriculo_slug || undefined,
        });

        results.push({ email: toEmail, success: false, error: err.message || String(err) });
      }
    }

    return c.json({ results });
  } catch (err) {
    console.error('Email route general error:', err);
    return c.json({ error: 'Erro interno ao processar o envio de email' }, 500);
  }
});

export default app;
