import { supabaseAdmin } from '../services/supabase.service.js';

export const updateCandidaturaDefinition = {
  type: 'function' as const,
  function: {
    name: 'update_candidatura',
    description: 'Atualiza informações de uma candidatura existente no painel Kanban (como mudar o status do processo seletivo, alterar o salário, atualizar notas ou definir a data da próxima ação).',
    parameters: {
      type: 'object',
      properties: {
        candidatureId: { 
          type: 'string', 
          description: 'O ID único da candidatura que se deseja atualizar.' 
        },
        status: {
          type: 'string',
          enum: ['interested', 'applied', 'interview', 'test', 'offer', 'rejected'],
          description: 'Novo status do processo: "interested" (Interessado), "applied" (Aplicado), "interview" (Entrevista), "test" (Testes), "offer" (Proposta recebida), "rejected" (Recusado/Reprovado).'
        },
        salary: { type: 'string', description: 'Novo valor da bolsa-auxílio/salário mensal.' },
        location: { type: 'string', description: 'Nova localização ou modelo de trabalho (ex: "Híbrido", "Remoto").' },
        notes: { type: 'string', description: 'Novas observações/anotações sobre o processo seletivo.' },
        nextAction: { type: 'string', description: 'Descrição da próxima ação (ex: "Enviar teste técnico", "Aguardar retorno do RH").' },
        nextActionDate: { type: 'string', description: 'Data da próxima ação no formato ISO (ex: "2026-06-15" ou "2026-06-15T14:00:00Z").' }
      },
      required: ['candidatureId']
    }
  }
};

export async function runUpdateCandidatura(userId: string, args: {
  candidatureId: string;
  status?: 'interested' | 'applied' | 'interview' | 'test' | 'offer' | 'rejected';
  salary?: string;
  location?: string;
  notes?: string;
  nextAction?: string;
  nextActionDate?: string;
}) {
  try {
    const { candidatureId, status, salary, location, notes, nextAction, nextActionDate } = args;

    // 1. Verificar se a candidatura existe e pertence ao usuário
    const { data: app, error: appErr } = await supabaseAdmin
      .from('kanban_applications')
      .select('id, company, position, status, progress')
      .eq('id', candidatureId)
      .eq('user_id', userId)
      .single();

    if (appErr || !app) {
      return { error: 'Candidatura não encontrada ou você não tem permissão para alterá-la.' };
    }

    // 2. Montar objeto com os campos fornecidos
    const updates: Record<string, any> = {};

    if (status !== undefined) {
      updates.status = status;
      // Calcular progresso correspondente
      let progress = 0;
      if (status === 'applied') progress = 20;
      else if (status === 'interview') progress = 40;
      else if (status === 'test') progress = 65;
      else if (status === 'offer') progress = 90;
      else if (status === 'rejected') progress = 100;
      updates.progress = progress;
    }

    if (salary !== undefined) updates.salary = salary;
    if (location !== undefined) updates.location = location;
    if (notes !== undefined) updates.notes = notes;
    if (nextAction !== undefined) updates.next_action = nextAction;
    if (nextActionDate !== undefined) updates.next_action_date = nextActionDate ? new Date(nextActionDate).toISOString() : null;

    if (Object.keys(updates).length === 0) {
      return { error: 'Nenhum campo foi enviado para atualização.' };
    }

    // 3. Executar o update
    const { data: updatedApp, error: updateErr } = await supabaseAdmin
      .from('kanban_applications')
      .update(updates)
      .eq('id', candidatureId)
      .select()
      .single();

    if (updateErr) {
      console.error('Error updating candidature in tool:', updateErr);
      return { error: `Erro ao salvar atualizações: ${updateErr.message}` };
    }

    return {
      success: true,
      message: `Candidatura para "${updatedApp.position} na ${updatedApp.company}" atualizada com sucesso!`,
      candidatureId: updatedApp.id,
      company: updatedApp.company,
      position: updatedApp.position,
      status: updatedApp.status,
      progress: updatedApp.progress,
      updatedFields: Object.keys(updates)
    };
  } catch (err: any) {
    console.error('Unexpected error in update_candidatura tool:', err);
    return { error: `Erro inesperado ao atualizar candidatura: ${err.message}` };
  }
}
