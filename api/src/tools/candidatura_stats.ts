import { supabaseAdmin } from '../services/supabase.service.js';

export const candidaturaStatsDefinition = {
  type: 'function' as const,
  function: {
    name: 'candidatura_stats',
    description: 'Consulta as estatísticas do painel Kanban de candidaturas do usuário (total de vagas, distribuição por coluna/status e média de progresso).',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
};

export async function runCandidaturaStats(userId: string) {
  try {
    const { data: apps, error } = await supabaseAdmin
      .from('kanban_applications')
      .select('status, progress')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching stats in tool:', error);
      return { error: `Erro ao calcular estatísticas do Kanban: ${error.message}` };
    }

    const totalApps = apps.length;

    const statusCounts: Record<string, number> = {
      interested: 0,
      applied: 0,
      interview: 0,
      test: 0,
      offer: 0,
      rejected: 0
    };

    apps.forEach(app => {
      if (statusCounts[app.status] !== undefined) {
        statusCounts[app.status]++;
      }
    });

    const avgProgress = totalApps > 0 
      ? Math.round(apps.reduce((sum, app) => sum + app.progress, 0) / totalApps) 
      : 0;

    const statusTranslation: Record<string, string> = {
      interested: 'Interessado(a)',
      applied: 'Candidatura Enviada',
      interview: 'Fase de Entrevista',
      test: 'Fase de Testes',
      offer: 'Proposta Recebida',
      rejected: 'Reprovado/Recusado'
    };

    const lines = [];
    lines.push(`Resumo do seu Painel Kanban (Total: ${totalApps} candidaturas):`);
    lines.push(`- Média de Progresso nos processos: ${avgProgress}%`);
    lines.push('\nDistribuição por etapas:');
    Object.entries(statusCounts).forEach(([key, val]) => {
      lines.push(`- ${statusTranslation[key] || key}: ${val}`);
    });

    return {
      success: true,
      totalApplications: totalApps,
      statusCounts,
      averageProgress: avgProgress,
      message: lines.join('\n')
    };
  } catch (err: any) {
    console.error('Unexpected error in candidatura_stats tool:', err);
    return { error: `Erro inesperado ao obter estatísticas: ${err.message}` };
  }
}
