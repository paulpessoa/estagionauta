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

    const results = []

    // Send email to each recipient
    for (const toEmail of toEmails) {
      try {
        const emailData = {
          sender: {
            name: 'Estagionauta',
            email: 'noreply@estagionauta.com'
          },
          to: [
            {
              email: toEmail,
              name: toEmail.split('@')[0]
            }
          ],
          subject: subject,
          htmlContent: generateEmailHTML(profile, message, curriculumUrl),
          textContent: generateEmailText(profile, message, curriculumUrl)
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
          from_email: 'noreply@estagionauta.com',
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
          from_email: 'noreply@estagionauta.com',
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

function generateEmailHTML(profile: any, message: string, curriculumUrl: string) {
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
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📄 Currículo Compartilhado</h1>
          <p>Estagionauta - Plataforma de Carreira</p>
        </div>
        
        <div class="content">
          <div class="profile-card">
            <h2>${profile.full_name}</h2>
            ${profile.course && profile.university ? `<p><strong>Formação:</strong> ${profile.course} • ${profile.university}</p>` : ''}
            ${profile.bio ? `<p><strong>Sobre:</strong> ${profile.bio}</p>` : ''}
            ${profile.phone ? `<p><strong>Contato:</strong> ${profile.phone}</p>` : ''}
            ${profile.linkedin_url ? `<p><strong>LinkedIn:</strong> <a href="${profile.linkedin_url}">${profile.linkedin_url}</a></p>` : ''}
          </div>
          
          <div style="white-space: pre-wrap;">${message}</div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${curriculumUrl}" class="btn">Ver Currículo Completo</a>
          </div>
          
          <div class="footer">
            <p>Este email foi enviado através da plataforma Estagionauta</p>
            <p>Para mais informações, acesse: <a href="https://estagionauta.com">estagionauta.com</a></p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}

function generateEmailText(profile: any, message: string, curriculumUrl: string) {
  return `
Currículo de ${profile.full_name} - Estagionauta

${profile.full_name}
${profile.course && profile.university ? `Formação: ${profile.course} • ${profile.university}` : ''}
${profile.bio ? `Sobre: ${profile.bio}` : ''}
${profile.phone ? `Contato: ${profile.phone}` : ''}
${profile.linkedin_url ? `LinkedIn: ${profile.linkedin_url}` : ''}

${message}

Ver currículo completo: ${curriculumUrl}

---
Este email foi enviado através da plataforma Estagionauta
Para mais informações: https://estagionauta.com
  `.trim()
}

async function saveEmailHistory(supabase: any, emailData: any) {
  try {
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

    const { error } = await supabase
      .from('email_logs')
      .insert(insertData)

    if (error) {
      console.error('Error saving email history:', error)
    } else {
      console.log('Email history saved successfully')
    }
  } catch (error) {
    console.error('Error saving email history:', error)
  }
} 