import { supabaseAdmin } from '../services/supabase.service.js';

export const listRemindersDefinition = {
  type: 'function' as const,
  function: {
    name: 'list_reminders',
    description: 'Lista todos os lembretes cadastrados pelo usuário (ativos, pendentes ou cancelados), detalhando a data, hora, descrição e se há vaga associada.',
    parameters: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['pending', 'sent', 'cancelled', 'all'],
          description: 'Filtrar lembretes por status: "pending" (Pendente), "sent" (Enviado/Disparado), "cancelled" (Cancelado) ou "all" (Todos). Padrão é "all".'
        }
      }
    }
  }
};

export async function runListReminders(userId: string, args: { status?: 'pending' | 'sent' | 'cancelled' | 'all' }) {
  try {
    const { status = 'all' } = args;

    // 1. Montar a query com join no Kanban
    let query = supabaseAdmin
      .from('user_reminders')
      .select('id, title, description, reminder_at, status, created_at, kanban_applications(id, company, position)')
      .eq('user_id', userId);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: reminders, error } = await query.order('reminder_at', { ascending: true });

    if (error) {
      console.error('Error listing reminders in tool:', error);
      return { error: `Erro ao buscar lembretes: ${error.message}` };
    }

    const statusTranslation: Record<string, string> = {
      pending: 'Pendente',
      sent: 'Enviado',
      cancelled: 'Cancelado'
    };

    const formattedReminders = (reminders || []).map((r: any) => {
      const app = r.kanban_applications;
      return {
        id: r.id,
        title: r.title,
        description: r.description,
        reminderAt: new Date(r.reminder_at).toLocaleString('pt-BR'),
        status: statusTranslation[r.status] || r.status,
        candidature: app ? `${app.position} na ${app.company}` : null
      };
    });

    return {
      success: true,
      total: formattedReminders.length,
      reminders: formattedReminders,
      message: formattedReminders.length > 0
        ? `Você tem ${formattedReminders.length} lembrete(s) cadastrado(s):
${formattedReminders.map(r => `- **${r.title}** (${r.reminderAt}) [${r.status}]${r.candidature ? ` - Relacionado a: ${r.candidature}` : ''}`).join('\n')}`
        : 'Você não tem nenhum lembrete agendado no momento.'
    };
  } catch (err: any) {
    console.error('Unexpected error in list_reminders tool:', err);
    return { error: `Erro inesperado ao listar lembretes: ${err.message}` };
  }
}
