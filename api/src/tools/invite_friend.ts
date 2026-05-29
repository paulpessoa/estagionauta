import { supabaseAdmin } from '../services/supabase.service.js';
import { env } from '../config/env.js';

export const inviteFriendDefinition = {
  type: 'function' as const,
  function: {
    name: 'invite_friend',
    description: 'Envia um convite por e-mail para um amigo se cadastrar na plataforma através do link de indicação do usuário. Recebe o nome e o e-mail do amigo.',
    parameters: {
      type: 'object',
      properties: {
        email: { type: 'string', description: 'O e-mail do amigo que será convidado.' },
        name: { type: 'string', description: 'O nome do amigo que será convidado.' }
      },
      required: ['email', 'name']
    }
  }
};

export async function runInviteFriend(userId: string, args: { email: string; name: string }) {
  try {
    const { email, name } = args;

    // 1. Validar e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { error: 'O endereço de e-mail fornecido é inválido.' };
    }

    // 2. Verificar se o amigo já foi convidado por este usuário
    const { data: existingInvite } = await supabaseAdmin
      .from('referral_invites')
      .select('id, status')
      .eq('referrer_id', userId)
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (existingInvite) {
      return { 
        success: false,
        message: `Você já convidou ${name} (${email}) anteriormente. Status atual: ${existingInvite.status}.` 
      };
    }

    // 3. Buscar perfil e código de indicação do usuário
    const { data: referrer, error: refErr } = await supabaseAdmin
      .from('user_profiles')
      .select('full_name, email, referral_code')
      .eq('id', userId)
      .single();

    if (refErr || !referrer) {
      return { error: 'Não foi possível encontrar suas informações de perfil para enviar o convite.' };
    }

    const referralCode = referrer.referral_code || userId.replace(/-/g, '').substring(0, 8).toUpperCase();
    const referralUrl = `${env.CLIENT_URL}/r/${referralCode}`;
    const referrerName = referrer.full_name || 'Um amigo';

    // 4. Inserir convite na tabela do banco
    const { error: insertErr } = await supabaseAdmin
      .from('referral_invites')
      .insert({
        referrer_id: userId,
        email: email.toLowerCase(),
        name,
        status: 'pending'
      });

    if (insertErr) {
      console.error('Error inserting referral invite in tool:', insertErr);
      return { error: 'Ocorreu um erro ao salvar o convite no banco de dados.' };
    }

    let emailSent = false;
    let emailError = '';

    // 5. Enviar e-mail via Brevo se a chave de API estiver configurada
    if (env.BREVO_API_KEY) {
      try {
        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Você foi convidado para o Estagionauta!</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; }
              .header { text-align: center; background-color: #667eea; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
              .content { padding: 30px; background-color: #fafafa; }
              .btn { display: inline-block; background-color: #764ba2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 15px; }
              .footer { text-align: center; font-size: 12px; color: #777; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2>🚀 Convite Especial!</h2>
              </div>
              <div class="content">
                <p>Olá, <strong>${name}</strong>!</p>
                <p>Seu amigo <strong>${referrerName}</strong> está usando o <strong>Estagionauta</strong> para conseguir as melhores vagas de estágio e treinar para processos seletivos.</p>
                <p>Ele te convidou para fazer parte da comunidade! Ao se cadastrar, você ganha <strong>5 créditos gratuitos</strong> para simular entrevistas com IA e analisar o seu currículo.</p>
                <div style="text-align: center;">
                  <a href="${referralUrl}" class="btn" style="color: white !important;">Aceitar Convite & Cadastrar</a>
                </div>
                <p style="margin-top: 20px; font-size: 13px; color: #666;">Caso o botão acima não funcione, copie e cole este link no seu navegador: <br>${referralUrl}</p>
              </div>
              <div class="footer">
                <p>Esta mensagem foi enviada pelo Estagionauta a pedido de ${referrer.email}.</p>
              </div>
            </div>
          </body>
          </html>
        `;

        const textContent = `
Olá, ${name}!

Seu amigo ${referrerName} está usando o Estagionauta para acelerar a carreira dele e conseguir as melhores vagas de estágio.
Ele te convidou para fazer parte! Ao se cadastrar, você ganha 5 créditos gratuitos de boas-vindas para simular entrevistas com IA e analisar o seu currículo.

Para aceitar o convite e se cadastrar, acesse:
${referralUrl}

Abraços,
Equipe Estagionauta
        `.trim();

        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'api-key': env.BREVO_API_KEY,
          },
          body: JSON.stringify({
            sender: {
              name: 'Estagionauta',
              email: 'noreply@estagionauta.com.br',
            },
            to: [
              {
                email: email,
                name: name,
              },
            ],
            subject: `${referrerName} te convidou para o Estagionauta! 🚀`,
            htmlContent,
            textContent,
          }),
        });

        if (response.ok) {
          emailSent = true;
          // Log email to DB
          const result = await response.json() as any;
          await supabaseAdmin.from('email_logs').insert({
            to_email: email,
            from_email: 'noreply@estagionauta.com.br',
            subject: `${referrerName} te convidou para o Estagionauta! 🚀`,
            status: 'sent',
            provider: 'brevo',
            provider_id: result.messageId,
            template_name: 'referral_invite',
            profile_id: userId,
          });
        } else {
          const errBody = await response.text();
          emailError = `Brevo error: ${errBody}`;
        }
      } catch (err: any) {
        console.error('Error sending referral email:', err);
        emailError = err.message || String(err);
      }
    } else {
      emailError = 'Serviço de e-mail (Brevo) não configurado.';
    }

    return {
      success: true,
      emailSent,
      name,
      email,
      referralUrl,
      message: emailSent 
        ? `Convite enviado por e-mail com sucesso para ${name} (${email})!`
        : `Convite cadastrado no banco, mas não foi possível disparar o e-mail (${emailError}). Compartilhe o link manualmente com seu amigo: ${referralUrl}`
    };
  } catch (err: any) {
    console.error('Unexpected error in invite_friend tool:', err);
    return { error: `Erro ao convidar amigo: ${err.message}` };
  }
}
