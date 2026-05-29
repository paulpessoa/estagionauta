import { supabaseAdmin } from '../services/supabase.service.js';

export const checkAccountStatusDefinition = {
  type: 'function' as const,
  function: {
    name: 'check_account_status',
    description: 'Consulta informações e status gerais da conta do usuário logado (nível de acesso/tier, e-mail cadastrado, data de criação, créditos totais comprados e utilizados).',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
};

export async function runCheckAccountStatus(userId: string) {
  try {
    const { data: profile, error } = await supabaseAdmin
      .from('user_profiles')
      .select('email, role, subscription_status, subscription_tier, credits, total_credits_used, total_credits_purchased, created_at')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      console.error('Error fetching account status in tool:', error);
      return { error: 'Não foi possível encontrar as informações da conta.' };
    }

    const tierLabels: Record<string, string> = {
      free: 'Gratuito',
      premium: 'Cosmonauta (Premium)',
      astronauta: 'Astronauta (Avançado)'
    };

    const roleLabels: Record<string, string> = {
      student: 'Estudante',
      moderator: 'Moderador',
      admin: 'Administrador'
    };

    const formattedDate = new Date(profile.created_at).toLocaleDateString('pt-BR');

    return {
      success: true,
      email: profile.email,
      role: roleLabels[profile.role] || profile.role,
      subscriptionStatus: profile.subscription_status,
      tier: tierLabels[profile.subscription_tier || 'free'] || profile.subscription_tier || 'Gratuito',
      credits: profile.credits,
      totalUsed: profile.total_credits_used,
      totalPurchased: profile.total_credits_purchased,
      createdAt: formattedDate,
      message: `Informações da sua Conta:
- E-mail: ${profile.email}
- Cargo na Plataforma: ${roleLabels[profile.role] || profile.role}
- Tipo de Conta / Assinatura: ${tierLabels[profile.subscription_tier || 'free'] || 'Gratuito'} (Status: ${profile.subscription_status})
- Saldo Atual: ${profile.credits} créditos
- Créditos Consumidos: ${profile.total_credits_used} créditos
- Créditos Comprados (Histórico): ${profile.total_credits_purchased} créditos
- Membro desde: ${formattedDate}`
    };
  } catch (err: any) {
    console.error('Unexpected error in check_account_status tool:', err);
    return { error: `Erro inesperado ao buscar status da conta: ${err.message}` };
  }
}
