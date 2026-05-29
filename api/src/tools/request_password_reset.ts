import { supabaseAdmin } from '../services/supabase.service.js';
import { env } from '../config/env.js';

export const requestPasswordResetDefinition = {
  type: 'function' as const,
  function: {
    name: 'request_password_reset',
    description: 'Envia um e-mail com link seguro de recuperação e alteração de senha para o e-mail cadastrado da conta do usuário. NENHUMA senha é solicitada ou processada no chat.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
};

export async function runRequestPasswordReset(userId: string) {
  try {
    // 1. Obter e-mail do perfil do usuário
    const { data: profile, error } = await supabaseAdmin
      .from('user_profiles')
      .select('email')
      .eq('id', userId)
      .single();

    if (error || !profile?.email) {
      console.error('Error fetching user email for password reset:', error);
      return { error: 'Não foi possível identificar o e-mail do usuário para enviar a redefinição.' };
    }

    // 2. Disparar fluxo de recuperação de senha pelo Supabase Auth
    // Definimos o link de redirecionamento de volta para o app web
    const redirectToUrl = `${env.CLIENT_URL}/redefinir-senha`;

    const { error: authError } = await supabaseAdmin.auth.resetPasswordForEmail(
      profile.email,
      { redirectTo: redirectToUrl }
    );

    if (authError) {
      console.error('Supabase Auth error in password reset tool:', authError);
      return { error: `Erro ao enviar link de recuperação: ${authError.message}` };
    }

    return {
      success: true,
      email: profile.email,
      message: `Um e-mail de recuperação de senha foi enviado com sucesso para ${profile.email}. Verifique sua caixa de entrada e spam para redefinir sua senha.`
    };
  } catch (err: any) {
    console.error('Unexpected error in request_password_reset tool:', err);
    return { error: `Erro inesperado ao solicitar recuperação de senha: ${err.message}` };
  }
}
