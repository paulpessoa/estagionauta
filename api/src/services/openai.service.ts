import OpenAI from 'openai';
import { env } from '../config/env.js';

const openai = new OpenAI({
  apiKey: env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

import type { AnalysisRequest as AnalysisInput, AnalysisOutput, ResumeProfileData, SimulatorMessage, SimulatorFeedback } from '../../../shared/types/index.js';
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
    model: 'llama-3.3-70b-versatile',
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
    model: 'llama-3.3-70b-versatile',
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

export async function generateNextInterviewQuestionAI(
  jobTitle: string,
  jobDescription: string | null,
  interviewerType: string,
  messageHistory: SimulatorMessage[]
): Promise<string> {
  const interviewerTones: Record<string, string> = {
    tech: 'Você é um entrevistador puramente técnico, focado em hard skills, arquitetura de sistemas, conceitos fundamentais e resolução de problemas práticos. Faça perguntas diretas e desafie as decisões técnicas do candidato.',
    behavioral: 'Você é um entrevistador de Recursos Humanos focado em soft skills, aspectos comportamentais, liderança, comunicação e adequação cultural. Use metodologias como a técnica STAR (Situação, Tarefa, Ação, Resultado) para avaliar respostas anteriores.',
    hard: 'Você é um entrevistador extremamente exigente, incisivo e direto. Você questiona profundamente as respostas do candidato, pressionando-o para testar sua capacidade de raciocinar sob estresse e resolver dilemas complexos.',
    friendly: 'Você é um entrevistador caloroso, amigável e empático. Seu objetivo é fazer com que o candidato se sinta confortável, promovendo um diálogo fluido e construtivo, mas sem perder o foco na avaliação profissional.',
  };

  const toneInstruction = interviewerTones[interviewerType] || interviewerTones.friendly;

  const systemPrompt = `Você é um entrevistador profissional experiente conduzindo uma simulação de entrevista de emprego realista.
Cargo pretendido: ${jobTitle}
Descrição/Requisitos da vaga: ${jobDescription || 'Não informado'}

Instrução de tom e personalidade:
${toneInstruction}

Regras cruciais:
1. Conduza a entrevista de forma interativa. Faça apenas UMA pergunta por vez.
2. Leia a resposta anterior do candidato e responda de forma natural, comentando brevemente se necessário antes de formular a próxima pergunta.
3. Não saia do personagem. Você não é um assistente de IA, você é o entrevistador.
4. Mantenha suas falas extremamente concisas, no máximo 2 ou 3 frases curtas (cerca de 30 palavras), para que a resposta em áudio não fique longa e cansativa. Vá direto ao ponto.
5. Se for o início da entrevista (histórico vazio), apresente-se brevemente e faça a primeira pergunta.`;

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt }
  ];

  for (const msg of messageHistory) {
    messages.push({
      role: msg.role === 'candidate' ? 'user' : 'assistant',
      content: msg.content
    });
  }

  const response = await openai.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages,
    temperature: 0.8,
    max_tokens: 200,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('Nenhuma resposta retornada da OpenAI para a simulação de entrevista');
  }

  return content;
}

export async function generateInterviewFeedbackAI(
  jobTitle: string,
  jobDescription: string | null,
  interviewerType: string,
  messageHistory: SimulatorMessage[]
): Promise<SimulatorFeedback> {
  const systemPrompt = `Você é um especialista sênior em recrutamento e seleção de talentos.
Analise o histórico completo da simulação de entrevista de emprego e forneça um relatório de feedback construtivo e detalhado em português brasileiro.

Cargo pretendido: ${jobTitle}
Descrição/Requisitos da vaga: ${jobDescription || 'Não informado'}
Tipo de Entrevista conduzida: ${interviewerType}

Instruções para o Feedback:
1. Avalie o desempenho geral das respostas do candidato (conteúdo, clareza, embasamento técnico e comportamental).
2. Estipule uma pontuação geral (score) de 0 a 100.
3. Identifique pelo menos 3 Pontos Fortes demonstrados nas respostas.
4. Identifique pelo menos 3 Áreas de Melhoria de forma construtiva.
5. Dê dicas acionáveis e práticas de estudo ou comportamento para que o candidato possa se destacar em entrevistas reais.

A sua resposta deve ser EXCLUSIVAMENTE um objeto JSON válido no seguinte formato:
{
  "score": 85,
  "strengths": [
    "Destaque claro das tecnologias X e Y...",
    "Excelente articulação sobre projetos passados...",
    "Uso adequado do modelo comportamental..."
  ],
  "improvements": [
    "Faltou aprofundamento na explicação técnica sobre Z...",
    "Respostas muito prolixas em determinados pontos...",
    "Poderia dar exemplos práticos de como resolveu conflitos de time..."
  ],
  "tips": "Dica executiva estruturada recomendando ferramentas de aprendizado, refinamento da retórica profissional e leituras úteis."
}`;

  const response = await openai.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `Aqui está o histórico completo da entrevista estruturado em JSON para sua análise:\n${JSON.stringify(messageHistory, null, 2)}`
      }
    ],
    temperature: 0.6,
    max_tokens: 1500,
    response_format: { type: 'json_object' }
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('Nenhuma resposta retornada da OpenAI para o feedback de entrevista');
  }

  return JSON.parse(content) as SimulatorFeedback;
}


