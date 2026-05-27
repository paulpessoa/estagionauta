import { supabaseAdmin } from '../services/supabase.service.js';

export const checkProfileDefinition = {
  type: 'function' as const,
  function: {
    name: 'check_profile',
    description: 'Analisa o perfil do usuário logado e retorna quais campos (como nome, curso, universidade, bio, etc.) estão preenchidos ou vazios.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
};

export async function runCheckProfile(userId: string) {
  try {
    const { data: profile, error } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      return { error: 'Não foi possível encontrar o perfil do usuário.' };
    }

    const fieldsToCheck = {
      full_name: 'Nome Completo',
      bio: 'Biografia',
      phone: 'Telefone',
      linkedin_url: 'Link do LinkedIn',
      course: 'Curso',
      university: 'Universidade/Faculdade',
      period: 'Período',
      curriculo_slug: 'Link do Currículo Público',
    };

    const filled: string[] = [];
    const missing: string[] = [];
    const values: Record<string, any> = {};

    for (const [key, label] of Object.entries(fieldsToCheck)) {
      const val = profile[key];
      values[key] = val;
      if (val && String(val).trim() !== '') {
        filled.push(label);
      } else {
        missing.push(label);
      }
    }

    return {
      success: true,
      filled,
      missing,
      values,
    };
  } catch (err: any) {
    return { error: `Erro ao analisar perfil: ${err.message}` };
  }
}
