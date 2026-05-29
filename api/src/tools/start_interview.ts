import { supabaseAdmin } from '../services/supabase.service.js';
import { generateNextInterviewQuestionAI } from '../services/openai.service.js';
import { env } from '../config/env.js';
import type { SimulatorMessage } from '../../../shared/types/index.js';

export const startInterviewDefinition = {
  type: 'function' as const,
  function: {
    name: 'start_interview',
    description: 'Inicia uma nova simulação de entrevista de emprego por IA. Isso consome 1 crédito do usuário e retorna o link direto para a sessão do simulador de entrevistas com a primeira pergunta do entrevistador já gerada.',
    parameters: {
      type: 'object',
      properties: {
        jobTitle: { 
          type: 'string', 
          description: 'O cargo ou título da vaga para a simulação (ex: "Desenvolvedor Node.js Júnior", "Estagiário de Administração").' 
        },
        jobDescription: { 
          type: 'string', 
          description: 'Requisitos da vaga ou descrição das responsabilidades para personalizar as perguntas do entrevistador.' 
        },
        interviewerType: { 
          type: 'string', 
          enum: ['tech', 'behavioral', 'hard', 'friendly'],
          description: 'Personalidade do entrevistador: "tech" (técnico focado em hard skills), "behavioral" (focado em comportamental/soft skills), "hard" (exigente/desafiador), "friendly" (amigável/tom mais calmo). Padrão é "friendly".'
        },
        companyName: { 
          type: 'string', 
          description: 'Nome da empresa onde a vaga seria oferecida para tornar a simulação realista.' 
        }
      },
      required: ['jobTitle']
    }
  }
};

export async function runStartInterview(userId: string, args: {
  jobTitle: string;
  jobDescription?: string;
  interviewerType?: 'tech' | 'behavioral' | 'hard' | 'friendly';
  companyName?: string;
}) {
  try {
    const { jobTitle, jobDescription, interviewerType = 'friendly', companyName } = args;

    // 1. Consumir 1 crédito via RPC
    const { data: consumeResult, error: consumeError } = await supabaseAdmin.rpc(
      'consume_credits',
      {
        user_uuid: userId,
        amount: 1,
        description: `Simulação de entrevista: ${jobTitle}`,
      }
    );

    if (consumeError || !consumeResult) {
      console.error('Credits consumption failed in start_interview tool:', consumeError);
      return { 
        error: 'Você não tem créditos suficientes para iniciar uma simulação de entrevista (necessário 1 crédito). Acesse a página de créditos para adquirir mais.',
        requiresCredits: true
      };
    }

    // 2. Buscar perfil do candidato para alimentar o entrevistador
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('full_name, course, university, period, bio, linkedin_url')
      .eq('id', userId)
      .single();

    // 3. Gerar a primeira pergunta do entrevistador
    const firstQuestion = await generateNextInterviewQuestionAI(
      jobTitle,
      jobDescription || null,
      interviewerType,
      [], // Sem histórico ainda
      profile || null,
      companyName || null
    );

    const initialMessages: SimulatorMessage[] = [
      {
        role: 'interviewer',
        content: firstQuestion,
        timestamp: new Date().toISOString(),
      },
    ];

    // 4. Salvar a nova simulação no banco
    const { data: simulation, error: saveError } = await supabaseAdmin
      .from('interview_simulations')
      .insert({
        user_id: userId,
        job_title: jobTitle,
        job_description: jobDescription || null,
        interviewer_type: interviewerType,
        status: 'started',
        messages: initialMessages,
        feedback: null,
        company_name: companyName || null,
      })
      .select()
      .single();

    if (saveError || !simulation) {
      console.error('Error saving interview simulation in tool:', saveError);
      return { error: 'Ocorreu um erro ao salvar a simulação de entrevista no banco de dados.' };
    }

    const simulatorUrl = `${env.CLIENT_URL}/simulador-entrevistas?id=${simulation.id}`;

    return {
      success: true,
      message: `Simulação para "${jobTitle}" iniciada com sucesso! 1 crédito foi consumido.`,
      simulationId: simulation.id,
      firstQuestion,
      url: simulatorUrl,
    };
  } catch (err: any) {
    console.error('Unexpected error in start_interview tool:', err);
    return { error: `Erro ao iniciar entrevista: ${err.message}` };
  }
}
