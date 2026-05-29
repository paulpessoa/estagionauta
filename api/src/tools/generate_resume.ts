import { supabaseAdmin } from '../services/supabase.service.js';
import { generateResumeAI } from '../services/openai.service.js';
import { env } from '../config/env.js';

export const generateResumeDefinition = {
  type: 'function' as const,
  function: {
    name: 'generate_resume',
    description: 'Gera um currículo otimizado e formatado em Markdown para uma vaga específica. Consome 1 crédito do usuário. Busca automaticamente o histórico acadêmico e profissional anterior do usuário e as informações da vaga para realizar a otimização por IA.',
    parameters: {
      type: 'object',
      properties: {
        jobTitle: { 
          type: 'string', 
          description: 'O cargo da vaga alvo (ex: "Desenvolvedor Front-end Júnior"). Se não fornecido e candidaturaId for passado, será buscado do Kanban.' 
        },
        jobDescription: { 
          type: 'string', 
          description: 'Descrição ou requisitos da vaga para adaptar o currículo. Se não fornecido e candidaturaId for passado, será buscado do Kanban.' 
        },
        candidatureId: { 
          type: 'string', 
          description: 'ID opcional da candidatura no Kanban para buscar automaticamente o cargo e descrição da vaga.' 
        }
      }
    }
  }
};

export async function runGenerateResume(userId: string, args: {
  jobTitle?: string;
  jobDescription?: string;
  candidatureId?: string;
}) {
  try {
    let { jobTitle, jobDescription, candidatureId } = args;

    // 1. Verificar saldo de créditos
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('credits, email, full_name, phone, bio, course, university, period, linkedin_url')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return { error: 'Não foi possível buscar as informações do perfil do usuário para gerar o currículo.' };
    }

    if (profile.credits < 1) {
      return { 
        error: 'Você não possui créditos suficientes para gerar um currículo (necessário 1 crédito). Acesse a página de créditos para adquirir mais.',
        requiresCredits: true
      };
    }

    // 2. Se candidaturaId for passado, buscar os dados da vaga se não fornecidos
    if (candidatureId && (!jobTitle || !jobDescription)) {
      const { data: app } = await supabaseAdmin
        .from('kanban_applications')
        .select('company, position, description')
        .eq('id', candidatureId)
        .eq('user_id', userId)
        .single();

      if (app) {
        if (!jobTitle) jobTitle = `${app.position} na ${app.company}`;
        if (!jobDescription) jobDescription = app.description;
      }
    }

    // 3. Buscar o currículo gerado anteriormente mais recente para herdar experiências e formação
    const { data: lastResume } = await supabaseAdmin
      .from('generated_resumes')
      .select('profile_data')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const previousProfileData = lastResume?.profile_data || {};

    // 4. Montar dados para o gerador de currículos, herdando dados anteriores
    const resumePayload = {
      fullName: profile.full_name || previousProfileData.fullName || 'Estudante',
      email: profile.email || previousProfileData.email || '',
      phone: profile.phone || previousProfileData.phone || '',
      location: previousProfileData.location || 'Brasil',
      website: previousProfileData.website || '',
      linkedin: profile.linkedin_url || previousProfileData.linkedin || '',
      github: previousProfileData.github || '',
      summary: profile.bio || previousProfileData.summary || 'Estudante buscando oportunidade.',
      experiences: previousProfileData.experiences || [],
      education: previousProfileData.education || [],
      skills: previousProfileData.skills || (profile.course ? [profile.course] : ['Geral']),
      languages: previousProfileData.languages || [],
      jobTitle: jobTitle || 'Estágio',
      jobDescription: jobDescription || '',
    };

    // Caso o usuário tenha campos de formação no perfil mas nenhuma educação estruturada no histórico do currículo,
    // podemos alimentar um item inicial de educação com base no perfil.
    if (resumePayload.education.length === 0 && profile.university && profile.course) {
      resumePayload.education.push({
        institution: profile.university,
        degree: 'Graduação',
        fieldOfStudy: profile.course,
        startDate: 'Ingresso',
        endDate: profile.period || 'Em andamento',
        current: true
      });
    }

    // 5. Cobrar 1 crédito via RPC
    const { data: consumeResult, error: consumeError } = await supabaseAdmin.rpc(
      'consume_credits',
      {
        user_uuid: userId,
        amount: 1,
        description: `Geração de currículo otimizado para: ${jobTitle || 'Vaga de Estágio'}`,
      }
    );

    if (consumeError || !consumeResult) {
      return { error: 'Erro ao debitar crédito para a geração do currículo.' };
    }

    // 6. Chamar serviço de IA para gerar o currículo
    const content = await generateResumeAI(resumePayload);
    const title = jobTitle ? `Currículo - ${jobTitle}` : `Currículo - Inteligente`;

    // 7. Salvar currículo gerado no banco de dados automaticamente
    const { data: savedResume, error: saveError } = await supabaseAdmin
      .from('generated_resumes')
      .insert({
        user_id: userId,
        title,
        profile_data: resumePayload,
        content,
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving generated resume in tool:', saveError);
    }

    return {
      success: true,
      message: `Currículo para "${jobTitle || 'Vaga de Estágio'}" gerado e salvo com sucesso! 1 crédito foi consumido.`,
      resumeId: savedResume?.id,
      title,
      content,
      url: `${env.CLIENT_URL}/gerador-curriculos`
    };
  } catch (err: any) {
    console.error('Unexpected error in generate_resume tool:', err);
    return { error: `Erro ao gerar currículo: ${err.message}` };
  }
}
