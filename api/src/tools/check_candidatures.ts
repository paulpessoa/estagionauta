import { supabaseAdmin } from '../services/supabase.service.js';

export const checkCandidaturesDefinition = {
  type: 'function' as const,
  function: {
    name: 'check_candidatures',
    description: 'Busca a lista e a quantidade de candidaturas (processos seletivos) do usuário no painel Kanban de candidaturas. Use esta ferramenta sempre que o usuário perguntar quantas candidaturas ele tem, quais são elas, o progresso delas ou qualquer outra informação relacionada a vagas nas quais ele se candidatou.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
};

export async function runCheckCandidatures(userId: string) {
  try {
    const { data: apps, error } = await supabaseAdmin
      .from('kanban_applications')
      .select('id, company, position, status, progress, next_action, next_action_date, applied_date')
      .eq('user_id', userId)
      .order('applied_date', { ascending: false });

    if (error) {
      console.error('Error fetching candidatures in tool:', error);
      return { error: `Erro ao buscar candidaturas: ${error.message}` };
    }

    const total = apps ? apps.length : 0;
    
    // Tradução de status para facilitar a interpretação pelo modelo
    const statusMap: Record<string, string> = {
      interested: 'Interessado (A aplicar)',
      applied: 'Aplicado',
      interview: 'Entrevista',
      test: 'Teste Técnico',
      offer: 'Proposta Recebida',
      rejected: 'Recusado/Negativa',
    };

    const formattedApps = (apps || []).map(app => ({
      empresa: app.company,
      cargo: app.position,
      status: statusMap[app.status] || app.status,
      progresso: `${app.progress}%`,
      proxima_acao: app.next_action || 'Nenhuma cadastrada',
      data_proxima_acao: app.next_action_date || 'Nenhuma',
      data_candidatura: app.applied_date,
    }));

    return {
      success: true,
      total,
      candidaturas: formattedApps,
    };
  } catch (err: any) {
    console.error('Unexpected error in check_candidatures tool:', err);
    return { error: `Erro inesperado ao buscar candidaturas: ${err.message}` };
  }
}
