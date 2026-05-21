import OpenAI from 'openai';
import { env } from '../config/env.js';

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

import type { AnalysisRequest as AnalysisInput, AnalysisOutput, ResumeProfileData } from '../../../shared/types/index.js';
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

export async function generateResumeAI(data: ResumeProfileData): Promise<string> {
  let prompt = `Você é um redator profissional de currículos e especialista em recrutamento. Crie um currículo altamente otimizado e bem formatado em Markdown para o seguinte candidato:

NOME COMPLETO: ${data.fullName}
E-MAIL: ${data.email}
TELEFONE: ${data.phone}
LOCALIZAÇÃO: ${data.location}
WEBSITE: ${data.website || 'Não informado'}
LINKEDIN: ${data.linkedin || 'Não informado'}
GITHUB: ${data.github || 'Não informado'}

RESUMO PROFISSIONAL:
${data.summary}

EXPERIÊNCIAS PROFISSIONAIS:
${data.experiences.map((exp, idx) => `
Experiência ${idx + 1}:
Empresa: ${exp.company}
Cargo: ${exp.position}
Período: de ${exp.startDate} a ${exp.current ? 'Atual' : exp.endDate}
Descrição das atividades e conquistas:
${exp.description}
`).join('\n')}

FORMAÇÃO ACADÊMICA:
${data.education.map((edu, idx) => `
Formação ${idx + 1}:
Instituição: ${edu.institution}
Grau/Curso: ${edu.degree} em ${edu.fieldOfStudy}
Período: de ${edu.startDate} a ${edu.current ? 'Atual' : edu.endDate}
`).join('\n')}

HABILIDADES:
${data.skills.join(', ')}

IDIOMAS:
${data.languages?.join(', ') || 'Não informado'}
`;

  if (data.jobTitle || data.jobDescription) {
    prompt += `

VAGA ALVO:
Cargo: ${data.jobTitle || 'Não informado'}
Descrição/Requisitos da Vaga:
${data.jobDescription || 'Não informado'}

ATENÇÃO: Adapte e otimize o currículo especificamente para essa vaga alvo, destacando as experiências, palavras-chave e habilidades que são mais relevantes para o cargo.`;
  }

  prompt += `

INSTRUÇÕES DE FORMATAÇÃO:
1. Retorne APENAS o currículo completo formatado em Markdown profissional. Não inclua observações, introduções ou explicações antes ou depois.
2. Utilize cabeçalhos claros (H1 para o nome, H2 para as seções principais).
3. Use tópicos (bullet points) nas experiências para descrever as realizações de forma objetiva, começando por verbos de ação e destacando conquistas.
4. Mantenha um layout limpo, elegante e profissional.
5. Remova seções vazias ou não informadas.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'Você é um especialista em recrutamento. Crie currículos otimizados e profissionais em português brasileiro. Retorne exclusivamente o conteúdo em Markdown, sem blocos de código markdown (sem ```markdown ... ```), apenas o texto cru.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.7,
    max_tokens: 3000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('Nenhuma resposta retornada da OpenAI para o gerador de currículo');
  }

  return content;
}

