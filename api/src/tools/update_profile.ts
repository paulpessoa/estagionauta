import { supabaseAdmin } from '../services/supabase.service.js';

export const updateProfileDefinition = {
  type: 'function' as const,
  function: {
    name: 'update_profile',
    description: 'Atualiza as informações de perfil do usuário (como nome, telefone, linkedin, biografia, curso, universidade, período, cidade/estado, links de github/portfolio, competências, idiomas, histórico acadêmico ou experiências profissionais). Use esta ferramenta sempre que o usuário solicitar para preencher, alterar, salvar ou atualizar dados do perfil dele.',
    parameters: {
      type: 'object',
      properties: {
        full_name: { type: ['string', 'null'], description: 'Nome completo do usuário' },
        phone: { type: ['string', 'null'], description: 'Telefone de contato' },
        linkedin_url: { type: ['string', 'null'], description: 'URL completa do perfil do LinkedIn' },
        bio: { type: ['string', 'null'], description: 'Biografia ou resumo profissional' },
        course: { type: ['string', 'null'], description: 'Curso de graduação/estudos principal' },
        university: { type: ['string', 'null'], description: 'Nome da faculdade/universidade principal' },
        period: { 
          type: ['string', 'null'], 
          enum: ['1-2', '3-5', '6+', 'formado', null],
          description: 'Período acadêmico atual: "1-2" (1º - 2º período), "3-5" (3º - 5º período), "6+" (6º período ou mais), "formado" ou null.'
        },
        city_state: { type: ['string', 'null'], description: 'Cidade e Estado do usuário (ex: São Paulo - SP)' },
        portfolio_url: { type: ['string', 'null'], description: 'URL do portfólio ou website pessoal' },
        github_url: { type: ['string', 'null'], description: 'URL completa do perfil do GitHub' },
        skills: { 
          type: 'array', 
          items: { type: 'string' }, 
          description: 'Lista de competências técnicas ou interpessoais (ex: ["React", "TypeScript", "Inglês"])' 
        },
        languages: { 
          type: 'array', 
          items: { type: 'string' }, 
          description: 'Lista de idiomas com proficiência (ex: ["Inglês Avançado", "Espanhol Básico"])' 
        },
        experiences: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              company: { type: 'string', description: 'Empresa / Organização' },
              position: { type: 'string', description: 'Cargo / Posição' },
              startDate: { type: 'string', description: 'Mês/Ano de início (ex: "Jan 2023")' },
              endDate: { type: 'string', description: 'Mês/Ano de término ou "Atual"' },
              current: { type: 'boolean', description: 'Ainda trabalha nesta empresa?' },
              description: { type: 'string', description: 'Principais Atividades e Conquistas' }
            },
            required: ['company', 'position', 'startDate']
          },
          description: 'Lista completa de experiências profissionais'
        },
        education: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              institution: { type: 'string', description: 'Instituição de ensino' },
              degree: { type: 'string', description: 'Nível/Grau (ex: Bacharelado, Tecnólogo)' },
              fieldOfStudy: { type: 'string', description: 'Área/Curso (ex: Engenharia de Software)' },
              startDate: { type: 'string', description: 'Mês/Ano de início' },
              endDate: { type: 'string', description: 'Mês/Ano de término ou "Cursando"' },
              current: { type: 'boolean', description: 'Ainda está cursando?' }
            },
            required: ['institution', 'degree', 'fieldOfStudy', 'startDate']
          },
          description: 'Lista completa do histórico acadêmico'
        }
      },
    },
  },
};

export async function runUpdateProfile(userId: string, updates: any) {
  try {
    const cleanUpdates: Record<string, any> = {};
    const allowedKeys = [
      'full_name', 'phone', 'linkedin_url', 'bio', 'course', 'university', 'period',
      'city_state', 'portfolio_url', 'github_url', 'skills', 'languages', 'experiences', 'education'
    ];
    
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
