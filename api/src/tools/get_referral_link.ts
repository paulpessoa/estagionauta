import { supabaseAdmin } from '../services/supabase.service.js';
import { env } from '../config/env.js';

export const getReferralLinkDefinition = {
  type: 'function' as const,
  function: {
    name: 'get_referral_link',
    description: 'Obtém o link de indicação (referral link) exclusivo do usuário para ele convidar amigos e ganhar créditos extras.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
};

export async function runGetReferralLink(userId: string) {
  try {
    // 1. Consultar referral_code
    let { data: profile, error } = await supabaseAdmin
      .from('user_profiles')
      .select('referral_code')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      return { error: 'Não foi possível obter o perfil do usuário para consultar o código de indicação.' };
    }

    let referralCode = profile.referral_code;

    // Se por acaso o referral_code for nulo (ou vazio), vamos gerar um e atualizar
    if (!referralCode) {
      referralCode = userId.replace(/-/g, '').substring(0, 8).toUpperCase();
      const { error: updateErr } = await supabaseAdmin
        .from('user_profiles')
        .update({ referral_code: referralCode })
        .eq('id', userId);

      if (updateErr) {
        return { error: 'Ocorreu um erro ao gerar um novo código de indicação.' };
      }
    }

    const referralUrl = `${env.CLIENT_URL}/r/${referralCode}`;

    return {
      success: true,
      referralCode,
      url: referralUrl,
      message: `Aqui está o seu link de indicação personalizado: ${referralUrl}. Envie para seus amigos! Quando eles se cadastrarem, você ganha 3 créditos. Quando eles fizerem a primeira compra, você ganha mais 5 créditos!`
    };
  } catch (err: any) {
    console.error('Unexpected error in get_referral_link tool:', err);
    return { error: `Erro ao buscar link de indicação: ${err.message}` };
  }
}
