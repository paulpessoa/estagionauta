import { supabaseAdmin } from '../services/supabase.service.js';

export const saveResumeDefinition = {
  type: 'function' as const,
  function: {
    name: 'save_resume',
    description: 'Salva um currículo gerado no banco de dados para que o usuário possa visualizar e baixar na página "Gerador de Currículos". Use esta ferramenta sempre que o usuário aprovar um currículo criado ou solicitar para salvá-lo no painel dele.',
    parameters: {
      type: 'object',
      properties: {
        title: { 
          type: 'string', 
          description: 'Título/nome identificador do currículo (ex: "Currículo - Desenvolvedor Full Stack - Estácio de Sá")' 
        },
        content: { 
          type: 'string', 
          description: 'Texto completo do currículo em formato Markdown profissional (sem os delimitadores ```markdown e ```)' 
        },
        profileData: {
          type: 'object',
          description: 'Objeto opcional contendo os dados de perfil consolidados na geração do currículo',
          properties: {
            fullName: { type: 'string' },
            email: { type: 'string' },
            phone: { type: 'string' },
            location: { type: 'string' },
            summary: { type: 'string' },
            skills: { type: 'array', items: { type: 'string' } },
            languages: { type: 'array', items: { type: 'string' } },
          }
        }
      },
      required: ['title', 'content'],
    },
  },
};

export async function runSaveResume(
  userId: string,
  args: { title: string; content: string; profileData?: any }
) {
  try {
    const { title, content, profileData } = args;

    const { data, error } = await supabaseAdmin
      .from('generated_resumes')
      .insert({
        user_id: userId,
        title,
        content,
        profile_data: profileData || {},
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving resume in tool:', error);
      return { error: `Erro ao salvar currículo no banco de dados: ${error.message}` };
    }

    return {
      success: true,
      message: 'Currículo salvo com sucesso! O usuário poderá encontrá-lo e editá-lo na página "Gerador de Currículos".',
      resumeId: data.id,
      title: data.title,
    };
  } catch (err: any) {
    console.error('Unexpected error in save_resume tool:', err);
    return { error: `Erro inesperado ao salvar currículo: ${err.message}` };
  }
}
