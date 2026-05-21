import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const allowedOrigins = [
  'https://estagionauta.com.br',
  'http://localhost:5173'
];

function getCorsHeaders(origin: string | null) {
  const allowOrigin = origin && allowedOrigins.includes(origin) ? origin : 'https://estagionauta.com.br';
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
  };
}

interface AnalysisRequest {
  resumeText: string;
  formData: {
    name: string;
    email: string;
    course: string;
    university: string;
    period: string;
    hasInternship: string;
    hasLinkedIn?: string;
    currentFocus?: string;
    careerGoals?: string;
    skillsToDevelop?: string;
    timeAvailability?: string;
    hasSpecificJob?: boolean;
    jobDescription?: string;
    jobRequirements?: string;
    mentorshipTopics?: string;
    hasParticipated?: string;
    hasInterest?: string;
    howHeard: string;
    feedback?: string;
    user_id?: string;
  };
}

// Função para extrair texto de PDF usando base64
async function extractTextFromPDF(base64Data: string): Promise<string> {
  try {
    // Para simplicidade, vamos usar uma abordagem básica
    // Em produção, você pode usar bibliotecas como pdf-parse ou similar
    const text = atob(base64Data);
    
    // Remove caracteres não imprimíveis e limpa o texto
    const cleanText = text
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Se o texto for muito curto, pode ser que não seja um PDF válido
    if (cleanText.length < 100) {
      throw new Error('PDF inválido ou não contém texto legível');
    }
    
    return cleanText.substring(0, 2000); // Limita a 2000 caracteres
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Não foi possível extrair texto do PDF');
  }
}

// Função para consumir créditos do usuário
async function consumeUserCredits(supabase: any, userId: string): Promise<boolean> {
  try {
    // Verifica se o usuário tem créditos suficientes
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('credits')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return false;
    }

    if (!profile || profile.credits < 3) {
      throw new Error('Créditos insuficientes para análise. Você precisa de 3 créditos.');
    }

    // Consome 3 créditos
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ 
        credits: profile.credits - 3,
        total_credits_used: (profile.total_credits_used || 0) + 3
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating user credits:', updateError);
      return false;
    }

    // Registra a transação
    const { error: transactionError } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: userId,
        type: 'usage',
        amount: 3,
        description: 'Análise de currículo com IA'
      });

    if (transactionError) {
      console.error('Error recording credit transaction:', transactionError);
      // Não falha a operação se não conseguir registrar a transação
    }

    return true;
  } catch (error) {
    console.error('Error consuming credits:', error);
    throw error;
  }
}

// Função para fazer retry com backoff exponencial
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Se for rate limit, espera mais tempo
      const isRateLimit = error.message?.includes('Too Many Requests') || 
                         error.message?.includes('rate limit');
      
      const delay = isRateLimit ? baseDelay * Math.pow(2, attempt) * 2 : baseDelay * Math.pow(2, attempt);
      
      console.log(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries exceeded');
}

// Análise fallback quando a API não está disponível
function generateFallbackAnalysis(formData: AnalysisRequest['formData'], resumeText: string) {
  const period = formData.period;
  const hasInternship = formData.hasInternship;
  
  let baseScore = 6;
  const analysis: string[] = [];
  const recommendations: string[] = [];
  
  // Analisa o texto do currículo
  const textLength = resumeText.length;
  const hasEmail = resumeText.includes('@');
  const hasPhone = /\d{2,}/.test(resumeText);
  const hasEducation = /(curso|graduação|universidade|faculdade|ensino)/i.test(resumeText);
  
  // Ajusta score baseado no período
  if (period === '1-2') {
    baseScore = 5;
    analysis.push("Currículo adequado para início de curso. Foque em atividades extracurriculares.");
  } else if (period === '3-5') {
    baseScore = 6;
    analysis.push("Período ideal para buscar estágio. Considere projetos práticos.");
  } else if (period === '6+') {
    baseScore = 7;
    analysis.push("Período avançado. Destaque experiências e projetos relevantes.");
  } else {
    baseScore = 8;
    analysis.push("Formado recentemente. Foque em experiências práticas e networking.");
  }
  
  // Ajusta baseado em experiência
  if (hasInternship === 'yes') {
    baseScore += 1;
    analysis.push("Experiência de estágio é um diferencial importante.");
  } else if (hasInternship === 'looking') {
    analysis.push("Busca ativa por estágio demonstra proatividade.");
  }
  
  // Ajusta baseado no conteúdo do currículo
  if (textLength < 500) {
    baseScore -= 1;
    analysis.push("Currículo muito conciso. Considere adicionar mais detalhes sobre experiências.");
  }
  
  if (!hasEmail || !hasPhone) {
    analysis.push("Certifique-se de incluir informações de contato completas.");
  }
  
  if (!hasEducation) {
    analysis.push("Destaque sua formação acadêmica de forma clara.");
  }
  
  return {
    notas: {
      organizacao: baseScore,
      ortografia: baseScore + 1,
      experiencias: baseScore - 1,
      adequacao: baseScore,
      extracurriculares: baseScore - 2,
      diferencial: baseScore - 1,
      habilidades: baseScore
    },
    analise: analysis,
    recomendacoes: [
      "Inclua projetos acadêmicos e pessoais",
      "Destaque habilidades técnicas específicas",
      "Mantenha o currículo atualizado",
      "Adicione links para portfólio ou LinkedIn"
    ],
    tags: [
      "comunicação",
      "trabalho em equipe",
      "resolução de problemas",
      "aprendizado contínuo"
    ]
  };
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'))
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get user from JWT
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { resumeText, jobDescription, currentSituation, mentorshipQuestions } = await req.json()

    // Verificar se o usuário tem créditos suficientes (3 créditos por análise)
    const { data: userProfile, error: profileError } = await supabaseClient
      .from('user_profiles')
      .select('credits')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Erro ao buscar perfil do usuário:', profileError)
      return new Response(
        JSON.stringify({ error: 'Erro ao verificar créditos do usuário' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!userProfile || userProfile.credits < 3) {
      return new Response(
        JSON.stringify({ 
          error: 'Créditos insuficientes', 
          requiredCredits: 3,
          availableCredits: userProfile?.credits || 0,
          message: 'Você precisa de 3 créditos para analisar um currículo. Compre mais créditos na página de preços.'
        }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Consumir 3 créditos
    const { data: consumeResult, error: consumeError } = await supabaseClient
      .rpc('consume_credits', {
        user_uuid: user.id,
        amount: 3,
        description: 'Análise de currículo com IA'
      })

    if (consumeError || !consumeResult) {
      console.error('Erro ao consumir créditos:', consumeError)
      return new Response(
        JSON.stringify({ error: 'Erro ao processar pagamento de créditos' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Créditos consumidos com sucesso para usuário:', user.id)

    // Preparar prompt para análise
    let analysisPrompt = `Analise o seguinte currículo e forneça uma avaliação detalhada em português brasileiro:

CURRÍCULO:
${resumeText}

SITUAÇÃO ATUAL DO CANDIDATO:
${currentSituation || 'Não informado'}`

    if (jobDescription) {
      analysisPrompt += `

DESCRIÇÃO DA VAGA:
${jobDescription}

Por favor, analise especificamente a adequação do candidato para esta vaga.`
    }

    analysisPrompt += `

Forneça uma análise estruturada com:
1. Pontos Fortes (mínimo 3)
2. Áreas de Melhoria (mínimo 3)
3. Recomendações Específicas (mínimo 3)
4. Score Geral (0-100)
5. Adequação ao Mercado (0-100)
6. Potencial de Crescimento (0-100)

Formate a resposta como JSON válido com a seguinte estrutura:
{
  "pontosFortes": ["ponto 1", "ponto 2", "ponto 3"],
  "areasMelhoria": ["área 1", "área 2", "área 3"],
  "recomendacoes": ["recomendação 1", "recomendação 2", "recomendação 3"],
  "scoreGeral": 75,
  "adequacaoMercado": 80,
  "potencialCrescimento": 85,
  "resumo": "Resumo executivo da análise"
}`

    if (mentorshipQuestions) {
      analysisPrompt += `

PERGUNTAS DE MENTORIA:
${mentorshipQuestions}

Inclua também na análise:
7. Respostas às Perguntas de Mentoria
8. Plano de Desenvolvimento Personalizado

Adicione ao JSON:
"respostasMentoria": ["resposta 1", "resposta 2", "resposta 3"],
"planoDesenvolvimento": ["ação 1", "ação 2", "ação 3"]`
    }

    // Tentar usar OpenAI
    let analysisResult
    let usedFallback = false

    try {
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'Você é um especialista em recrutamento e análise de currículos. Forneça análises objetivas e construtivas em português brasileiro.'
            },
            {
              role: 'user',
              content: analysisPrompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000
        })
      })

      if (openaiResponse.ok) {
        const openaiData = await openaiResponse.json()
        const content = openaiData.choices[0].message.content
        
        try {
          analysisResult = JSON.parse(content)
          console.log('Análise OpenAI bem-sucedida')
        } catch (parseError) {
          console.error('Erro ao fazer parse da resposta OpenAI:', parseError)
          throw new Error('Resposta OpenAI inválida')
        }
      } else {
        console.error('Erro OpenAI:', openaiResponse.status, await openaiResponse.text())
        throw new Error('Erro na API OpenAI')
      }
    } catch (openaiError) {
      console.error('Erro ao usar OpenAI, usando fallback:', openaiError)
      usedFallback = true
      
      // Análise fallback baseada no texto extraído
      const wordCount = resumeText.split(/\s+/).length
      const hasExperience = /experiência|experience|trabalho|work|empresa|company/i.test(resumeText)
      const hasEducation = /graduação|graduation|curso|course|universidade|university|faculdade|college/i.test(resumeText)
      const hasSkills = /habilidades|skills|competências|competencies|tecnologias|technologies/i.test(resumeText)
      
      let scoreGeral = 50
      let adequacaoMercado = 50
      let potencialCrescimento = 50
      
      if (wordCount > 200) scoreGeral += 10
      if (hasExperience) scoreGeral += 15
      if (hasEducation) scoreGeral += 10
      if (hasSkills) scoreGeral += 15
      
      adequacaoMercado = scoreGeral + Math.floor(Math.random() * 20) - 10
      potencialCrescimento = scoreGeral + Math.floor(Math.random() * 20) - 10
      
      adequacaoMercado = Math.max(0, Math.min(100, adequacaoMercado))
      potencialCrescimento = Math.max(0, Math.min(100, potencialCrescimento))
      
      analysisResult = {
        pontosFortes: [
          "Currículo estruturado e organizado",
          "Informações profissionais bem apresentadas",
          "Formação acadêmica adequada"
        ],
        areasMelhoria: [
          "Considerar adicionar mais detalhes sobre realizações específicas",
          "Incluir métricas e resultados quantitativos",
          "Destacar soft skills e competências interpessoais"
        ],
        recomendacoes: [
          "Quantificar resultados e conquistas profissionais",
          "Incluir palavras-chave relevantes para a área",
          "Manter o currículo atualizado regularmente"
        ],
        scoreGeral,
        adequacaoMercado,
        potencialCrescimento,
        resumo: "Análise realizada com base no conteúdo do currículo fornecido. Recomenda-se revisão e aprimoramento contínuo."
      }
    }

    // Salvar análise no banco de dados
    const { error: saveError } = await supabaseClient
      .from('curriculum_analysis')
      .insert({
        user_id: user.id,
        resume_text: resumeText,
        job_description: jobDescription || null,
        current_situation: currentSituation || null,
        mentorship_questions: mentorshipQuestions || null,
        analysis_result: analysisResult,
        used_fallback: usedFallback,
        credits_used: 3
      })

    if (saveError) {
      console.error('Erro ao salvar análise:', saveError)
      return new Response(
        JSON.stringify({ error: 'Erro ao salvar análise no banco de dados' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Análise salva com sucesso para usuário:', user.id)

    return new Response(
      JSON.stringify({
        success: true,
        analysis: analysisResult,
        usedFallback,
        creditsUsed: 3,
        remainingCredits: userProfile.credits - 3
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Erro geral:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
