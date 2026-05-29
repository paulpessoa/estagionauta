import { supabaseAdmin } from '../services/supabase.service.js';

export const checkCreditHistoryDefinition = {
  type: 'function' as const,
  function: {
    name: 'check_credit_history',
    description: 'Consulta o histórico completo de transações de créditos do usuário (compras de planos, bônus recebidos por tarefas ou indicações, e utilizações de créditos na plataforma).',
    parameters: {
      type: 'object',
      properties: {
        limit: {
          type: 'integer',
          description: 'Número máximo de transações a retornar. Padrão é 15.'
        }
      }
    }
  }
};

export async function runCheckCreditHistory(userId: string, args: { limit?: number }) {
  try {
    const { limit = 15 } = args;

    const { data: txs, error } = await supabaseAdmin
      .from('credit_transactions')
      .select('type, amount, description, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching credit history in tool:', error);
      return { error: `Erro ao buscar histórico de créditos: ${error.message}` };
    }

    const typeLabels: Record<string, string> = {
      purchase: 'Compra',
      usage: 'Uso',
      refund: 'Reembolso',
      bonus: 'Bônus'
    };

    const formattedTxs = (txs || []).map(tx => {
      // O uso geralmente consome créditos, então representamos como negativo
      const prefix = tx.type === 'usage' ? '-' : '+';
      return {
        type: typeLabels[tx.type] || tx.type,
        amount: `${prefix}${tx.amount} créditos`,
        description: tx.description,
        date: new Date(tx.created_at).toLocaleString('pt-BR')
      };
    });

    return {
      success: true,
      total: formattedTxs.length,
      history: formattedTxs,
      message: formattedTxs.length > 0
        ? `Seu histórico de créditos (últimas ${formattedTxs.length} transações):
${formattedTxs.map(t => `- [${t.date}] ${t.type}: ${t.amount} (${t.description})`).join('\n')}`
        : 'Nenhuma transação de crédito encontrada na sua conta.'
    };
  } catch (err: any) {
    console.error('Unexpected error in check_credit_history tool:', err);
    return { error: `Erro inesperado ao buscar histórico de créditos: ${err.message}` };
  }
}
