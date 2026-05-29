import { supabaseAdmin } from '../services/supabase.service.js';

export const listPastInterviewsDefinition = {
  type: 'function' as const,
  function: {
    name: 'list_past_interviews',
    description: 'Lista o histórico de simulações de entrevista de emprego realizadas pelo usuário, detalhando o cargo, data, tom do entrevistador, status e a nota recebida no feedback final (se concluído).',
    parameters: {
      type: 'object',
      properties: {
        limit: {
          type: 'integer',
          description: 'Número máximo de simulações a retornar. Padrão é 10.'
        }
      }
    }
  }
};

export async function runListPastInterviews(userId: string, args: { limit?: number }) {
  try {
    const { limit = 10 } = args;

    const { data: simulations, error } = await supabaseAdmin
      .from('interview_simulations')
      .select('id, job_title, interviewer_type, status, feedback, created_at, company_name')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching past interviews in tool:', error);
      return { error: `Erro ao buscar histórico de entrevistas: ${error.message}` };
    }

    const interviewerLabels: Record<string, string> = {
      tech: 'Técnico',
      behavioral: 'Comportamental',
      hard: 'Exigente/Hard',
      friendly: 'Amigável'
    };

    const statusLabels: Record<string, string> = {
      started: 'Em andamento',
      completed: 'Concluído',
      cancelled: 'Cancelado'
    };

    const formattedList = (simulations || []).map((sim: any) => {
      // Extrair score do JSON de feedback se disponível
      let score = null;
      let feedbackSummary = null;
      if (sim.feedback && typeof sim.feedback === 'object') {
        score = sim.feedback.score !== undefined ? sim.feedback.score : sim.feedback.scoreGeral;
        feedbackSummary = sim.feedback.resumo || sim.feedback.summary;
      }

      return {
        id: sim.id,
        jobTitle: sim.job_title,
        companyName: sim.company_name || 'Geral',
        interviewerType: interviewerLabels[sim.interviewer_type] || sim.interviewer_type,
        status: statusLabels[sim.status] || sim.status,
        score: score,
        feedbackSummary: feedbackSummary,
        date: new Date(sim.created_at).toLocaleDateString('pt-BR')
      };
    });

    const lines = [];
    lines.push(`Histórico de Simulações (últimas ${formattedList.length} entrevistas):`);
    for (const s of formattedList) {
      const scoreStr = s.score !== null ? ` - Nota: ${s.score}/100` : '';
      const companyStr = s.companyName !== 'Geral' ? ` na ${s.companyName}` : '';
      lines.push(`- **${s.jobTitle}**${companyStr} (${s.date}) [${s.status}]${scoreStr} (Entrevistador: ${s.interviewerType})`);
    }

    return {
      success: true,
      total: formattedList.length,
      simulations: formattedList,
      message: formattedList.length > 0 ? lines.join('\n') : 'Você ainda não realizou nenhuma simulação de entrevista.'
    };
  } catch (err: any) {
    console.error('Unexpected error in list_past_interviews tool:', err);
    return { error: `Erro inesperado ao listar entrevistas passadas: ${err.message}` };
  }
}
