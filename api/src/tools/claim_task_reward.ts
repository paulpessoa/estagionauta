import { supabaseAdmin } from '../services/supabase.service.js';
import { TASKS } from './list_available_tasks.js';

export const claimTaskRewardDefinition = {
  type: 'function' as const,
  function: {
    name: 'claim_task_reward',
    description: 'Resgata os créditos de recompensa de uma tarefa gamificada que o usuário já concluiu.',
    parameters: {
      type: 'object',
      properties: {
        taskKey: {
          type: 'string',
          enum: ['complete_profile', 'first_interview', 'invite_friend', 'first_analysis'],
          description: 'A chave identificadora da tarefa que se deseja resgatar (ex: "complete_profile").'
        }
      },
      required: ['taskKey']
    }
  }
};

export async function runClaimTaskReward(userId: string, args: { taskKey: string }) {
  try {
    const { taskKey } = args;
    const task = TASKS.find(t => t.key === taskKey);

    if (!task) {
      return { error: 'Tarefa de recompensa inválida fornecida.' };
    }

    // 1. Verificar se a tarefa já foi resgatada
    const { data: dbTask } = await supabaseAdmin
      .from('user_tasks')
      .select('completed, claimed')
      .eq('user_id', userId)
      .eq('task_key', taskKey)
      .maybeSingle();

    if (dbTask?.claimed) {
      return { 
        success: false, 
        message: `Você já resgatou a recompensa da tarefa "${task.name}" anteriormente.` 
      };
    }

    // 2. Se a tarefa não constar como concluída no banco, vamos re-verificar dinamicamente os critérios
    let isCompleted = dbTask?.completed || false;

    if (!isCompleted) {
      if (taskKey === 'complete_profile') {
        const { data: profile } = await supabaseAdmin
          .from('user_profiles')
          .select('full_name, bio, phone, course, university, period')
          .eq('id', userId)
          .single();

        isCompleted = !!(
          profile?.full_name?.trim() &&
          profile?.bio?.trim() &&
          profile?.phone?.trim() &&
          profile?.course?.trim() &&
          profile?.university?.trim() &&
          profile?.period?.trim()
        );
      } else if (taskKey === 'first_interview') {
        const { count } = await supabaseAdmin
          .from('interview_simulations')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId);
        isCompleted = (count || 0) > 0;
      } else if (taskKey === 'invite_friend') {
        const { count } = await supabaseAdmin
          .from('referral_invites')
          .select('id', { count: 'exact', head: true })
          .eq('referrer_id', userId)
          .in('status', ['registered', 'active']);
        isCompleted = (count || 0) > 0;
      } else if (taskKey === 'first_analysis') {
        const { count } = await supabaseAdmin
          .from('curriculum_analysis')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId);
        isCompleted = (count || 0) > 0;
      }
    }

    if (!isCompleted) {
      return { 
        success: false, 
        message: `A tarefa "${task.name}" ainda não foi concluída. Certifique-se de cumprir os requisitos antes de resgatar.` 
      };
    }

    // 3. Marcar como resgatada no banco (usando upsert para garantir registro)
    const { error: upsertErr } = await supabaseAdmin
      .from('user_tasks')
      .upsert({
        user_id: userId,
        task_key: taskKey,
        completed: true,
        claimed: true,
        completed_at: dbTask?.completed ? undefined : new Date().toISOString(),
        claimed_at: new Date().toISOString()
      }, { onConflict: 'user_id,task_key' });

    if (upsertErr) {
      console.error('Error claiming reward in DB:', upsertErr);
      return { error: 'Ocorreu um erro ao salvar o resgate da recompensa no banco.' };
    }

    // 4. Adicionar créditos via RPC
    const { error: creditsErr } = await supabaseAdmin.rpc('add_credits', {
      user_uuid: userId,
      amount: task.reward,
      description: `Recompensa: Concluiu a tarefa "${task.name}"`
    });

    if (creditsErr) {
      console.error('Error adding reward credits via RPC:', creditsErr);
      // Reverter o claimed do banco
      await supabaseAdmin
        .from('user_tasks')
        .update({ claimed: false, claimed_at: null })
        .eq('user_id', userId)
        .eq('task_key', taskKey);

      return { error: 'Ocorreu um erro ao creditar sua recompensa. Tente novamente mais tarde.' };
    }

    // Obter saldo final
    const { data: finalProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('credits')
      .eq('id', userId)
      .single();

    return {
      success: true,
      reward: task.reward,
      newBalance: finalProfile?.credits,
      message: `Recompensa resgatada com sucesso! +${task.reward} créditos foram adicionados à sua conta. Seu novo saldo é de ${finalProfile?.credits} créditos.`
    };
  } catch (err: any) {
    console.error('Unexpected error in claim_task_reward tool:', err);
    return { error: `Erro inesperado ao resgatar recompensa: ${err.message}` };
  }
}
