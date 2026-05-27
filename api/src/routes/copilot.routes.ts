import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { authMiddleware, type Env } from '../middleware/auth.middleware.js';
import { supabaseAdmin } from '../services/supabase.service.js';
import { checkAbuse } from '../services/abuse.service.js';
import { copilotTools, executeCopilotTool } from '../tools/registry.js';
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

// GET /api/copilot/history - Get recent chat history (e.g. for loading the drawer)
app.get('/history', authMiddleware, async (c) => {
  const user = c.get('user');

  try {
    const { data: messages, error } = await supabaseAdmin
      .from('copilot_messages')
      .select('role, content, name, created_at')
      // Only show user and assistant messages to the frontend
      .in('role', ['user', 'assistant'])
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(50);

    if (error) {
      console.error('Error fetching copilot history:', error);
      return c.json({ error: 'Erro ao carregar o histórico de conversas.' }, 500);
    }

    return c.json({ messages });
  } catch (err) {
    console.error('Unexpected error fetching copilot history:', err);
    return c.json({ error: 'Erro interno no servidor.' }, 500);
  }
});

// POST /api/copilot/message - Send message to Copilot and get response
app.post('/message', authMiddleware, zValidator('json', messageSchema), async (c) => {
  const user = c.get('user');
  const { message } = c.req.valid('json');

  // Retrieve client IP for abuse detection
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

    // 2. Save the user's message to the database
    const { error: saveUserMsgErr } = await supabaseAdmin
      .from('copilot_messages')
      .insert({
        user_id: user.id,
        role: 'user',
        content: message,
      });

    if (saveUserMsgErr) {
      console.error('Error saving user message to database:', saveUserMsgErr);
      return c.json({ error: 'Erro ao processar mensagem no banco de dados.' }, 500);
    }

    // 3. Fetch past 15 messages for LLM context
    const { data: dbHistory, error: historyErr } = await supabaseAdmin
      .from('copilot_messages')
      .select('role, content, name, tool_calls, tool_call_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      // Fetch slightly more to account for intermediate tool messages
      .limit(20);

    if (historyErr) {
      console.log('Error fetching history, starting fresh context:', historyErr);
    }

    // 4. Construct messages array for LLM
    const systemPrompt = `Você é o Copilot do Estagiário (Assistente Oficial do Estagionauta). 
Seu objetivo é ajudar estudantes e estagiários a navegarem pela plataforma Estagionauta, tirar dúvidas sobre a Lei do Estágio (Lei 11.788/2008), dar feedback de carreira e usar ferramentas integradas.
Instruções importantes:
- Responda em português brasileiro de forma amigável, clara e prestativa.
- Nunca invente dados. Use as ferramentas disponibilizadas para consultar o saldo de créditos do usuário, recesso ou perfil do usuário.
- Se o usuário pedir para calcular o recesso, chame a ferramenta 'calculate_recess'.
- Se o usuário quiser saber se o perfil dele está completo, chame a ferramenta 'check_profile'.
- Se o usuário quiser saber seus créditos, chame a ferramenta 'check_credits'.
- Se o usuário quiser analisar o currículo dele, chame a ferramenta 'analyze_resume'. Avise que a análise custa 3 créditos.
- Seja conciso e evite respostas excessivamente longas.`;

    const apiMessages: any[] = [
      { role: 'system', content: systemPrompt },
    ];

    if (dbHistory && dbHistory.length > 0) {
      // Map stored messages to OpenAI format
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
      // Fallback: just add the current message
      apiMessages.push({ role: 'user', content: message });
    }

    // 5. Tool completion loop (max 5 iterations)
    let loopCount = 0;
    let finalResponseText = '';
    const MAX_LOOPS = 5;

    while (loopCount < MAX_LOOPS) {
      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: apiMessages,
        tools: copilotTools,
        tool_choice: 'auto',
        temperature: 0.7,
      });

      const choice = response.choices[0];
      const aiMsg = choice.message;

      if (!aiMsg) {
        throw new Error('Nenhuma resposta retornada da API.');
      }

      // Check if LLM wanted to call tools
      if (aiMsg.tool_calls && aiMsg.tool_calls.length > 0) {
        console.log(`[Copilot] LLM requested tools:`, aiMsg.tool_calls.map(tc => tc.function.name));

        // Save assistant tool call instruction in database
        const { error: saveToolCallErr } = await supabaseAdmin
          .from('copilot_messages')
          .insert({
            user_id: user.id,
            role: 'assistant',
            content: aiMsg.content || null,
            tool_calls: aiMsg.tool_calls,
          });

        if (saveToolCallErr) {
          console.error('Error saving assistant tool calls:', saveToolCallErr);
        }

        // Push to internal API messages representation
        apiMessages.push(aiMsg);

        // Execute all tool calls requested
        for (const toolCall of aiMsg.tool_calls) {
          const toolName = toolCall.function.name;
          const toolArgs = JSON.parse(toolCall.function.arguments);

          let toolResult;
          try {
            toolResult = await executeCopilotTool(toolName, toolArgs, user.id);
          } catch (toolError: any) {
            console.error(`Error running tool ${toolName}:`, toolError);
            toolResult = { error: toolError.message || 'Erro ao executar ferramenta.' };
          }

          // Save tool response in database
          const { error: saveToolResultErr } = await supabaseAdmin
            .from('copilot_messages')
            .insert({
              user_id: user.id,
              role: 'tool',
              name: toolName,
              tool_call_id: toolCall.id,
              content: JSON.stringify(toolResult),
            });

          if (saveToolResultErr) {
            console.error('Error saving tool result:', saveToolResultErr);
          }

          // Push tool response message to LLM messages history
          apiMessages.push({
            role: 'tool',
            name: toolName,
            tool_call_id: toolCall.id,
            content: JSON.stringify(toolResult),
          });
        }

        loopCount++;
      } else {
        // No tool calls, this is the final text response
        finalResponseText = aiMsg.content || '';
        
        // Save the assistant's final response to the database
        const { error: saveAssistantMsgErr } = await supabaseAdmin
          .from('copilot_messages')
          .insert({
            user_id: user.id,
            role: 'assistant',
            content: finalResponseText,
          });

        if (saveAssistantMsgErr) {
          console.error('Error saving assistant message to database:', saveAssistantMsgErr);
        }

        break;
      }
    }

    if (!finalResponseText && loopCount >= MAX_LOOPS) {
      finalResponseText = 'Desculpe, excedi o limite de processamento de ferramentas. O que mais posso ajudar?';
      await supabaseAdmin.from('copilot_messages').insert({
        user_id: user.id,
        role: 'assistant',
        content: finalResponseText,
      });
    }

    return c.json({ response: finalResponseText });
  } catch (err: any) {
    console.error('Copilot processing error:', err);
    return c.json({ error: 'Desculpe, ocorreu um erro interno ao processar sua mensagem.' }, 500);
  }
});

// DELETE /api/copilot/clear - Clear chat history
app.delete('/clear', authMiddleware, async (c) => {
  const user = c.get('user');

  try {
    const { error } = await supabaseAdmin
      .from('copilot_messages')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      console.error('Error clearing copilot messages:', error);
      return c.json({ error: 'Erro ao limpar histórico do chat.' }, 500);
    }

    return c.json({ success: true, message: 'Histórico limpo com sucesso.' });
  } catch (err) {
    console.error('Unexpected error clearing copilot:', err);
    return c.json({ error: 'Erro interno no servidor.' }, 500);
  }
});

export default app;
