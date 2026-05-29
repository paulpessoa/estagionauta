import { supabaseAdmin } from '../services/supabase.service.js';

export const listInviteesDefinition = {
  type: 'function' as const,
  function: {
    name: 'list_invitees',
    description: 'Lista todos os amigos que o usuário convidou para a plataforma e o status atual de cada indicação.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
};

export async function runListInvitees(userId: string) {
  try {
    const { data: invites, error } = await supabaseAdmin
      .from('referral_invites')
      .select('name, email, status, created_at')
      .eq('referrer_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error listing invites in tool:', error);
      return { error: `Erro ao buscar convites: ${error.message}` };
    }

    // Traduzir status para exibição amigável
    const statusTranslation: Record<string, string> = {
      pending: 'Pendente (E-mail enviado)',
      registered: 'Cadastrado (Ganhou 3 créditos!)',
      active: 'Ativo (Fez a primeira compra - Ganhou mais 5 créditos!)'
    };

    const formattedInvites = (invites || []).map(invite => ({
      name: invite.name,
      email: invite.email,
      status: statusTranslation[invite.status] || invite.status,
      date: new Date(invite.created_at).toLocaleDateString('pt-BR')
    }));

    return {
      success: true,
      total: formattedInvites.length,
      invitees: formattedInvites,
      message: formattedInvites.length > 0
        ? `Você convidou ${formattedInvites.length} amigos até o momento.`
        : 'Você ainda não enviou nenhum convite. Compartilhe o link de indicação para ganhar créditos!'
    };
  } catch (err: any) {
    console.error('Unexpected error in list_invitees tool:', err);
    return { error: `Erro inesperado ao listar convidados: ${err.message}` };
  }
}
