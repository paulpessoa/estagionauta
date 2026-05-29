import { supabaseAdmin } from '../services/supabase.service.js';

export interface TaskDefinition {
  key: string;
  name: string;
  description: string;
  reward: number;
}

export const TASKS: TaskDefinition[] = [
  {
    key: 'complete_profile',
    name: 'Completar Perfil',
    description: 'Preencher nome, biografia, telefone, curso, faculdade e período no seu Perfil.',
    reward: 2
  },
  {
    key: 'first_interview',
    name: 'Primeira Entrevista Simulada',
    description: 'Realizar a sua primeira simulação de entrevista no Simulador de Entrevistas.',
    reward: 1
  },
  {
    key: 'invite_friend',
    name: 'Indicar um Amigo',
    description: 'Convidar pelo menos um amigo que se cadastre com sucesso na plataforma.',
    reward: 3
  },
  {
    key: 'first_analysis',
    name: 'Primeira Análise de Currículo',
    description: 'Realizar a sua primeira análise detalhada de currículo por inteligência artificial.',
    reward: 1
  }
];

export const listAvailableTasksDefinition = {
  type: 'function' as const,
  function: {
    name: 'list_available_tasks',
    description: 'Lista as tarefas gamificadas que o usuário pode cumprir para ganhar créditos de recompensa gratuitos na plataforma, informando o status de conclusão e resgate de cada uma.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
};

export async function runListAvailableTasks(userId: string) {
  try {
    // 1. Obter dados atuais do usuário para verificar completitude dos critérios
    // Perfil
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('full_name, bio, phone, course, university, period')
      .eq('id', userId)
      .single();

    // Entrevistas
    const { count: interviewCount } = await supabaseAdmin
      .from('interview_simulations')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Indicações
    const { count: referralCount } = await supabaseAdmin
      .from('referral_invites')
      .select('id', { count: 'exact', head: true })
      .eq('referrer_id', userId)
      .in('status', ['registered', 'active']);

    // Análises de currículo
    const { count: analysisCount } = await supabaseAdmin
      .from('curriculum_analysis')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    // 2. Determinar dinamicamente o status de conclusão de cada tarefa
    const isProfileComplete = !!(
      profile?.full_name?.trim() &&
      profile?.bio?.trim() &&
      profile?.phone?.trim() &&
      profile?.course?.trim() &&
      profile?.university?.trim() &&
      profile?.period?.trim()
    );

    const completionStatus: Record<string, boolean> = {
      complete_profile: isProfileComplete,
      first_interview: (interviewCount || 0) > 0,
      invite_friend: (referralCount || 0) > 0,
      first_analysis: (analysisCount || 0) > 0,
    };

    // 3. Buscar tarefas que já foram registradas no banco (para saber se foram resgatadas/claimed)
    const { data: dbTasks } = await supabaseAdmin
      .from('user_tasks')
      .select('task_key, completed, claimed')
      .eq('user_id', userId);

    const taskMap = new Map<string, { completed: boolean; claimed: boolean }>();
    if (dbTasks) {
      for (const t of dbTasks) {
        taskMap.set(t.task_key, { completed: t.completed, claimed: t.claimed });
      }
    }

    // 4. Montar a resposta atualizando e sincronizando no banco as concluídas que não estavam registradas
    const results = [];
    for (const task of TASKS) {
      const isCompletedNow = completionStatus[task.key];
      const dbRecord = taskMap.get(task.key);
      const isCompleted = dbRecord?.completed || isCompletedNow;
      const isClaimed = dbRecord?.claimed || false;

      // Se a tarefa foi concluída dinamicamente mas não está salva no banco como concluída, vamos salvar/sincronizar
      if (isCompleted && (!dbRecord || !dbRecord.completed)) {
        await supabaseAdmin
          .from('user_tasks')
          .upsert({
            user_id: userId,
            task_key: task.key,
            completed: true,
            completed_at: new Date().toISOString()
          }, { onConflict: 'user_id,task_key' });
      }

      let statusLabel = 'Pendente';
      if (isClaimed) {
        statusLabel = 'Resgatada';
      } else if (isCompleted) {
        statusLabel = 'Concluída (Pronta para resgate!)';
      }

      results.push({
        key: task.key,
        name: task.name,
        description: task.description,
        reward: task.reward,
        completed: isCompleted,
        claimed: isClaimed,
        status: statusLabel
      });
    }

    const availableToClaim = results.filter(r => r.completed && !r.claimed).length;

    return {
      success: true,
      tasks: results,
      availableToClaim,
      message: `Lista de Tarefas de Recompensa:
${results.map(r => `- **${r.name}** (+${r.reward} créditos): ${r.status}`).join('\n')}
${availableToClaim > 0 ? `\nVocê tem ${availableToClaim} tarefa(s) pronta(s) para resgatar! Diga "resgatar recompensa da tarefa X" para ganhar os créditos.` : ''}`
    };
  } catch (err: any) {
    console.error('Unexpected error in list_available_tasks tool:', err);
    return { error: `Erro inesperado ao listar tarefas: ${err.message}` };
  }
}
