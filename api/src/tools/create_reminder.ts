import { supabaseAdmin } from '../services/supabase.service.js';

export const createReminderDefinition = {
  type: 'function' as const,
  function: {
    name: 'create_reminder',
    description: 'Cria um novo lembrete com assunto e data/hora específicos (ex: entrevista agendada, prazo de envio de teste, follow-up com recrutador), opcionalmente vinculando-o a uma candidatura do Kanban.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'O título ou assunto do lembrete (ex: "Entrevista com a Google").' },
        reminderAt: { type: 'string', description: 'A data e hora programada para o lembrete em formato ISO ou legível (ex: "2026-06-15T14:30:00Z").' },
        description: { type: 'string', description: 'Descrição detalhada ou anotações extras sobre o lembrete.' },
        candidatureId: { type: 'string', description: 'ID opcional da candidatura no Kanban associada a este lembrete.' }
      },
      required: ['title', 'reminderAt']
    }
  }
};

export async function runCreateReminder(userId: string, args: {
  title: string;
  reminderAt: string;
  description?: string;
  candidatureId?: string;
}) {
  try {
    const { title, reminderAt, description = '', candidatureId } = args;

    // 1. Validar data e hora
    const parsedDate = new Date(reminderAt);
    if (isNaN(parsedDate.getTime())) {
      return { error: 'A data e hora informada é inválida. Use um formato legível, por exemplo: AAAA-MM-DDTHH:MM:SSZ' };
    }

    if (parsedDate.getTime() < Date.now()) {
      return { error: 'Não é possível criar um lembrete para uma data passada.' };
    }

    // 2. Se tiver candidatura, validar se existe
    if (candidatureId) {
      const { data: app } = await supabaseAdmin
        .from('kanban_applications')
        .select('id, company, position')
        .eq('id', candidatureId)
        .eq('user_id', userId)
        .single();

      if (!app) {
        return { error: 'Candidatura associada não encontrada no seu painel Kanban.' };
      }
    }

    // 3. Salvar lembrete
    const { data: reminder, error: insertErr } = await supabaseAdmin
      .from('user_reminders')
      .insert({
        user_id: userId,
        title,
        description,
        reminder_at: parsedDate.toISOString(),
        candidatura_id: candidatureId || null,
        status: 'pending'
      })
      .select()
      .single();

    if (insertErr || !reminder) {
      console.error('Error inserting reminder in tool:', insertErr);
      return { error: 'Ocorreu um erro ao salvar o lembrete no banco de dados.' };
    }

    return {
      success: true,
      message: `Lembrete "${title}" criado com sucesso para o dia ${parsedDate.toLocaleString('pt-BR')}!`,
      reminderId: reminder.id,
      title: reminder.title,
      reminderAt: reminder.reminder_at,
      status: reminder.status
    };
  } catch (err: any) {
    console.error('Unexpected error in create_reminder tool:', err);
    return { error: `Erro inesperado ao criar lembrete: ${err.message}` };
  }
}
