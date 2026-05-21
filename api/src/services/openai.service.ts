import OpenAI from 'openai';
import { env } from '../config/env.js';

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

import type { AnalysisRequest as AnalysisInput, AnalysisOutput } from '../../../shared/types/index.js';
export type { AnalysisInput, AnalysisOutput };

export async function analyzeResumeAI(input: AnalysisInput): Promise<AnalysisOutput> {
  const { resumeText, jobDescription, currentSituation, mentorshipQuestions } = input;

  let analysisPrompt = `Analise o seguinte currículo e forneça uma avaliação detalhada em português brasileiro:

CURRÍCULO:
${resumeText}

SITUAÇÃO ATUAL DO CANDIDATO:
${currentSituation || 'Não informado'}`;

  if (jobDescription) {
    analysisPrompt += `

DESCRIÇÃO DA VAGA:
${jobDescription}

Por favor, analise especificamente a adequação do candidato para esta vaga.`;
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
}`;

  if (mentorshipQuestions) {
    analysisPrompt += `

PERGUNTAS DE MENTORIA:
${mentorshipQuestions}

Inclua também na análise:
7. Respostas às Perguntas de Mentoria
8. Plano de Desenvolvimento Personalizado

Adicione ao JSON:
"respostasMentoria": ["resposta 1", "resposta 2", "resposta 3"],
"planoDesenvolvimento": ["ação 1", "ação 2", "ação 3"]`;
  }

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'Você é um especialista em recrutamento e análise de currículos. Forneça análises objetivas e construtivas em português brasileiro. A sua resposta deve ser EXCLUSIVAMENTE um objeto JSON válido.',
      },
      {
        role: 'user',
        content: analysisPrompt,
      },
    ],
    temperature: 0.7,
    max_tokens: 2000,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('Nenhuma resposta retornada da OpenAI');
  }

  return JSON.parse(content) as AnalysisOutput;
}
