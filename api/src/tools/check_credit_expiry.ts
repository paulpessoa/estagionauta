import { supabaseAdmin } from '../services/supabase.service.js';

export const checkCreditExpiryDefinition = {
  type: 'function' as const,
  function: {
    name: 'check_credit_expiry',
    description: 'Consulta o saldo atual de créditos detalhado em lotes (FIFO), informando a data exata de validade e expiração de cada lote de créditos adquiridos.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
};

export async function runCheckCreditExpiry(userId: string) {
  try {
    // 1. Buscar todas as transações do usuário
    const { data: txs, error } = await supabaseAdmin
      .from('credit_transactions')
      .select('type, amount, expires_at, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching transactions for expiry check:', error);
      return { error: `Erro ao consultar lotes de créditos: ${error.message}` };
    }

    // 2. Calcular total utilizado (usage)
    const totalUsed = (txs || [])
      .filter(tx => tx.type === 'usage')
      .reduce((sum, tx) => sum + tx.amount, 0);

    // 3. FIFO para lotes de compras (purchase)
    let remainingUsed = totalUsed;
    const activePurchaseBatches = [];
    const expiredPurchaseBatches = [];

    const purchases = (txs || []).filter(tx => tx.type === 'purchase');
    const now = new Date();

    for (const p of purchases) {
      if (remainingUsed >= p.amount) {
        remainingUsed -= p.amount;
      } else {
        const availableAmount = p.amount - remainingUsed;
        remainingUsed = 0;

        const expiryDate = p.expires_at ? new Date(p.expires_at) : null;
        if (expiryDate) {
          if (expiryDate > now) {
            activePurchaseBatches.push({
              amount: availableAmount,
              expiresAt: expiryDate,
              dateStr: expiryDate.toLocaleDateString('pt-BR')
            });
          } else {
            expiredPurchaseBatches.push({
              amount: availableAmount,
              expiredAt: expiryDate,
              dateStr: expiryDate.toLocaleDateString('pt-BR')
            });
          }
        } else {
          // Lote sem expiração definida (caso antigo)
          activePurchaseBatches.push({
            amount: availableAmount,
            expiresAt: null,
            dateStr: 'Sem expiração'
          });
        }
      }
    }

    // 4. Calcular bônus e outros tipos que não expiram
    const totalBonus = (txs || [])
      .filter(tx => tx.type !== 'purchase' && tx.type !== 'usage')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const activeList = [];
    if (totalBonus > 0) {
      activeList.push(`- **${totalBonus} créditos** recebidos como bônus (Sem data de expiração)`);
    }

    for (const batch of activePurchaseBatches) {
      const expStr = batch.expiresAt 
        ? `expiram em ${batch.dateStr}` 
        : 'sem data de expiração';
      activeList.push(`- **${batch.amount} créditos** adquiridos (${expStr})`);
    }

    const messageLines = [];
    messageLines.push('Lotes de Créditos Ativos:');
    if (activeList.length > 0) {
      messageLines.push(...activeList);
    } else {
      messageLines.push('Nenhum crédito ativo no momento.');
    }

    if (expiredPurchaseBatches.length > 0) {
      messageLines.push('\nLotes expirados recentemente:');
      for (const batch of expiredPurchaseBatches) {
        messageLines.push(`- ${batch.amount} créditos expirados em ${batch.dateStr}`);
      }
    }

    return {
      success: true,
      activeBatches: activePurchaseBatches,
      expiredBatches: expiredPurchaseBatches,
      bonusCredits: totalBonus,
      message: messageLines.join('\n')
    };
  } catch (err: any) {
    console.error('Unexpected error in check_credit_expiry tool:', err);
    return { error: `Erro inesperado ao verificar expirações: ${err.message}` };
  }
}
