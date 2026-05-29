import { supabaseAdmin } from '../services/supabase.service.js';

export const updateReminderDefinition = {
  type: 'function' as const,
  function: {
    name: 'update_reminder',
    description: 'Atualiza os dados de um lembrete existente (como título, descrição, status ou data/hora).',
    parameters: {
      type: 'object',
      properties: {
        reminderId: { type: 'string', description: 'O ID único do lembrete que se deseja alterar.' },
        title: { type: 'string', description: 'Novo título ou assunto do lembrete.' },
        reminderAt: { type: 'string', description: 'Nova data e hora programada em formato ISO (ex: "2026-06-16T10:00:00Z").' },
        description: { type: 'string', description: 'Nova descrição ou anotações.' },
        status: {
          type: 'string',
          enum: ['pending', 'sent', 'cancelled'],
          description: 'Novo status do lembrete: "pending" (Pendente), "sent" (Enviado), "cancelled" (Cancelado).'
        },
        candidatureId: { type: 'string', description: 'Novo ID da candidatura vinculada.' }
      },
      required: ['reminderId']
    }
  }
};

export async function runUpdateReminder(userId: string, args: {
  reminderId: string;
  title?: string;
  reminderAt?: string;
  description?: string;
  status?: 'pending' | 'sent' | 'cancelled';
  candidatureId?: string;
}) {
  try {
    const { reminderId, title, reminderAt, description, status, candidatureId } = args;

    // 1. Verificar se pertence ao usuário
    const { data: existing, error: fetchErr } = await supabaseAdmin
      .from('user_reminders')
      .select('id')
      .eq('id', reminderId)
      .eq('user_id', userId)
      .single();

    if (fetchErr || !existing) {
      return { error: 'Lembrete não encontrado ou sem permissão de acesso.' };
    }

    // 2. Montar updates
    const updates: Record<string, any> = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (status !== undefined) updates.status = status;

    if (reminderAt !== undefined) {
      const parsedDate = new Date(reminderAt);
      if (isNaN(parsedDate.getTime())) {
        return { error: 'A nova data fornecida é inválida.' };
      }
      updates.reminder_at = parsedDate.toISOString();
    }

    if (candidatureId !== undefined) {
      if (candidatureId) {
        const { data: app } = await supabaseAdmin
          .from('kanban_applications')
          .select('id')
          .eq('id', candidatureId)
          .eq('user_id', userId)
          .single();

        if (!app) {
          return { error: 'Candidatura associada não encontrada no Kanban.' };
        }
        updates.candidatura_id = candidatureId;
      } else {
        updates.candidatura_id = null;
      }
    }

    if (Object.keys(updates).length === 0) {
      return { error: 'Nenhum campo para atualizar foi fornecido.' };
    }

    // 3. Executar update
    const { data: updated, error: updateErr } = await supabaseAdmin
      .from('user_reminders')
      .update(updates)
      .eq('id', reminderId)
      .select()
      .single();

    if (updateErr) {
      console.error('Error updating reminder in tool:', updateErr);
      return { error: `Erro ao salvar atualizações: ${updateErr.message}` };
    }

    return {
      success: true,
      message: `Lembrete "${updated.title}" atualizado com sucesso!`,
      reminderId: updated.id,
      title: updated.title,
      reminderAt: updated.reminder_at,
      status: updated.status
    };
  } catch (err: any) {
    console.error('Unexpected error in update_reminder tool:', err);
    return { error: `Erro inesperado ao atualizar lembrete: ${err.message}` };
  }
}
