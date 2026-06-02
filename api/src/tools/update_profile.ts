import { supabaseAdmin } from '../services/supabase.service.js';

export const updateProfileDefinition = {
  type: 'function' as const,
  function: {
    name: 'update_profile',
    description: 'Atualiza as informações de perfil do usuário (como curso, universidade, período, telefone, linkedin ou biografia). Use esta ferramenta sempre que o usuário solicitar para preencher, alterar, salvar ou atualizar dados do perfil dele.',
    parameters: {
      type: 'object',
      properties: {
        full_name: { type: ['string', 'null'], description: 'Nome completo do usuário' },
        phone: { type: ['string', 'null'], description: 'Telefone de contato' },
        linkedin_url: { type: ['string', 'null'], description: 'URL completa do perfil do LinkedIn' },
        bio: { type: ['string', 'null'], description: 'Biografia ou resumo profissional' },
        course: { type: ['string', 'null'], description: 'Curso de graduação/estudos' },
        university: { type: ['string', 'null'], description: 'Nome da faculdade, universidade ou instituição de ensino' },
        period: { 
          type: ['string', 'null'], 
          enum: ['1-2', '3-5', '6+', 'formado', null],
          description: 'Período acadêmico atual: "1-2" (1º - 2º período), "3-5" (3º - 5º período), "6+" (6º período ou mais), "formado" ou null.'
        },
      },
    },
  },
};

export async function runUpdateProfile(userId: string, updates: any) {
  try {
    const cleanUpdates: Record<string, any> = {};
    const allowedKeys = ['full_name', 'phone', 'linkedin_url', 'bio', 'course', 'university', 'period'];
    
    for (const key of allowedKeys) {
      if (updates[key] !== undefined) {
        cleanUpdates[key] = updates[key];
      }
    }

    if (Object.keys(cleanUpdates).length === 0) {
      return { error: 'Nenhum campo válido foi fornecido para atualização.' };
    }

    const { error } = await supabaseAdmin
      .from('user_profiles')
      .update(cleanUpdates)
      .eq('id', userId);

    if (error) {
      console.error('Error updating profile in tool:', error);
      return { error: `Erro ao salvar atualizações de perfil: ${error.message}` };
    }

    return {
      success: true,
      message: 'Perfil atualizado com sucesso!',
      updatedFields: Object.keys(cleanUpdates),
    };
  } catch (err: any) {
    console.error('Unexpected error in update_profile tool:', err);
    return { error: `Erro inesperado ao atualizar perfil: ${err.message}` };
  }
}
