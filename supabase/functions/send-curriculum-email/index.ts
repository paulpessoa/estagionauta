import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Token de autorização necessário' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get environment variables
    const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!BREVO_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'API key do Brevo não configurada' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({ error: 'Configuração do Supabase incompleta' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse request body
    const { toEmails, subject, message, profile, curriculumUrl } = await req.json()

    // Validate input
    if (!toEmails || !Array.isArray(toEmails) || toEmails.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Emails são obrigatórios' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (toEmails.length > 5) {
      return new Response(
        JSON.stringify({ error: 'Máximo 5 emails permitidos' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verify that the user is the owner of the profile or has permission
    if (profile.id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Sem permissão para compartilhar este currículo' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get user profile to use their email as sender
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile) {
      return new Response(
        JSON.stringify({ error: 'Perfil do usuário não encontrado' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const results = []

    // Send email to each recipient
    for (const toEmail of toEmails) {
      try {
        const emailData = {
          sender: {
            name: 'Estagionauta',
            email: 'noreply@estagionauta.com.br' // Email oficial da plataforma
          },
          replyTo: {
            name: userProfile.full_name || 'Estagionauta',
            email: userProfile.email // Reply-to para o usuário logado
          },
          to: [
            {
              email: toEmail,
              name: toEmail.split('@')[0]
            }
          ],
          cc: [
            {
              email: userProfile.email, // Cópia para o usuário logado
              name: userProfile.full_name || 'Usuário Estagionauta'
            }
          ],
          subject: subject,
          htmlContent: generateEmailHTML(profile, message, curriculumUrl, userProfile),
          textContent: generateEmailText(profile, message, curriculumUrl, userProfile)
        }

        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'api-key': BREVO_API_KEY
          },
          body: JSON.stringify(emailData)
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || 'Erro ao enviar email')
        }

        const result = await response.json()

        // Save to history
        await saveEmailHistory(supabase, {
          to_email: toEmail,
          from_email: 'noreply@estagionauta.com.br', // Email oficial da plataforma
          subject: subject,
          status: 'sent',
          provider: 'brevo',
          provider_id: result.messageId,
          template_name: 'curriculum_share',
          profile_id: profile.id,
          curriculum_slug: profile.curriculo_slug
        })

        results.push({
          email: toEmail,
          success: true
        })

      } catch (error) {
        console.error(`Error sending email to ${toEmail}:`, error)

        // Save error to history
        await saveEmailHistory(supabase, {
          to_email: toEmail,
          from_email: 'noreply@estagionauta.com.br', // Email oficial da plataforma
          subject: subject,
          status: 'failed',
          provider: 'brevo',
          error_message: error.message,
          template_name: 'curriculum_share',
          profile_id: profile.id,
          curriculum_slug: profile.curriculo_slug
        })

        results.push({
          email: toEmail,
          success: false,
          error: error.message
        })
      }
    }

    return new Response(
      JSON.stringify({ results }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in send-curriculum-email:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

function generateEmailHTML(profile: any, message: string, curriculumUrl: string, sender: any) {
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
          <h1>📄 Currículo Compartilhado</h1>
          <p>Estagionauta - Plataforma de Carreira</p>
        </div>
        
        <div class="content">
          <div class="sender-info">
            <div class="sender-row">
              <div class="sender-avatar">
                ${sender.full_name ? sender.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'}
              </div>
              <div class="sender-details">
                <h3 style="margin: 0 0 5px 0; color: #333;">${sender.full_name || 'Usuário Estagionauta'}</h3>
                <p style="margin: 0; color: #666; font-size: 14px;">${sender.email}</p>
                <p style="margin: 5px 0 0 0; color: #667eea; font-size: 12px;">✓ Compartilhado através da plataforma Estagionauta</p>
              </div>
            </div>
          </div>

          <div class="platform-info">
            <strong>ℹ️ Informação:</strong> Este email foi enviado pela plataforma Estagionauta em nome de ${sender.full_name || 'um usuário'}. 
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
  `
}

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
  `.trim()
}

async function saveEmailHistory(supabase: any, emailData: any) {
  try {
    console.log('Attempting to save email history:', {
      to_email: emailData.to_email,
      from_email: emailData.from_email,
      subject: emailData.subject,
      status: emailData.status,
      profile_id: emailData.profile_id,
      curriculum_slug: emailData.curriculum_slug
    })

    const insertData: any = {
      to_email: emailData.to_email,
      from_email: emailData.from_email,
      subject: emailData.subject,
      status: emailData.status,
      provider: emailData.provider,
      template_name: emailData.template_name,
      created_at: new Date().toISOString()
    }

    // Adicionar campos opcionais apenas se existirem
    if (emailData.provider_id) insertData.provider_id = emailData.provider_id
    if (emailData.sent_at) insertData.sent_at = emailData.sent_at
    if (emailData.error_message) insertData.error_message = emailData.error_message
    if (emailData.profile_id) insertData.profile_id = emailData.profile_id
    if (emailData.curriculum_slug) insertData.curriculum_slug = emailData.curriculum_slug

    console.log('Insert data prepared:', insertData)

    const { data, error } = await supabase
      .from('email_logs')
      .insert(insertData)
      .select()

    if (error) {
      console.error('Error saving email history:', error)
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
    } else {
      console.log('Email history saved successfully:', data)
    }
  } catch (error) {
    console.error('Exception in saveEmailHistory:', error)
  }
} 