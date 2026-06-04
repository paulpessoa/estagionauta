import OpenAI from 'openai';
import { supabaseAdmin } from '../services/supabase.service.js';
import { env } from '../config/env.js';

const getLlmClient = () => {
  if (env.GEMINI_API_KEY) {
    return new OpenAI({
      apiKey: env.GEMINI_API_KEY,
      baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    });
  }
  if (env.OPENAI_API_KEY) {
    return new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    });
  }
  return new OpenAI({
    apiKey: env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
  });
};

export const analyzeCandidaturaDefinition = {
  type: 'function' as const,
  function: {
    name: 'analyze_candidatura',
    description: 'Analisa a compatibilidade do perfil do usuário com uma vaga específica do Kanban de candidaturas. Consome 2 créditos. Retorna uma análise detalhada contendo score de compatibilidade, pontos fortes, lacunas (o que falta no perfil) e dicas para a entrevista.',
    parameters: {
      type: 'object',
      properties: {
        candidatureId: { 
          type: 'string', 
          description: 'O ID da candidatura no Kanban que o usuário deseja analisar.' 
        }
      },
      required: ['candidatureId']
    }
  }
};

export async function runAnalyzeCandidatura(userId: string, args: { candidatureId: string }) {
  try {
    const { candidatureId } = args;

    // 1. Verificar créditos (necessário 2 créditos)
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('user_profiles')
      .select('credits, full_name, course, university, period, bio')
      .eq('id', userId)
      .single();

    if (profileErr || !profile) {
      return { error: 'Não foi possível encontrar o perfil do usuário para realizar a análise.' };
    }

    if (profile.credits < 2) {
      return { 
        error: 'Você não tem créditos suficientes para realizar a análise de compatibilidade da vaga (necessário 2 créditos). Acesse a página de créditos para adquirir mais.',
        requiresCredits: true
      };
    }

    // 2. Buscar dados da candidatura no Kanban
    const { data: app, error: appErr } = await supabaseAdmin
      .from('kanban_applications')
      .select('company, position, description, notes')
      .eq('id', candidatureId)
      .eq('user_id', userId)
      .single();

    if (appErr || !app) {
      return { error: 'Candidatura não encontrada no seu painel Kanban.' };
    }

    // 3. Buscar currículo mais recente para complementar o perfil
    const { data: lastResume } = await supabaseAdmin
      .from('generated_resumes')
      .select('content')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const candidateSummary = `
Nome: ${profile.full_name || 'Estudante'}
Curso: ${profile.course || 'Não informado'}
Faculdade: ${profile.university || 'Não informada'}
Período: ${profile.period || 'Não informado'}
Resumo Profissional: ${profile.bio || 'Não informado'}

--- CURRÍCULO CADASTRADO ---
${lastResume?.content || 'Nenhum currículo em markdown encontrado.'}
`;

    const jobSummary = `
Empresa: ${app.company}
Cargo: ${app.position}
Descrição/Requisitos da Vaga: ${app.description || 'Não informado'}
Anotações do Usuário: ${app.notes || 'Nenhuma'}
`;

    // 4. Consumir 2 créditos via RPC
    const { data: consumeResult, error: consumeError } = await supabaseAdmin.rpc(
      'consume_credits',
      {
        user_uuid: userId,
        amount: 2,
        description: `Análise de compatibilidade: ${app.position} na ${app.company}`,
      }
    );

    if (consumeError || !consumeResult) {
      return { error: 'Erro ao debitar créditos para a análise.' };
    }

    // 5. Chamar a LLM
    const client = getLlmClient();
    const model = env.GEMINI_API_KEY 
      ? 'gemini-1.5-flash' 
      : (env.OPENAI_API_KEY ? 'gpt-4o-mini' : 'llama-3.3-70b-versatile');

    const systemPrompt = `Você é um Recrutador Sênior e Especialista em Carreira.
Sua tarefa é analisar a compatibilidade (fit) entre o perfil do candidato (currículo e dados acadêmicos) e os requisitos da vaga de estágio/trabalho no Kanban.
Seja honesto, construtivo e direto. Forneça a resposta em formato JSON válido e em português brasileiro.`;

    const userPrompt = `
PERFIL DO CANDIDATO:
${candidateSummary}

DETALHES DA VAGA:
${jobSummary}

Por favor, analise a compatibilidade e retorne EXCLUSIVAMENTE um objeto JSON no seguinte formato:
{
  "compatibilityScore": 85, // número de 0 a 100
  "summary": "Resumo executivo de compatibilidade entre o candidato e a vaga.",
  "strengths": ["Ponto forte 1", "Ponto forte 2", "Ponto forte 3"], // o que o candidato tem que bate com a vaga
  "gaps": ["Lacuna 1", "Lacuna 2"], // o que falta no perfil ou pode ser melhorado para esta vaga
  "interviewTips": ["Dica 1", "Dica 2", "Dica 3"] // dicas práticas de como se destacar na entrevista para esta vaga específica
}`;

    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.5,
      response_format: { type: 'json_object' }
    });

    const rawContent = response.choices[0]?.message?.content;
    if (!rawContent) {
      throw new Error('Nenhuma resposta gerada pela inteligência artificial.');
    }

    const analysisResult = JSON.parse(rawContent);

    // Salvar feedback e score na própria candidatura para enriquecer o Kanban!
    // A tabela kanban_applications possui colunas de feedbacks e status_history. Podemos concatenar ou salvar.
    // Vamos apenas retornar para o Rover, que irá expor ao usuário.
    return {
      success: true,
      message: `Análise de compatibilidade concluída para "${app.position} na ${app.company}". 2 créditos foram consumidos.`,
      company: app.company,
      position: app.position,
      analysis: analysisResult
    };
  } catch (err: any) {
    console.error('Unexpected error in analyze_candidatura tool:', err);
    return { error: `Erro ao analisar candidatura: ${err.message}` };
  }
}
