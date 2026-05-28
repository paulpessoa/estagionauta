import { supabaseAdmin } from '../services/supabase.service.js';
import { analyzeResumeAI } from '../services/openai.service.js';

export const analyzeResumeDefinition = {
  type: 'function' as const,
  function: {
    name: 'analyze_resume',
    description: 'Realiza uma análise completa e detalhada do currículo do usuário (cadastrado ou fornecido) para avaliar pontos fortes, pontos fracos, e dar recomendações. Custo: 3 créditos.',
    parameters: {
      type: 'object',
      properties: {
        resumeText: {
          type: 'string',
          description: 'Texto do currículo a ser analisado. Se não fornecido, o assistente tentará buscar o currículo gerado mais recente do usuário no banco de dados.',
        },
        jobDescription: {
          type: 'string',
          description: 'Descrição da vaga opcional para avaliar a adequação do candidato para uma vaga específica.',
        },
      },
    },
  },
};

export async function runAnalyzeResume(userId: string, args: {
  resumeText?: string;
  jobDescription?: string;
}) {
  try {
    let textToAnalyze = args.resumeText || '';

    // 1. If resumeText is not provided, fetch the most recent resume from generated_resumes
    if (!textToAnalyze) {
      const { data: resumes, error: resumeErr } = await supabaseAdmin
        .from('generated_resumes')
        .select('content')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (resumeErr || !resumes || resumes.length === 0) {
        return {
          error: 'Nenhum currículo encontrado. Para analisar, você pode gerar um currículo no "Gerador de Currículos" da plataforma ou nos enviar o texto do seu currículo diretamente aqui.',
        };
      }

      textToAnalyze = resumes[0].content;
    }

    if (textToAnalyze.length < 50) {
      return { error: 'O currículo fornecido é muito curto. Envie um currículo com pelo menos 50 caracteres.' };
    }

    // 2. Fetch user profile to verify and deduct credits (3 credits)
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('user_profiles')
      .select('credits, full_name, course, university, email')
      .eq('id', userId)
      .single();

    if (profileErr || !profile) {
      return { error: 'Não foi possível encontrar o perfil do usuário para validar créditos.' };
    }

    if (profile.credits < 3) {
      return {
        error: `Créditos insuficientes. A análise de currículo custa 3 créditos, mas você possui apenas ${profile.credits} créditos. Visite a página de Preços para adquirir mais créditos.`,
      };
    }

    // 3. Consume credits using atomic RPC
    const { data: consumeResult, error: consumeError } = await supabaseAdmin.rpc(
      'consume_credits',
      {
        user_uuid: userId,
        amount: 3,
        description: 'Análise de currículo via Rover Assistente',
      }
    );

    if (consumeError || !consumeResult) {
      return { error: 'Erro ao deduzir créditos para a análise de currículo.' };
    }

    // 4. Run AI analysis
    const analysis = await analyzeResumeAI({
      resumeText: textToAnalyze,
      jobDescription: args.jobDescription,
    });

    // 5. Save to curriculum_analysis table
    const { data: insertData, error: saveError } = await supabaseAdmin
      .from('curriculum_analysis')
      .insert({
        user_id: userId,
        name: profile.full_name || 'Usuário do Rover',
        email: profile.email || 'rover@estagionauta.com.br',
        course: profile.course || null,
        university: profile.university || null,
        analysis_data: analysis,
        status: 'completed',
        used_fallback: false,
        credits_used: 3,
      })
      .select('id')
      .single();

    if (saveError) {
      console.error('Error saving curriculum analysis from rover:', saveError);
    }

    return {
      success: true,
      creditsUsed: 3,
      remainingCredits: profile.credits - 3,
      analysisId: insertData?.id,
      analysisSummary: {
        scoreGeral: analysis.scoreGeral,
        adequacaoMercado: analysis.adequacaoMercado,
        potencialCrescimento: analysis.potencialCrescimento,
        pontosFortes: analysis.pontosFortes,
        areasMelhoria: analysis.areasMelhoria,
        recomendacoes: analysis.recomendacoes,
        resumo: analysis.resumo,
      },
    };
  } catch (err: any) {
    return { error: `Erro na análise do currículo: ${err.message}` };
  }
}
