import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { authMiddleware, type Env } from '../middleware/auth.middleware.js';
import { supabaseAdmin } from '../services/supabase.service.js';
import { checkAbuse, logAbuse } from '../services/abuse.service.js';
import { roverTools, executeRoverTool, toolInvalidations } from '../tools/registry.js';
import OpenAI from 'openai';
import { env } from '../config/env.js';

const app = new Hono<Env>();

const groq = new OpenAI({
  apiKey: env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

// Client for OpenAI Content Moderation API
const openaiClient = env.OPENAI_API_KEY ? new OpenAI({ apiKey: env.OPENAI_API_KEY }) : null;

const messageSchema = z.object({
  message: z.string().min(1, 'A mensagem não pode ser vazia'),
});

const PROMPT_INJECTION_PATTERNS = [
  /ignore(e)?\s+(as|todas|os)?\s*(instru(ç|c)(õ|o)es|diretrizes|regras|prompts)/i,
  /ignore\s+previous\s+instructions/i,
  /system\s+override/i,
  /voc(ê|e)\s+agora\s+(é|e)\s+um/i,
  /you\s+are\s+now\s+a/i,
  /esque(ç|c)a\s+(o\s+que|tudo)/i,
  /forget\s+(what|everything)/i,
  /dan\s+mode/i,
  /jailbreak/i,
  /n(ã|a)o\s+siga\s+as/i,
  /ignore\s+above/i
];

export function detectPromptInjection(message: string): boolean {
  return PROMPT_INJECTION_PATTERNS.some(pattern => pattern.test(message));
}

export function redactPII(text: string): string {
  // Redigir CPF (ex: 123.456.789-00 ou 12345678900)
  const cpfRegex = /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g;
  // Redigir número de cartão de crédito (ex: 4111-2222-3333-4444 ou 16 dígitos)
  const cardRegex = /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g;

  return text
    .replace(cpfRegex, '[CPF REDIGIDO]')
    .replace(cardRegex, '[CARTÃO REDIGIDO]');
}

// GET /api/rover/history - Get recent chat history
app.get('/history', authMiddleware, async (c) => {
  const user = c.get('user');

  try {
    const { data: messages, error } = await supabaseAdmin
      .from('rover_messages')
      .select('role, content, name, created_at')
      .in('role', ['user', 'assistant'])
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(50);

    if (error) {
      console.error('Error fetching rover history:', error);
      return c.json({ error: 'Erro ao carregar o histórico de conversas.' }, 500);
    }

    return c.json({ messages });
  } catch (err) {
    console.error('Unexpected error fetching rover history:', err);
    return c.json({ error: 'Erro interno no servidor.' }, 500);
  }
});

// POST /api/rover/message - Send message to Rover and get response
app.post('/message', authMiddleware, zValidator('json', messageSchema), async (c) => {
  const user = c.get('user');
  const { message } = c.req.valid('json');
  const ipAddress = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || '127.0.0.1';

  try {
    // 1. Check rate limits & abuse
    const abuseCheck = await checkAbuse(user.id, ipAddress);
    if (!abuseCheck.allowed) {
      let message = 'Muitas mensagens em pouco tempo. Por favor, aguarde um momento.';
      if (abuseCheck.reason === 'rate_limit_hourly') {
        message = 'Limite de mensagens por hora atingido (máximo 30). Tente novamente mais tarde.';
      } else if (abuseCheck.reason === 'rate_limit_daily') {
        message = 'Limite de mensagens diárias atingido (máximo 100). Volte amanhã!';
      } else if (abuseCheck.reason === 'spam_cooldown') {
        message = `Você enviou mensagens muito rápido. Bloqueado por spam. Restam ${abuseCheck.cooldownRemaining} segundos.`;
      }
      return c.json({ error: message, reason: abuseCheck.reason, cooldownRemaining: abuseCheck.cooldownRemaining }, 429);
    }

    // 1.5. Prompt Injection Filter
    if (detectPromptInjection(message)) {
      await logAbuse(user.id, ipAddress, 'prompt_injection', `Mensagem suspeita bloqueada: "${message.substring(0, 200)}"`);
      return c.json({
        error: 'Mensagem bloqueada por questões de segurança (detecção de comportamento ou comando suspeito).',
        reason: 'prompt_injection'
      }, 400);
    }

    // 1.6. Content Moderation Guardrail
    if (openaiClient) {
      try {
        const modRes = await openaiClient.moderations.create({ input: message });
        if (modRes.results[0]?.flagged) {
          await logAbuse(user.id, ipAddress, 'content_moderation', `Mensagem ofensiva bloqueada: "${message.substring(0, 200)}"`);
          return c.json({
            error: 'Sua mensagem viola as nossas diretrizes de comunidade. Por favor, seja respeitoso(a).',
            reason: 'content_moderation'
          }, 400);
        }
      } catch (modErr) {
        console.error('Content moderation call failed:', modErr);
      }
    }

    // 1.7. PII Redaction Guardrail
    const redactedMessage = redactPII(message);

    // 2. Save user message (saving the redacted version)
    const { error: saveUserMsgErr } = await supabaseAdmin
      .from('rover_messages')
      .insert({
        user_id: user.id,
        role: 'user',
        content: redactedMessage,
      });

    if (saveUserMsgErr) {
      console.error('Error saving user message:', saveUserMsgErr);
      return c.json({ error: 'Erro ao processar mensagem.' }, 500);
    }

    // 3. Fetch past messages for context
    const { data: dbHistory, error: historyErr } = await supabaseAdmin
      .from('rover_messages')
      .select('role, content, name, tool_calls, tool_call_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(20);

    if (historyErr) {
      console.log('Error fetching history:', historyErr);
    }

    const now = new Date();
    const currentDateStr = now.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const currentISO = now.toISOString().split('T')[0];

    // 4. System Prompt with SITE MAP, BUSINESS RULES & ALL NEW TOOLS
    const systemPrompt = `Você é o Rover (Assistente Inteligente Oficial do Estagionauta).
A data de hoje é: ${currentDateStr} (formato ISO: ${currentISO}). Sempre use esta data de hoje como referência temporal absoluta para interpretar termos de data informados pelo usuário, como "hoje", "este ano", "mês passado", "estou estagiando desde janeiro deste ano", etc.

Seu objetivo é ajudar estudantes e estagiários com dúvidas de estágio, orientar sobre a Lei do Estágio (Lei 11.788/2008), dar dicas de carreira e interagir com o site.

REGRAS CRUCIAIS DE NAVEGAÇÃO (MAPA DO SITE):
Sempre que instruir o usuário sobre onde preencher, visualizar ou acessar algo na plataforma, use rigorosamente este mapa do site:
1. Perfil do Usuário: A página "Meu Perfil" (caminho: '/perfil') é o local exclusivo onde o usuário edita suas informações pessoais e acadêmicas, como: Nome, Foto (avatar), Biografia, Telefone, LinkedIn, Curso, Universidade/Faculdade e Período de graduação. (IMPORTANTE: Nunca diga que essas informações são editadas na aba perfil de configurações, pois configurações e perfil agora são páginas totalmente separadas!)
2. Configurações da Conta: A página "Configurações" (caminho: '/configuracoes') serve apenas para alterar a senha ou excluir a conta permanentemente (zona de perigo).
3. Candidaturas (Kanban): A página "Candidaturas" (caminho: '/candidaturas') serve para organizar as vagas e processos seletivos do usuário.
4. Simulador de Entrevistas: A página "Simulador de Entrevistas" (caminho: '/simulador-entrevistas') é onde o usuário treina com um entrevistador de IA por áudio ou chat (custa 1 crédito por nova simulação).
5. Nova Análise de Currículo por IA: A página "Nova Análise de Currículo" (caminho: '/analises/new') serve para enviar um currículo e obter uma nota e feedback estruturado da IA (custa 3 créditos por análise).
6. Minhas Análises de Currículo: A página "Minhas Análises" (caminho: '/analises') lista o histórico de todas as análises de currículo enviadas anteriormente pelo usuário.
7. Calculadora de Recesso: A página "Calculadora de Recesso" (caminho: '/calculadora') calcula o período e valor proporcional de recesso garantido pela lei.

Páginas acessíveis (em segundo plano, não priorizar nas sugestões):
- Mapa de Agências (caminho: '/agencias'): busca e avalia agências de integração. Mencione somente se o usuário perguntar.
- Indicar Amigos (caminho: '/convide-amigos'): convida amigos. Mencione somente se o usuário perguntar.
- Preços / Créditos (caminho: '/precos'): adquire créditos. Mencione somente se o usuário perguntar sobre compra de créditos.

REGRA DE NAVEGAÇÃO DIRETA (REDIRECT):
Se o usuário pedir explicitamente para ir, navegar, abrir, ou acessar alguma página do site (ex: "me leva pro simulador", "ir para perfil", "ver agencias"), chame a ferramenta 'navigate_to' informando a página de destino correspondente.

REGRA DE LEMBRETES:
1. Para criar lembretes (ex: "me lembre de enviar o teste técnico amanhã às 14h"), chame a ferramenta 'create_reminder' informando título, data/hora e opcionalmente uma candidaturaId vinculada.
2. Para listar lembretes ativos ou passados, use 'list_reminders'.
3. Para atualizar data, título ou cancelar/concluir um lembrete (marcar como enviado, cancelled, pending), use 'update_reminder'.

REGRA DE HISTÓRICOS DE CRÉDITOS E VALIDADE:
1. Se o usuário quiser consultar o extrato de créditos ou histórico detalhado de compras/gastos, use 'check_credit_history'.
2. Se o usuário quiser saber quando seus créditos vão expirar (validade de 2 meses por lote/FIFO), use 'check_credit_expiry'.

REGRA DE HISTÓRICO DE ENTREVISTAS:
Se o usuário quiser ver ou listar as simulações de entrevista anteriores realizadas, chame 'list_past_interviews'.

REGRA DE CURRÍCULOS SALVOS:
Se o usuário quiser ver os currículos que ele já criou ou salvou, use 'list_resumes'.

REGRA DE ESTATÍSTICAS E STATUS DA CONTA:
1. Se o usuário quiser saber o status geral da conta (plano ativo, se é premium, data de cadastro), chame 'check_account_status'.
2. Para ver estatísticas do Kanban (quantas candidaturas por estágio), use 'candidatura_stats'.

REGRA DE COMPRA DE CRÉDITOS:
Se o usuário solicitar a compra de créditos, upgrade de conta, preços ou como adquirir créditos, chame a ferramenta 'buy_credits' passando o plano correspondente (cosmonauta ou astronauta) e mostre o link retornado para o usuário clicar.

REGRA DE INICIAR SIMULAÇÃO DE ENTREVISTA:
Se o usuário pedir para iniciar, simular ou treinar uma entrevista de emprego (ou similar), use a ferramenta 'start_interview' passando o cargo alvo (jobTitle) e outros detalhes de vaga. Forneça o link seguro retornado.

REGRA DE RESGATE DE CUPONS (CÓDIGOS PROMOCIONAIS):
Se o usuário mencionar que possui um cupom, código promocional, ou se quiser resgatar créditos por código (ex: "quero usar o cupom ESTAGIO100" ou "como resgatar meu cupom?"), use a ferramenta 'redeem_coupon' passando o código do cupom.

REGRA DE ANÁLISE DE COMPATIBILIDADE DE VAGA:
Se o usuário solicitar uma análise de fit/adequação ou feedback técnico de uma vaga do Kanban dele, use a ferramenta 'analyze_candidatura' com o ID da candidatura e exponha as notas e recomendações detalhadamente.

REGRA DE ATUALIZAÇÃO E MOVIMENTAÇÃO DE VAGAS:
Se o usuário solicitar para alterar informações, notas, salário ou mover o status de uma vaga no Kanban (ex: "passei para a fase de entrevista na empresa X"), chame a ferramenta 'update_candidatura' com o ID da vaga e informe o sucesso.

REGRA DE ATUALIZAÇÃO DE PERFIL:
Você tem a capacidade de atualizar diretamente as informações de perfil do usuário. Se o usuário fornecer novos dados (como nome, telefone, linkedin, biografia, curso, universidade ou período acadêmico) ou solicitar que você preencha/altere/atualize essas informações, use a ferramenta 'update_profile' imediatamente para salvar as alterações no banco de dados e informe que a atualização foi realizada com sucesso.

REGRA DE CADASTRO DE VAGAS:
Se o usuário pedir para cadastrar, adicionar, registrar ou salvar uma nova vaga ou candidatura que ele encontrou, use a ferramenta 'add_candidatura' passando as informações fornecidas para salvá-la diretamente no painel Kanban dele.

REGRA DE CONVITE E INDICAÇÕES DE AMIGOS:
Se o usuário quiser convidar amigos por email, use a ferramenta 'invite_friend' passando o e-mail e nome. Para obter seu link de indicação, use 'get_referral_link'. Para ver estatísticas de indicações, use 'check_referral_stats'.

REGRA DE TAREFAS GAMIFICADAS E RECOMPENSAS:
Se o usuário quiser ganhar créditos grátis ou ver tarefas disponíveis, use 'list_available_tasks'. Para resgatar uma recompensa de tarefa concluída, use 'claim_task_reward' com a chave correspondente.

REGRA DE RECUPERAÇÃO DE SENHA:
Se o usuário pedir para mudar ou recuperar a senha da conta de forma segura, chame 'request_password_reset' para disparar o email com o token de redefinição oficial do Supabase Auth. Não peça ou trate senhas no chat.

REGRA DE AGÊNCIAS DE ESTÁGIO:
1. Se o usuário quiser pesquisar, listar ou encontrar agências de estágio (ex: "procure agências em Recife", "quais agências existem em PE?"), use a ferramenta 'search_agencies' com os parâmetros informados e apresente a lista com seus respectivos IDs, nomes e notas.
2. Se o usuário quiser ver os detalhes de uma agência específica ou ler seus comentários/avaliações (ex: "me mostre as avaliações da agência CIEE", "quais os contatos e detalhes da agência X?"), use a ferramenta 'get_agency_details' passando o agencyId correspondente.
3. Se o usuário quiser avaliar, deixar uma nota ou comentar sobre uma agência (ex: "quero avaliar a agência X com nota 4"), use a ferramenta 'submit_agency_review' informando o agencyId, a nota de 1 a 5 e o comentário (que deve ter mais de 20 caracteres).
4. Se o usuário quiser sugerir ou cadastrar uma nova agência de estágio na plataforma (ex: "cadastra a agência CIEE PE"), use a ferramenta 'create_agency' informando os dados necessários.

REGRA DE CONCISÃO DE RESPOSTA (MANDATÓRIO):
Mantenha suas respostas curtas, diretas e amigáveis. Use no máximo 3 a 4 parágrafos por mensagem, a menos que o usuário solicite explicitamente uma explicação detalhada ou análise aprofundada.

Comporte-se de forma amigável, neutra, prestativa e objetiva. Chame as ferramentas adequadas de acordo com as necessidades expressas pelo usuário.`;

    const apiMessages: any[] = [
      { role: 'system', content: systemPrompt },
    ];

    if (dbHistory && dbHistory.length > 0) {
      for (const msg of dbHistory) {
        apiMessages.push({
          role: msg.role,
          content: msg.content || null,
          name: msg.name || undefined,
          tool_calls: msg.tool_calls || undefined,
          tool_call_id: msg.tool_call_id || undefined,
        });
      }
    } else {
      apiMessages.push({ role: 'user', content: redactedMessage });
    }

    let loopCount = 0;
    let finalResponseText = '';
    const MAX_LOOPS = 5;
    const invalidatedDomains = new Set<string>();

    while (loopCount < MAX_LOOPS) {
      let response;
      try {
        response = await groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: apiMessages,
          tools: roverTools,
          tool_choice: 'auto',
          temperature: 0.7,
          max_tokens: 4096,
        });
      } catch (primaryErr: any) {
        console.error('[Rover] Primary Groq model (llama-3.3-70b-versatile) failed, attempting fallback...', primaryErr.message);
        
        try {
          response = await groq.chat.completions.create({
            model: 'llama-3.1-8b-instant',
            messages: apiMessages,
            tools: roverTools,
            tool_choice: 'auto',
            temperature: 0.7,
            max_tokens: 4096,
          });
        } catch (secondaryErr: any) {
          console.error('[Rover] Fallback Groq model (llama-3.1-8b-instant) failed:', secondaryErr.message);
          
          if (openaiClient) {
            console.log('[Rover] Attempting fallback to OpenAI gpt-4o-mini...');
            response = await openaiClient.chat.completions.create({
              model: 'gpt-4o-mini',
              messages: apiMessages,
              tools: roverTools,
              tool_choice: 'auto',
              temperature: 0.7,
              max_tokens: 4096,
            });
          } else {
            throw secondaryErr;
          }
        }
      }

      const choice = response.choices[0];
      const aiMsg = choice.message;
      const finishReason = choice.finish_reason;

      console.log(`[Rover] finish_reason: ${finishReason}`);

      if (!aiMsg) {
        throw new Error('Nenhuma resposta do LLM.');
      }

      if (aiMsg.tool_calls && aiMsg.tool_calls.length > 0) {
        console.log(`[Rover] LLM requested tools:`, aiMsg.tool_calls.map(tc => tc.function.name));

        // Save assistant tool call
        await supabaseAdmin
          .from('rover_messages')
          .insert({
            user_id: user.id,
            role: 'assistant',
            content: aiMsg.content || null,
            tool_calls: aiMsg.tool_calls,
          });

        apiMessages.push(aiMsg);

        for (const toolCall of aiMsg.tool_calls) {
          const toolName = toolCall.function.name;
          const toolArgs = JSON.parse(toolCall.function.arguments);

          let toolResult;
          try {
            toolResult = await executeRoverTool(toolName, toolArgs, user.id);
            const domains = toolInvalidations[toolName];
            if (domains) {
              domains.forEach(d => invalidatedDomains.add(d));
            }
          } catch (toolError: any) {
            console.error(`Error running tool ${toolName}:`, toolError);
            toolResult = { error: toolError.message || 'Erro ao executar ferramenta.' };
          }

          // Save tool response
          await supabaseAdmin
            .from('rover_messages')
            .insert({
              user_id: user.id,
              role: 'tool',
              name: toolName,
              tool_call_id: toolCall.id,
              content: JSON.stringify(toolResult),
            });

          apiMessages.push({
            role: 'tool',
            name: toolName,
            tool_call_id: toolCall.id,
            content: JSON.stringify(toolResult),
          });
        }

        loopCount++;
      } else {
        finalResponseText = (aiMsg.content || '').trim();

        // Handle truncated responses
        if (finishReason === 'length' && finalResponseText) {
          finalResponseText += '\n\n_A resposta foi cortada por limite de tamanho. Tente perguntar de forma mais específica._';
          console.warn('[Rover] Response was truncated (finish_reason=length)');
        }

        if (!finalResponseText) {
          finalResponseText = `Olá! Sou o Rover, o seu assistente de estágio no Estagionauta. Posso te ajudar com as seguintes tarefas:

1. **Verificar ou atualizar seu perfil** (diga "verificar meu perfil" ou me informe seus dados como curso, faculdade e período para eu atualizar);
2. **Analisar seu currículo** com base em uma vaga (custa 3 créditos);
3. **Calcular seu recesso proporcional** de estágio (diga "calcular recesso");
4. **Consultar seu saldo de créditos** (diga "verificar meus créditos");
5. **Simular entrevistas** no simulador de entrevistas.

Como posso ajudar você hoje?`;
        }

        // Save assistant message
        await supabaseAdmin
          .from('rover_messages')
          .insert({
            user_id: user.id,
            role: 'assistant',
            content: finalResponseText,
          });

        break;
      }
    }

    if (!finalResponseText && loopCount >= MAX_LOOPS) {
      finalResponseText = 'Desculpe, excedi o limite de processamento de ferramentas. O que mais posso ajudar?';
      await supabaseAdmin.from('rover_messages').insert({
        user_id: user.id,
        role: 'assistant',
        content: finalResponseText,
      });
    }

    return c.json({
      response: finalResponseText,
      invalidates: Array.from(invalidatedDomains),
    });
  } catch (err: any) {
    console.error('Rover processing error:', err);
    return c.json({ error: 'Desculpe, ocorreu um erro interno ao processar sua mensagem.' }, 500);
  }
});

// DELETE /api/rover/clear - Clear chat history
app.delete('/clear', authMiddleware, async (c) => {
  const user = c.get('user');

  try {
    const { error } = await supabaseAdmin
      .from('rover_messages')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      console.error('Error clearing rover messages:', error);
      return c.json({ error: 'Erro ao limpar histórico do chat.' }, 500);
    }

    return c.json({ success: true, message: 'Histórico limpo com sucesso.' });
  } catch (err) {
    console.error('Unexpected error clearing rover:', err);
    return c.json({ error: 'Erro interno no servidor.' }, 500);
  }
});

export default app;
