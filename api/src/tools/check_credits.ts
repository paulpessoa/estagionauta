import { supabaseAdmin } from '../services/supabase.service.js';

export const checkCreditsDefinition = {
  type: 'function' as const,
  function: {
    name: 'check_credits',
    description: 'Consulta o saldo atual de créditos do usuário.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
};

export async function runCheckCredits(userId: string) {
  try {
    const { data: profile, error } = await supabaseAdmin
      .from('user_profiles')
      .select('credits, subscription_status')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      return { error: 'Não foi possível consultar os créditos do usuário.' };
    }

    return {
      success: true,
      credits: profile.credits,
      subscription_status: profile.subscription_status,
    };
  } catch (err: any) {
    return { error: `Erro ao consultar créditos: ${err.message}` };
  }
}
