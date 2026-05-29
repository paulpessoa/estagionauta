import { supabaseAdmin } from '../services/supabase.service.js';

export const listResumesDefinition = {
  type: 'function' as const,
  function: {
    name: 'list_resumes',
    description: 'Lista todos os currículos profissionais salvos na conta do usuário.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
};

export async function runListResumes(userId: string) {
  try {
    const { data: resumes, error } = await supabaseAdmin
      .from('generated_resumes')
      .select('id, title, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error listing resumes in tool:', error);
      return { error: `Erro ao buscar currículos: ${error.message}` };
    }

    const formattedList = (resumes || []).map(r => ({
      id: r.id,
      title: r.title,
      date: new Date(r.created_at).toLocaleDateString('pt-BR')
    }));

    return {
      success: true,
      total: formattedList.length,
      resumes: formattedList,
      message: formattedList.length > 0
        ? `Você tem ${formattedList.length} currículo(s) salvo(s):
${formattedList.map(r => `- **${r.title}** (Salvo em ${r.date})`).join('\n')}`
        : 'Você não possui nenhum currículo salvo no momento.'
    };
  } catch (err: any) {
    console.error('Unexpected error in list_resumes tool:', err);
    return { error: `Erro inesperado ao listar currículos: ${err.message}` };
  }
}
