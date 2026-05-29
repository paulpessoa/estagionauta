import { supabaseAdmin } from '../services/supabase.service.js';

export const checkReferralStatsDefinition = {
  type: 'function' as const,
  function: {
    name: 'check_referral_stats',
    description: 'Consulta as estatísticas de indicação de amigos do usuário (convites enviados, cadastrados, ativos e total de créditos recebidos).',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
};

export async function runCheckReferralStats(userId: string) {
  try {
    // 1. Obter total de convidados, cadastrados e ativos
    const { data: invites, error: invitesErr } = await supabaseAdmin
      .from('referral_invites')
      .select('status')
      .eq('referrer_id', userId);

    if (invitesErr) {
      console.error('Error fetching invites count in tool:', invitesErr);
      return { error: `Erro ao buscar dados de indicações: ${invitesErr.message}` };
    }

    const totalInvited = invites.length;
    const totalRegistered = invites.filter(i => i.status === 'registered' || i.status === 'active').length;
    const totalActive = invites.filter(i => i.status === 'active').length;

    // 2. Buscar transações de bônus de indicação
    const { data: transactions, error: txErr } = await supabaseAdmin
      .from('credit_transactions')
      .select('amount, description')
      .eq('user_id', userId)
      .eq('type', 'bonus');

    if (txErr) {
      console.error('Error fetching referral transactions in tool:', txErr);
      return { error: `Erro ao buscar transações de bônus: ${txErr.message}` };
    }

    // Filtrar bônus referentes à indicação
    const referralTx = transactions.filter(t => 
      t.description?.toLowerCase().includes('indicação') || 
      t.description?.toLowerCase().includes('indicado') ||
      t.description?.toLowerCase().includes('bônus: primeira compra')
    );

    const totalEarnedCredits = referralTx.reduce((sum, tx) => sum + tx.amount, 0);

    return {
      success: true,
      totalInvited,
      registeredCount: totalRegistered,
      activeCount: totalActive,
      totalEarnedCredits,
      message: `Estatísticas de Indicação:
- Total de convites enviados: ${totalInvited}
- Amigos que se cadastraram: ${totalRegistered}
- Amigos que compraram planos (ativos): ${totalActive}
- Total de créditos bônus acumulados: ${totalEarnedCredits} créditos`
    };
  } catch (err: any) {
    console.error('Unexpected error in check_referral_stats tool:', err);
    return { error: `Erro inesperado ao buscar estatísticas: ${err.message}` };
  }
}
