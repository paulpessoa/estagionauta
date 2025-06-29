import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    if (!profile || profile.credits < 1) {
      throw new Error('Créditos insuficientes para análise');
    }

    // Consome 1 crédito
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ credits: profile.credits - 1 })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating user credits:', updateError);
      return false;
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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting resume analysis...');
    
    const { resumeText, formData }: AnalysisRequest = await req.json();
    console.log('Request data received:', { 
      hasResumeText: !!resumeText, 
      formDataKeys: Object.keys(formData),
      name: formData.name,
      email: formData.email 
    });
    
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error('OpenAI API key not configured');
      throw new Error('OpenAI API key not configured');
    }
    console.log('OpenAI API key found');

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase environment variables not configured');
      throw new Error('Supabase configuration missing');
    }
    console.log('Supabase configuration found');

    // Extrai texto do PDF
    let extractedText = '';
    try {
      extractedText = await extractTextFromPDF(resumeText);
      console.log('Text extracted from PDF, length:', extractedText.length);
    } catch (error) {
      console.error('Error extracting text:', error);
      throw new Error('Não foi possível extrair texto do PDF. Verifique se o arquivo é válido.');
    }

    // Consome créditos do usuário
    if (formData.user_id) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const creditsConsumed = await consumeUserCredits(supabase, formData.user_id);
      if (!creditsConsumed) {
        throw new Error('Erro ao consumir créditos. Verifique se você tem créditos suficientes.');
      }
      console.log('Credits consumed successfully');
    }

    const prompt = `Você é um analista de carreira com foco em estágio. Avalie o currículo a seguir e atribua uma nota de 0 a 10 para cada critério abaixo, baseado no conteúdo fornecido. Em seguida, dê sugestões para melhoria.

Critérios:
- Clareza e organização do currículo
- Ortografia e gramática
- Destaque de experiências relevantes
- Adequação ao nível acadêmico
- Presença de atividades extracurriculares
- Personalização e diferencial
- Habilidades técnicas e interpessoais visíveis

IMPORTANTE: Responda APENAS com o JSON válido, sem formatação markdown, sem \`\`\`json no início ou fim.

{
  "notas": {
    "organizacao": 7,
    "ortografia": 9,
    "experiencias": 5,
    "adequacao": 8,
    "extracurriculares": 4,
    "diferencial": 6,
    "habilidades": 7
  },
  "analise": [
    "O currículo está bem organizado, mas pode usar marcadores para facilitar a leitura.",
    "Pouca ênfase em experiências extracurriculares. Considere incluir projetos ou voluntariado.",
    "Faltam habilidades específicas ou softwares utilizados nos cursos.",
    "Boa adequação para o nível de graduação."
  ],
  "recomendacoes": [
    "Use verbos de ação como 'desenvolvi', 'participei', 'colaborei' para valorizar suas experiências.",
    "Inclua um pequeno resumo profissional no topo do currículo.",
    "Se possível, adicione links para LinkedIn ou portfólio."
  ],
  "tags": [
    "comunicação",
    "gestão de tempo",
    "documentação",
    "testes",
    "clean code"
  ]
}

Texto extraído do currículo:
${extractedText}

Informações adicionais do estudante:
- Nome: ${formData.name}
- Curso: ${formData.course} 
- Universidade: ${formData.university}
- Período: ${formData.period}
- Já fez estágio: ${formData.hasInternship}
- Interesses em mentoria: ${formData.mentorshipTopics || 'Não informado'}`;

    let analysisData;
    let usedFallback = false;

    try {
      // Tenta usar a API do OpenAI com retry
      const response = await retryWithBackoff(async () => {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-nano',
            messages: [
              { 
                role: 'system', 
                content: 'Você é um especialista em análise de currículos para estágios. Responda SEMPRE com JSON válido, sem formatação markdown.' 
              },
              { role: 'user', content: prompt }
            ],
            temperature: 0.7,
          }),
        });

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`OpenAI API error: ${res.status} ${res.statusText} - ${errorText}`);
        }

        return res;
      });

      const data = await response.json();
      let analysisText = data.choices[0].message.content;
      
      // Remove formatação markdown se presente
      analysisText = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      try {
        analysisData = JSON.parse(analysisText);
      } catch (error) {
        console.error('Error parsing OpenAI response:', analysisText);
        throw new Error('Invalid response format from AI');
      }

    } catch (error) {
      console.error('OpenAI API failed, using fallback analysis:', error);
      
      // Se a API falhar, usa análise fallback
      analysisData = generateFallbackAnalysis(formData, extractedText);
      usedFallback = true;
    }

    // Save to database
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: savedAnalysis, error: dbError } = await supabase
      .from('curriculum_analysis')
      .insert({
        user_id: formData.user_id || null,
        name: formData.name,
        email: formData.email,
        course: formData.course,
        university: formData.university,
        analysis_data: analysisData,
        status: 'completed',
        credits_used: 1,
        used_fallback: usedFallback
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error(`Failed to save analysis: ${dbError.message}`);
    }

    return new Response(JSON.stringify({
      success: true,
      analysis: analysisData,
      analysisId: savedAnalysis.id,
      usedFallback: usedFallback
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-resume function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
