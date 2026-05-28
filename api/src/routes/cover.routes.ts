import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { authMiddleware, type Env } from '../middleware/auth.middleware.js';
import { supabaseAdmin } from '../services/supabase.service.js';
import { checkAbuse } from '../services/abuse.service.js';
import { coverTools, executeCoverTool } from '../tools/registry.js';
import OpenAI from 'openai';
import { env } from '../config/env.js';

const app = new Hono<Env>();

const groq = new OpenAI({
  apiKey: env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

const messageSchema = z.object({
  message: z.string().min(1, 'A mensagem não pode ser vazia'),
});

// GET /api/cover/history - Get recent chat history
app.get('/history', authMiddleware, async (c) => {
  const user = c.get('user');

  try {
    const { data: messages, error } = await supabaseAdmin
      .from('cover_messages')
      .select('role, content, name, created_at')
      .in('role', ['user', 'assistant'])
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(50);

    if (error) {
      console.error('Error fetching cover history:', error);
      return c.json({ error: 'Erro ao carregar o histórico de conversas.' }, 500);
    }

    return c.json({ messages });
  } catch (err) {
    console.error('Unexpected error fetching cover history:', err);
    return c.json({ error: 'Erro interno no servidor.' }, 500);
  }
});

// POST /api/cover/message - Send message to Cover and get response
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

    // 2. Save user message
    const { error: saveUserMsgErr } = await supabaseAdmin
      .from('cover_messages')
      .insert({
        user_id: user.id,
        role: 'user',
        content: message,
      });

    if (saveUserMsgErr) {
      console.error('Error saving user message:', saveUserMsgErr);
      return c.json({ error: 'Erro ao processar mensagem.' }, 500);
    }

    // 3. Fetch past messages for context
    const { data: dbHistory, error: historyErr } = await supabaseAdmin
      .from('cover_messages')
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

    // 4. System Prompt with SITE MAP & BUSINESS RULES
    const systemPrompt = `Você é o Cover (Assistente Inteligente Oficial do Estagionauta).
A data de hoje é: ${currentDateStr} (formato ISO: ${currentISO}). Sempre use esta data de hoje como referência temporal absoluta para interpretar termos de data informados pelo usuário, como "hoje", "este ano", "mês passado", "estou estagiando desde janeiro deste ano", etc.

Seu objetivo é ajudar estudantes e estagiários com dúvidas de estágio, orientar sobre a Lei do Estágio (Lei 11.788/2008), dar dicas de carreira e interagir com o site.

REGRAS CRUCIAIS DE NAVEGAÇÃO (MAPA DO SITE):
Sempre que instruir o usuário sobre onde preencher, visualizar ou acessar algo na plataforma, use rigorosamente este mapa do site:
1. Perfil do Usuário: A página "Meu Perfil" (caminho: '/perfil') é o local exclusivo onde o usuário edita suas informações pessoais e acadêmicas, como: Nome, Foto (avatar), Biografia, Telefone, LinkedIn, Curso, Universidade/Faculdade e Período de graduação. (IMPORTANTE: Nunca diga que essas informações são editadas na aba perfil de configurações, pois configurações e perfil agora são páginas totalmente separadas!)
2. Configurações da Conta: A página "Configurações" (caminho: '/configuracoes') serve apenas para alterar a senha ou excluir a conta permanentemente (zona de perigo).
3. Candidaturas (Kanban): A página "Candidaturas" (caminho: '/candidaturas') serve para organizar as vagas e processos seletivos do usuário.
4. Simulador de Entrevistas: A página "Simulador de Entrevistas" (caminho: '/simulador-entrevistas') é onde o usuário treina com um entrevistador de IA por áudio ou chat (custa 1 crédito por nova simulação).
5. Gerador de Currículos: A página "Gerador de Currículos" (caminho: '/gerador-curriculos') serve para criar e exportar currículos profissionais.
6. Análise de Currículo por IA: A página "Análise de Currículo" (caminho: '/analise-curriculo') serve para enviar um currículo e obter uma nota e feedback estruturado da IA (custa 3 créditos por análise).
7. Calculadora de Recesso: A página "Calculadora de Recesso" (caminho: '/calculadora') calcula o período e valor proporcional de recesso garantido pela lei.
8. Indicar Amigos: A página "Indicar Amigos" (caminho: '/convide-amigos') permite ao usuário convidar amigos para ganhar créditos.
9. Preços / Comprar Créditos: A página "Gestão de Créditos" (caminho: '/precos') é onde o usuário adquire novos créditos na Stripe.

REGRA DE ATUALIZAÇÃO DE PERFIL:
Você tem a capacidade de atualizar diretamente as informações de perfil do usuário. Se o usuário fornecer novos dados (como nome, telefone, linkedin, biografia, curso, universidade ou período acadêmico) ou solicitar que você preencha/altere/atualize essas informações, use a ferramenta 'update_profile' imediatamente para salvar as alterações no banco de dados e informe que a atualização foi realizada com sucesso.

Comporte-se de forma amigável, neutra, prestativa e objetiva. Chame as ferramentas adequadas se o usuário pedir informações sobre créditos, perfil incompleto, alterações/atualizações no perfil, cálculos de recesso, análise de currículo ou status/quantidade de candidaturas.`;

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
      apiMessages.push({ role: 'user', content: message });
    }

    let loopCount = 0;
    let finalResponseText = '';
    const MAX_LOOPS = 5;

    while (loopCount < MAX_LOOPS) {
      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: apiMessages,
        tools: coverTools,
        tool_choice: 'auto',
        temperature: 0.7,
      });

      const choice = response.choices[0];
      const aiMsg = choice.message;

      if (!aiMsg) {
        throw new Error('Nenhuma resposta do LLM.');
      }

      if (aiMsg.tool_calls && aiMsg.tool_calls.length > 0) {
        console.log(`[Cover] LLM requested tools:`, aiMsg.tool_calls.map(tc => tc.function.name));

        // Save assistant tool call
        await supabaseAdmin
          .from('cover_messages')
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
            toolResult = await executeCoverTool(toolName, toolArgs, user.id);
          } catch (toolError: any) {
            console.error(`Error running tool ${toolName}:`, toolError);
            toolResult = { error: toolError.message || 'Erro ao executar ferramenta.' };
          }

          // Save tool response
          await supabaseAdmin
            .from('cover_messages')
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
        if (!finalResponseText) {
          finalResponseText = `Olá! Sou o Cover, o seu assistente de estágio no Estagionauta. Posso te ajudar com as seguintes tarefas:

1. 📋 **Verificar ou atualizar seu perfil** (diga "verificar meu perfil" ou me informe seus dados como curso, faculdade e período para eu atualizar);
2. 📊 **Analisar seu currículo** com base em uma vaga (custa 3 créditos);
3. 📅 **Calcular seu recesso proporcional** de estágio (diga "calcular recesso");
4. 💰 **Consultar seu saldo de créditos** (diga "verificar meus créditos");
5. 🤝 **Simular entrevistas** no simulador de entrevistas.

Como posso ajudar você hoje?`;
        }
        
        // Save assistant message
        await supabaseAdmin
          .from('cover_messages')
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
      await supabaseAdmin.from('cover_messages').insert({
        user_id: user.id,
        role: 'assistant',
        content: finalResponseText,
      });
    }

    return c.json({ response: finalResponseText });
  } catch (err: any) {
    console.error('Cover processing error:', err);
    return c.json({ error: 'Desculpe, ocorreu um erro interno ao processar sua mensagem.' }, 500);
  }
});

// DELETE /api/cover/clear - Clear chat history
app.delete('/clear', authMiddleware, async (c) => {
  const user = c.get('user');

  try {
    const { error } = await supabaseAdmin
      .from('cover_messages')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      console.error('Error clearing cover messages:', error);
      return c.json({ error: 'Erro ao limpar histórico do chat.' }, 500);
    }

    return c.json({ success: true, message: 'Histórico limpo com sucesso.' });
  } catch (err) {
    console.error('Unexpected error clearing cover:', err);
    return c.json({ error: 'Erro interno no servidor.' }, 500);
  }
});

export default app;
