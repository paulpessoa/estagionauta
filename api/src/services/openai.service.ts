import OpenAI from 'openai';
import { env } from '../config/env.js';

const openai = new OpenAI({
  apiKey: env.GEMINI_API_KEY,
  baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
});

import type { AnalysisRequest as AnalysisInput, AnalysisOutput, ResumeProfileData, SimulatorMessage, SimulatorFeedback } from '../../../shared/types/index.js';
export type { AnalysisInput, AnalysisOutput };

export interface AIOptions {
  apiKey?: string;
  provider?: 'gemini' | 'openai';
}

function getClientAndModel(options?: AIOptions) {
  if (options?.apiKey) {
    if (options.provider === 'openai') {
      return {
        client: new OpenAI({ apiKey: options.apiKey }),
        model: 'gpt-4o-mini'
      };
    } else {
      return {
        client: new OpenAI({
          apiKey: options.apiKey,
          baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
        }),
        model: 'gemini-1.5-flash'
      };
    }
  }
  return {
    client: openai,
    model: 'gemini-1.5-flash'
  };
}

async function createChatCompletion(
  params: any,
  options?: AIOptions
): Promise<any> {
  if (options?.apiKey) {
    const { client, model } = getClientAndModel(options);
    return client.chat.completions.create({ ...params, model });
  }

  const useGeminiFirst = !!(env.GEMINI_API_KEY && env.GEMINI_API_KEY.startsWith('AIzaSy'));

  if (useGeminiFirst) {
    try {
      const { client, model } = getClientAndModel();
      return await client.chat.completions.create({ ...params, model });
    } catch (error) {
      console.warn('Default Gemini API call failed, attempting fallback to platform OpenAI:', error);
      if (env.OPENAI_API_KEY) {
        const fallbackClient = new OpenAI({ apiKey: env.OPENAI_API_KEY });
        return await fallbackClient.chat.completions.create({ ...params, model: 'gpt-4o-mini' });
      }
      throw error;
    }
  } else if (env.OPENAI_API_KEY) {
    const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    return await client.chat.completions.create({ ...params, model: 'gpt-4o-mini' });
  } else {
    const { client, model } = getClientAndModel();
    return await client.chat.completions.create({ ...params, model });
  }
}


export async function analyzeResumeAI(input: AnalysisInput, options?: AIOptions): Promise<AnalysisOutput> {
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

DIRETRIZES DE VALORIZAÇÃO E INCENTIVO A EXPERIÊNCIAS DE ESTUDANTE:
Ao analisar o currículo, caso o candidato seja estudante ou possua pouca experiência profissional formal, siga estas diretrizes:
1. Incentive-o e oriente-o explicitamente a adicionar no currículo como "Experiências" ou "Projetos" atividades como:
   - Projetos acadêmicos relevantes, projetos de extensão universitária ou projetos pessoais (repositórios de código, portfólios, etc.).
   - Trabalhos de pesquisa, iniciação científica ou monitoria.
   - Atividades voluntárias ou de liderança (liderança de grupos de jovens na igreja, atuação em ONGs, grêmios estudantis, etc.).
   - Experiências informais de trabalho (ajudar os pais no comércio, pequenos bicos ou freelancing).
2. Se o candidato possuir formação técnica (como cursos técnicos de nível médio/integrado) que concluiu ou está cursando além/antes da faculdade, valorize e sugira destacar isso no currículo para demonstrar perfil proativo e multidisciplinar.
3. Nas seções "Áreas de Melhoria" e "Recomendações Específicas", dê exemplos práticos de como descrever e encaixar essas experiências informais ou de voluntariado de forma profissional (focando em responsabilidades e soft skills adquiridos).

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

  const response = await createChatCompletion({
    messages: [
      {
        role: 'system',
        content: 'Você é um especialista em recrutamento e análise de currículos. Forneça análises objetivas e construtivas em português brasileiro. A sua resposta deve ser EXCLUSIVAMENTE um JSON válido conforme o formato solicitado.',
      },
      {
        role: 'user',
        content: analysisPrompt,
      },
    ],
    temperature: 0.7,
    max_tokens: 2000,
    response_format: { type: 'json_object' },
  }, options);

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('Nenhuma resposta retornada da OpenAI');
  }

  return JSON.parse(content) as AnalysisOutput;
}

export async function generateResumeAI(data: ResumeProfileData, options?: AIOptions): Promise<string> {
  // Determinar se é vaga de tech/engenharia/produto para decidir sobre GitHub
  const jobTitleLower = (data.jobTitle || '').toLowerCase();
  const isTechRole = /desenvolv|tech|software|engenharia|frontend|backend|fullstack|mobile|devops|arquitetura|produto|engineer/i.test(jobTitleLower);

  // Determinar se o candidato tem pouca experiência profissional
  const lowExperience = !data.experiences || data.experiences.length === 0 || 
    (data.experiences.length === 1 && data.experiences[0].description.length < 150);

  let prompt = `Você é um recrutador especialista no mercado de trabalho brasileiro de início de carreira e triagem automatizada por ATS (Applicant Tracking Systems). Sua tarefa é estruturar e otimizar as informações do usuário em um currículo altamente competitivo para vagas de emprego e agências de estágio (CIEE, IEL, ABRE, Super Estágios).

O currículo gerado DEVE obrigatoriamente respeitar as seguintes regras estruturais para evitar eliminação automática em triagens:

## ARQUITETURA DE SEÇÕES E ORDEM OBRIGATÓRIA:

1. **CABEÇALHO - DADOS DE CONTATO:**
   - Nome completo
   - E-mail (texto limpo, SEM sintaxe markdown exposta. Use apenas: email@example.com)
   - Telefone com DDD (ex: (81) 99509-7377)
   - Localização (apenas Cidade/Estado)
   ${isTechRole ? '- LinkedIn\n   - GitHub (apenas para vagas de tecnologia)' : '- LinkedIn\n   - Portfólio ou Behance (se aplicável; omita GitHub)'}

2. **OBJETIVO / VAGA ALVO:**
   Posicionado logo abaixo do cabeçalho, indicando claramente a área e o nível pretendido.
   Exemplo: "Objetivo: Estágio em Marketing Digital e E-commerce, com foco em estratégias de crescimento"

3. **RESUMO PROFISSIONAL:**
   - Máximo 4 linhas
   - Contextualizar o curso atual, principais interesses, resultados prévios
   - INCLUIR OBRIGATORIAMENTE a disponibilidade de horário para estágios
   - Exemplo: "Estudante de Administração com foco em gestão de projetos. Disponível para estágio de 6h diárias no período vespertino."

4. **ORDENAÇÃO INTELIGENTE DE SEÇÕES (FORMAÇÃO VS EXPERIÊNCIA):**
   ${lowExperience 
     ? '- Como o candidato é um estudante com pouca ou nenhuma experiência profissional, a seção de **FORMAÇÃO ACADÊMICA** DEVE obrigatoriamente vir ANTES da seção de **EXPERIÊNCIAS PROFISSIONAIS**.' 
     : '- Como o candidato possui experiência profissional robusta, a seção de **EXPERIÊNCIAS PROFISSIONAIS** deve vir ANTES da seção de **FORMAÇÃO ACADÊMICA**.'}

5. **FORMAÇÃO ACADÊMICA:**
   - Nome do Curso
   - Instituição
   - Data de início
   - Data explícita de "Previsão de Conclusão: Mês/Ano" (MANDATÓRIO para contratos de estágio)
   - Exemplo: "Administração de Empresas • Universidade Federal de Pernambuco • Previsão de Conclusão: Dezembro de 2027"

6. **EXPERIÊNCIAS PROFISSIONAIS (Se houver):**
   - Listar em ordem cronológica inversa (mais recente primeiro)
   - Usar bullets descritivos que começam com verbos de ação (Desenvolveu, Implantou, Coordenou, etc)
   - Manter resultados quantificados e estatísticos fornecidos pelo usuário
   - SEM reduções ou diluições do impacto

7. **PROJETOS DE DESTAQUE (Se houver):**
   - Projetos acadêmicos, pessoais ou open source que demonstram competências práticas relevantes para a vaga.
   - Formatar no padrão: \`**Nome do Projeto** | Tecnologias/Link\` (se houver link)
   - Seguido de um ou dois tópicos descrevendo o escopo e o resultado do projeto.

8. **CURSOS E ATIVIDADES EXTRACURRICULARES (Se houver):**
   - Cursos complementares (Alura, Coursera, etc.), certificações e trabalhos voluntários relevantes.
   - Formatar no padrão: \`**Nome do Curso/Atividade** • Instituição | Data de conclusão\`
   - Omitir seções vazias.

9. **COMPETÊNCIAS / HABILIDADES:**
   - NÃO gere listas verticais longas
   - Agrupe as competências em categorias horizontais SEPARADAS POR " | "
   - Exemplo: "Ferramentas de Mídia: Google Ads, Meta Ads | Análise: Excel, Tableau | Soft Skills: Comunicação Assertiva, Trabalho em Equipe"

10. **IDIOMAS:**
   - Listar idiomas e respectivos níveis de forma sucinta
   - Exemplo: "Português (Nativo) | Inglês (Intermediário)"

## DIRETRIZES DE FORMATAÇÃO DO TEXTO:

- **DATAS**: NUNCA use formato técnico "AAAA-MM". Use formato brasileiro abreviado: "mar/2025 a dez/2025" ou "ago/2024 - Atual"
- **CONCISÃO**: Escreva de forma estratégica e densa para garantir que a estrutura caiba em UMA PÁGINA A4
- **LIMPEZA**: Aplicar .trim() em todas as strings para remover quebras de linha residuais

## DADOS DO CANDIDATO:

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
${data.experiences && data.experiences.length > 0 ? data.experiences.map((exp, idx) => `
Experiência ${idx + 1}:
Empresa: ${exp.company}
Cargo: ${exp.position}
Período: ${exp.startDate} a ${exp.current ? 'Atual' : exp.endDate}
Descrição das atividades e conquistas:
${exp.description}
`).join('\n') : 'Nenhuma experiência informada'}

FORMAÇÃO ACADÊMICA:
${data.education && data.education.length > 0 ? data.education.map((edu, idx) => `
Formação ${idx + 1}:
Instituição: ${edu.institution}
Grau/Curso: ${edu.degree} em ${edu.fieldOfStudy}
Período: ${edu.startDate} a ${edu.current ? 'Atual' : edu.endDate}
`).join('\n') : 'Nenhuma formação informada'}

PROJETOS DE DESTAQUE:
${data.projects && data.projects.length > 0 ? data.projects.map((proj, idx) => `
Projeto ${idx + 1}:
Nome: ${proj.name}
Descrição: ${proj.description}
URL/Link: ${proj.url || 'Não informado'}
`).join('\n') : 'Nenhum projeto informado'}

ATIVIDADES EXTRACURRICULARES E CURSOS COMPLEMENTARES:
${data.extracurriculars && data.extracurriculars.length > 0 ? data.extracurriculars.map((extra, idx) => `
Atividade ${idx + 1}:
Nome: ${extra.name}
Instituição: ${extra.institution || 'Não informada'}
Período: ${extra.startDate || ''} a ${extra.endDate || ''}
Descrição: ${extra.description || 'Não informada'}
`).join('\n') : 'Nenhuma atividade informada'}

HABILIDADES:
${data.skills && data.skills.length > 0 ? data.skills.join(', ') : 'Não informado'}

IDIOMAS:
${data.languages && data.languages.length > 0 ? data.languages.join(', ') : 'Não informado'}
`;

  if (data.jobTitle || data.jobDescription) {
    prompt += `

VAGA ALVO - INFORMAÇÕES CRÍTICAS:
Cargo: ${data.jobTitle || 'Não informado'}
Descrição/Requisitos da Vaga:
${data.jobDescription || 'Não informado'}

ATENÇÃO CRÍTICA: Adapte e otimize o currículo especificamente para essa vaga alvo, destacando:
- Experiências e palavras-chave que são mais relevantes para o cargo
- Habilidades técnicas (hard skills) que exatamente correspondem aos requisitos
- Se a vaga for de tecnologia, GitHub deve ser destacado; caso contrário, priorize portfólio/Behance
`;
  }

  prompt += `

## INSTRUÇÕES FINAIS DE FORMATAÇÃO:

1. Retorne APENAS o currículo completo formatado em Markdown profissional. Nada de observações, blocos de código ou explicações.
2. Utilize cabeçalhos claros:
   - # para o NOME DO CANDIDATO no topo
   - ## para as seções principais (OBJETIVO, EXPERIÊNCIAS, FORMAÇÃO, etc)
   - ### para subsections se necessário
3. Use tópicos (bullet points •) nas experiências para descrever conquistas, começando com verbos de ação
4. Mantenha layout limpo, elegante e profissional
5. Remova seções vazias ou não informadas
6. CRÍTICO: Limpar TODA e QUALQUER sintaxe Markdown exposta (ex: [email@gmail.com](mailto:email@gmail.com) deve ser apenas email@gmail.com)
7. Aplicar .trim() em strings finais para eliminar quebras de linha residuais
8. Garantir que todo o conteúdo caiba em UMA página A4`;

  const response = await createChatCompletion({
    messages: [
      {
        role: 'system',
        content: 'Você é um especialista em recrutamento e ATS. Crie currículos otimizados, profissionais e adequados ao mercado brasileiro de estágios em português brasileiro. Retorne EXCLUSIVAMENTE o conteúdo em Markdown, sem comentários ou blocos de código. Siga rigorosamente as regras de estrutura, formatação de datas em português, ordenação inteligente de seções, agrupamento horizontal de habilidades e inclusão obrigatória de previsão de conclusão e disponibilidade de horário.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.7,
    max_tokens: 3000,
  }, options);

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('Nenhuma resposta retornada da OpenAI para o gerador de currículo');
  }

  // Limpar markdown exposto e trim
  return content
    .replace(/\[([^\]]+)\]\(mailto:([^\)]+)\)/g, '$1') // Remove markdown de email
    .replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '$1') // Remove outros markdown de links inline
    .trim();
}

export async function generateNextInterviewQuestionAI(
  jobTitle: string,
  jobDescription: string | null,
  interviewerType: string,
  messageHistory: SimulatorMessage[],
  candidateProfile?: any,
  companyName?: string | null,
  options?: AIOptions
): Promise<string> {
  const interviewerTones: Record<string, string> = {
    tech: 'Você é um entrevistador puramente técnico, focado em hard skills, arquitetura de sistemas, conceitos fundamentais e resolução de problemas práticos. Faça perguntas diretas e desafiadoras.',
    behavioral: 'Você é um entrevistador de Recursos Humanos focado em soft skills, aspectos comportamentais, liderança, comunicação e adequação cultural. Use metodologias como a técnica STAR.',
    hard: 'Você é um entrevistador extremamente exigente, incisivo e direto. Você questiona profundamente as respostas do candidato, pressionando-o para testar sua capacidade de raciocinar sob pressão.',
    friendly: 'Você é um entrevistador caloroso, amigável e empático. Seu objetivo é fazer com que o candidato se sinta confortável, promovendo um diálogo fluido e construtivo, mas sem perder rigor profissional.',
  };

  const toneInstruction = interviewerTones[interviewerType] || interviewerTones.friendly;

  let profileInfo = '';
  if (candidateProfile) {
    profileInfo = `
INFORMAÇÕES SOBRE O CANDIDATO:
- Nome completo: ${candidateProfile.full_name || 'Não informado'}
- Curso: ${candidateProfile.course || 'Não informado'}
- Instituição de Ensino / Faculdade: ${candidateProfile.university || 'Não informada'}
- Período: ${candidateProfile.period || 'Não informado'}
- Biografia / Resumo Profissional: ${candidateProfile.bio || 'Não informado'}
- LinkedIn: ${candidateProfile.linkedin_url || 'Não informado'}

Aja como um entrevistador que leu o currículo do candidato e já conhece esses dados básicos. Use-os de forma profissional nas suas interações.`;
  }

  let companyInfo = '';
  if (companyName) {
    companyInfo = `
EMPRESA/AGÊNCIA DA VAGA:
- Esta entrevista simula um processo seletivo para a empresa/agência: ${companyName}.
Direcione o contexto das suas falas e perguntas para essa empresa/agência específica.`;
  }

  const systemPrompt = `Você é um entrevistador profissional experiente conduzindo uma simulação de entrevista de emprego realista.
Cargo pretendido: ${jobTitle}
Descrição/Requisitos da vaga: ${jobDescription || 'Não informado'}${companyInfo}${profileInfo}

Instrução de tom e personalidade:
${toneInstruction}

Regras cruciais:
1. Conduza a entrevista de forma interativa. Faça apenas UMA pergunta por vez.
2. Leia a resposta anterior do candidato e responda de forma natural, comentando brevemente se necessário antes de formular a próxima pergunta.
3. Não saia do personagem. Você não é um assistente de IA, você é o entrevistador.
4. Mantenha suas falas extremamente concisas, no máximo 2 ou 3 frases curtas (cerca de 30 palavras), para que a resposta em áudio não fique longa e cansativa. Vá direto ao ponto.
5. Se for o início da entrevista (histórico vazio), apresente-se brevemente e faça a primeira pergunta.
6. Escreva em português brasileiro perfeito, livre de erros gramaticais ou ortográficos. Garanta grafias corretas como "Entendo", "Organização", "Compreendo" e "Excelente".`;

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt }
  ];

  for (const msg of messageHistory) {
    messages.push({
      role: msg.role === 'candidate' ? 'user' : 'assistant',
      content: msg.content
    });
  }

  const response = await createChatCompletion({
    messages,
    temperature: 0.8,
    max_tokens: 200,
  }, options);

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('Nenhuma resposta retornada da OpenAI para a simulação de entrevista');
  }

  const cleanAIResponse = (text: string): string => {
    return text
      .replace(/\b([Ee])tendo\b/g, '$1ntendo')
      .replace(/\b([Oo])ganiza/g, '$1rganiza')
      .replace(/\b([Cc])opreendo\b/g, '$1ompreendo')
      .replace(/\b([Cc])opreen/g, '$1ompreen')
      .replace(/\b([Ee])xelente/g, '$1xcelente');
  };

  return cleanAIResponse(content);
}

export async function generateInterviewFeedbackAI(
  jobTitle: string,
  jobDescription: string | null,
  interviewerType: string,
  messageHistory: SimulatorMessage[],
  candidateProfile?: any,
  companyName?: string | null,
  options?: AIOptions
): Promise<SimulatorFeedback> {
  let profileInfo = '';
  if (candidateProfile) {
    profileInfo = `\nCandidato: ${candidateProfile.full_name || 'Não informado'} (Estudante de ${candidateProfile.course || 'Não informado'} na ${candidateProfile.university || 'Não informada'})`;
  }

  let companyInfo = '';
  if (companyName) {
    companyInfo = `\nEmpresa/Agência alvo do processo seletivo: ${companyName}.`;
  }

  const systemPrompt = `Você é um especialista sênior em recrutamento e seleção de talentos.
Analise o histórico completo da simulação de entrevista de emprego e forneça um relatório de feedback construtivo e detalhado em português brasileiro.
${profileInfo}${companyInfo}

Cargo pretendido: ${jobTitle}
Descrição/Requisitos da vaga: ${jobDescription || 'Não informado'}
Tipo de Entrevista conduzida: ${interviewerType}

Instruções para o Feedback:
1. Avalie o desempenho geral das respostas do candidato (conteúdo, embasamento técnico e comportamental). Avalie especificamente a clareza da vaga ou objetivo profissional demonstrado.
2. Estipule uma pontuação geral (score) de 0 a 100.
3. Identifique pelo menos 3 Pontos Fortes demonstrados nas respostas.
4. Identifique pelo menos 3 Áreas de Melhoria de forma construtiva.
5. Dê dicas acionáveis e práticas de estudo ou comportamento para entrevistas reais. Recomende explicitamente a plataforma de mentoria gratuita MENVO (https://menvo.com.br) para que o candidato continue melhorando.

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

  const response = await createChatCompletion({
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
  }, options);

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('Nenhuma resposta retornada da OpenAI para o feedback de entrevista');
  }

  return JSON.parse(content) as SimulatorFeedback;
}

export async function generateRecessoCommentAI(data: {
  startDate: string;
  endDate?: string;
  salario: string;
  horasDiarias: string;
  diasSemana: string;
  diasRecesso: number;
  valorRecesso: number;
}, options?: AIOptions): Promise<string> {
  const { startDate, endDate, salario, horasDiarias, diasSemana, diasRecesso, valorRecesso } = data;

  const systemPrompt = `Você é um especialista em legislação trabalhista de estágio brasileira (Lei nº 11.788/2008). 
Analise os dados do cálculo de recesso fornecidos pelo usuário e dê um parecer ou conselho prático sobre seus direitos, se o cálculo está de acordo com a lei, o que ele precisa negociar com a empresa e dicas de como proceder.
Responda em formato de texto limpo em português do Brasil de forma extremamente amigável, direta e profissional. Não use formatação markdown excessiva. Limite a resposta a no máximo 4 parágrafos.`;

  const userPrompt = `Dados do Estágio:
- Data de início: ${startDate}
- Data final/atual: ${endDate || 'Hoje'}
- Bolsa-auxílio mensal: R$ ${salario}
- Horas diárias: ${horasDiarias}h
- Dias por semana: ${diasSemana} dias
- Dias de recesso calculados: ${diasRecesso} dias
- Valor total do recesso calculado: R$ ${valorRecesso.toFixed(2)}`;

  const response = await createChatCompletion({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.7,
    max_tokens: 600,
  }, options);

  const contentResponse = response.choices[0]?.message?.content;
  if (!contentResponse) {
    throw new Error('Nenhuma resposta retornada da inteligência artificial');
  }

  const cleanText = (text: string): string => {
    return text
      .replace(/\b([Ee])tendo\b/g, '$1ntendo')
      .replace(/\b([Oo])ganiza/g, '$1rganiza')
      .replace(/\b([Cc])opreendo\b/g, '$1ompreendo')
      .replace(/\b([Cc])opreen/g, '$1ompreen')
      .replace(/\b([Ee])xelente/g, '$1xcelente');
  };

  return cleanText(contentResponse.trim());
}
