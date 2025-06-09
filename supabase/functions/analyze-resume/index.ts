
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
    mentorshipTopics: string;
    hasParticipated: string;
    hasInterest: string;
    howHeard: string;
    feedback?: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { resumeText, formData }: AnalysisRequest = await req.json();
    
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
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

Currículo para análise:
${resumeText}

Informações adicionais do estudante:
- Nome: ${formData.name}
- Curso: ${formData.course} 
- Universidade: ${formData.university}
- Período: ${formData.period}
- Já fez estágio: ${formData.hasInternship}
- Interesses em mentoria: ${formData.mentorshipTopics}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
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

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    let analysisText = data.choices[0].message.content;
    
    // Remove formatação markdown se presente
    analysisText = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    let analysisData;
    try {
      analysisData = JSON.parse(analysisText);
    } catch (error) {
      console.error('Error parsing OpenAI response:', analysisText);
      throw new Error('Invalid response format from AI');
    }

    // Save to database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: savedAnalysis, error: dbError } = await supabase
      .from('curriculum_analysis')
      .insert({
        name: formData.name,
        email: formData.email,
        course: formData.course,
        university: formData.university,
        analysis_data: analysisData,
        status: 'completed'
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to save analysis');
    }

    return new Response(JSON.stringify({
      success: true,
      analysis: analysisData,
      analysisId: savedAnalysis.id
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
