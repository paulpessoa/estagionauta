import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { authMiddleware, type Env } from '../middleware/auth.middleware.js';
import { supabaseAdmin } from '../services/supabase.service.js';
import { encrypt } from '../services/crypto.service.js';

const app = new Hono<Env>();

const saveKeysSchema = z.object({
  geminiKey: z.string().optional().nullable(),
  openaiKey: z.string().optional().nullable(),
});

// Helper functions for validating keys via API ping
async function validateGeminiKey(key: string): Promise<boolean> {
  if (!key.startsWith('AIzaSy')) return false;
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: 'ping' }] }] }),
    });
    return res.status === 200;
  } catch (err) {
    console.error('Gemini API key validation failed:', err);
    return false;
  }
}

async function validateOpenaiKey(key: string): Promise<boolean> {
  if (!key.startsWith('sk-')) return false;
  try {
    const res = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: { Authorization: `Bearer ${key}` },
    });
    return res.status === 200;
  } catch (err) {
    console.error('OpenAI API key validation failed:', err);
    return false;
  }
}

// GET /api/user/keys/status - Check if custom API keys exist (returns status only)
app.get('/keys/status', authMiddleware, async (c) => {
  const user = c.get('user');

  try {
    const { data: profile, error } = await supabaseAdmin
      .from('user_profiles')
      .select('encrypted_gemini_key, encrypted_openai_key')
      .eq('id', user.id)
      .single();

    if (error || !profile) {
      return c.json({ hasGeminiKey: false, hasOpenaiKey: false });
    }

    return c.json({
      hasGeminiKey: !!profile.encrypted_gemini_key,
      hasOpenaiKey: !!profile.encrypted_openai_key,
    });
  } catch (err) {
    console.error('Error getting keys status:', err);
    return c.json({ error: 'Erro interno ao verificar chaves' }, 500);
  }
});

// POST /api/user/keys - Save and encrypt custom API keys after validating them
app.post('/keys', authMiddleware, zValidator('json', saveKeysSchema), async (c) => {
  const user = c.get('user');
  const { geminiKey, openaiKey } = c.req.valid('json');

  const updatePayload: Record<string, any> = {};

  try {
    // 1. Validate and encrypt Gemini key if provided
    if (geminiKey !== undefined) {
      if (geminiKey === null || geminiKey.trim() === '') {
        updatePayload.encrypted_gemini_key = null;
        updatePayload.gemini_key_iv = null;
        updatePayload.gemini_key_tag = null;
      } else {
        const trimmedKey = geminiKey.trim();
        const isValid = await validateGeminiKey(trimmedKey);
        if (!isValid) {
          return c.json({ error: 'Chave do Google Gemini inválida ou inativa.' }, 400);
        }
        const encrypted = encrypt(trimmedKey);
        updatePayload.encrypted_gemini_key = encrypted.ciphertext;
        updatePayload.gemini_key_iv = encrypted.iv;
        updatePayload.gemini_key_tag = encrypted.tag;
      }
    }

    // 2. Validate and encrypt OpenAI key if provided
    if (openaiKey !== undefined) {
      if (openaiKey === null || openaiKey.trim() === '') {
        updatePayload.encrypted_openai_key = null;
        updatePayload.openai_key_iv = null;
        updatePayload.openai_key_tag = null;
      } else {
        const trimmedKey = openaiKey.trim();
        const isValid = await validateOpenaiKey(trimmedKey);
        if (!isValid) {
          return c.json({ error: 'Chave da OpenAI inválida ou inativa.' }, 400);
        }
        const encrypted = encrypt(trimmedKey);
        updatePayload.encrypted_openai_key = encrypted.ciphertext;
        updatePayload.openai_key_iv = encrypted.iv;
        updatePayload.openai_key_tag = encrypted.tag;
      }
    }

    // 3. Save to database
    if (Object.keys(updatePayload).length > 0) {
      const { error } = await supabaseAdmin
        .from('user_profiles')
        .update(updatePayload)
        .eq('id', user.id);

      if (error) {
        console.error('Error saving keys to database:', error);
        return c.json({ error: 'Erro ao salvar chaves de API no banco de dados' }, 500);
      }
    }

    return c.json({ success: true, message: 'Chaves de API configuradas com sucesso' });
  } catch (err) {
    console.error('Error saving keys:', err);
    return c.json({ error: 'Erro interno ao processar chaves' }, 500);
  }
});

// DELETE /api/user/keys/:provider - Remove a custom API key
app.delete('/keys/:provider', authMiddleware, async (c) => {
  const user = c.get('user');
  const provider = c.req.param('provider');

  if (provider !== 'gemini' && provider !== 'openai') {
    return c.json({ error: 'Provedor inválido. Escolha "gemini" ou "openai".' }, 400);
  }

  const updatePayload: Record<string, any> = {};
  if (provider === 'gemini') {
    updatePayload.encrypted_gemini_key = null;
    updatePayload.gemini_key_iv = null;
    updatePayload.gemini_key_tag = null;
  } else {
    updatePayload.encrypted_openai_key = null;
    updatePayload.openai_key_iv = null;
    updatePayload.openai_key_tag = null;
  }

  try {
    const { error } = await supabaseAdmin
      .from('user_profiles')
      .update(updatePayload)
      .eq('id', user.id);

    if (error) {
      console.error(`Error deleting ${provider} key:`, error);
      return c.json({ error: `Erro ao deletar chave do ${provider}` }, 500);
    }

    return c.json({ success: true, message: `Chave do ${provider} removida com sucesso` });
  } catch (err) {
    console.error(`Error in deleting key:`, err);
    return c.json({ error: 'Erro interno no servidor' }, 500);
  }
});

// DELETE /api/user/delete-account - Excluir própria conta
app.delete('/delete-account', authMiddleware, async (c) => {
  const user = c.get('user');
  console.log(`Solicitação de exclusão de conta recebida para o usuário: ${user.id}`);
  
  try {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);
    if (error) {
      console.error('Erro ao excluir usuário no Supabase Auth:', error);
      return c.json({ error: 'Erro ao excluir conta de usuário' }, 500);
    }
    
    console.log(`Usuário ${user.id} excluído com sucesso.`);
    return c.json({ success: true, message: 'Conta excluída com sucesso' });
  } catch (err) {
    console.error('Erro no endpoint de exclusão de conta:', err);
    return c.json({ error: 'Erro interno do servidor' }, 500);
  }
});

export default app;
